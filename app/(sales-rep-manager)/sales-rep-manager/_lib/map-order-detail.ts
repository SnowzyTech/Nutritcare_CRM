import { formatCurrency, formatDate } from "@/lib/utils";
import type { getOrderWithDetails } from "@/modules/orders/services/orders.service";
import type { OrderDetail } from "@/lib/mock-data/sales-rep-manager";
import { feedbackLabel } from "@/lib/orders/order-feedback";

type DbOrder = NonNullable<Awaited<ReturnType<typeof getOrderWithDetails>>>;

/**
 * Maps a fully-loaded DB order into the read-only `OrderDetail` shape used by the
 * sales-rep-manager order detail view. Shared by both manager routes so they stay
 * in sync.
 */
export function mapOrderToDetail(dbOrder: DbOrder, repName: string): OrderDetail {
  const mainItem = dbOrder.items.find((i) => !i.isUpsell) ?? dbOrder.items[0];
  const upsellItem = dbOrder.items.find((i) => i.isUpsell);
  const delivery = dbOrder.deliveries[0] ?? null;
  const orderDate = formatDate(dbOrder.createdAt);

  const gross = Number(dbOrder.totalAmount);
  const net = Number(dbOrder.netAmount);
  const discountAmt = Number(dbOrder.discountAmount);
  const deliveryFeeNum = Number(dbOrder.deliveryFee);

  // Events carry their timestamp so the rep's call feedback can be merged in
  // chronologically; they are formatted to date strings at the end.
  const events: { label: string; at: Date }[] = [
    { label: "Order Created", at: dbOrder.createdAt },
    { label: `Sales Rep Assigned: ${repName}`, at: dbOrder.createdAt },
  ];
  if (dbOrder.status !== "PENDING" && dbOrder.status !== "CANCELLED") {
    events.push({
      label: "Order Confirmed",
      at: delivery ? delivery.createdAt : dbOrder.updatedAt,
    });
  }
  if (dbOrder.status !== "PENDING" && delivery && (dbOrder.notes?.trim() ?? "") !== "") {
    events.push({ label: "Prescription Sent", at: delivery.createdAt });
  }
  if (dbOrder.agent) {
    events.push({
      label: `Delivery Agent Assigned: ${dbOrder.agent.companyName}`,
      at: delivery ? delivery.createdAt : dbOrder.createdAt,
    });
  }
  if (dbOrder.status === "DELIVERED" && delivery?.deliveredTime) {
    events.push({ label: "Order Delivered", at: delivery.deliveredTime });
  }
  if (dbOrder.status === "FAILED" && delivery) {
    events.push({ label: "Order Failed", at: delivery.updatedAt });
  }
  if (dbOrder.status === "CANCELLED") {
    events.push({ label: "Order Cancelled", at: dbOrder.updatedAt });
  }

  // Each feedback entry slots in before the first status event that happened
  // after it (feedbacks arrive newest-first; walk them oldest-first). Status
  // events keep their existing relative order.
  for (const f of [...dbOrder.feedbacks].reverse()) {
    const label = `Feedback: ${feedbackLabel(f.outcome)}${f.note ? ` — ${f.note}` : ""} (by ${f.author.name})`;
    const idx = events.findIndex((e) => e.at.getTime() > f.createdAt.getTime());
    const entry = { label, at: f.createdAt };
    if (idx === -1) events.push(entry);
    else events.splice(idx, 0, entry);
  }

  const history: { label: string; date: string }[] = events.map((e) => ({
    label: e.label,
    date: formatDate(e.at),
  }));

  return {
    orderId: dbOrder.id,
    orderNumber: dbOrder.orderNumber,
    status: dbOrder.status as OrderDetail["status"],
    customer: {
      fullName: dbOrder.customer.name,
      phone: dbOrder.customer.phone,
      whatsapp: dbOrder.customer.whatsappNumber ?? dbOrder.customer.phone,
      email: dbOrder.customer.email ?? "",
      address: dbOrder.customer.deliveryAddress,
      state: dbOrder.customer.state,
      lga: dbOrder.customer.lga,
      landmark: dbOrder.customer.landmark ?? "",
    },
    product: mainItem?.product.name ?? "—",
    productImage: mainItem?.product.imageUrl ?? null,
    quantity: mainItem?.quantity ?? 0,
    upsell: upsellItem
      ? { product: upsellItem.product.name, quantity: upsellItem.quantity, image: upsellItem.product.imageUrl ?? null }
      : null,
    // Per-line breakdown: original quantity + rep-upsold portion (units + amount).
    // Handles merged same-product upsells and multiple upsold products.
    items: dbOrder.items.map((it) => ({
      product: it.product.name,
      image: it.product.imageUrl ?? null,
      quantity:
        !it.isUpsell && it.upsellQuantity > 0
          ? it.quantity - it.upsellQuantity
          : it.quantity,
      upsellQuantity: it.upsellQuantity,
      upsellAmount: formatCurrency(Number(it.upsellAmount)),
      isUpsell: it.isUpsell,
    })),
    totalPrice: formatCurrency(net),
    pricing: {
      original: formatCurrency(gross),
      net: formatCurrency(net),
      discount: discountAmt > 0 ? formatCurrency(discountAmt) : null,
      discountPercent: discountAmt > 0 ? Number(dbOrder.discountPercent).toString() : null,
    },
    orderDate,
    source: dbOrder.customer.source ?? "—",
    contactedVia:
      dbOrder.contactMethod === "PHONE"
        ? "phone"
        : dbOrder.contactMethod === "WHATSAPP"
          ? "whatsapp"
          : "none",
    agent: dbOrder.agent
      ? {
          companyName: dbOrder.agent.companyName,
          state: dbOrder.agent.state ?? null,
          phone: dbOrder.agent.phone1,
        }
      : null,
    deliveryFee: deliveryFeeNum > 0 ? formatCurrency(deliveryFeeNum) : null,
    estimatedDelivery: delivery?.scheduledTime ? formatDate(delivery.scheduledTime) : null,
    deliveredDate: delivery?.deliveredTime ? formatDate(delivery.deliveredTime) : null,
    failReason: delivery?.failureReason ?? undefined,
    cancelReason: dbOrder.cancellationReason ?? undefined,
    prescription: dbOrder.notes ?? "",
    history,
  };
}
