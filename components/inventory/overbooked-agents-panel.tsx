import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getOverbookedAgents } from "@/modules/delivery/services/agents.service";

/**
 * Agents who have promised more units of a product than they are holding.
 *
 * Order assignment deliberately allows this - a newer, more urgent order must
 * never be blocked because an earlier order booked the agent's stock - so the
 * shortfall has to be visible somewhere the office looks. Whatever is still on
 * this list when the agent reaches the customer becomes a REFUSED delivery
 * (`deliverOrder` will not overdraw the agent), so this is a work queue: restock
 * the agent, or correct their recorded stock.
 *
 * Server component: renders nothing at all when everything is in balance.
 */
export default async function OverbookedAgentsPanel({
  correctionHref,
}: {
  /** Where "fix" links go; omit for viewers without access to the correction tool. */
  correctionHref?: string;
}) {
  const rows = await getOverbookedAgents();
  if (rows.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-amber-900">
            Over-booked agents ({rows.length})
          </h3>
        </div>
        {correctionHref && (
          <Link
            href={correctionHref}
            className="text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
          >
            Correct agent stock
          </Link>
        )}
      </div>

      <p className="px-4 pt-3 text-xs text-amber-800">
        These agents have confirmed orders for more units than they are holding. Restock them
        before the delivery date — otherwise those deliveries will be refused.
      </p>

      <div className="overflow-x-auto px-4 py-3">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-amber-700">
              <th className="py-2 pr-3 font-bold">Agent</th>
              <th className="py-2 px-3 font-bold">Product</th>
              <th className="py-2 px-3 font-bold text-center">Holding</th>
              <th className="py-2 px-3 font-bold text-center">Committed</th>
              <th className="py-2 pl-3 font-bold text-center">Short by</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.agentId}-${r.productId}`} className="border-t border-amber-100">
                <td className="py-2 pr-3">
                  <div className="font-medium text-amber-900">{r.agentName}</div>
                  {r.state && <div className="text-[11px] text-amber-600">{r.state}</div>}
                </td>
                <td className="py-2 px-3 text-amber-900">{r.productName}</td>
                <td className="py-2 px-3 text-center text-amber-800">{r.held}</td>
                <td className="py-2 px-3 text-center text-amber-800">{r.committed}</td>
                <td className="py-2 pl-3 text-center font-bold text-red-600">{r.short}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
