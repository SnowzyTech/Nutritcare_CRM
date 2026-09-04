"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Plus, Check, X, Undo2, ChevronDown, Search } from "lucide-react";
import {
  getAgentStocksForCorrectionAction,
  createAgentStockCorrectionAction,
  approveAgentStockCorrectionAction,
  rejectAgentStockCorrectionAction,
  reverseAgentStockCorrectionAction,
  type AgentStockCorrectionRow,
} from "@/modules/inventory/actions/agent-stock.action";
import type { AgentStockAdjustmentRow } from "@/modules/inventory/services/agent-stock-adjustment.service";

type AgentOption = { id: string; name: string };
type EditableRow = AgentStockCorrectionRow & { input: string };

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_APPROVAL: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending approval" },
  RECORDED: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Applied" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
  REVERSED: { bg: "bg-gray-200", text: "text-gray-600", label: "Reversed" },
  DRAFT: { bg: "bg-gray-100", text: "text-gray-500", label: "Draft" },
};

/** Searchable agent picker — type to filter by name, click to select. */
function AgentSearchSelect({
  agents,
  value,
  onChange,
}: {
  agents: AgentOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = agents.find((a) => a.id === value);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q ? agents.filter((a) => a.name.toLowerCase().includes(q)) : agents;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl h-11 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-300 cursor-pointer"
      >
        <span className={selected ? "text-gray-700 truncate" : "text-gray-400"}>
          {selected ? selected.name : "Select an agent…"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search agent name…"
                className="w-full pl-8 pr-3 h-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400 text-center">No agents found.</p>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onChange(a.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 ${
                    a.id === value ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  {a.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentStockClient({
  agents,
  adjustments,
  canApprove,
}: {
  agents: AgentOption[];
  adjustments: AgentStockAdjustmentRow[];
  /** Admin sees Approve / Reject / Reverse controls. */
  canApprove: boolean;
}) {
  const router = useRouter();

  const [agentId, setAgentId] = useState("");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [reason, setReason] = useState("CRM transition reconciliation");
  const [submitting, startSubmit] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onSelectAgent(id: string) {
    setAgentId(id);
    setRows([]);
    if (!id) return;
    setLoadingRows(true);
    try {
      const data = await getAgentStocksForCorrectionAction(id);
      setRows(data.map((r) => ({ ...r, input: String(r.currentQty) })));
    } finally {
      setLoadingRows(false);
    }
  }

  function setRowInput(productId: string, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, input: value.replace(/[^0-9]/g, "") } : r)),
    );
  }

  const changedRows = rows.filter((r) => r.input !== "" && Number(r.input) !== r.currentQty);
  const belowCommitted = changedRows.find((r) => Number(r.input) < r.committed);

  function submit() {
    if (!agentId) return toast.error("Select an agent.");
    if (!reason.trim()) return toast.error("Enter a reason.");
    if (changedRows.length === 0) return toast.error("Change at least one quantity.");
    if (belowCommitted) {
      return toast.error(
        `${belowCommitted.productName} can't go below ${belowCommitted.committed} committed unit(s).`,
      );
    }
    startSubmit(async () => {
      const res = await createAgentStockCorrectionAction({
        agentId,
        reason: reason.trim(),
        items: changedRows.map((r) => ({ productId: r.productId, quantityAfter: Number(r.input) })),
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.pending
          ? "Correction submitted for admin approval."
          : "Agent stock corrected.",
      );
      setAgentId("");
      setRows([]);
      setReason("CRM transition reconciliation");
      router.refresh();
    });
  }

  function runAction(id: string, fn: () => Promise<{ error?: string; ok?: true }>, done: string) {
    setBusyId(id);
    startSubmit(async () => {
      const res = await fn();
      setBusyId(null);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(done);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* ── New correction ─────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-gray-800">New agent stock correction</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Pick an agent, enter the <strong>correct actual quantity</strong> per product, and give a reason.
            {canApprove
              ? " As an admin, your correction applies immediately."
              : " Your correction is sent to an admin for approval before it takes effect."}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Agent</label>
            <AgentSearchSelect agents={agents} value={agentId} onChange={onSelectAgent} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reason</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this correction needed?"
              className="w-full bg-white border border-gray-200 rounded-xl h-11 px-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-300"
            />
          </div>
        </div>

        {loadingRows ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading agent stock…
          </div>
        ) : agentId && rows.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">This agent has no product stock on record.</p>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3 font-bold">Product</th>
                  <th className="py-2 px-3 font-bold text-center">Current (system)</th>
                  <th className="py-2 px-3 font-bold text-center">Committed</th>
                  <th className="py-2 pl-3 font-bold text-center">Correct actual qty</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const val = r.input === "" ? null : Number(r.input);
                  const below = val !== null && val < r.committed;
                  const changed = val !== null && val !== r.currentQty;
                  return (
                    <tr key={r.productId} className="border-b border-gray-50">
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-gray-800">{r.productName}</div>
                        <div className="text-[11px] text-gray-400">{r.productSku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-600">{r.currentQty}</td>
                      <td className="py-2.5 px-3 text-center text-gray-500">{r.committed}</td>
                      <td className="py-2.5 pl-3">
                        <input
                          inputMode="numeric"
                          value={r.input}
                          onChange={(e) => setRowInput(r.productId, e.target.value)}
                          className={`w-24 mx-auto block text-center bg-white border rounded-lg h-9 px-2 text-sm focus:outline-none focus:ring-1 ${
                            below
                              ? "border-red-300 focus:ring-red-300 text-red-600"
                              : changed
                                ? "border-purple-300 focus:ring-purple-300 text-purple-700 font-semibold"
                                : "border-gray-200 focus:ring-purple-300 text-gray-700"
                          }`}
                        />
                        {below && (
                          <p className="text-[10px] text-red-500 text-center mt-1">
                            Below {r.committed} committed
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {rows.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">
              {changedRows.length} product{changedRows.length === 1 ? "" : "s"} changed
            </p>
            <button
              onClick={submit}
              disabled={submitting || changedRows.length === 0 || !!belowCommitted}
              className="inline-flex items-center gap-1.5 bg-[#A020F0] hover:bg-[#8B1ED2] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {canApprove ? "Apply correction" : "Submit for approval"}
            </button>
          </div>
        )}
      </section>

      {/* ── Corrections list ───────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">Corrections</h2>
        {adjustments.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No corrections yet.</p>
        ) : (
          <div className="space-y-3">
            {adjustments.map((a) => {
              const s = STATUS_STYLES[a.status] ?? STATUS_STYLES.DRAFT;
              return (
                <div key={a.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">{a.agentName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                          {s.label}
                        </span>
                        <span className="text-[11px] text-gray-400">{a.referenceNumber}</span>
                      </div>
                      <div className="mt-1.5 text-xs text-gray-600 space-y-0.5">
                        {a.items.map((it) => (
                          <div key={it.productId}>
                            {it.productName}:{" "}
                            <span className="text-gray-400">{it.quantityBefore}</span>
                            {" → "}
                            <span className="font-semibold text-gray-800">{it.quantityAfter}</span>
                            <span className={it.delta < 0 ? "text-red-500" : "text-emerald-600"}>
                              {" "}({it.delta > 0 ? "+" : ""}{it.delta})
                            </span>
                            <span className="text-gray-400"> · {it.committed} committed</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[11px] text-gray-400">
                        {a.reason}
                        {a.notes ? ` — ${a.notes}` : ""} · by {a.createdByName}
                        {a.approvedByName ? ` · approved by ${a.approvedByName}` : ""} ·{" "}
                        {format(new Date(a.createdAt), "d MMM yyyy, h:mm a")}
                      </p>
                    </div>

                    {canApprove && (
                      <div className="flex items-center gap-2 shrink-0">
                        {a.status === "PENDING_APPROVAL" && (
                          <>
                            <button
                              onClick={() =>
                                runAction(a.id, () => approveAgentStockCorrectionAction(a.id), "Correction approved.")
                              }
                              disabled={submitting && busyId === a.id}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                const reasonText = window.prompt("Reason for rejecting?") ?? "";
                                runAction(
                                  a.id,
                                  () => rejectAgentStockCorrectionAction(a.id, reasonText),
                                  "Correction rejected.",
                                );
                              }}
                              disabled={submitting && busyId === a.id}
                              className="inline-flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {a.status === "RECORDED" && (
                          <button
                            onClick={() => {
                              if (window.confirm("Reverse this correction and restore the previous quantities?")) {
                                runAction(
                                  a.id,
                                  () => reverseAgentStockCorrectionAction(a.id),
                                  "Correction reversed.",
                                );
                              }
                            }}
                            disabled={submitting && busyId === a.id}
                            className="inline-flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50"
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Reverse
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
