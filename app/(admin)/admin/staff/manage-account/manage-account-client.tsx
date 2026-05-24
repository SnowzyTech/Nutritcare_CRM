"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronRight, Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  approveAccountAction,
  rejectAccountAction,
} from "@/modules/users/actions/users.action";

type ActivationRequest = {
  id: string;
  name: string;
  role: string;
  createdAt: Date;
};

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

function formatRoleLabel(role: string) {
  const map: Record<string, string> = {
    SALES_REP: "Sales Rep",
    DELIVERY_AGENT: "Delivery Agent",
    DATA_ANALYST: "Data",
    ACCOUNTANT: "Accounting",
    INVENTORY_MANAGER: "Inventory Mgr.",
    WAREHOUSE_MANAGER: "Warehouse Mgr.",
    LOGISTICS_MANAGER: "Logistics Mgr.",
  };
  return map[role] ?? role;
}

function formatRequestDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function ActivationCard({
  req,
  colorClass,
  onDone,
}: {
  req: ActivationRequest;
  colorClass: string;
  onDone: (id: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  function handleApprove(e: React.MouseEvent) {
    e.stopPropagation();
    setAction("approve");
    startTransition(async () => {
      await approveAccountAction(req.id);
      onDone(req.id);
    });
  }

  function handleReject(e: React.MouseEvent) {
    e.stopPropagation();
    setAction("reject");
    startTransition(async () => {
      await rejectAccountAction(req.id);
      onDone(req.id);
    });
  }

  return (
    <div
      onClick={() => router.push(`/admin/staff/manage-account/${req.id}`)}
      className="flex flex-col rounded-2xl overflow-hidden border border-slate-100 min-w-[170px] max-w-[190px] shadow-sm bg-slate-50/30 group hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      <div
        className={`h-[130px] ${colorClass} flex items-center justify-center relative overflow-hidden`}
      >
        <span className="text-[2.5rem] font-black text-white/90 relative z-10 transition-transform group-hover:scale-110 duration-500">
          {getInitials(req.name)}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-4 bg-white flex-1">
        <div className="flex justify-between items-start">
          <p className="font-bold text-[0.9rem] text-slate-900 truncate flex-1 mr-2">
            {req.name}
          </p>
          <span className="shrink-0 w-6 h-6 rounded-full bg-slate-50 group-hover:bg-purple-50 flex items-center justify-center text-slate-300 group-hover:text-purple-500 transition-colors">
            <ChevronRight size={14} />
          </span>
        </div>
        <div className="flex justify-between items-center mt-1.5">
          <p className="text-[0.75rem] text-slate-400 font-bold uppercase tracking-tight">
            {formatRoleLabel(req.role)}
          </p>
          <p className="text-[0.7rem] text-slate-300 font-medium">
            {formatRequestDate(req.createdAt)}
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-5">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-[0.8rem] font-black transition-colors shadow-sm"
          >
            {isPending && action === "approve" ? "…" : "Confirm"}
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className="w-full py-2 rounded-lg bg-transparent hover:bg-purple-50 disabled:opacity-60 text-purple-600 text-[0.8rem] font-black transition-colors"
          >
            {isPending && action === "reject" ? "…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActivationRequestsSection({
  requests,
}: {
  requests: ActivationRequest[];
}) {
  const [visible, setVisible] = useState(requests);

  function handleDone(id: string) {
    setVisible((prev) => prev.filter((r) => r.id !== id));
  }

  if (visible.length === 0) {
    return (
      <p className="text-slate-400 text-[0.875rem] py-4">
        No pending activation requests.
      </p>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
      {visible.map((req, i) => (
        <ActivationCard
          key={req.id}
          req={req}
          colorClass={AVATAR_COLORS[i % AVATAR_COLORS.length]}
          onDone={handleDone}
        />
      ))}
    </div>
  );
}

// ── Toolbar ──────────────────────────────────────────────────────────────────

type Team = { id: string; name: string; department: string };

export function ManageAccountToolbar({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dept = searchParams.get("dept") ?? "";
  const team = searchParams.get("team") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const q = searchParams.get("q") ?? "";

  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  function buildParams(updates: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const str = p.toString();
    return str ? `?${str}` : "";
  }

  function setDept(val: string | null) {
    const d = !val || val === "all" ? "" : val;
    router.push(`${pathname}${buildParams({ dept: d, team: "" })}`);
  }

  function setTeam(val: string | null) {
    router.push(`${pathname}${buildParams({ team: !val || val === "all" ? "" : val })}`);
  }

  function toggleSort() {
    const next = sort === "asc" ? "" : "asc";
    router.push(`${pathname}${buildParams({ sort: next })}`);
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(`${pathname}${buildParams({ q: value.trim() })}`);
    }, 350);
  }

  const deptTeams = dept ? teams.filter((t) => t.department === dept) : teams;
  const sortActive = sort === "asc";

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-[0.85rem] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
        <SlidersHorizontal size={15} />
        Filter
      </button>

      <Select value={dept || "all"} onValueChange={setDept}>
        <SelectTrigger className="w-[130px] h-[38px] border-slate-200 rounded-lg bg-white text-[0.85rem] font-bold text-slate-700 shadow-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Depts</SelectItem>
          <SelectItem value="SALES">Sales</SelectItem>
          <SelectItem value="INVENTORY_LOGISTICS">Inventory</SelectItem>
          <SelectItem value="ACCOUNTING">Accounting</SelectItem>
          <SelectItem value="DATA">Data</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={team || "all"}
        onValueChange={setTeam}
        disabled={deptTeams.length === 0}
      >
        <SelectTrigger className="w-[130px] h-[38px] border-slate-200 rounded-lg bg-white text-[0.85rem] font-bold text-slate-700 shadow-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Teams</SelectItem>
          {deptTeams.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        onClick={toggleSort}
        title={sortActive ? "Oldest first — click for newest" : "Newest first — click for oldest"}
        className={`flex items-center gap-1 px-2.5 py-2 border rounded-lg transition-all shadow-sm ${
          sortActive
            ? "border-purple-300 text-purple-600 bg-purple-50 hover:bg-purple-100"
            : "border-slate-200 text-slate-400 bg-white hover:bg-slate-50"
        }`}
      >
        <ArrowUpDown size={15} />
      </button>

      <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-[0.82rem] font-black uppercase tracking-wider transition-all shadow-md shadow-purple-200">
        See all Staffs
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 bg-white min-w-[280px] shadow-sm">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="search by name"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border-none outline-none text-[0.85rem] text-slate-700 bg-transparent w-full placeholder:text-slate-400"
        />
        {searchValue && (
          <button
            onClick={() => handleSearchChange("")}
            className="text-slate-300 hover:text-slate-500 transition-colors text-[0.75rem] shrink-0"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
