"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Package, TrendingUp, Truck } from "lucide-react";

interface OrderItem {
  productName: string;
  quantity: number;
  lineTotal: number;
}

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  date: Date;
  deliveryFee: number;
  netAmount: number;
  customerName: string;
  items: OrderItem[];
}

interface Props {
  orders: DeliveryOrder[];
  agentName: string | null | undefined;
  avatarUrl: string;
}

// Format as "Mon, Apr 26" for the filter chips and group headers
function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// Full date for group header e.g. "Saturday, 26 April 2026"
function formatFullDay(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function dateKey(date: Date): string {
  return new Date(date).toISOString().split("T")[0];
}

export function AccountClient({ orders, agentName, avatarUrl }: Props) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Unique dates sorted newest first
  const uniqueDays = useMemo(() => {
    const seen = new Set<string>();
    const days: { key: string; date: Date; label: string }[] = [];
    for (const o of orders) {
      const k = dateKey(o.date);
      if (!seen.has(k)) {
        seen.add(k);
        days.push({ key: k, date: o.date, label: formatDayLabel(o.date) });
      }
    }
    return days;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(
    () => (selectedDay ? orders.filter((o) => dateKey(o.date) === selectedDay) : orders),
    [orders, selectedDay]
  );

  // Group filtered orders by date key, preserving order (newest first)
  const grouped = useMemo(() => {
    const map = new Map<string, { date: Date; orders: DeliveryOrder[] }>();
    for (const o of filteredOrders) {
      const k = dateKey(o.date);
      if (!map.has(k)) map.set(k, { date: o.date, orders: [] });
      map.get(k)!.orders.push(o);
    }
    return Array.from(map.values());
  }, [filteredOrders]);

  // Overall totals for current filter
  const totals = useMemo(() => {
    return filteredOrders.reduce(
      (acc, o) => ({
        fee: acc.fee + o.deliveryFee,
        sales: acc.sales + o.netAmount,
        orders: acc.orders + 1,
        items: acc.items + o.items.reduce((s, i) => s + i.quantity, 0),
      }),
      { fee: 0, sales: 0, orders: 0, items: 0 }
    );
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      {/* Hero earnings card */}
      <div className="bg-[#ad1df4] rounded-[28px] p-6 text-white shadow-lg shadow-purple-200">
        <p className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">
          {selectedDay
            ? `Earnings · ${uniqueDays.find((d) => d.key === selectedDay)?.label}`
            : "Total Earnings"}
        </p>
        <p className="text-4xl font-black tracking-tight">{formatCurrency(totals.fee)}</p>
        <p className="text-purple-200 text-sm mt-1">from {totals.orders} {totals.orders === 1 ? "delivery" : "deliveries"}</p>

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/20">
          <StatPill icon={<Truck className="w-3.5 h-3.5" />} label="Orders" value={String(totals.orders)} />
          <StatPill icon={<Package className="w-3.5 h-3.5" />} label="Items" value={String(totals.items)} />
          <StatPill icon={<TrendingUp className="w-3.5 h-3.5" />} label="Sales value" value={formatCurrency(totals.sales)} small />
        </div>
      </div>

      {/* Day filter chips */}
      {uniqueDays.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <DayChip
            label="All Time"
            active={selectedDay === null}
            onClick={() => setSelectedDay(null)}
          />
          {uniqueDays.map((d) => (
            <DayChip
              key={d.key}
              label={d.label}
              active={selectedDay === d.key}
              onClick={() => setSelectedDay(selectedDay === d.key ? null : d.key)}
            />
          ))}
        </div>
      )}

      {/* Orders grouped by day */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-[28px] p-10 text-center text-gray-400 shadow-sm">
          <p className="font-bold text-base">No deliveries yet</p>
          <p className="text-sm mt-1">Your completed deliveries and earnings will appear here.</p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-white rounded-[28px] p-10 text-center text-gray-400 shadow-sm">
          <p className="font-bold">No deliveries on this day</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const dayFee = group.orders.reduce((s, o) => s + o.deliveryFee, 0);
            const dayItems = group.orders.reduce(
              (s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0),
              0
            );
            return (
              <div key={dateKey(group.date)} className="space-y-3">
                {/* Day header */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider">
                      {formatFullDay(group.date)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {group.orders.length} {group.orders.length === 1 ? "order" : "orders"} · {dayItems} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-medium uppercase">Fee earned</p>
                    <p className="text-base font-black text-[#ad1df4]">{formatCurrency(dayFee)}</p>
                  </div>
                </div>

                {/* Order cards */}
                <div className="space-y-3">
                  {group.orders.map((order) => {
                    const itemSummary = order.items
                      .map((i) => `${i.productName} ×${i.quantity}`)
                      .join(" · ");
                    const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-50 space-y-4"
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Order #{order.orderNumber}
                            </p>
                            <p className="text-sm font-black text-[#1e1e2d]">{order.customerName}</p>
                          </div>
                          {/* Fee badge */}
                          <div className="bg-[#faf5ff] px-3 py-2 rounded-xl text-right">
                            <p className="text-[9px] font-bold text-purple-400 uppercase">Fee</p>
                            <p className="text-base font-black text-[#ad1df4] leading-tight">
                              {formatCurrency(order.deliveryFee)}
                            </p>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-[1px] bg-gray-50" />

                        {/* Products */}
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#f3e8ff] flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-black text-[#ad1df4]">
                                    {item.productName[0]}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold text-gray-600">
                                  {item.productName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                  ×{item.quantity}
                                </span>
                                <span className="text-xs font-bold text-gray-600">
                                  {formatCurrency(item.lineTotal)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Footer: totals */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                          <p className="text-[10px] text-gray-400 font-semibold">
                            {totalItems} item{totalItems !== 1 ? "s" : ""} delivered
                          </p>
                          <p className="text-xs font-bold text-gray-500">
                            Order total{" "}
                            <span className="text-gray-800">{formatCurrency(order.netAmount)}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Day subtotal bar (only when showing all days) */}
                {!selectedDay && (
                  <div className="bg-[#f8f0ff] rounded-2xl px-5 py-3 flex items-center justify-between">
                    <p className="text-xs font-bold text-purple-400">Day total</p>
                    <div className="flex items-center gap-4">
                      <p className="text-xs text-gray-400 font-medium">
                        Sales{" "}
                        <span className="text-gray-600 font-bold">
                          {formatCurrency(group.orders.reduce((s, o) => s + o.netAmount, 0))}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 font-medium">
                        Fee{" "}
                        <span className="text-[#ad1df4] font-black">{formatCurrency(dayFee)}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white/10 rounded-2xl px-3 py-2.5 space-y-1">
      <div className="flex items-center gap-1 text-purple-200">
        {icon}
        <p className="text-[9px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`font-black text-white ${small ? "text-xs" : "text-base"} leading-tight`}>{value}</p>
    </div>
  );
}

function DayChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
        active
          ? "bg-[#ad1df4] text-white border-[#ad1df4] shadow-sm"
          : "bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600"
      }`}
    >
      {label}
    </button>
  );
}
