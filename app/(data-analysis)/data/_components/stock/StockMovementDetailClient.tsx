"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle, Info } from "lucide-react";
import { StatusPill } from "./StockTable";
import type { StockDetailView } from "@/modules/data-analysis/services/stock-analysis.service";

// One read-only renderer for all five record kinds (incoming, outgoing,
// returned, transfer, adjustment), driven by the normalized StockDetailView.
//
// Deliberately NOT reusing app/(inventory)/inventory/*/[id]/*-detail-client.tsx:
// those embed approve/reject/reverse write actions, and this section is
// read-only by design.

export function StockMovementDetailClient({ detail }: { detail: StockDetailView }) {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <Link
        href={detail.backHref}
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-gray-400 hover:text-[#8B2FE8] transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {detail.title}
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {detail.title}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{detail.reference}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Read only
          </span>
          <StatusPill status={detail.status} />
        </div>
      </div>

      {detail.reversalReason && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-5 flex gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-rose-700">
              Reversed{detail.dateReversed ? ` on ${detail.dateReversed}` : ""}
            </p>
            <p className="text-[12px] text-rose-600 mt-0.5">{detail.reversalReason}</p>
            <p className="text-[11px] text-rose-400 mt-1">
              Reversed records are excluded from all analytics totals.
            </p>
          </div>
        </div>
      )}

      {/* Summary fields */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
          {detail.fields.map((f) => (
            <div key={f.label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                {f.label}
              </p>
              <p className="text-[13px] font-semibold text-gray-800 break-words">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-[13px] font-bold text-gray-900">Line Items</h3>
          {detail.totalQuantity !== null && (
            <p className="text-[11px] font-bold text-gray-500">
              Total:{" "}
              <span className="text-gray-900">{detail.totalQuantity.toLocaleString()}</span> units
            </p>
          )}
        </div>
        {detail.items.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No line items on this record.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {detail.itemColumns.map((c, i) => (
                    <th
                      key={c}
                      className={`px-6 py-2.5 whitespace-nowrap ${
                        i >= detail.itemColumns.length - 1 ? "text-right" : ""
                      }`}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {detail.items.map((item) => {
                  // Column layout varies by kind: adjustments carry a variance
                  // in `extra` (rendered last), returns/transfers a unit label
                  // (rendered before the quantity).
                  const extraIsTrailing = detail.itemColumns.length === 6;
                  return (
                    <tr key={item.index}>
                      <td className="px-6 py-3 text-[12px] text-gray-400">{item.index}</td>
                      <td className="px-6 py-3 text-[12px] font-semibold text-gray-800">
                        {item.product}
                      </td>
                      <td className="px-6 py-3 text-[12px] text-gray-500">{item.productCode}</td>
                      {item.extra !== undefined && !extraIsTrailing && (
                        <td className="px-6 py-3 text-[12px] text-gray-500">{item.extra}</td>
                      )}
                      <td
                        className={`px-6 py-3 text-[12px] font-semibold text-gray-700 ${
                          extraIsTrailing ? "" : "text-right"
                        }`}
                      >
                        {item.quantity}
                      </td>
                      {item.extra !== undefined && extraIsTrailing && (
                        <td
                          className={`px-6 py-3 text-[12px] font-bold text-right ${
                            item.extra.startsWith("-") ? "text-rose-500" : "text-emerald-600"
                          }`}
                        >
                          {item.extra}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RAPS block — incoming only */}
      {detail.raps && (detail.raps.items.length > 0 || detail.raps.statusLabel) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[13px] font-bold text-gray-900">RAPS Units</h3>
            {detail.raps.statusLabel && <StatusPill status={detail.raps.statusLabel} />}
          </div>
          <div className="flex items-start gap-2 mb-4">
            <Info className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-400">
              RAPS units are recorded on the movement but were never credited to stock, so they are
              subtracted from &ldquo;units received&rdquo; in all reporting.
            </p>
          </div>

          {detail.raps.rejectionReason && (
            <p className="text-[12px] text-rose-600 mb-3">
              <span className="font-bold">Rejection reason:</span> {detail.raps.rejectionReason}
            </p>
          )}

          {detail.raps.items.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5">Product Code</th>
                  <th className="px-4 py-2.5 text-right">Withheld Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {detail.raps.items.map((r) => (
                  <tr key={`${r.productCode}-${r.product}`}>
                    <td className="px-4 py-2.5 text-[12px] font-semibold text-gray-800">
                      {r.product}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-gray-500">{r.productCode}</td>
                    <td className="px-4 py-2.5 text-[12px] font-bold text-amber-600 text-right">
                      {r.quantity.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={2} className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">
                    Total withheld
                  </td>
                  <td className="px-4 py-2.5 text-[12px] font-bold text-gray-900 text-right">
                    {detail.raps.withheldTotal.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Attachments */}
      {detail.attachments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-[13px] font-bold text-gray-900 mb-4">Supplier Invoices</h3>
          <div className="flex flex-col gap-2">
            {detail.attachments.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[12px] font-semibold text-[#8B2FE8] hover:underline"
              >
                <FileText className="w-3.5 h-3.5" /> Invoice {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
