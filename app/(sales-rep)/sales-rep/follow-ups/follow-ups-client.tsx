"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FOLLOW_UP_OVERDUE_WINDOW_DAYS } from "@/lib/orders/follow-up";
import { markFollowUpDoneAction } from "@/modules/reports/sales/actions/rep-reporting.action";
import type { RepFollowUp } from "@/modules/reports/sales/services/follow-up.service";

const DATE = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });

function Row({ item }: { item: RepFollowUp }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  const mark = () =>
    start(async () => {
      const res = await markFollowUpDoneAction({ orderId: item.orderId, stage: item.stage });
      if (res.ok) {
        setDone(true);
        toast.success(`${item.stageLabel} follow-up done`);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <li className={cn("rounded-2xl border bg-white p-4 shadow-sm", item.daysLate > 0 ? "border-amber-200" : "border-gray-100", done && "opacity-50")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">
            {item.customerName}{" "}
            <Link href={`/sales-rep/orders/${item.orderId}`} className="font-medium text-[#A020F0] hover:underline">
              {item.orderNumber}
            </Link>
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{item.products}</p>
          <p className="mt-1.5 text-xs">
            <span className="rounded-full bg-purple-50 px-2 py-0.5 font-semibold text-[#A020F0]">{item.stageLabel}</span>{" "}
            <span className="text-gray-600">{item.action}</span>
            <span className="text-gray-400"> · delivered {DATE.format(new Date(item.deliveredAt))}</span>
            {item.daysLate > 0 && (
              <span className="ml-1 font-semibold text-amber-700">
                · {item.daysLate} day{item.daysLate === 1 ? "" : "s"} late
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`tel:${item.customerPhone}`} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-purple-300">
            <Phone size={14} /> Call
          </a>
          <button
            type="button"
            onClick={mark}
            disabled={pending || done}
            className="flex items-center gap-1.5 rounded-lg bg-[#A020F0] px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <CalendarCheck size={14} />} Mark done
          </button>
        </div>
      </div>
    </li>
  );
}

export function FollowUpsClient({ items }: { items: RepFollowUp[] }) {
  const today = items.filter((i) => i.daysLate === 0);
  const late = items.filter((i) => i.daysLate > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Follow-ups</h1>
        <p className="mt-1 text-sm text-gray-500">
          Calls to your delivered customers — Day 1 prescription, Day 2 thank-you, Day 4 feedback, Day 7 upsell / reorder.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Due today ({today.length})</h2>
        {today.length === 0 ? (
          <p className="rounded-2xl border border-gray-100 bg-white p-5 text-sm italic text-gray-400">Nothing due today.</p>
        ) : (
          <ul className="space-y-2">
            {today.map((i) => (
              <Row key={`${i.orderId}:${i.stage}`} item={i} />
            ))}
          </ul>
        )}
      </section>

      {late.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-700">
            Missed — last {FOLLOW_UP_OVERDUE_WINDOW_DAYS} days ({late.length})
          </h2>
          <ul className="space-y-2">
            {late.map((i) => (
              <Row key={`${i.orderId}:${i.stage}`} item={i} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
