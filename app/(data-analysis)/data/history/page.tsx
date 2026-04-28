import { HistoryClient } from "./history-client";
import { getUserActivityHistory } from "@/modules/data-analysis/services/data-analysis.service";
import { auth } from "@/lib/auth/auth";

export default async function HistoryPage() {
  const session = await auth();
  const historyGroups = session?.user?.id
    ? await getUserActivityHistory(session.user.id)
    : [];

  return <HistoryClient historyGroups={historyGroups} />;
}
