import { MOCK_TEAM_ORDERS } from "@/lib/mock-data/sales-rep-manager";
import { TeamOrdersClient } from "./team-orders-client";

export const dynamic = "force-dynamic";

export default async function TeamOrdersPage() {
  const orders = [...MOCK_TEAM_ORDERS];
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    failed: orders.filter((o) => o.status === "FAILED").length,
  };

  return <TeamOrdersClient orders={orders} counts={counts} />;
}
