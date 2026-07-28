import { redirect } from "next/navigation";
import { ChevronRight, Users, Building2, Crown } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { isCompanySalesManager } from "@/lib/auth/role-routes";
import {
  getTeamsWithMemberCount,
  getSalesTeamLeads,
} from "@/modules/users/services/users.service";
import { getTeamsAnalytics } from "@/modules/data-analysis/services/data-analysis.service";
import { parseMonthParam } from "@/lib/month-period";
import { BaseLink } from "../_lib/base-path";
import { AnalyticsPeriodToggle } from "../analytics/period-toggle";
import { parseRange } from "../analytics/analytics-period";

export const dynamic = "force-dynamic";

const PERIOD_LABEL: Record<"day" | "week" | "month", string> = {
  day: "today",
  week: "this week",
  month: "this month",
};

/**
 * Company Sales Manager only — a company-wide view of every team, each team's
 * lead(s), and a side-by-side comparison of their key delivery metrics
 * (Features 1 & 3). The Day/Week/Month toggle scopes the Orders/Delivered/KPI
 * columns. Team-leads never reach this (guarded + no nav link).
 */
export default async function TeamsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; month?: string }>;
}) {
  const session = await auth();
  if (!isCompanySalesManager(session?.user?.role)) {
    redirect("/sales-rep-manager");
  }

  const { range: rangeParam, month } = await searchParams;
  const range = parseRange(rangeParam);
  const mp = parseMonthParam(month);
  // getTeamsAnalytics month is 0-indexed; parseMonthParam is 1-12.
  const analyticsOptions =
    range === "month"
      ? { period: "month" as const, month: mp.month - 1, year: mp.year }
      : { period: range };

  const [teams, leads, analytics] = await Promise.all([
    getTeamsWithMemberCount(),
    getSalesTeamLeads(),
    getTeamsAnalytics(analyticsOptions),
  ]);

  // Group team leads by their team id; collect any with no team separately.
  const leadsByTeam = new Map<string, { id: string; name: string }[]>();
  const unassignedLeads: { id: string; name: string }[] = [];
  for (const lead of leads) {
    const tid = lead.team?.id;
    if (!tid) {
      unassignedLeads.push({ id: lead.id, name: lead.name });
      continue;
    }
    const arr = leadsByTeam.get(tid) ?? [];
    arr.push({ id: lead.id, name: lead.name });
    leadsByTeam.set(tid, arr);
  }

  // Index analytics by team id for the comparison columns.
  const metricsByTeam = new Map(analytics.map((a) => [a.teamId, a.currentMetrics]));

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-[#3B0069] text-white text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
            Manager Mode
          </span>
          <span className="bg-[#F3E8FF] text-[#A020F0] text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-[#D6BBFB]">
            All Teams
          </span>
        </div>
        <AnalyticsPeriodToggle />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#FAF5FF] text-[#A020F0] flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Teams</p>
            <p className="text-xl font-black text-gray-900">{teams.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#FAF5FF] text-[#A020F0] flex items-center justify-center shrink-0">
            <Crown size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Team Leads</p>
            <p className="text-xl font-black text-gray-900">{leads.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#FAF5FF] text-[#A020F0] flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Sales Reps</p>
            <p className="text-xl font-black text-gray-900">
              {teams.reduce((sum, t) => sum + t._count.members, 0)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          Teams & Team Leads — Comparison
          <span className="ml-2 normal-case tracking-normal text-gray-400 font-medium">
            (Orders / Delivered / KPI — {PERIOD_LABEL[range]})
          </span>
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-bold">Team</th>
                <th className="px-6 py-4 font-bold">Team Lead</th>
                <th className="px-6 py-4 font-bold text-center">Reps</th>
                <th className="px-6 py-4 font-bold text-center">Orders</th>
                <th className="px-6 py-4 font-bold text-center">Delivered</th>
                <th className="px-6 py-4 font-bold text-center">KPI</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, idx) => {
                const teamLeads = leadsByTeam.get(team.id) ?? [];
                const m = metricsByTeam.get(team.id);
                return (
                  <tr
                    key={team.id}
                    className={`hover:bg-purple-50/50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                  >
                    <td className="px-6 py-4 font-bold text-gray-900">{team.name}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {teamLeads.length > 0 ? teamLeads.map((l) => l.name).join(", ") : "—"}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">{team._count.members}</td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">{m ? m.kpi.totalOrders : "—"}</td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">{m ? m.kpi.ordersDelivered : "—"}</td>
                    <td className="px-6 py-4 text-center">
                      {m ? (
                        <span className="inline-flex items-center justify-center bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold text-xs border border-green-100">
                          {m.kpi.value}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <BaseLink
                        href={`/teams/${team.id}`}
                        className="inline-flex items-center gap-1 text-[#A020F0] font-semibold hover:underline"
                      >
                        View <ChevronRight size={14} />
                      </BaseLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {unassignedLeads.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Unassigned Team Leads
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5 flex flex-col gap-3">
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              These sales reps are flagged as team leads but aren&apos;t assigned to any team. Assign
              them from a rep&apos;s profile, or clear the flag.
            </p>
            <div className="flex flex-wrap gap-2">
              {unassignedLeads.map((l) => (
                <BaseLink
                  key={l.id}
                  href={`/${l.id}`}
                  className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-amber-100 transition"
                >
                  <Crown size={13} /> {l.name}
                </BaseLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
