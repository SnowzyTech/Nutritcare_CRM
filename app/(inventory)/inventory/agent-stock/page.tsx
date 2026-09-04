import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/role-routes";
import { getAgentsForDropdown } from "@/modules/inventory/services/inventory.service";
import { listAgentStockAdjustments } from "@/modules/inventory/services/agent-stock-adjustment.service";
import { AgentStockClient } from "@/components/inventory/agent-stock-client";

export const metadata: Metadata = { title: "Agent Stock Correction" };

export default async function AgentStockPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const admin = isAdmin(session.user.role);

  const [agents, adjustments] = await Promise.all([
    getAgentsForDropdown(),
    // Inventory managers see their own corrections; super-admin oversight sees all.
    listAgentStockAdjustments(admin ? undefined : { createdById: session.user.id }),
  ]);

  return (
    <div className="max-w-[1100px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Agent Stock Correction</h1>
        <p className="text-sm text-gray-400 mt-1">
          Reconcile an agent&apos;s recorded stock to the real physical count.
        </p>
      </div>
      <AgentStockClient agents={agents} adjustments={adjustments} canApprove={admin} />
    </div>
  );
}
