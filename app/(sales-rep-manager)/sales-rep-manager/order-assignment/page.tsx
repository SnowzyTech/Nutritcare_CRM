import { MOCK_TEAM_ORDERS, MOCK_SALES_REPS } from "@/lib/mock-data/sales-rep-manager";
import { OrderAssignmentClient } from "./order-assignment-client";

export const dynamic = "force-dynamic";

export default async function OrderAssignmentPage() {
  const orders = [...MOCK_TEAM_ORDERS];
  const salesReps = [...MOCK_SALES_REPS];
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    failed: orders.filter((o) => o.status === "FAILED").length,
  };

  return <OrderAssignmentClient orders={orders} counts={counts} salesReps={salesReps} />;
}
