import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getPendingActivationRequests,
  getTeamLeads,
  getAllTeams,
} from "@/modules/users/services/users.service";
import {
  ActivationRequestsSection,
  ManageAccountToolbar,
} from "./manage-account-client";
import {
  ROLE_TO_UI_DEPT,
  UI_DEPT_LABELS,
  UI_DEPT_ORDER,
  type UiDepartment,
} from "@/lib/staff-departments";

export const metadata: Metadata = { title: "Manage Account" };

const AVATAR_COLORS = [
  "bg-purple-600",
  "bg-rose-500",
  "bg-blue-500",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-slate-600",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Avatar({
  initials,
  color,
  imageUrl,
  name,
  size = "w-[52px] h-[52px]",
}: {
  initials: string;
  color: string;
  imageUrl?: string | null;
  name?: string;
  size?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name ?? initials}
        className={`${size} rounded-full object-cover shrink-0 shadow-sm`}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-full ${color} flex items-center justify-center text-white text-[0.8rem] font-black shrink-0 shadow-sm`}
    >
      {initials}
    </div>
  );
}

function TeamLeadCard({
  label,
  name,
  colorIndex,
  avatarUrl,
}: {
  label: string;
  name: string;
  colorIndex: number;
  avatarUrl?: string | null;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <Avatar
        initials={getInitials(name)}
        color={AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]}
        imageUrl={avatarUrl}
        name={name}
        size="w-11 h-11"
      />
      <div className="leading-tight">
        <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-[0.9rem] font-bold text-slate-900 mt-0.5">{name}</p>
      </div>
    </div>
  );
}

type PageProps = {
  searchParams: Promise<{
    dept?: string;
    team?: string;
    sort?: string;
    q?: string;
  }>;
};

export default async function ManageAccountPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const dept = params.dept as UiDepartment | undefined;
  const teamId = params.team;
  const sort = params.sort ?? "desc";
  const q = params.q?.toLowerCase().trim();

  const [allRequests, allTeamLeads, allTeams] = await Promise.all([
    getPendingActivationRequests(),
    getTeamLeads(),
    getAllTeams(),
  ]);

  // ── Filter activation requests ──────────────────────────────────────────────
  let filteredRequests = allRequests;

  if (dept) {
    filteredRequests = filteredRequests.filter(
      (r) => ROLE_TO_UI_DEPT[r.role] === dept
    );
  }
  if (q) {
    filteredRequests = filteredRequests.filter((r) =>
      r.name.toLowerCase().includes(q)
    );
  }
  if (sort === "asc") {
    filteredRequests = [...filteredRequests].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  // ── Group and filter team leads ─────────────────────────────────────────────
  type LeadEntry = {
    id: string;
    name: string;
    teamName: string;
    teamId: string | undefined;
    avatarUrl: string | null;
  };

  const leadsByDept: Partial<Record<UiDepartment, LeadEntry[]>> = {};
  for (const lead of allTeamLeads) {
    const d = ROLE_TO_UI_DEPT[lead.role] ?? "SALES";
    if (!leadsByDept[d]) leadsByDept[d] = [];
    leadsByDept[d]!.push({
      id: lead.id,
      name: lead.name,
      teamName: lead.team?.name ?? "—",
      teamId: lead.team?.id,
      avatarUrl: lead.avatarUrl ?? null,
    });
  }

  // Apply dept / team / search filters to team leads
  const filteredLeadsByDept: Partial<Record<UiDepartment, LeadEntry[]>> = {};
  for (const d of UI_DEPT_ORDER) {
    if (dept && d !== dept) continue;
    let leads = leadsByDept[d] ?? [];
    if (teamId) leads = leads.filter((l) => l.teamId === teamId);
    if (q) leads = leads.filter((l) => l.name.toLowerCase().includes(q));
    if (leads.length > 0) filteredLeadsByDept[d] = leads;
  }

  const activeDepts = UI_DEPT_ORDER.filter(
    (d) => filteredLeadsByDept[d] && filteredLeadsByDept[d]!.length > 0
  );

  // Total pending count (unfiltered) for the badge
  const totalPending = allRequests.length;

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      {/* ── Toolbar ── */}
      <Suspense fallback={<div className="h-[52px] mb-8" />}>
        <ManageAccountToolbar teams={allTeams} />
      </Suspense>

      {/* ── Account Activation Requests ── */}
      <section className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50 mb-8">
        <h2 className="text-[1.1rem] font-black text-slate-900 mb-6 flex items-center gap-2">
          Account Activation Requests
          {totalPending > 0 && (
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
          )}
          {totalPending > 0 && (
            <span className="ml-1 text-[0.75rem] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              {totalPending}
            </span>
          )}
        </h2>

        {/* key resets internal visible-state when filters change */}
        <ActivationRequestsSection
          key={`${dept ?? ""}-${sort}-${q ?? ""}`}
          requests={filteredRequests}
        />
      </section>

      {/* ── Team Leads ── */}
      <section className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50 mb-10">
        <h2 className="text-[1.1rem] font-black text-slate-900 mb-8">
          Team Leads
        </h2>

        {activeDepts.length === 0 ? (
          <p className="text-slate-400 text-[0.875rem]">
            No team leads match the current filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activeDepts.map((d, deptIndex) => (
              <div key={d}>
                <p className="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest mb-4">
                  {UI_DEPT_LABELS[d]}
                </p>
                <div className="bg-slate-50/50 rounded-2xl p-6 flex flex-wrap gap-12 border border-slate-50 h-[calc(100%-36px)]">
                  {filteredLeadsByDept[d]!.map((lead, i) => (
                    <TeamLeadCard
                      key={lead.id}
                      label={lead.teamName}
                      name={lead.name}
                      colorIndex={i + deptIndex}
                      avatarUrl={lead.avatarUrl}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── View Log in History CTA ── */}
      <button className="px-10 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white text-[1rem] font-black shadow-xl shadow-purple-200 transition-all active:scale-95">
        View Log in History
      </button>
    </div>
  );
}
