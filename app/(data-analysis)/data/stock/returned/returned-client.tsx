"use client";

import React from "react";
import { StockFilterBar } from "../../_components/stock/StockFilterBar";
import { StockTable, type StockColumn } from "../../_components/stock/StockTable";
import type {
  Paged,
  StockFilterOptions,
} from "@/modules/data-analysis/services/stock-analysis.service";
import type { ReturnedMovementRow } from "@/modules/inventory/services/inventory.service";

const columns: StockColumn<ReturnedMovementRow>[] = [
  { key: "date", label: "Date", sortKey: "date", render: (r) => r.date },
  {
    key: "product",
    label: "Product",
    render: (r) => <span className="block max-w-[220px] truncate">{r.productName}</span>,
  },
  { key: "state", label: "State", render: (r) => r.state },
  {
    key: "agent",
    label: "Agent",
    render: (r) => <span className="font-semibold text-gray-700">{r.agent}</span>,
  },
  { key: "warehouse", label: "Returned To", render: (r) => r.warehouse },
  {
    key: "qtyReturned",
    label: "Qty Returned",
    align: "right",
    sortKey: "qty",
    render: (r) => (
      <span className="font-bold text-gray-900">{r.qtyReturned.toLocaleString()}</span>
    ),
  },
  {
    key: "damaged",
    label: "Damaged",
    render: (r) => (
      <span
        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
          r.damaged === "Yes" ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-500"
        }`}
      >
        {r.damaged}
      </span>
    ),
  },
  {
    key: "remarks",
    label: "Remarks",
    render: (r) => <span className="block max-w-[220px] truncate">{r.remarks}</span>,
  },
  { key: "addedBy", label: "Added By", render: (r) => r.addedBy },
];

export function StockReturnedClient({
  data,
  options,
}: {
  data: Paged<ReturnedMovementRow>;
  options: StockFilterOptions;
}) {
  return (
    <div className="p-8 max-w-[1400px] mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Returned Stock</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Stock returned by agents, including damaged goods
        </p>
      </div>

      <StockFilterBar
        options={options}
        fields={["product", "warehouse", "agent", "status"]}
        statusKind="movement"
        searchPlaceholder="Search SR ID, agent, product, remarks…"
      />

      <StockTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        rowHref={(r) => `/data/stock/returned/${r.id}`}
        unitLabel="returns"
        emptyTitle="No returned stock"
        emptyMessage="No stock returns match the current filters. Try widening the date range or clearing filters."
      />
    </div>
  );
}
