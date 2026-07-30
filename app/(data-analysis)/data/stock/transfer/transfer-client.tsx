"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { StockFilterBar } from "../../_components/stock/StockFilterBar";
import { StockTable, StatusPill, type StockColumn } from "../../_components/stock/StockTable";
import type {
  Paged,
  StockFilterOptions,
} from "@/modules/data-analysis/services/stock-analysis.service";
import type { StockTransferRow } from "@/modules/inventory/services/inventory.service";

const columns: StockColumn<StockTransferRow>[] = [
  { key: "date", label: "Date", sortKey: "date", render: (r) => r.date },
  {
    key: "transferId",
    label: "Transfer ID",
    render: (r) => <span className="font-semibold text-[#8B2FE8]">{r.transferId}</span>,
  },
  {
    key: "route",
    label: "From → To",
    render: (r) => (
      <span className="flex items-center gap-1.5">
        <span className="font-semibold text-gray-700">{r.from}</span>
        <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
        <span className="font-semibold text-gray-700">{r.to}</span>
      </span>
    ),
  },
  { key: "manager", label: "Manager", render: (r) => r.warehouseManager },
  { key: "items", label: "Items", align: "right", render: (r) => r.items },
  {
    key: "totalQty",
    label: "Total Qty",
    align: "right",
    sortKey: "qty",
    render: (r) => <span className="font-bold text-gray-900">{r.totalQty.toLocaleString()}</span>,
  },
  { key: "status", label: "Status", sortKey: "status", render: (r) => <StatusPill status={r.status} /> },
  { key: "addedBy", label: "Added By", render: (r) => r.addedBy },
];

export function StockTransferClient({
  data,
  options,
}: {
  data: Paged<StockTransferRow>;
  options: StockFilterOptions;
}) {
  return (
    <div className="p-8 max-w-[1400px] mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Stock moved between warehouses and agents
        </p>
      </div>

      <StockFilterBar
        options={options}
        fields={["product", "warehouse", "status"]}
        statusKind="transfer"
        searchPlaceholder="Search transfer ID, product, notes…"
      />

      <StockTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        rowHref={(r) => `/data/stock/transfer/${r.id}`}
        unitLabel="transfers"
        emptyTitle="No stock transfers"
        emptyMessage="No stock transfers match the current filters. Try widening the date range or clearing filters."
      />
    </div>
  );
}
