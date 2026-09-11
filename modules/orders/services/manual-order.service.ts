import { prisma } from "@/lib/db/prisma";
import { nextOrderNumber } from "@/modules/orders/services/order-number.service";
import { resolveUpsellPrice } from "@/modules/orders/services/tier-pricing.service";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { formatCurrency } from "@/lib/utils";
import { z } from "zod";

/**
 * Shared write path for MANUAL order creation (i.e. not a public form submission).
 *
 * Two entry points use it and must never diverge on the money math:
 *  - the sales rep's own "Add Order" modal (`createOrderAction`), and
 *  - the data analyst creating an order on a rep's behalf
 *    (`createOrderByAnalystAction`).
 *
 * Same rule as the upsell flow (docs/upsell-package-pricing.md): pricing is
 * resolved server-side from the chosen FORM's package tiers via
 * `resolveUpsellPrice` — never `sellingPrice x qty` — and the caller-supplied
 * `unitPrice` only ever covers surplus units that have no exact package.
 */

/**
 * One product line carries the FORM whose package tiers price it (a product can
 * belong to many forms) plus the quantity; `unitPrice` is the price-of-one the
 * creator types and is only needed when the quantity has no exact package.
 */
export const manualOrderSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required."),
  phone: z.string().trim().min(1, "Phone number is required."),
  whatsappNumber: z.string().trim().optional(),
  email: z.string().trim().optional(),
  deliveryAddress: z.string().trim().min(1, "Delivery address is required."),
  state: z.string().trim().min(1, "State is required."),
  landmark: z.string().trim().optional(),
  isReorder: z.boolean().optional(),
  products: z
    .array(
      z.object({
        productId: z.string().min(1),
        formId: z.string().min(1, "Choose a form for pricing."),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive().optional(),
      }),
    )
    .min(1, "At least one product is required."),
});

export type ManualOrderInput = z.infer<typeof manualOrderSchema>;

/** A line priced with a typed unit price (surplus units) — audited after the write. */
export type ManualOrderSurplusLine = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ManualOrderResult =
  | {
      orderId: string;
      orderNumber: string;
      totalAmount: number;
      surplusLines: ManualOrderSurplusLine[];
    }
  | { error: string };

/**
 * Upserts the customer by phone, re-prices every line from its chosen form, and
 * creates the PENDING order attributed to `salesRepId`.
 *
 * Callers own auth, `suppressCameraForRequest()`, audit logging (via
 * `logManualOrderCreated`) and revalidation. Never throws — returns `{ error }`
 * so actions can hand the message straight back to the UI.
 */
export async function createManualOrder(
  input: ManualOrderInput,
  salesRepId: string,
): Promise<ManualOrderResult> {
  const {
    customerName, phone, whatsappNumber, email, deliveryAddress,
    state, landmark, isReorder, products,
  } = input;

  const cleanPhone = phone.replace(/\s+/g, "");

  let customer = await prisma.customer.findFirst({ where: { phone: cleanPhone } });
  if (customer) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: customerName,
        whatsappNumber: whatsappNumber || null,
        email: email || null,
        deliveryAddress,
        state,
        landmark: landmark || null,
      },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        name: customerName,
        phone: cleanPhone,
        whatsappNumber: whatsappNumber || null,
        email: email || null,
        deliveryAddress,
        state,
        lga: "",
        landmark: landmark || null,
      },
    });
  }

  const dbProducts = await prisma.product.findMany({
    where: { id: { in: products.map((p) => p.productId) }, deletedAt: null },
    select: { id: true, name: true, costPrice: true },
  });
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));
  // Order code prefix comes from the main (first-selected) product.
  const mainProductName = productMap.get(products[0]?.productId)?.name;

  // Validate the chosen forms are active and belong to each line's product — we
  // price ONLY from the chosen form and never silently fall back to another form
  // if it was disabled since the page loaded.
  const formIds = [...new Set(products.map((p) => p.formId))];
  const forms = await prisma.form.findMany({
    where: { id: { in: formIds }, disabledAt: null, deletedAt: null },
    select: { id: true, data: true },
  });
  const formMap = new Map(forms.map((f) => [f.id, f]));

  const orderItemsData: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    costPriceAtSale: number;
  }> = [];
  const surplusLines: ManualOrderSurplusLine[] = [];

  for (const item of products) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { error: "One or more selected products are unavailable." };
    }

    const form = formMap.get(item.formId);
    const selectedProduct = (form?.data as { selectedProduct?: unknown } | undefined)
      ?.selectedProduct;
    if (!form || selectedProduct !== item.productId) {
      return {
        error: `Pricing for ${product.name} could not be resolved — its form may have been disabled. Please contact the admin.`,
      };
    }

    // Reuse the shared upsell pricing engine: exact package → package price;
    // between/below packages → nearest lower + surplus × typed unit price.
    const priced = await resolveUpsellPrice(
      item.productId,
      item.quantity,
      item.unitPrice ?? 0,
      item.formId,
    );
    if (priced.requiresUnitPrice && (!item.unitPrice || item.unitPrice <= 0)) {
      return {
        error: `Enter a unit price for the extra units of ${product.name}.`,
      };
    }

    orderItemsData.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: priced.unitPrice,
      lineTotal: priced.lineTotal,
      costPriceAtSale: Number(product.costPrice),
    });

    if (priced.source === "surplus") {
      surplusLines.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? 0,
        lineTotal: priced.lineTotal,
      });
    }
  }

  const totalAmount = orderItemsData.reduce((sum, i) => sum + i.lineTotal, 0);

  try {
    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = await nextOrderNumber(tx, mainProductName);
      return tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          salesRepId,
          totalAmount,
          netAmount: totalAmount,
          // Order.formId intentionally left null: a manual order can mix lines
          // from different forms; the chosen form only prices at creation time,
          // and we don't attribute manual orders to media-buyer form analytics.
          status: "PENDING",
          isReorder: isReorder ?? false,
          items: { create: orderItemsData },
        },
      });
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount,
      surplusLines,
    };
  } catch (err) {
    console.error("[createManualOrder] Error:", err);
    return { error: "Failed to create order. Please try again." };
  }
}

/**
 * Audit rows for a manual order: one "Created" row plus one per manually-priced
 * (surplus) line, so finance can review every typed unit price.
 *
 * Rows are filed under the OWNING SALES REP (`salesRepId`) with the real actor in
 * `actorName`/`actorRole` — the same on-behalf-of convention the analyst's
 * mark-delivered/failed flows use, so an order a data analyst types in still
 * lands on the rep's history while naming who actually keyed it.
 */
export async function logManualOrderCreated(params: {
  salesRepId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  surplusLines: ManualOrderSurplusLine[];
  /** The signed-in creator, when that is not the rep themselves. */
  actor?: { name?: string | null; role?: string | null } | null;
  /** The rep's name — only used to spell out the on-behalf-of description. */
  onBehalfOfName?: string | null;
}): Promise<void> {
  const {
    salesRepId, orderId, orderNumber, customerName,
    totalAmount, surplusLines, actor, onBehalfOfName,
  } = params;

  const onBehalfOf = actor
    ? ` by ${actor.name ?? "another user"} on behalf of ${onBehalfOfName ?? "the sales rep"}`
    : "";

  await logActivity({
    userId: salesRepId,
    actorName: actor?.name ?? null,
    actorRole: actor?.role ?? null,
    action: "Created",
    entityType: "Order",
    entityId: orderId,
    description: `Order #${orderNumber} created for ${customerName}${onBehalfOf}`,
    details: { amount: totalAmount },
  });

  // Audit every manually-priced (surplus) line so finance can review typed unit
  // prices — same guardrail as the upsell flow.
  for (const s of surplusLines) {
    await logActivity({
      userId: salesRepId,
      actorName: actor?.name ?? null,
      actorRole: actor?.role ?? null,
      action: "Created",
      entityType: "OrderItem",
      entityId: orderId,
      description: `Manual unit price ${formatCurrency(
        s.unitPrice,
      )} used for ${s.productName} (qty ${s.quantity}) on Order #${orderNumber}`,
      details: {
        field: "unitPrice",
        amount: s.lineTotal,
        productId: s.productId,
        typedUnitPrice: s.unitPrice,
      },
    });
  }
}
