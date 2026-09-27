import { prisma } from "@/lib/db/prisma";
import { resolveUpsellPrice } from "./tier-pricing.service";
import { computeOrderTotals } from "@/lib/orders/order-totals";
import {
  checkAgentOnHandStock,
  lockAgent,
} from "@/modules/delivery/services/agents.service";
import type { OrderStatus, Prisma } from "@prisma/client";

/**
 * Shared "revise an order's lines" core — the re-price + re-total logic behind
 * two customer-driven changes on a still-open order:
 *
 *   • changeItemQuantity — the customer wants a different quantity of the SAME
 *     product ("I confirmed 4, I'll take 2"). Re-prices via the per-form package
 *     tiers.
 *   • swapItemProduct    — the customer wants a DIFFERENT product instead
 *     ("not Neurovive, give me Afternatal"). Removes the old line, prices the new
 *     product from its form.
 *
 * Both are REVISIONS, not upsells: they never touch `upsellAmount`/`upsellQuantity`
 * (those stay reserved for genuine rep add-ons via `applyUpsellItems`) so upsell
 * reporting (`SUM(upsellAmount)`) stays honest. Callers do their own auth + order
 * load, then hand the loaded order here. Money math is shared with the upsell path
 * via `resolveUpsellPrice` + `computeOrderTotals`.
 *
 * Agent-stock rule mirrors `applyUpsellItems`: on a CONFIRMED order the assigned
 * agent must physically hold the extra/new units, else the change is refused
 * (the hard zero-floor still lives at delivery). Reductions need no check.
 */

type Decimalish = Prisma.Decimal | number | string;

export type ReviseOrderContext = {
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
    product: { id: string; name: string };
  }>;
};

/** The order shape the revise functions need — reuse in each action's select. */
export const reviseOrderSelect = {
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
      product: { select: { id: true, name: true } },
    },
  },
} as const;

/** A manually-priced line the caller should audit (typed unit price used). */
export type ReviseSurplus = {
  productId: string;
  productName: string;
  quantity: number;
  typedUnitPrice: number;
  lineTotal: number;
};

export type ChangeQuantityResult =
  | { error: string }
  | {
      ok: true;
      productName: string;
      oldQuantity: number;
      newQuantity: number;
      oldLineTotal: number;
      newLineTotal: number;
      surplus: ReviseSurplus | null;
    };

export type SwapProductResult =
  | { error: string }
  | {
      ok: true;
      oldProductName: string;
      newProductName: string;
      newQuantity: number;
      newLineTotal: number;
      surplus: ReviseSurplus | null;
    };

const round2 = (n: number) => Math.round(n * 100) / 100;

function agentShortMessage(name: string): string {
  return `The assigned agent isn't holding enough ${name}. Reassign the order to an agent who carries it, or reduce the quantity.`;
}

/**
 * Change the quantity of an existing line and re-price it via the per-form
 * packages. This is a customer revision, so the line's upsell tracking is reset
 * to zero (the new quantity is the customer's real order, not a rep upsell).
 */
export async function changeItemQuantity(
  order: ReviseOrderContext,
  orderItemId: string,
  newQuantity: number,
  typedUnitPrice: number,
): Promise<ChangeQuantityResult> {
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    return { error: "Quantities can only be changed on pending or confirmed orders." };
  }

  const line = order.items.find((i) => i.id === orderItemId);
  if (!line) return { error: "Product not found on this order." };

  const qty = Math.max(1, Math.floor(newQuantity));
  const priced = await resolveUpsellPrice(
    line.productId,
    qty,
    typedUnitPrice ?? 0,
    order.formId ?? undefined,
  );
  if (priced.requiresUnitPrice && !(typedUnitPrice > 0)) {
    return { error: `Enter a unit price greater than ₦0 for ${line.product.name}.` };
  }

  const oldLineTotal = Number(line.lineTotal);
  // New order gross: every other line unchanged, this line at its new total.
  const lineTotals = order.items.map((i) =>
    i.id === line.id ? priced.lineTotal : Number(i.lineTotal),
  );
  // Editing the order CLEARS any prior negotiated discount — the rep re-sets the
  // price after the change (passing 0 zeroes the discount; net = new gross).
  const totals = computeOrderTotals(lineTotals, 0);

  const confirmedAgentId =
    order.status === "CONFIRMED" && order.agentId ? order.agentId : null;
  const delta = qty - line.quantity;

  let agentShort = false;
  await prisma.$transaction(async (tx) => {
    if (confirmedAgentId && delta > 0) {
      await lockAgent(tx, confirmedAgentId);
      const check = await checkAgentOnHandStock(tx, confirmedAgentId, [
        { productId: line.productId, quantity: delta, product: { name: line.product.name } },
      ]);
      if (!check.ok) {
        agentShort = true;
        return; // leave the order untouched
      }
    }
    await tx.orderItem.update({
      where: { id: line.id },
      data: {
        quantity: qty,
        unitPrice: priced.unitPrice,
        lineTotal: priced.lineTotal,
        // Revision, not an upsell — clear this line's upsell attribution.
        upsellAmount: 0,
        upsellQuantity: 0,
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: { ...totals, discountedById: null, discountReason: null, discountedAt: null },
    });
  });

  if (agentShort) return { error: agentShortMessage(line.product.name) };

  return {
    ok: true,
    productName: line.product.name,
    oldQuantity: line.quantity,
    newQuantity: qty,
    oldLineTotal: round2(oldLineTotal),
    newLineTotal: priced.lineTotal,
    surplus:
      priced.source === "surplus"
        ? {
            productId: line.productId,
            productName: line.product.name,
            quantity: qty,
            typedUnitPrice: typedUnitPrice ?? 0,
            lineTotal: priced.lineTotal,
          }
        : null,
  };
}

/**
 * Replace an existing line's product with a different one. The old line is
 * removed and the new product is priced from its own form. This is a revision,
 * NOT an upsell — the new line carries no upsell attribution. If the order
 * already has a line for the new product, the quantities merge into one line.
 */
export async function swapItemProduct(
  order: ReviseOrderContext,
  orderItemId: string,
  newProductId: string,
  newQuantity: number,
  typedUnitPrice: number,
  actorId: string,
): Promise<SwapProductResult> {
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    return { error: "Products can only be changed on pending or confirmed orders." };
  }

  const oldLine = order.items.find((i) => i.id === orderItemId);
  if (!oldLine) return { error: "Product not found on this order." };

  const newProduct = await prisma.product.findFirst({
    where: { id: newProductId, deletedAt: null },
    select: { id: true, name: true, costPrice: true },
  });
  if (!newProduct) return { error: "The selected product is unavailable." };

  const qty = Math.max(1, Math.floor(newQuantity));

  // Lines already on the order for the new product (excluding the one being
  // swapped away) — the swap merges into them so a product is never duplicated.
  const remaining = order.items.filter((i) => i.id !== oldLine.id);
  const existingNewLines = remaining.filter((i) => i.productId === newProductId);
  const existingNewQty = existingNewLines.reduce((s, i) => s + i.quantity, 0);
  const mergedQty = existingNewQty + qty;

  const priced = await resolveUpsellPrice(
    newProductId,
    mergedQty,
    typedUnitPrice ?? 0,
    order.formId ?? undefined,
  );
  if (priced.requiresUnitPrice && !(typedUnitPrice > 0)) {
    return { error: `Enter a unit price greater than ₦0 for ${newProduct.name}.` };
  }

  // New order gross: keep every line that is neither the removed old line nor a
  // merged new-product line, then add the single re-priced new-product line.
  const lineTotals = remaining
    .filter((i) => i.productId !== newProductId)
    .map((i) => Number(i.lineTotal));
  lineTotals.push(priced.lineTotal);
  // Editing the order CLEARS any prior negotiated discount — the rep re-sets the
  // price after the change (passing 0 zeroes the discount; net = new gross).
  const totals = computeOrderTotals(lineTotals, 0);

  const confirmedAgentId =
    order.status === "CONFIRMED" && order.agentId ? order.agentId : null;

  let agentShort = false;
  await prisma.$transaction(async (tx) => {
    if (confirmedAgentId) {
      await lockAgent(tx, confirmedAgentId);
      // Only the newly-required units of the new product burden the agent.
      const check = await checkAgentOnHandStock(tx, confirmedAgentId, [
        { productId: newProductId, quantity: qty, product: { name: newProduct.name } },
      ]);
      if (!check.ok) {
        agentShort = true;
        return; // leave the order untouched
      }
    }

    await tx.orderItem.delete({ where: { id: oldLine.id } });

    if (existingNewLines.length > 0) {
      const [keep, ...dupes] = existingNewLines;
      await tx.orderItem.update({
        where: { id: keep.id },
        data: {
          quantity: mergedQty,
          unitPrice: priced.unitPrice,
          lineTotal: priced.lineTotal,
          costPriceAtSale: Number(newProduct.costPrice),
        },
      });
      if (dupes.length) {
        await tx.orderItem.deleteMany({ where: { id: { in: dupes.map((d) => d.id) } } });
      }
    } else {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: newProductId,
          quantity: mergedQty,
          unitPrice: priced.unitPrice,
          lineTotal: priced.lineTotal,
          costPriceAtSale: Number(newProduct.costPrice),
          isUpsell: false,
          addedById: actorId,
          upsellAmount: 0,
          upsellQuantity: 0,
        },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { ...totals, discountedById: null, discountReason: null, discountedAt: null },
    });
  });

  if (agentShort) return { error: agentShortMessage(newProduct.name) };

  return {
    ok: true,
    oldProductName: oldLine.product.name,
    newProductName: newProduct.name,
    newQuantity: mergedQty,
    newLineTotal: priced.lineTotal,
    surplus:
      priced.source === "surplus"
        ? {
            productId: newProductId,
            productName: newProduct.name,
            quantity: mergedQty,
            typedUnitPrice: typedUnitPrice ?? 0,
            lineTotal: priced.lineTotal,
          }
        : null,
  };
}

/**
 * Live price preview for the Edit-line popup — prices an ABSOLUTE quantity of a
 * product (unlike `previewUpsellPrice`, which prices existing + added). Shared by
 * the rep/admin/manager/analyst reprice-preview actions. Read-only.
 */
export async function previewLineReprice(
  formId: string | null,
  productId: string,
  absoluteQty: number,
  typedUnitPrice: number,
) {
  const q = Math.max(1, Math.floor(absoluteQty));
  const priced = await resolveUpsellPrice(
    productId,
    q,
    typedUnitPrice ?? 0,
    formId ?? undefined,
  );
  return { ...priced, mergedQty: q };
}
