"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_FEEDBACK_STATUSES,
  customerFeedbackStatusLabel,
} from "@/lib/orders/customer-feedback";
import {
  createActionItemAction,
  updateActionItemAction,
  updateFeedbackStatusAction,
} from "@/modules/reports/sales/actions/sales-reports.action";
import type {
  ActionItemRow,
  ActionItemsSection,
  BacklogSection,
  FeedbackItem,
  FeedbackSection,
  ReportNarrative,
  ReviewSection,
} from "@/modules/reports/sales/types";
import { ReportCell, SectionCard } from "./report-table";

const input =
  "w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-800 outline-none focus:border-[#5C2B90] focus:ring-1 focus:ring-[#5C2B90] disabled:bg-gray-50 disabled:text-gray-500";

// ── Backlog ─────────────────────────────────────────────────────────────────

export function BacklogTable({
  section,
  values,
  editable,
  onChange,
}: {
  section: BacklogSection;
  values: NonNullable<ReportNarrative["backlog"]>;
  editable: boolean;
  onChange: (rowKey: string, field: "action" | "owner", value: string) => void;
}) {
  return (
    <SectionCard heading={section.heading} note={section.note}>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#5C2B90] text-white">
              <th className="px-3 py-2 text-left font-semibold">Status</th>
              <th className="px-3 py-2 text-right font-semibold">Number</th>
              <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Age / Days</th>
              <th className="px-3 py-2 text-left font-semibold">Action</th>
              <th className="px-3 py-2 text-left font-semibold">Owner</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, i) => (
              <tr key={row.key} className={i % 2 ? "bg-purple-50/40" : "bg-white"}>
                <td className="px-3 py-2 text-gray-700">{row.label}</td>
                <ReportCell cell={row.number} />
                <ReportCell cell={row.age} />
                <td className="px-2 py-1.5 min-w-[14rem]">
                  <input
                    className={input}
                    disabled={!editable}
                    value={values[row.key]?.action ?? ""}
                    onChange={(e) => onChange(row.key, "action", e.target.value)}
                    placeholder={editable ? "Action" : ""}
                    maxLength={500}
                  />
                </td>
                <td className="px-2 py-1.5 min-w-[9rem]">
                  <input
                    className={input}
                    disabled={!editable}
                    value={values[row.key]?.owner ?? ""}
                    onChange={(e) => onChange(row.key, "owner", e.target.value)}
                    placeholder={editable ? "Owner" : ""}
                    maxLength={120}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ── Weekly Management Review ─────────────────────────────────────────────────

export function ReviewTable({
  section,
  values,
  editable,
  onChange,
}: {
  section: ReviewSection;
  values: NonNullable<ReportNarrative["review"]>;
  editable: boolean;
  onChange: (areaKey: string, field: "summary" | "action", value: string) => void;
}) {
  return (
    <SectionCard
      heading={section.heading}
      note="Summaries are pre-filled from this week's figures where possible — edit them to add the why."
    >
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#5C2B90] text-white">
              <th className="px-3 py-2 text-left font-semibold">Area</th>
              <th className="px-3 py-2 text-left font-semibold">Summary</th>
              <th className="px-3 py-2 text-left font-semibold">Action Required</th>
            </tr>
          </thead>
          <tbody>
            {section.areas.map((a, i) => (
              <tr key={a.key} className={cn("align-top", i % 2 ? "bg-purple-50/40" : "bg-white")}>
                <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{a.label}</td>
                <td className="px-2 py-1.5 min-w-[18rem]">
                  <textarea
                    className={input}
                    rows={2}
                    disabled={!editable}
                    value={values[a.key]?.summary ?? a.prefill}
                    onChange={(e) => onChange(a.key, "summary", e.target.value)}
                    maxLength={2000}
                  />
                </td>
                <td className="px-2 py-1.5 min-w-[14rem]">
                  <textarea
                    className={input}
                    rows={2}
                    disabled={!editable}
                    value={values[a.key]?.action ?? ""}
                    onChange={(e) => onChange(a.key, "action", e.target.value)}
                    maxLength={1000}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ── Customer / Product Feedback ──────────────────────────────────────────────

function FeedbackRow({ item, canManage }: { item: FeedbackItem; canManage: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState(item.status);
  const [action, setAction] = useState(item.action ?? "");
  const [pending, start] = useTransition();
  const dirty = status !== item.status || action !== (item.action ?? "");

  const save = () =>
    start(async () => {
      const res = await updateFeedbackStatusAction({ id: item.id, status, action });
      if (res.ok) {
        toast.success("Feedback updated");
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <tr className="align-top border-t border-gray-100">
      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{item.categoryLabel}</td>
      <td className="px-3 py-2 text-gray-800 min-w-[16rem]">
        {item.message}
        <div className="mt-0.5 text-[11px] text-gray-400">
          <Link href={`/sales-manager/orders/${item.orderId}`} className="hover:text-[#5C2B90] hover:underline">
            {item.orderNumber}
          </Link>{" "}
          · {item.rep}
        </div>
      </td>
      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{item.product ?? "—"}</td>
      <td className="px-2 py-1.5 min-w-[16rem]">
        {canManage ? (
          <div className="flex items-start gap-1.5">
            <select className={cn(input, "w-28 shrink-0")} value={status} onChange={(e) => setStatus(e.target.value)}>
              {CUSTOMER_FEEDBACK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <input className={input} value={action} onChange={(e) => setAction(e.target.value)} placeholder="Action taken" maxLength={500} />
            {dirty && (
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="rounded-md bg-[#5C2B90] p-2 text-white hover:bg-purple-800 disabled:opacity-60"
                title="Save"
              >
                {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
            )}
          </div>
        ) : (
          <span className="text-gray-700">
            {customerFeedbackStatusLabel(item.status)}
            {item.action ? ` — ${item.action}` : ""}
          </span>
        )}
      </td>
    </tr>
  );
}

export function FeedbackTable({ section, canManage }: { section: FeedbackSection; canManage: boolean }) {
  return (
    <SectionCard heading={section.heading} note="Logged by reps on the order. Set a status and the action taken for each.">
      <div className="mb-3 flex flex-wrap gap-2">
        {section.summary.map((s) => (
          <span key={s.category} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
            {s.label}: <b className="text-gray-900">{s.count}</b>
          </span>
        ))}
      </div>
      {section.items.length === 0 ? (
        <p className="text-sm italic text-gray-400">No customer feedback recorded in this period.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#5C2B90] text-white">
                <th className="px-3 py-2 text-left font-semibold">Category</th>
                <th className="px-3 py-2 text-left font-semibold">Customer Feedback</th>
                <th className="px-3 py-2 text-left font-semibold">Product</th>
                <th className="px-3 py-2 text-left font-semibold">Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {section.items.map((item) => (
                <FeedbackRow key={item.id} item={item} canManage={canManage} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ── Challenges / Management Action ───────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In progress", DONE: "Done" };

type Draft = Omit<ActionItemRow, "id" | "createdAt" | "closedAt">;

const EMPTY: Draft = { issue: "", teamOrLocation: "", impact: "", actionRequired: "", owner: "", status: "OPEN" };

function ActionEditor({
  initial,
  onSave,
  onCancel,
  pending,
}: {
  initial: Draft;
  onSave: (d: Draft) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [d, setD] = useState<Draft>(initial);
  const field = (k: keyof Draft, placeholder: string, max: number) => (
    <td className="px-1.5 py-1.5">
      <input className={input} value={(d[k] as string | null) ?? ""} onChange={(e) => setD({ ...d, [k]: e.target.value })} placeholder={placeholder} maxLength={max} />
    </td>
  );
  return (
    <tr className="bg-purple-50/50">
      {field("issue", "Issue *", 500)}
      {field("teamOrLocation", "Team / location", 120)}
      {field("impact", "Impact", 300)}
      {field("actionRequired", "Action required", 500)}
      {field("owner", "Owner", 120)}
      <td className="px-1.5 py-1.5">
        <div className="flex items-center gap-1">
          <select className={cn(input, "w-28")} value={d.status} onChange={(e) => setD({ ...d, status: e.target.value })}>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button type="button" disabled={pending || !d.issue.trim()} onClick={() => onSave(d)} className="rounded-md bg-[#5C2B90] p-2 text-white disabled:opacity-50" title="Save">
            {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button type="button" onClick={onCancel} className="rounded-md p-2 text-gray-400 hover:text-gray-700" title="Cancel">
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function ActionItemsTable({ section, canManage }: { section: ActionItemsSection; canManage: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();

  const payload = (d: Draft) => ({
    issue: d.issue,
    teamOrLocation: d.teamOrLocation ?? "",
    impact: d.impact ?? "",
    actionRequired: d.actionRequired ?? "",
    owner: d.owner ?? "",
    status: d.status,
  });

  const save = (id: string | null, d: Draft) =>
    start(async () => {
      const res = id ? await updateActionItemAction(id, payload(d)) : await createActionItemAction(payload(d));
      if (res.ok) {
        toast.success(id ? "Item updated" : "Item added");
        setEditing(null);
        setAdding(false);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <SectionCard
      heading={section.heading}
      note="Items stay on every report until marked Done."
      actions={
        canManage && !adding ? (
          <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#5C2B90] hover:border-purple-300">
            <Plus size={14} /> Add item
          </button>
        ) : null
      }
    >
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#5C2B90] text-white">
              {["Issue", "Team / Location", "Impact", "Action Required", "Owner", "Status"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adding && <ActionEditor initial={EMPTY} onSave={(d) => save(null, d)} onCancel={() => setAdding(false)} pending={pending} />}
            {section.items.length === 0 && !adding && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-sm italic text-gray-400">
                  No open challenges.
                </td>
              </tr>
            )}
            {section.items.map((it) =>
              editing === it.id ? (
                <ActionEditor key={it.id} initial={it} onSave={(d) => save(it.id, d)} onCancel={() => setEditing(null)} pending={pending} />
              ) : (
                <tr key={it.id} className="border-t border-gray-100 align-top">
                  <td className="px-3 py-2 text-gray-800">{it.issue}</td>
                  <td className="px-3 py-2 text-gray-600">{it.teamOrLocation ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{it.impact ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{it.actionRequired ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{it.owner ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        it.status === "DONE" ? "bg-emerald-50 text-emerald-700" : it.status === "IN_PROGRESS" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {STATUS_LABEL[it.status] ?? it.status}
                    </span>
                    {canManage && (
                      <button type="button" onClick={() => setEditing(it.id)} className="ml-2 text-gray-400 hover:text-[#5C2B90]" title="Edit">
                        <Pencil size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
