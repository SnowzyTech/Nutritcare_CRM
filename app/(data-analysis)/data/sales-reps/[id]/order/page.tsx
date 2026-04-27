import { OrderDashboardClient } from "../../../_components/OrderDashboardClient";

export default async function SalesRepOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDashboardClient id={id} />;
}
