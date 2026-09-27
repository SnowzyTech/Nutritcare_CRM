import { CheckCircle2, Circle, MessageSquare, MessageSquarePlus, PhoneCall } from "lucide-react";
import {
  FEEDBACK_TONE_CLASSES,
  feedbackLabel,
  feedbackTone,
} from "@/lib/orders/order-feedback";
import {
  customerFeedbackCategoryLabel,
  customerFeedbackStatusLabel,
} from "@/lib/orders/customer-feedback";
import { FOLLOW_UP_STAGES } from "@/lib/orders/follow-up";

/**
 * Read-only view of the sales-rep's customer-interaction trail on an order:
 * call feedback ("Not Reachable", …), customer/product feedback and the
 * post-delivery follow-up journey. Used by the oversight order-detail views
 * (data, sales-manager, sales-rep team-lead, admin) so they see the same
 * richness the rep records — without any edit controls (the rep owns writes,
 * via components/.../customer-care-panel.tsx).
 *
 * Every prop is already serialized (dates are ISO strings) so this drops into
 * any client component without leaking Prisma/server code.
 */

export type PanelCallFeedback = {
  id: string;
  outcome: string;
  note: string | null;
  authorName: string;
  at: string; // ISO
};

export type PanelCustomerFeedback = {
  id: string;
  category: string;
  message: string;
  status: string;
  action: string | null;
  productName: string | null;
  authorName: string;
  at: string; // ISO
};

export type PanelFollowUp = {
  stage: string;
  note: string | null;
  completedByName: string;
  at: string; // ISO
};

const DATE_TIME = new Intl.DateTimeFormat("en-NG", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});
const DATE = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  timeZone: "Africa/Lagos",
});

export function CustomerInteractionPanel({
  callFeedback,
  customerFeedback,
  followUps,
}: {
  callFeedback: PanelCallFeedback[];
  customerFeedback: PanelCustomerFeedback[];
  followUps: PanelFollowUp[];
}) {
  const followUpByStage = new Map(followUps.map((f) => [f.stage, f]));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Call feedback — the "Not Reachable / Not Picking" trail */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-800">
          <PhoneCall size={18} className="text-[#A020F0]" /> Call feedback
        </h3>
        <p className="mt-0.5 text-xs text-gray-400">Outcomes the sales rep logged when calling the customer.</p>
        <ul className="mt-4 space-y-2">
          {callFeedback.length === 0 && (
            <li className="text-sm italic text-gray-400">No call feedback recorded yet.</li>
          )}
          {callFeedback.map((f) => (
            <li key={f.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${FEEDBACK_TONE_CLASSES[feedbackTone(f.outcome)]}`}
                >
                  {feedbackLabel(f.outcome)}
                </span>
                <span className="text-xs text-gray-400">
                  {f.authorName} · {DATE_TIME.format(new Date(f.at))}
                </span>
              </div>
              {f.note ? <p className="mt-1.5 text-gray-700">{f.note}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      {/* Customer / product feedback */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-800">
          <MessageSquarePlus size={18} className="text-[#A020F0]" /> Customer feedback
        </h3>
        <p className="mt-0.5 text-xs text-gray-400">What the customer said about the product or delivery.</p>
        <ul className="mt-4 space-y-2">
          {customerFeedback.length === 0 && (
            <li className="text-sm italic text-gray-400">No feedback recorded yet.</li>
          )}
          {customerFeedback.map((f) => (
            <li key={f.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-gray-800">
                  {customerFeedbackCategoryLabel(f.category)}
                  {f.productName ? <span className="font-normal text-gray-500"> · {f.productName}</span> : null}
                </span>
                <span className="text-xs text-gray-400">
                  {f.authorName} · {DATE.format(new Date(f.at))}
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

      {/* Post-delivery follow-up journey */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-800">
          <MessageSquare size={18} className="text-[#A020F0]" /> After-delivery follow-ups
        </h3>
        <p className="mt-0.5 text-xs text-gray-400">The Day 1 / 2 / 4 / 7 customer journey.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {FOLLOW_UP_STAGES.map((s) => {
            const d = followUpByStage.get(s.value);
            return (
              <li key={s.value} className="flex items-start gap-2.5 rounded-xl border border-gray-100 p-3">
                {d ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                ) : (
                  <Circle size={18} className="mt-0.5 shrink-0 text-gray-300" />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.action}</p>
                  {d ? (
                    <>
                      <p className="text-[11px] text-emerald-700">
                        Done by {d.completedByName} · {DATE.format(new Date(d.at))}
                      </p>
                      {d.note ? <p className="mt-0.5 text-xs text-gray-600">{d.note}</p> : null}
                    </>
                  ) : (
                    <p className="text-[11px] text-gray-400">Not done yet</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
