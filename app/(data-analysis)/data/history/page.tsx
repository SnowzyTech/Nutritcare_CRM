import { HistoryClient } from "./history-client";
import { getDeletedOrders } from "@/modules/data-analysis/services/data-analysis.service";
import { auth } from "@/lib/auth/auth";

export default async function HistoryPage() {
  const session = await auth();
  const deletedOrderGroups = session?.user?.id
    ? await getDeletedOrders(session.user.id)
    : [];

  return <HistoryClient deletedOrderGroups={deletedOrderGroups} />;
}
