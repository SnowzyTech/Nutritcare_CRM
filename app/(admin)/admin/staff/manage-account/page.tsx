import type { Metadata } from "next";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPendingActivationRequests,
  getTeamLeads,
} from "@/modules/users/services/users.service";
import { ActivationRequestsSection } from "./manage-account-client";
import type { Department } from "@prisma/client";

export const metadata: Metadata = { title: "Manage Account" };

const DEPT_LABELS: Record<Department, string> = {
  SALES: "Sales",
  INVENTORY_LOGISTICS: "Inventory / Logistics",
  ACCOUNTING: "Accounting",
  DATA: "Data",
};

const DEPT_ORDER: Department[] = [
  "SALES",
  "INVENTORY_LOGISTICS",
  "ACCOUNTING",
  "DATA",
];

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
  size = "w-[52px] h-[52px]",
}: {
  initials: string;
  color: string;
  size?: string;
}) {
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
}: {
  label: string;
  name: string;
  colorIndex: number;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <Avatar
        initials={getInitials(name)}
        color={AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]}
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

export default async function ManageAccountPage() {
  const [pendingRequests, allTeamLeads] = await Promise.all([
    getPendingActivationRequests(),
    getTeamLeads(),
  ]);

  // Group team leads by department
  const leadsByDept: Partial<
    Record<Department, { id: string; name: string; teamName: string }[]>
  > = {};
  for (const lead of allTeamLeads) {
    const dept = lead.team?.department ?? ("SALES" as Department);
    if (!leadsByDept[dept]) leadsByDept[dept] = [];
    leadsByDept[dept]!.push({
      id: lead.id,
      name: lead.name,
      teamName: lead.team?.name ?? "—",
    });
  }

  const activeDepts = DEPT_ORDER.filter(
    (d) => leadsByDept[d] && leadsByDept[d]!.length > 0
  );

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-[0.85rem] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
          <SlidersHorizontal size={15} />
          Filter
        </button>

        <Select defaultValue="dept">
          <SelectTrigger className="w-[110px] h-[38px] border-slate-200 rounded-lg bg-white text-[0.85rem] font-bold text-slate-700 shadow-sm">
            <SelectValue placeholder="Dept." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="data">Data</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="team-2">
          <SelectTrigger className="w-[110px] h-[38px] border-slate-200 rounded-lg bg-white text-[0.85rem] font-bold text-slate-700 shadow-sm">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="team-1">Team 1</SelectItem>
            <SelectItem value="team-2">Team 2</SelectItem>
          </SelectContent>
        </Select>

        <button className="flex items-center gap-1 px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
          <ArrowUpDown size={15} />
        </button>

        <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-[0.82rem] font-black uppercase tracking-wider transition-all shadow-md shadow-purple-200">
          See all Staffs
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 bg-white min-w-[280px] shadow-sm">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="search"
            className="border-none outline-none text-[0.85rem] text-slate-700 bg-transparent w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ── Account Activation Requests ── */}
      <section className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50 mb-8">
        <h2 className="text-[1.1rem] font-black text-slate-900 mb-6 flex items-center gap-2">
          Account Activation Requests
          {pendingRequests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
          )}
          {pendingRequests.length > 0 && (
            <span className="ml-1 text-[0.75rem] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </h2>

        <ActivationRequestsSection requests={pendingRequests} />
      </section>

      {/* ── Team Leads ── */}
      <section className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50 mb-10">
        <h2 className="text-[1.1rem] font-black text-slate-900 mb-8">
          Team Leads
        </h2>

        {activeDepts.length === 0 ? (
          <p className="text-slate-400 text-[0.875rem]">
            No team leads assigned yet.
          </p>
        ) : (
          <div className="space-y-10">
            {/* Sales — full width */}
            {leadsByDept.SALES && leadsByDept.SALES.length > 0 && (
              <div>
                <p className="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Sales
                </p>
                <div className="bg-slate-50/50 rounded-2xl p-6 flex flex-wrap gap-12 border border-slate-50">
                  {leadsByDept.SALES.map((lead, i) => (
                    <TeamLeadCard
                      key={lead.id}
                      label={lead.teamName}
                      name={lead.name}
                      colorIndex={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inventory/Logistics + Accounting side by side */}
            {(leadsByDept.INVENTORY_LOGISTICS?.length ||
              leadsByDept.ACCOUNTING?.length) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {leadsByDept.INVENTORY_LOGISTICS &&
                  leadsByDept.INVENTORY_LOGISTICS.length > 0 && (
                    <div className="lg:col-span-2">
                      <p className="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Inventory / Logistics
                      </p>
                      <div className="bg-slate-50/50 rounded-2xl p-6 flex flex-wrap gap-12 border border-slate-50 h-[calc(100%-36px)]">
                        {leadsByDept.INVENTORY_LOGISTICS.map((lead, i) => (
                          <TeamLeadCard
                            key={lead.id}
                            label={lead.teamName}
                            name={lead.name}
                            colorIndex={i + 2}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {leadsByDept.ACCOUNTING && leadsByDept.ACCOUNTING.length > 0 && (
                  <div>
                    <p className="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest mb-4">
                      Accounting
                    </p>
                    <div className="bg-slate-50/50 rounded-2xl p-6 flex flex-col gap-6 border border-slate-50 h-[calc(100%-36px)]">
                      {leadsByDept.ACCOUNTING.map((lead, i) => (
                        <TeamLeadCard
                          key={lead.id}
                          label={lead.teamName}
                          name={lead.name}
                          colorIndex={i + 1}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Data — full width */}
            {leadsByDept.DATA && leadsByDept.DATA.length > 0 && (
              <div>
                <p className="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Data
                </p>
                <div className="bg-slate-50/50 rounded-2xl p-6 flex flex-wrap gap-12 border border-slate-50">
                  {leadsByDept.DATA.map((lead, i) => (
                    <TeamLeadCard
                      key={lead.id}
                      label={lead.teamName}
                      name={lead.name}
                      colorIndex={i + 3}
                    />
                  ))}
                </div>
              </div>
            )}
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
