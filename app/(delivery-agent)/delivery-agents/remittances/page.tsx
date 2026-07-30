import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import {
  getAgentIdByUserId,
  getAgentRemittances,
} from "@/modules/delivery/services/delivery-agent-portal.service";
import { formatDate } from "@/lib/utils";
import { RemittancesClient } from "./remittances-client";

export const dynamic = "force-dynamic";

export default async function RemittancesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) redirect("/delivery-agents");

  const { netBalance, totalRemitted, entries } = await getAgentRemittances(agentId);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-black text-[#1e1e2d]">Remittances</h2>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
          Payments recorded by accounting
        </p>
      </div>

      <RemittancesClient netBalance={netBalance} totalRemitted={totalRemitted} entries={entries} />

      <p className="text-xs text-gray-300 font-bold text-left px-2">
        Last Updated: {formatDate(new Date())}
      </p>
    </div>
  );
}
