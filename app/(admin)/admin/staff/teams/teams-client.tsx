"use client";

import React, { useState, useTransition } from "react";
import { Trash2, Plus, Users, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { createTeamAction, deleteTeamAction } from "@/modules/users/actions/users.action";
import { getInitials } from "@/lib/utils";
import type { Department, UserRole } from "@prisma/client";

const DEPT_LABELS: Record<Department, string> = {
  SALES: "Sales",
  INVENTORY_LOGISTICS: "Inventory & Logistics",
  ACCOUNTING: "Accounting",
  DATA: "Data Analysis",
};

const DEPT_COLORS: Record<Department, string> = {
  SALES: "bg-purple-50 text-purple-700 border-purple-200",
  INVENTORY_LOGISTICS: "bg-amber-50 text-amber-700 border-amber-200",
  ACCOUNTING: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DATA: "bg-blue-50 text-blue-700 border-blue-200",
};

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MEDIA_BUYER: "Media Buyer",
  SALES_REP: "Sales Rep",
  SALES_REP_MANAGER: "Sales Manager",
  DELIVERY_AGENT: "Delivery Agent",
  ACCOUNTANT: "Accountant",
  INVENTORY_MANAGER: "Inventory Manager",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  LOGISTICS_MANAGER: "Logistics Manager",
  DATA_ANALYST: "Data Analyst",
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  isTeamLead: boolean;
};

type Team = {
  id: string;
  name: string;
  department: Department;
  createdAt: Date;
  _count: { members: number };
  members: TeamMember[];
};

interface Props {
  teams: Team[];
}

export default function TeamsClient({ teams: initialTeams }: Props) {
  const [teams, setTeams] = useState(initialTeams);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState<Department>("SALES");
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // Several teams can be open at once — comparing rosters side by side is the
  // main reason to expand them in the first place.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCreate() {
    setError(null);
    if (!name.trim()) { setError("Team name is required"); return; }
    startTransition(async () => {
      const result = await createTeamAction(name.trim(), department);
      if ("error" in result) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setShowForm(false);
        setName("");
        setDepartment("SALES");
        toast.success("Team created successfully");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTeamAction(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setTeams((prev) => prev.filter((t) => t.id !== id));
        setDeleteConfirm(null);
        toast.success("Team deleted");
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Sales Rep Teams</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organise sales reps into teams by department.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
        >
          <Plus size={16} />
          New Team
        </button>
      </div>

      {/* Create Team Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-700">Create New Team</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Team Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lagos Sales Alpha"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-purple-400 appearance-none bg-white cursor-pointer"
              >
                {(Object.keys(DEPT_LABELS) as Department[]).map((d) => (
                  <option key={d} value={d}>
                    {DEPT_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              disabled={isPending}
              onClick={handleCreate}
              className="bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create Team"}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null); setName(""); }}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Team List */}
      {teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-bold">No teams yet</p>
          <p className="text-sm mt-1">Create your first team above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left text-xs font-bold text-slate-400 uppercase px-6 py-3">
                  Team Name
                </th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase px-6 py-3">
                  Department
                </th>
                <th className="text-center text-xs font-bold text-slate-400 uppercase px-6 py-3">
                  Members
                </th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase px-6 py-3">
                  Created
                </th>
                <th className="px-6 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const isOpen = expanded.has(team.id);
                return (
                <React.Fragment key={team.id}>
                <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-slate-800">{team.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${DEPT_COLORS[team.department]}`}
                    >
                      {DEPT_LABELS[team.department]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleExpanded(team.id)}
                      disabled={team.members.length === 0}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? "Hide" : "Show"} members of ${team.name}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 rounded-lg px-2 py-1 -mx-2 hover:bg-slate-100 hover:text-purple-700 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 disabled:cursor-default"
                    >
                      <Users size={14} className="text-slate-400" />
                      {team._count.members}
                      {team.members.length > 0 && (
                        <ChevronDown
                          size={14}
                          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(team.createdAt).toLocaleDateString("en-NG")}
                  </td>
                  <td className="px-6 py-4">
                    {deleteConfirm === team.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={isPending}
                          onClick={() => handleDelete(team.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(team.id)}
                        className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete team"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>

                {isOpen && (
                  <tr className="border-t border-slate-100 bg-slate-50/60">
                    <td colSpan={5} className="px-6 py-4">
                      <ul className="divide-y divide-slate-200/70">
                        {team.members.map((m) => (
                          <li key={m.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                            {m.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.avatarUrl}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-[11px] font-black flex items-center justify-center shrink-0">
                                {getInitials(m.name)}
                              </span>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-800 truncate">{m.name}</p>
                                {m.isTeamLead && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wide">
                                    Lead
                                  </span>
                                )}
                                {!m.isActive && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wide">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 truncate">{m.email}</p>
                            </div>

                            <span className="shrink-0 text-xs font-bold text-slate-500">
                              {ROLE_LABELS[m.role]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
                </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
