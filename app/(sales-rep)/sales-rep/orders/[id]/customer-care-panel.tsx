"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_FEEDBACK_CATEGORIES,
  CUSTOMER_FEEDBACK_MESSAGE_MAX,
  customerFeedbackCategoryLabel,
  customerFeedbackStatusLabel,
  type CustomerFeedbackCategory,
} from "@/lib/orders/customer-feedback";
import { FOLLOW_UP_STAGES, type FollowUpStage } from "@/lib/orders/follow-up";
import {
  logCustomerFeedbackAction,
  markFollowUpDoneAction,
} from "@/modules/reports/sales/actions/rep-reporting.action";

export type CareFeedback = {
  id: string;
  category: string;
  message: string;
  status: string;
  action: string | null;
  product: string | null;
  author: string;
  createdAt: string;
};

export type CareFollowUp = { stage: string; completedAt: string; by: string; note: string | null };

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });

/**
 * Customer care on an order: log what the customer said (feeds the manager's
 * Customer / Product Feedback report) and tick off the post-delivery journey
 * (Day 1 / 2 / 4 / 7 — feeds the Customer Journey report).
 */
export function CustomerCarePanel({
  orderId,
  products,
  deliveredAt,
  feedback,
  followUps,
  canEdit,
}: {
  orderId: string;
  products: { id: string; name: string }[];
  deliveredAt: string | null;
  feedback: CareFeedback[];
  followUps: CareFollowUp[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [category, setCategory] = useState<CustomerFeedbackCategory>("POSITIVE");
  const [productId, setProductId] = useState<string>(products.length === 1 ? products[0].id : "");
  const [message, setMessage] = useState("");
  const [busyStage, setBusyStage] = useState<FollowUpStage | null>(null);

  const done = new Map(followUps.map((f) => [f.stage, f]));

  const submitFeedback = () =>
    start(async () => {
      const res = await logCustomerFeedbackAction({ orderId, category, message, productId: productId || null });
      if (res.ok) {
        toast.success("Feedback recorded");
        setMessage("");
        router.refresh();
      } else toast.error(res.error);
    });

  const markDone = (stage: FollowUpStage) => {
    setBusyStage(stage);
    start(async () => {
      const res = await markFollowUpDoneAction({ orderId, stage });
      setBusyStage(null);
      if (res.ok) {
        toast.success("Follow-up marked done");
        router.refresh();
      } else toast.error(res.error);
    });
  };

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      {/* Customer / product feedback */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-800">
          <MessageSquarePlus size={18} className="text-[#A020F0]" /> Customer feedback
        </h2>
        <p className="mt-0.5 text-xs text-gray-400">What the customer said about the product or delivery.</p>

        {canEdit && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {CUSTOMER_FEEDBACK_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                    category === c.value ? "border-[#A020F0] bg-[#A020F0] text-white" : "border-gray-200 text-gray-600 hover:border-purple-300",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {products.length > 1 && (
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700 outline-none focus:border-[#A020F0]"
              >
                <option value="">About the order in general</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={CUSTOMER_FEEDBACK_MESSAGE_MAX}
              placeholder="e.g. Customer says the balm worked within a week and wants to reorder."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#A020F0] focus:ring-1 focus:ring-[#A020F0]"
            />
            <button
              type="button"
              onClick={submitFeedback}
              disabled={pending || message.trim().length < 2}
              className="flex items-center gap-1.5 rounded-lg bg-[#A020F0] px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {pending && !busyStage ? <Loader2 size={15} className="animate-spin" /> : null} Save feedback
            </button>
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {feedback.length === 0 && <li className="text-sm italic text-gray-400">No feedback recorded yet.</li>}
          {feedback.map((f) => (
            <li key={f.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-gray-800">
                  {customerFeedbackCategoryLabel(f.category)}
                  {f.product ? <span className="font-normal text-gray-500"> · {f.product}</span> : null}
                </span>
                <span className="text-xs text-gray-400">
                  {f.author} · {DATE.format(new Date(f.createdAt))}
                </span>
              </div>
              <p className="mt-1 text-gray-700">{f.message}</p>
              <p className="mt-1 text-xs text-gray-500">
                {customerFeedbackStatusLabel(f.status)}
                {f.action ? ` — ${f.action}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Customer journey */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-800">After-delivery follow-ups</h2>
        {!deliveredAt ? (
          <p className="mt-2 text-sm italic text-gray-400">Follow-ups start once the order is delivered.</p>
        ) : (
          <>
            <p className="mt-0.5 text-xs text-gray-400">Delivered {DATE.format(new Date(deliveredAt))}. Tick each call once it&apos;s made.</p>
            <ul className="mt-3 space-y-2">
              {FOLLOW_UP_STAGES.map((s) => {
                const d = done.get(s.value);
                const due = new Date(new Date(deliveredAt).getTime() + s.day * DAY_MS);
                return (
                  <li key={s.value} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start gap-2.5">
                      {d ? <CheckCircle2 size={18} className="mt-0.5 text-emerald-500" /> : <Circle size={18} className="mt-0.5 text-gray-300" />}
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {s.label} <span className="font-normal text-gray-400">· {DATE.format(due)}</span>
                        </p>
                        <p className="text-xs text-gray-500">{s.action}</p>
                        {d && (
                          <p className="text-[11px] text-emerald-700">
                            Done by {d.by} · {DATE.format(new Date(d.completedAt))}
                          </p>
                        )}
                      </div>
                    </div>
                    {!d && canEdit && (
                      <button
                        type="button"
                        onClick={() => markDone(s.value)}
                        disabled={pending}
                        className="rounded-lg border border-[#A020F0] px-3 py-1.5 text-xs font-semibold text-[#A020F0] hover:bg-purple-50 disabled:opacity-50"
                      >
                        {busyStage === s.value ? <Loader2 size={13} className="animate-spin" /> : "Mark done"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
