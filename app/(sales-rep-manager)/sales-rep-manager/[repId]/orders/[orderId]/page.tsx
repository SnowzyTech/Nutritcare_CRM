import { MOCK_ORDER_DETAILS, MOCK_REP_DETAILS } from "@/lib/mock-data/sales-rep-manager";
import { notFound } from "next/navigation";
import { OrderDetailClient } from "./order-detail-client";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ repId: string; orderId: string }>;
}) {
  const { repId, orderId } = await params;
  const rep = MOCK_REP_DETAILS[repId] || MOCK_REP_DETAILS["2"];
  
  // Use mock order if it exists, otherwise provide a fallback pending order
  const order = MOCK_ORDER_DETAILS[orderId] || {
    orderId,
    status: "PENDING" as const,
    customer: {
      fullName: "Adewale Johnson",
      phone: "0906 713 6429",
      whatsapp: "0906 713 6429",
      email: "adewale@gmail.com",
      address: "15 Adeyemi Crescent, Bodija Estate, Ibadan, Oyo State, Nigeria",
      state: "Oyo State",
      lga: "Ibadan North Local Government Area",
      landmark: "Bodija Market",
    },
    product: "Prosxact",
    quantity: 4,
    upsell: null,
    totalPrice: "₦84,000",
    source: "WhatsApp",
    contactedVia: "none" as const,
    prescription: "Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days.",
    history: ["Order Created", `Sales Rep Assigned: ${rep.name}`],
  };

  if (!rep) {
    notFound();
  }

  return <OrderDetailClient repId={repId} repName={rep.name} order={order} />;
}
