import { MOCK_ORDER_DETAILS, MOCK_TEAM_ORDERS } from "@/lib/mock-data/sales-rep-manager";
import { notFound } from "next/navigation";
import { OrderDetailClient } from "../../[repId]/orders/[orderId]/order-detail-client";

export const dynamic = "force-dynamic";

export default async function TeamOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  
  // Find the order in team orders to get the assigned rep name
  const teamOrder = MOCK_TEAM_ORDERS.find(o => o.id === orderId);
  const repName = teamOrder?.salesRep || "Sales Rep";
  const repId = "unknown"; // Not heavily used by the UI except for back links which aren't in OrderDetailClient

  // Use mock order if it exists, otherwise provide a fallback order
  const order = MOCK_ORDER_DETAILS[orderId] || {
    orderId,
    status: teamOrder?.status as any || "PENDING",
    customer: {
      fullName: teamOrder?.name || "Adewale Johnson",
      phone: "0906 713 6429",
      whatsapp: "0906 713 6429",
      email: teamOrder?.email || "adewale@gmail.com",
      address: "15 Adeyemi Crescent, Bodija Estate, Ibadan, Oyo State, Nigeria",
      state: "Oyo State",
      lga: "Ibadan North Local Government Area",
      landmark: "Bodija Market",
    },
    product: teamOrder?.product || "Prosxact",
    quantity: teamOrder?.qty || 4,
    upsell: null,
    totalPrice: "₦84,000",
    source: "WhatsApp",
    contactedVia: "none" as const,
    prescription: "Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days.",
    history: ["Order Created", `Sales Rep Assigned: ${repName}`],
  };

  return <OrderDetailClient repId={repId} repName={repName} order={order} />;
}
