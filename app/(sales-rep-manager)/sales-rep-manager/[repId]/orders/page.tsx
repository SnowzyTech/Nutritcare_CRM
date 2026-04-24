import { MOCK_ORDERS, MOCK_REP_DETAILS } from "@/lib/mock-data/sales-rep-manager";
import { notFound } from "next/navigation";
import { OrdersClient } from "./orders-client";

export const dynamic = "force-dynamic";

export default async function RepOrdersPage({
  params,
}: {
  params: Promise<{ repId: string }>;
}) {
  const { repId } = await params;
  const rep = MOCK_REP_DETAILS[repId] || MOCK_REP_DETAILS["2"];

  if (!rep) {
    notFound();
  }

  const orders = [...MOCK_ORDERS];
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    failed: orders.filter((o) => o.status === "FAILED").length,
  };

  return (
    <OrdersClient repId={repId} repName={rep.name} orders={orders} counts={counts} />
  );
}
