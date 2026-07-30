"use client";

import React from "react";
import { StockFilterBar } from "../../_components/stock/StockFilterBar";
import { StockTable, StatusPill, type StockColumn } from "../../_components/stock/StockTable";
import type {
  Paged,
  StockFilterOptions,
} from "@/modules/data-analysis/services/stock-analysis.service";
import type { IncomingMovementRow } from "@/modules/inventory/services/inventory.service";

const columns: StockColumn<IncomingMovementRow>[] = [
  { key: "date", label: "Date", sortKey: "date", render: (r) => r.date },
  {
    key: "siId",
    label: "SI ID",
    render: (r) => <span className="font-semibold text-[#8B2FE8]">{r.siId}</span>,
  },
  { key: "supplier", label: "Supplier", render: (r) => r.supplier },
  { key: "warehouse", label: "Warehouse", render: (r) => r.warehouse },
  { key: "supplierRef", label: "Supplier Ref.", render: (r) => r.supplierRef },
  {
    key: "product",
    label: "Product",
    render: (r) => <span className="block max-w-[240px] truncate">{r.product}</span>,
  },
  { key: "status", label: "Status", sortKey: "status", render: (r) => <StatusPill status={r.status} /> },
  {
    key: "raps",
    label: "RAPS",
    render: (r) =>
      r.rapsQuantity > 0 ? (
        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap ${
            r.rapsApprovalStatus === "APPROVED"
              ? "bg-emerald-100 text-emerald-700"
              : r.rapsApprovalStatus === "REJECTED"
                ? "bg-rose-100 text-rose-600"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {r.rapsQuantity}{" "}
          {r.rapsApprovalStatus === "APPROVED"
            ? "Approved"
            : r.rapsApprovalStatus === "REJECTED"
              ? "Rejected"
              : "Pending"}
        </span>
      ) : (
        "—"
      ),
  },
  { key: "createdTime", label: "Created", render: (r) => r.createdTime },
  { key: "addedBy", label: "Added By", render: (r) => r.addedBy },
];

export function StockIncomingClient({
  data,
  options,
}: {
  data: Paged<IncomingMovementRow>;
  options: StockFilterOptions;
}) {
  return (
    <div className="p-8 max-w-[1400px] mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Incoming Stock</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Stock received from suppliers into warehouses
        </p>
      </div>

      <StockFilterBar
        options={options}
        fields={["product", "warehouse", "supplier", "status"]}
        statusKind="movement"
        searchPlaceholder="Search SI ID, supplier, ref, product…"
      />

      <StockTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        rowHref={(r) => `/data/stock/incoming/${r.id}`}
        unitLabel="movements"
        emptyTitle="No incoming stock"
        emptyMessage="No incoming stock movements match the current filters. Try widening the date range or clearing filters."
      />
    </div>
  );
}
