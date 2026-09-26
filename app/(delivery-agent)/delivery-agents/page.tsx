import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import {
  getAgentIdByUserId,
  getAgentOrdersPage,
  type AgentOrderFilters,
  type AgentUIStatus,
} from "@/modules/delivery/services/delivery-agent-portal.service";
import { OrdersClient } from "./orders-client";
import { PushPermissionCard } from "@/components/notifications/push-permission-card";

const PAGE_SIZE = 15;
const UI_STATUSES: AgentUIStatus[] = ["Pending", "Delivered", "Failed"];

export default async function DeliveryAgentOrders({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center text-gray-400">
        <p className="text-lg font-bold">No agent profile found for your account.</p>
        <p className="text-sm mt-2">Please contact your administrator.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const get = (k: string): string | undefined =>
    Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined);

  const statusRaw = get("status") ?? "";
  const filters: AgentOrderFilters = {
    uiStatus: UI_STATUSES.includes(statusRaw as AgentUIStatus) ? (statusRaw as AgentUIStatus) : undefined,
    search: (get("q") ?? "").trim(),
  };
  const pageNum = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);

  const orderPage = await getAgentOrdersPage(agentId, filters, pageNum, PAGE_SIZE);

  return (
    <>
      <PushPermissionCard variant="nudge" className="max-w-xl mx-auto mb-4" />
      <OrdersClient
        orders={orderPage.rows}
        statusCounts={orderPage.statusCounts}
        total={orderPage.total}
        page={pageNum}
        initialFilters={{ status: filters.uiStatus ?? "", search: filters.search ?? "" }}
        user={session.user}
      />
    </>
  );
}
