import { prisma } from "@/lib/db/prisma";
import { resolveUpsellPrice } from "./tier-pricing.service";
import {
  agentHasAvailableStock,
  lockAgent,
} from "@/modules/delivery/services/agents.service";
import type { OrderStatus, Prisma } from "@prisma/client";

/**
 * Shared upsell "Add Product" core — the merge + package-pricing + write logic,
 * used by BOTH the sales-rep (`addOrderItemsAction`) and admin
 * (`adminAddOrderItemsAction`) actions so the money math never lives in two
 * copies. Callers do their own auth + order load, then hand the loaded order
 * here. See docs/upsell-package-pricing.md and docs/upsell-display-rollout.md.
 */

type Decimalish = Prisma.Decimal | number | string;

export type UpsellOrderContext = {
  id: string;
  status: OrderStatus;
  agentId: string | null;
  orderNumber: string;
  formId: string | null;
  discountAmount: Decimalish;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    lineTotal: Decimalish;
    isUpsell: boolean;
    upsellAmount: Decimalish;
    upsellQuantity: number;
  }>;
};

export type SurplusPlan = {
  productId: string;
  productName: string;
  mergedQty: number;
  typedUnitPrice: number;
  lineTotal: number;
};

export type ApplyUpsellResult =
  | { error: string }
  | { ok: true; addedCount: number; surplusPlans: SurplusPlan[] };

/** The order shape `applyUpsellItems` needs — reuse in each action's select. */
export const upsellOrderSelect = {
  id: true,
  status: true,
  agentId: true,
  orderNumber: true,
  formId: true,
  discountAmount: true,
  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      lineTotal: true,
      isUpsell: true,
      upsellAmount: true,
      upsellQuantity: true,
    },
  },
} as const;

export async function applyUpsellItems(
  order: UpsellOrderContext,
  items: Array<{ productId: string; quantity: number; unitPrice?: number }>,
  addedById: string,
): Promise<ApplyUpsellResult> {
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    return {
      error: "Products can only be added to pending or confirmed orders.",
    };
  }

  // Consolidate duplicate incoming rows for the same product (sum the added
  // quantities; last typed unit price wins) so a product is only merged once.
  const consolidated = new Map<
    string,
    { productId: string; quantity: number; unitPrice?: number }
  >();
  for (const it of items) {
    const prev = consolidated.get(it.productId);
    if (prev) {
      prev.quantity += it.quantity;
      if (typeof it.unitPrice === "number") prev.unitPrice = it.unitPrice;
    } else {
      consolidated.set(it.productId, { ...it });
    }
  }
  const addedItems = [...consolidated.values()];

  const products = await prisma.product.findMany({
    where: { id: { in: addedItems.map((i) => i.productId) } },
    select: { id: true, name: true, sellingPrice: true, costPrice: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const item of addedItems) {
    if (!productMap.has(item.productId)) {
      return { error: "One or more selected products are unavailable." };
    }
  }

  // For confirmed orders the delivery agent is already assigned, so the agent
  // must physically hold the new product on top of everything already promised.
  const confirmedAgentId =
    order.status === "CONFIRMED" && order.agentId ? order.agentId : null;

  // Build a merge + pricing plan per product: fold the added quantity into any
  // existing line(s) for the same product, then price the MERGED quantity.
  const plans = await Promise.all(
    addedItems.map(async (item) => {
      const product = productMap.get(item.productId)!;
      const existingLines = order.items.filter(
        (it) => it.productId === item.productId,
      );
      const existingQty = existingLines.reduce((s, it) => s + it.quantity, 0);
      const mergedQty = existingQty + item.quantity;
      const priced = await resolveUpsellPrice(
        item.productId,
        mergedQty,
        item.unitPrice ?? 0,
        order.formId ?? undefined,
      );
      return { item, product, existingLines, mergedQty, priced };
    }),
  );

  // Guardrail: a manual unit price (> ₦0) is required whenever the merged
  // quantity has no exact package.
  for (const p of plans) {
    if (
      p.priced.requiresUnitPrice &&
      !(typeof p.item.unitPrice === "number" && p.item.unitPrice > 0)
    ) {
      return {
        error: `Enter a unit price greater than ₦0 for ${p.product.name}.`,
      };
    }
  }

  // Recompute the gross by replacing each merged product's existing line
  // total(s) with its new merged line total, preserving any existing discount
  // (same approach as removeOrderItemAction) so discountPercent never goes stale.
  const existingGross = order.items.reduce((s, i) => s + Number(i.lineTotal), 0);
  let gross = existingGross;
  for (const p of plans) {
    const replaced = p.existingLines.reduce(
      (s, it) => s + Number(it.lineTotal),
      0,
    );
    gross = gross - replaced + p.priced.lineTotal;
  }
  const newGross = Math.round(gross * 100) / 100;
  const discountAmount = Math.min(Number(order.discountAmount), newGross);
  const netAmount = Math.round((newGross - discountAmount) * 100) / 100;
  const discountPercent =
    newGross > 0 ? Math.round((discountAmount / newGross) * 10000) / 100 : 0;

  let capacityHit = false;
  await prisma.$transaction(async (tx) => {
    if (confirmedAgentId) {
      await lockAgent(tx, confirmedAgentId);
      // Available already nets out this confirmed order's existing items, so we
      // only need room for the NEW units (the added quantity) on top of the
      // agent's commitments — merging doesn't change how many new units ship.
      const ok = await agentHasAvailableStock(
        tx,
        confirmedAgentId,
        addedItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      );
      if (!ok) {
        capacityHit = true;
        return; // leave the order untouched
      }
    }
    for (const p of plans) {
      if (p.existingLines.length > 0) {
        // Merge into ONE surviving line, dropping any duplicates. Prefer a form
        // line (isUpsell false) as the survivor so the line keeps its original
        // origin — the addition is tracked via upsellAmount/upsellQuantity, not
        // by flipping the whole line to an upsell.
        const sorted = [...p.existingLines].sort(
          (a, b) => Number(a.isUpsell) - Number(b.isUpsell),
        );
        const [keep, ...dupes] = sorted;

        const oldTotal = p.existingLines.reduce(
          (s, it) => s + Number(it.lineTotal),
          0,
        );
        const oldUpsellAmount = p.existingLines.reduce(
          (s, it) => s + Number(it.upsellAmount),
          0,
        );
        const oldUpsellQuantity = p.existingLines.reduce(
          (s, it) => s + it.upsellQuantity,
          0,
        );
        // Everything added on top of the old price is upsell revenue.
        const increment = Math.max(
          0,
          Math.round((p.priced.lineTotal - oldTotal) * 100) / 100,
        );

        await tx.orderItem.update({
          where: { id: keep.id },
          data: {
            quantity: p.mergedQty,
            unitPrice: p.priced.unitPrice,
            lineTotal: p.priced.lineTotal,
            costPriceAtSale: Number(p.product.costPrice),
            upsellAmount: Math.round((oldUpsellAmount + increment) * 100) / 100,
            upsellQuantity: oldUpsellQuantity + p.item.quantity,
          },
        });
        if (dupes.length) {
          await tx.orderItem.deleteMany({
            where: { id: { in: dupes.map((d) => d.id) } },
          });
        }
      } else {
        // Brand-new upsell line: the whole line is upsell.
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: p.item.productId,
            quantity: p.mergedQty,
            unitPrice: p.priced.unitPrice,
            lineTotal: p.priced.lineTotal,
            costPriceAtSale: Number(p.product.costPrice),
            isUpsell: true,
            addedById,
            upsellAmount: p.priced.lineTotal,
            upsellQuantity: p.mergedQty,
          },
        });
      }
    }
    await tx.order.update({
      where: { id: order.id },
      data: { totalAmount: newGross, netAmount, discountAmount, discountPercent },
    });
  });

  if (capacityHit) {
    return {
      error:
        "The assigned agent doesn't have enough available stock for the added product(s).",
    };
  }

  const surplusPlans: SurplusPlan[] = plans
    .filter((p) => p.priced.source === "surplus")
    .map((p) => ({
      productId: p.item.productId,
      productName: p.product.name,
      mergedQty: p.mergedQty,
      typedUnitPrice: p.item.unitPrice ?? 0,
      lineTotal: p.priced.lineTotal,
    }));

  return { ok: true, addedCount: addedItems.length, surplusPlans };
}

/**
 * Live price preview for the Add-Product popup — shared by the rep and admin
 * preview actions (each does its own auth + order load first). Read-only.
 */
export async function previewUpsellPrice(
  formId: string | null,
  existingItems: Array<{ quantity: number }>,
  productId: string,
  addedQty: number,
  typedUnitPrice: number,
) {
  const existingQty = existingItems.reduce((s, it) => s + it.quantity, 0);
  const mergedQty = existingQty + Math.max(1, Math.floor(addedQty));
  const priced = await resolveUpsellPrice(
    productId,
    mergedQty,
    typedUnitPrice,
    formId ?? undefined,
  );
  return { ...priced, mergedQty };
}
