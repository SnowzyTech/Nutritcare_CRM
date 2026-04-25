"use client";

import { useState, useTransition } from "react";
import { ChevronRight } from "lucide-react";
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
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  function handleApprove() {
    setAction("approve");
    startTransition(async () => {
      await approveAccountAction(req.id);
      onDone(req.id);
    });
  }

  function handleReject() {
    setAction("reject");
    startTransition(async () => {
      await rejectAccountAction(req.id);
      onDone(req.id);
    });
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-100 min-w-[170px] max-w-[190px] shadow-sm bg-slate-50/30 group hover:shadow-md transition-all duration-300">
      <div
        className={`h-[130px] ${colorClass} flex items-center justify-center relative overflow-hidden`}
      >
        <span className="text-[2.5rem] font-black text-white/90 relative z-10 transition-transform group-hover:scale-110 duration-500">
          {getInitials(req.name)}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-4 bg-white flex-1">
        <p className="font-bold text-[0.9rem] text-slate-900 truncate">
          {req.name}
        </p>
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
      <button className="flex flex-col items-center justify-center gap-2 px-6 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 hover:bg-purple-50 hover:border-purple-100 text-purple-600 font-black text-[0.85rem] transition-all min-w-[100px]">
        See all <ChevronRight size={18} />
      </button>
    </div>
  );
}
