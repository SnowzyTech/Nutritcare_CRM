"use client";

import React from "react";
import { StockFilterBar } from "../../_components/stock/StockFilterBar";
import { StockTable, StatusPill, type StockColumn } from "../../_components/stock/StockTable";
import type {
  Paged,
  StockFilterOptions,
} from "@/modules/data-analysis/services/stock-analysis.service";
import type { OutgoingMovementRow } from "@/modules/inventory/services/inventory.service";

const columns: StockColumn<OutgoingMovementRow>[] = [
  { key: "date", label: "Date", sortKey: "date", render: (r) => r.date },
  {
    key: "product",
    label: "Product",
    render: (r) => <span className="block max-w-[240px] truncate">{r.productName}</span>,
  },
  { key: "state", label: "State", render: (r) => r.state },
  {
    key: "agent",
    label: "Agent",
    render: (r) => <span className="font-semibold text-gray-700">{r.agent}</span>,
  },
  { key: "otherInfo", label: "Contact", render: (r) => r.otherInfo },
  {
    key: "qtySent",
    label: "Qty Sent",
    align: "right",
    sortKey: "qty",
    render: (r) => <span className="font-bold text-gray-900">{r.qtySent.toLocaleString()}</span>,
  },
  { key: "status", label: "Status", sortKey: "status", render: (r) => <StatusPill status={r.status} /> },
  { key: "addedBy", label: "Added By", render: (r) => r.addedBy },
];

export function StockOutgoingClient({
  data,
  options,
}: {
  data: Paged<OutgoingMovementRow>;
  options: StockFilterOptions;
}) {
  return (
    <div className="p-8 max-w-[1400px] mx-auto pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Outgoing Stock</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Stock dispatched to delivery agents, including agent-to-agent transfers
        </p>
      </div>

      <StockFilterBar
        options={options}
        fields={["product", "warehouse", "agent", "status"]}
        statusKind="movement"
        searchPlaceholder="Search SO ID, agent, product, state…"
      />

      <StockTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        rowHref={(r) => `/data/stock/outgoing/${r.id}`}
        unitLabel="movements"
        emptyTitle="No outgoing stock"
        emptyMessage="No outgoing stock movements match the current filters. Try widening the date range or clearing filters."
      />
    </div>
  );
}
