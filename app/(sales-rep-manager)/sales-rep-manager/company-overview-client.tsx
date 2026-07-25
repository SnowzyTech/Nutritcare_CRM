"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Users, ClipboardList, Gauge, Building2, ChevronRight } from "lucide-react";

export type CompanyRep = {
  id: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  pendingOrders: number;
  performance: number;
  teamId: string | null;
  teamName: string | null;
};

type TeamGroup = {
  teamId: string | null;
  teamName: string;
  repCount: number;
  pendingOrders: number;
  avgPerformance: number;
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-[#FAF5FF] text-[#A020F0] flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function CompanyOverviewClient({ reps }: { reps: CompanyRep[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const totals = useMemo(() => {
    const pendingOrders = reps.reduce((sum, r) => sum + r.pendingOrders, 0);
    const avgPerformance =
      reps.length > 0 ? Math.round(reps.reduce((s, r) => s + r.performance, 0) / reps.length) : 0;
    const teamIds = new Set(reps.map(r => r.teamId ?? "unassigned"));
    return { repCount: reps.length, pendingOrders, avgPerformance, teamCount: teamIds.size };
  }, [reps]);

  const teams = useMemo<TeamGroup[]>(() => {
    const map = new Map<string, CompanyRep[]>();
    for (const r of reps) {
      const key = r.teamId ?? "unassigned";
      (map.get(key) ?? map.set(key, []).get(key)!).push(r);
    }
    return Array.from(map.entries())
      .map(([, members]) => {
        const first = members[0];
        return {
          teamId: first.teamId,
          teamName: first.teamName ?? "Unassigned",
          repCount: members.length,
          pendingOrders: members.reduce((s, m) => s + m.pendingOrders, 0),
          avgPerformance: Math.round(members.reduce((s, m) => s + m.performance, 0) / members.length),
        };
      })
      .sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [reps]);

  const filteredReps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reps;
    return reps.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q) ||
        (r.teamName ?? "").toLowerCase().includes(q)
    );
  }, [reps, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="bg-[#3B0069] text-white text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
          Manager Mode
        </span>
        <span className="bg-[#F3E8FF] text-[#A020F0] text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-[#D6BBFB]">
          Company-Wide
        </span>
      </div>

      {/* Company totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Sales Reps" value={totals.repCount} />
        <StatCard icon={Building2} label="Teams" value={totals.teamCount} />
        <StatCard icon={ClipboardList} label="Pending Orders" value={totals.pendingOrders} />
        <StatCard icon={Gauge} label="Avg General Performance" value={`${totals.avgPerformance}%`} />
      </div>

      {/* Per-team breakdown */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Teams</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => {
            const card = (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-[#D6BBFB] transition-colors h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-bold text-gray-900 truncate">{team.teamName}</span>
                  {team.teamId && <ChevronRight size={16} className="text-gray-300 shrink-0" />}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-gray-400">Reps</p>
                    <p className="font-bold text-gray-700">{team.repCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Pending</p>
                    <p className="font-bold text-gray-700">{team.pendingOrders}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Avg Perf.</p>
                    <p className="font-bold text-green-600">{team.avgPerformance}%</p>
                  </div>
                </div>
              </div>
            );
            return team.teamId ? (
              <Link key={team.teamId} href={`/sales-rep-manager/teams/${team.teamId}`}>
                {card}
              </Link>
            ) : (
              <div key="unassigned">{card}</div>
            );
          })}
        </div>
      </div>

      {/* All reps */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">All Sales Reps</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, phone or team…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 w-full sm:w-72 transition-all"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {filteredReps.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center text-gray-400 text-sm">
            {reps.length === 0 ? "No active sales reps." : "No reps match your search."}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Name</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Team</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-center">Pending</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Phone</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-right">Performance</th>
                </tr>
              </thead>
              <tbody>
                {filteredReps.map((rep, idx) => (
                  <tr
                    key={rep.id}
                    className={`hover:bg-purple-50/50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                  >
                    <td className="px-6 py-4 font-bold text-gray-900">
                      <Link href={`/sales-rep-manager/${rep.id}`} className="hover:underline flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-200 overflow-hidden shrink-0">
                          {rep.avatarUrl ? (
                            <img src={rep.avatarUrl} alt={rep.name} className="w-full h-full object-cover" />
                          ) : (
                            rep.name.charAt(0)
                          )}
                        </span>
                        {rep.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{rep.teamName ?? "—"}</td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">{rep.pendingOrders}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{rep.phone ?? "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center justify-center bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold text-xs border border-green-100">
                        {rep.performance}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
