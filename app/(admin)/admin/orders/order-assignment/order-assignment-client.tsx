"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  X,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderStatus } from "@prisma/client";
import { adminReassignOrdersAction } from "@/modules/orders/actions/admin-orders.action";

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export type AssignableOrder = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED";
  createdAt: string;
  customer: { name: string; email: string | null; state: string };
  agent: { companyName: string; state: string | null } | null;
  items: Array<{ quantity: number; product: { name: string } }>;
  salesRep: { id: string; name: string };
};

export type SalesRepWithCount = {
  id: string;
  name: string;
  avatarUrl: string | null;
  activeOrderCount: number;
};

interface OrderAssignmentClientProps {
  orders: AssignableOrder[];
  counts: { all: number; pending: number; confirmed: number };
  salesReps: SalesRepWithCount[];
  products: Array<{ id: string; name: string }>;
}

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-amber-400",
  CONFIRMED: "bg-emerald-300",
};

const TABS = [
  { label: "All", key: null as null | "PENDING" | "CONFIRMED", countKey: "all" as const },
  { label: "Pending", key: "PENDING" as const, countKey: "pending" as const },
  { label: "Confirmed", key: "CONFIRMED" as const, countKey: "confirmed" as const },
];

export function OrderAssignmentClient({
  orders,
  counts,
  salesReps,
  products,
}: OrderAssignmentClientProps) {
  const [isPending, startTransition] = useTransition();

  // Table filters
  const [activeTab, setActiveTab] = useState<"PENDING" | "CONFIRMED" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("__all__");
  const [selectedState, setSelectedState] = useState("__all__");
  const [selectedDate, setSelectedDate] = useState("");

  // Order selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repSearch, setRepSearch] = useState("");
  const [selectedRepIds, setSelectedRepIds] = useState<Set<string>>(new Set());
  const [assignResult, setAssignResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const filteredOrders = useMemo(() => {
    let result = activeTab ? orders.filter((o) => o.status === activeTab) : orders;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.customer.name.toLowerCase().includes(q) ||
          (o.customer.email ?? "").toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.salesRep.name.toLowerCase().includes(q)
      );
    }
    if (selectedProduct !== "__all__") {
      result = result.filter((o) =>
        o.items.some((i) => i.product.name === selectedProduct)
      );
    }
    if (selectedState !== "__all__") {
      result = result.filter(
        (o) => o.customer.state.toLowerCase() === selectedState.toLowerCase()
      );
    }
    if (selectedDate) {
      result = result.filter(
        (o) => new Date(o.createdAt).toISOString().split("T")[0] === selectedDate
      );
    }
    return result;
  }, [orders, activeTab, searchQuery, selectedProduct, selectedState, selectedDate]);

  const filteredReps = useMemo(() => {
    if (!repSearch.trim()) return salesReps;
    const q = repSearch.trim().toLowerCase();
    return salesReps.filter((r) => r.name.toLowerCase().includes(q));
  }, [salesReps, repSearch]);

  const selectedReps = salesReps.filter((r) => selectedRepIds.has(r.id));

  function toggleOrder(id: string) {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    const visibleIds = filteredOrders.map((o) => o.id);
    const allSelected = visibleIds.every((id) => selectedOrderIds.has(id));
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleRep(id: string) {
    setSelectedRepIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openModal() {
    setSelectedRepIds(new Set());
    setRepSearch("");
    setAssignResult(null);
    setIsModalOpen(true);
  }

  function handleAssign() {
    const orderIds = Array.from(selectedOrderIds);
    const repIds = Array.from(selectedRepIds);
    startTransition(async () => {
      try {
        await adminReassignOrdersAction(orderIds, repIds);
        setAssignResult({ ok: true, msg: `${orderIds.length} order(s) reassigned successfully.` });
        setSelectedOrderIds(new Set());
        setTimeout(() => {
          setIsModalOpen(false);
          setAssignResult(null);
        }, 1500);
      } catch (err) {
        setAssignResult({
          ok: false,
          msg: err instanceof Error ? err.message : "Assignment failed",
        });
      }
    });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    if (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    )
      return "Today";
    return d.toLocaleDateString("en-NG", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.has(o.id));

  return (
    <div className="max-w-[1400px] mx-auto font-inter text-slate-900 pb-20">
      {/* Status Tabs */}
      <div className="bg-white rounded-xl p-3 flex gap-10 items-center shadow-sm border border-slate-50 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.countKey];
          return (
            <button
              key={tab.key ?? "all"}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <span
                className={`text-[0.9rem] font-black ${
                  isActive ? "text-purple-700" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab.label}
              </span>
              {isActive ? (
                <span className="bg-purple-100 text-purple-600 text-[0.7rem] font-black px-2 py-0.5 rounded-[4px]">
                  {count}
                </span>
              ) : count > 0 && tab.key !== null ? (
                <span className="text-slate-400 text-[0.75rem] font-semibold">({count})</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mr-2">
          <SlidersHorizontal size={16} />
          Filter
        </div>

        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
          />
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 border border-black rounded-lg bg-white text-[0.75rem] font-black shadow-sm pointer-events-none"
          >
            {selectedDate || "Date"} <ChevronDown size={14} />
          </button>
        </div>

        <Select value={selectedProduct} onValueChange={(v) => setSelectedProduct(v ?? "__all__")}>
          <SelectTrigger className="w-[130px] h-[32px] border-black rounded-lg bg-white text-[0.75rem] font-black shadow-sm px-2">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Products</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedState} onValueChange={(v) => setSelectedState(v ?? "__all__")}>
          <SelectTrigger className="w-[110px] h-[32px] border-black rounded-lg bg-white text-[0.75rem] font-black shadow-sm px-2">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="__all__">All States</SelectItem>
            {nigerianStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(selectedDate || selectedProduct !== "__all__" || selectedState !== "__all__") && (
          <button
            onClick={() => { setSelectedDate(""); setSelectedProduct("__all__"); setSelectedState("__all__"); }}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-[0.75rem] font-black text-slate-500 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
        )}

        <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-all">
          <ArrowUpDown size={16} />
        </button>

        <div className="flex gap-2 mx-4">
          <span className="bg-amber-100 text-amber-700 text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">
            Pending
          </span>
          <span className="bg-emerald-50 text-emerald-600 text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">
            Confirmed
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white min-w-[240px] shadow-sm">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-none outline-none text-[0.8rem] text-slate-700 bg-transparent w-full placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Selected count banner */}
      {selectedOrderIds.size > 0 && (
        <div className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-xl px-6 py-3 mb-4">
          <span className="text-[0.85rem] font-bold text-purple-700">
            {selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => setSelectedOrderIds(new Set())}
            className="text-[0.75rem] font-bold text-purple-400 hover:text-purple-600"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden border border-slate-50">
        {/* Header */}
        <div className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.8fr_1fr_0.5fr] px-8 py-5 border-b border-slate-100 bg-slate-50/30">
          {["G-Mail", "Name", "Agent", "Sales Rep", "Product", "Qty", "Date", ""].map((h, i) =>
            i === 7 ? (
              <div key={i} className="flex justify-end">
                <button
                  onClick={toggleAllVisible}
                  title={allVisibleSelected ? "Deselect all" : "Select all visible"}
                  className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                    allVisibleSelected
                      ? "border-purple-500 bg-purple-500"
                      : "border-slate-300 hover:border-purple-300"
                  }`}
                >
                  {allVisibleSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </button>
              </div>
            ) : (
              <span key={i} className="text-[0.75rem] font-black text-slate-500 uppercase tracking-tight">
                {h}
              </span>
            )
          )}
        </div>

        {/* Rows */}
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No assignable orders found.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredOrders.map((order) => {
              const isSelected = selectedOrderIds.has(order.id);
              const firstItem = order.items[0];
              const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div
                  key={order.id}
                  onClick={() => toggleOrder(order.id)}
                  className={`grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.8fr_1fr_0.5fr] px-8 py-4 items-center hover:bg-slate-50/50 transition-colors cursor-pointer ${
                    isSelected ? "bg-purple-50/40" : ""
                  }`}
                >
                  {/* G-Mail + Status Dot */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[order.status] ?? "bg-slate-300"} shadow-sm`}
                    />
                    <span className="text-[0.85rem] font-medium text-slate-500 truncate max-w-[180px]">
                      {order.customer.email ?? "—"}
                    </span>
                  </div>

                  {/* Name */}
                  <span className="text-[0.85rem] font-bold text-slate-700">
                    {order.customer.name}
                  </span>

                  {/* Agent */}
                  <div className="leading-tight">
                    <p className="text-[0.85rem] font-bold text-slate-700">
                      {order.agent?.companyName ?? "—"}
                    </p>
                    <p className="text-[0.65rem] text-slate-400 font-bold uppercase">
                      {order.agent?.state ?? ""}
                    </p>
                  </div>

                  {/* Sales Rep */}
                  <span className="text-[0.85rem] font-medium text-slate-600">
                    {order.salesRep.name}
                  </span>

                  {/* Product */}
                  <span className="text-[0.85rem] font-medium text-slate-600">
                    {firstItem?.product.name ?? "—"}
                  </span>

                  {/* Quantity */}
                  <span className="text-[0.85rem] font-bold text-slate-700 pl-4">
                    {totalQty}
                  </span>

                  {/* Date */}
                  <span className="text-[0.85rem] font-medium text-slate-500">
                    {formatDate(order.createdAt)}
                  </span>

                  {/* Selection circle */}
                  <div className="flex justify-end">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-200 hover:border-purple-300"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Re-Assign Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={openModal}
          disabled={selectedOrderIds.size === 0}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:shadow-none text-white px-8 py-3.5 rounded-xl text-[0.9rem] font-black shadow-lg shadow-purple-200 transition-all active:scale-95 group disabled:cursor-not-allowed"
        >
          <RefreshCw
            size={18}
            className="group-hover:rotate-180 transition-transform duration-500"
          />
          Re-Assign {selectedOrderIds.size > 0 ? `${selectedOrderIds.size} Order${selectedOrderIds.size !== 1 ? "s" : ""}` : "Order"}
        </button>
      </div>

      {/* Reassign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[1100px] max-h-[90vh] overflow-y-auto p-12 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-slate-600 shrink-0">
                {selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? "s" : ""} selected
              </h2>

              <div className="flex-1 max-w-xl px-10">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                  <Search size={18} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search sales reps…"
                    value={repSearch}
                    onChange={(e) => setRepSearch(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-[1rem] placeholder:text-slate-300 font-medium"
                  />
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Available Sales Reps */}
            <p className="text-[0.75rem] font-black text-slate-400 uppercase tracking-wider mb-4">
              Available Sales Reps
            </p>
            {filteredReps.length === 0 ? (
              <p className="text-sm text-slate-400 mb-12">No sales reps found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
                {filteredReps.map((rep) => {
                  const isChosen = selectedRepIds.has(rep.id);
                  return (
                    <button
                      key={rep.id}
                      onClick={() => toggleRep(rep.id)}
                      className={`flex items-center justify-between rounded-3xl p-5 border transition-all text-left ${
                        isChosen
                          ? "bg-purple-50 border-purple-200 shadow-sm"
                          : "bg-slate-50/50 border-slate-100 hover:border-purple-200 hover:bg-purple-50/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                          {rep.avatarUrl ? (
                            <Image
                              src={rep.avatarUrl}
                              alt={rep.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image
                              src={`https://avatar.iran.liara.run/public/${Math.abs(rep.id.charCodeAt(0) % 100)}`}
                              alt={rep.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          )}
                        </div>
                        <div className="leading-tight">
                          <p className="text-[0.85rem] font-bold text-slate-700">{rep.name}</p>
                          <p className="text-[0.7rem] text-slate-400 font-medium">
                            {rep.activeOrderCount} Active Order{rep.activeOrderCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isChosen ? "border-purple-500 bg-purple-500" : "border-slate-200"
                        }`}
                      >
                        {isChosen && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Assign To section */}
            <div className="flex justify-between items-center mb-6 border-t border-slate-100 pt-8">
              <h3 className="text-xl font-black text-slate-400">Assign to</h3>
              <span className="text-[0.9rem] font-black text-slate-400">
                {selectedRepIds.size} Sales Rep{selectedRepIds.size !== 1 ? "s" : ""} Selected
              </span>
            </div>

            {selectedReps.length === 0 ? (
              <p className="text-sm text-slate-400 mb-10 text-center py-6">
                Select sales reps above to assign orders to.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                {selectedReps.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between bg-slate-50/80 rounded-2xl p-4 border border-slate-100 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                        <Image
                          src={
                            rep.avatarUrl ??
                            `https://avatar.iran.liara.run/public/${Math.abs(rep.id.charCodeAt(0) % 100)}`
                          }
                          alt={rep.name}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                          unoptimized={!rep.avatarUrl}
                        />
                      </div>
                      <div className="leading-tight">
                        <p className="text-[0.85rem] font-bold text-slate-700">{rep.name}</p>
                        <p className="text-[0.7rem] text-slate-400 font-medium">
                          {rep.activeOrderCount} Active
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRep(rep.id)}
                      className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Result message */}
            {assignResult && (
              <div
                className={`mb-6 px-6 py-3 rounded-xl text-sm font-bold ${
                  assignResult.ok
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {assignResult.msg}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-50">
              <button
                disabled={isPending || selectedRepIds.size === 0}
                onClick={handleAssign}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:shadow-none text-white px-12 py-4 rounded-xl text-[1rem] font-black shadow-xl shadow-purple-100 transition-all active:scale-95 disabled:cursor-not-allowed"
              >
                {isPending ? "Assigning…" : "Assign Orders Equally"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
