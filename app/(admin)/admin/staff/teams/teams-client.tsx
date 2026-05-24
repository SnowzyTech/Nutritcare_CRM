"use client";

import React, { useState, useTransition } from "react";
import { Trash2, Plus, Users } from "lucide-react";
import { createTeamAction, deleteTeamAction } from "@/modules/users/actions/users.action";
import type { Department } from "@prisma/client";

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

type Team = {
  id: string;
  name: string;
  department: Department;
  createdAt: Date;
  _count: { members: number };
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

  function handleCreate() {
    setError(null);
    if (!name.trim()) { setError("Team name is required"); return; }
    startTransition(async () => {
      const result = await createTeamAction(name.trim(), department);
      if ("error" in result) {
        setError(result.error);
      } else {
        setShowForm(false);
        setName("");
        setDepartment("SALES");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTeamAction(id);
      if ("error" in result) {
        alert(result.error);
      } else {
        setTeams((prev) => prev.filter((t) => t.id !== id));
        setDeleteConfirm(null);
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
              {teams.map((team) => (
                <tr key={team.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
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
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-600">
                      <Users size={14} className="text-slate-400" />
                      {team._count.members}
                    </span>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
