"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

type TeamOption = { id: string; name: string };

function TeamSelectInner({ teams }: { teams: TeamOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("team") ?? "";

  function setTeam(teamId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (teamId) params.set("team", teamId);
    else params.delete("team");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={selected}
        onChange={e => setTeam(e.target.value)}
        className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-9 py-1.5 text-xs font-semibold text-gray-700 outline-none hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <option value="">All Teams</option>
        {teams.map(t => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

export function TeamSelect({ teams }: { teams: TeamOption[] }) {
  return (
    <Suspense>
      <TeamSelectInner teams={teams} />
    </Suspense>
  );
}
