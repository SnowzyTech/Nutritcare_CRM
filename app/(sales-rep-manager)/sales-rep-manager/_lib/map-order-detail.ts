import { formatCurrency, formatDate } from "@/lib/utils";
import type { getOrderWithDetails } from "@/modules/orders/services/orders.service";
import type { OrderDetail } from "@/lib/mock-data/sales-rep-manager";

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

  const history: { label: string; date: string }[] = [
    { label: "Order Created", date: orderDate },
    { label: `Sales Rep Assigned: ${repName}`, date: orderDate },
  ];
  if (dbOrder.status !== "PENDING" && dbOrder.status !== "CANCELLED") {
    history.push({
      label: "Order Confirmed",
      date: delivery ? formatDate(delivery.createdAt) : formatDate(dbOrder.updatedAt),
    });
  }
  if (dbOrder.status !== "PENDING" && delivery && (dbOrder.notes?.trim() ?? "") !== "") {
    history.push({ label: "Prescription Sent", date: formatDate(delivery.createdAt) });
  }
  if (dbOrder.agent) {
    history.push({
      label: `Delivery Agent Assigned: ${dbOrder.agent.companyName}`,
      date: delivery ? formatDate(delivery.createdAt) : orderDate,
    });
  }
  if (dbOrder.status === "DELIVERED" && delivery?.deliveredTime) {
    history.push({ label: "Order Delivered", date: formatDate(delivery.deliveredTime) });
  }
  if (dbOrder.status === "FAILED" && delivery) {
    history.push({ label: "Order Failed", date: formatDate(delivery.updatedAt) });
  }
  if (dbOrder.status === "CANCELLED") {
    history.push({ label: "Order Cancelled", date: formatDate(dbOrder.updatedAt) });
  }

  return {
    orderId: dbOrder.id,
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
