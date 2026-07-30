"use client";

import React from "react";
import { StockFilterBar } from "../../_components/stock/StockFilterBar";
import { StockTable, StatusPill, type StockColumn } from "../../_components/stock/StockTable";
import type {
  Paged,
  StockFilterOptions,
} from "@/modules/data-analysis/services/stock-analysis.service";
import type { AdjustmentRow } from "@/modules/inventory/services/inventory.service";

const columns: StockColumn<AdjustmentRow>[] = [
  { key: "date", label: "Date", sortKey: "date", render: (r) => r.date },
  {
    key: "referenceNumber",
    label: "SA ID",
    render: (r) => <span className="font-semibold text-[#8B2FE8]">{r.referenceNumber}</span>,
  },
  { key: "warehouse", label: "Warehouse", render: (r) => r.warehouse },
  { key: "manager", label: "Manager", render: (r) => r.warehouseManager },
  {
    key: "products",
    label: "Products",
    render: (r) => <span className="block max-w-[280px] truncate">{r.products}</span>,
  },
  { key: "status", label: "Status", sortKey: "status", render: (r) => <StatusPill status={r.status} /> },
  { key: "addedBy", label: "Added By", render: (r) => r.addedBy },
];

export function StockAdjustmentClient({
  data,
  options,
}: {
  data: Paged<AdjustmentRow>;
  options: StockFilterOptions;
}) {
  return (
    <div className="p-8 max-w-[1400px] mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Manual corrections to warehouse stock counts
        </p>
      </div>

      <StockFilterBar
        options={options}
        fields={["product", "warehouse", "status"]}
        statusKind="adjustment"
        searchPlaceholder="Search SA ID, warehouse, reason, product…"
      />

      <StockTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        rowHref={(r) => `/data/stock/adjustment/${r.id}`}
        unitLabel="adjustments"
        emptyTitle="No stock adjustments"
        emptyMessage="No stock adjustments match the current filters. Try widening the date range or clearing filters."
      />
    </div>
  );
}
