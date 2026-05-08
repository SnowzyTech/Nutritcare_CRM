import type { Metadata } from "next";
import Link from "next/link";
import {
  pickPackOrders,
  goodsReceiving,
  locationBins,
  dashboardAlerts,
  dashboardStats,
  type LocationBin,
} from "@/lib/mock-data/warehouse";
import { Checkbox } from "@/components/ui/checkbox";

export const metadata: Metadata = { title: "Dashboard" };

// ── Helpers ──────────────────────────────────────────────────────────────────

const binColour: Record<LocationBin["status"], string> = {
  Full:     "bg-[#059669] text-white",
  Partial:  "bg-[#F59E0B] text-white",
  Reserved: "bg-[#DC2626] text-white",
  Empty:    "bg-[#A855F7] text-white",
  Damage:   "bg-[#9CA3AF] text-white",
};

const packStatusBadge: Record<string, string> = {
  Packed: "bg-[#059669] text-white",
  Queued: "bg-[#F59E0B] text-white",
};

const receivingStatusBadge: Record<string, string> = {
  "QC Check": "bg-[#E9D5FF] text-[#7C3AED]",
  Shelved:    "bg-[#059669] text-white",
};

const alertDot: Record<string, string> = {
  error:   "bg-[#DC2626]",
  warning: "bg-[#F59E0B]",
  info:    "bg-[#A855F7]",
};

// ── Component ────────────────────────────────────────────────────────────────

export default async function WarehouseDashboard() {
  const stats  = dashboardStats;
  const orders = pickPackOrders;
  const goods  = goodsReceiving;
  const bins   = locationBins;
  const alerts = dashboardAlerts;

  const zones = ["A", "B", "C", "D"] as const;
  const cols  = ["1", "2", "3", "4", "5", "6"] as const;

  return (
    <div className="space-y-5">

      {/* ── Workflow Progress Bar ─────────────────────────────────────────── */}
      <div className="bg-[#FAF5FF] rounded-lg px-6 py-2.5">
        <ol className="flex items-center gap-0 text-[12px] font-medium">
          {[
            { n: 1, label: "Order in",      active: false },
            { n: 2, label: "Confirm stock", active: false },
            { n: 3, label: "Pick & Pack",   active: false },
            { n: 4, label: "Dispatch",      active: true  },
            { n: 5, label: "Delivered",     active: false },
          ].map((step, i) => (
            <li key={step.n} className="flex items-center gap-0">
              {i > 0 && (
                <span className="mx-1.5 text-gray-400 text-xs select-none">&gt;</span>
              )}
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] mr-1.5 ${
                  step.active
                    ? "bg-[#A855F7] text-white"
                    : step.n < 4
                    ? "bg-[#92400E] text-white"
                    : "bg-[#D1D5DB] text-gray-500"
                }`}
              >
                {step.n}
              </span>
              <span className={step.active ? "text-[#A855F7] font-semibold" : step.n < 4 ? "text-gray-700" : "text-gray-400"}>
                {step.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {/* Orders to Pick */}
        <div className="bg-[#FAF5FF] rounded-lg p-4 border border-[#E9D5FF]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">
            ORDERS TO PICK
          </p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-800">{stats.ordersToPick}</span>
            <span className="text-[10px] font-bold text-[#059669]">
              Queued
            </span>
          </div>
        </div>

        {/* Incoming Stocks */}
        <div className="bg-[#FFF7ED] rounded-lg p-4 border border-[#FED7AA]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">
            INCOMING STOCKS
          </p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-800">{stats.incomingStocks}</span>
            <span className="text-[10px] font-bold text-[#A855F7]">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Ready for Dispatch */}
        <div className="bg-[#EFF6FF] rounded-lg p-4 border border-[#BFDBFE]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">
            READY FOR DISPATCH
          </p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-800">{stats.readyForDispatch}</span>
            <span className="text-[10px] font-bold text-[#059669]">
              Ready
            </span>
          </div>
        </div>

        {/* Damage Reports */}
        <div className="bg-[#FED7AA] rounded-lg p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-3">
            DAMAGE REPORTS
          </p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white">{stats.damageReports}</span>
            <span className="text-[10px] font-bold text-white">
              Open
            </span>
          </div>
        </div>
      </div>

      {/* ── Middle Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Pick & Pack Queue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#D1D5DB]">
            <h2 className="text-[11px] font-semibold text-gray-600">Pick &amp; pack Queue</h2>
            <button className="bg-[#A855F7] text-white text-[11px] font-bold px-4 py-1.5 rounded-md hover:bg-[#9333EA] transition-colors">
              Assign Picker
            </button>
          </div>
          <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-[#FAF5FF] sticky top-0">
                <tr className="text-gray-500 text-left">
                  <th className="px-4 py-2.5 w-8"><Checkbox className="border-gray-300 rounded-sm" /></th>
                  <th className="px-4 py-2.5 font-medium">Order ID</th>
                  <th className="px-4 py-2.5 font-medium">Items</th>
                  <th className="px-4 py-2.5 font-medium">Picker</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order, i) => (
                  <tr key={i} className={`${i % 2 === 1 ? "bg-gray-50" : "bg-white"} hover:bg-gray-50/80 transition-colors`}>
                    <td className="px-4 py-2.5"><Checkbox className="border-gray-300 rounded-sm" /></td>
                    <td className="px-4 py-2.5 text-gray-700 font-medium">{order.id}</td>
                    <td className="px-4 py-2.5 text-gray-500">{order.items}</td>
                    <td className="px-4 py-2.5 text-gray-500">{order.picker}</td>
                    <td className="px-4 py-2.5 text-gray-500">{order.location}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-sm ${packStatusBadge[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Location Map */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#D1D5DB]">
            <h2 className="text-[11px] font-semibold text-gray-600">Location map – ZONE A &amp; B</h2>
            <Link href="/warehouse/location-management" className="bg-[#A855F7] text-white text-[11px] font-bold px-4 py-1.5 rounded-md hover:bg-[#9333EA] transition-colors">
              Full Map
            </Link>
          </div>

          <div className="p-4">
            <p className="text-[10px] text-gray-500 font-medium mb-3">Shelf occupancy</p>
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
              {zones.map((zone) =>
                cols.map((col) => {
                  const bin = bins.find((b) => b.zone === zone && b.bin === col);
                  const colour = bin ? binColour[bin.status] : "bg-gray-100 text-gray-400";
                  return (
                    <div
                      key={`${zone}${col}`}
                      className={`${colour} rounded-md flex items-center justify-center font-bold text-[14px] aspect-square`}
                    >
                      {zone}{col}
                    </div>
                  );
                })
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
              <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#059669]" /> Full
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" /> Partial
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" /> Reserved
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#A855F7]" /> Empty
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#9CA3AF]" /> Damage
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Goods Receiving */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#D1D5DB]">
            <h2 className="text-[11px] font-semibold text-gray-600">Goods Receiving</h2>
            <button className="bg-[#A855F7] text-white text-[11px] font-bold px-4 py-1.5 rounded-md hover:bg-[#9333EA] transition-colors">
              +Incoming Goods
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-[#FAF5FF]">
                <tr className="text-gray-500 text-left">
                  <th className="px-4 py-2.5 w-8"><Checkbox className="border-gray-300 rounded-sm" /></th>
                  <th className="px-4 py-2.5 font-medium">INC ID</th>
                  <th className="px-4 py-2.5 font-medium">Units</th>
                  <th className="px-4 py-2.5 font-medium">Supplier</th>
                  <th className="px-4 py-2.5 font-medium">QC</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {goods.map((g, i) => (
                  <tr key={i} className={`${i % 2 === 1 ? "bg-gray-50" : "bg-white"} hover:bg-gray-50/80 transition-colors`}>
                    <td className="px-4 py-2.5"><Checkbox className="border-gray-300 rounded-sm" /></td>
                    <td className="px-4 py-2.5 text-gray-700 font-medium">{g.id}</td>
                    <td className="px-4 py-2.5 text-gray-500">{g.units}</td>
                    <td className="px-4 py-2.5 text-gray-500">{g.supplier}</td>
                    <td className="px-4 py-2.5 text-gray-500">{g.qc}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-sm ${receivingStatusBadge[g.status]}`}>
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-[#D1D5DB]">
            <h2 className="text-[11px] font-semibold text-gray-600">Alerts</h2>
          </div>
          <div className="p-4 space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${alertDot[alert.severity]}`} />
                <div>
                  <p className="text-[11px] text-gray-700 font-medium leading-snug">
                    {alert.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
