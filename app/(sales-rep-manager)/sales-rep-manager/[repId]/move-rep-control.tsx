"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { moveRepToTeamAction } from "@/modules/users/actions/sales-manager-teams.action";
import { useBasePath, useCanManage } from "../_lib/base-path";

type TeamOption = { id: string; name: string };

/**
 * Company-manager-only control to move a sales rep from one team to another —
 * the same capability the admin has. Renders only on the /sales-manager
 * dashboard; the underlying action re-checks the SALES_REP_MANAGER role.
 */
export function MoveRepControl({
  repId,
  currentTeamId,
  teams,
}: {
  repId: string;
  currentTeamId: string | null;
  teams: TeamOption[];
}) {
  const base = useBasePath();
  const canManage = useCanManage();
  const router = useRouter();
  const [selected, setSelected] = useState<string>(currentTeamId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (base !== "/sales-manager" || !canManage) return null;

  const dirty = (selected || null) !== (currentTeamId ?? null);

  async function handleMove() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await moveRepToTeamAction(repId, selected || null);
    setBusy(false);
    if ("success" in res) {
      setSaved(true);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ArrowLeftRight size={18} className="text-[#A020F0]" />
        <h3 className="text-sm font-bold text-gray-900">Move to another team</h3>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <select
          value={selected}
          onChange={(e) => { setSelected(e.target.value); setSaved(false); }}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-100"
        >
          <option value="">Unassigned (no team)</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button
          onClick={handleMove}
          disabled={busy || !dirty}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#A020F0] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#8B2FE8] transition disabled:opacity-50"
        >
          {busy ? "Moving…" : "Move Rep"}
        </button>
      </div>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {saved && !dirty && <p className="text-sm font-semibold text-emerald-600">Team updated.</p>}
    </div>
  );
}
