"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getOrderTagSummaryAction } from "@/modules/chat/actions/chat.action";
import { formatCurrency, formatDate } from "@/lib/utils";

type Summary = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  state: string;
  salesRep: string;
  agent: string | null;
  netAmount: string;
  date: Date;
  itemCount: number;
};

export function OrderTagModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getOrderTagSummaryAction(orderId).then((res) => {
      if (!active) return;
      if (res.ok) setSummary(res.data as Summary);
      else setError(res.error);
    });
    return () => {
      active = false;
    };
  }, [orderId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {summary ? summary.orderNumber : "Order"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {!summary && !error && <p className="text-sm text-gray-400">Loading…</p>}

        {summary && (
          <dl className="space-y-2 text-sm">
            <Row label="Status" value={summary.status} />
            <Row label="Customer" value={summary.customerName} />
            <Row label="Phone" value={summary.customerPhone} />
            <Row label="Address" value={`${summary.deliveryAddress}, ${summary.state}`} />
            <Row label="Sales Rep" value={summary.salesRep} />
            {summary.agent && <Row label="Agent" value={summary.agent} />}
            <Row label="Items" value={String(summary.itemCount)} />
            <Row label="Total" value={formatCurrency(Number(summary.netAmount))} />
            <Row label="Date" value={formatDate(summary.date)} />
          </dl>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-50 pb-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}
