"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dispatchOrderAction } from "@/modules/delivery/actions/logistics-dispatch.action";
import type { DispatchOrder, DispatchDriver } from "@/modules/delivery/services/logistics-dispatch.service";

const MAX_LOAD = 5;

const SOURCE_LABEL: Record<string, string> = {
  order: "Order",
  stockOut: "Stock Out",
  stockTransfer: "Transfer",
};

export function DispatchClient({
  orders,
  drivers,
}: {
  orders: DispatchOrder[];
  drivers: DispatchDriver[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [priority, setPriority] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedItem = orders.find((o) => o.id === selectedItemId) ?? null;

  // Pre-fill from query params (set by the Assign button on the deliveries page)
  useEffect(() => {
    const paramId = searchParams.get("orderId");
    if (paramId && orders.some((o) => o.id === paramId)) {
      setSelectedItemId(paramId);
    }
  }, [searchParams, orders]);

  function handleReset() {
    setSelectedItemId("");
    setSelectedDriverId("");
    setPriority("");
    setError(null);
  }

  function handleDispatch() {
    if (!selectedItemId) {
      setError("Please select an item to dispatch.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await dispatchOrderAction(
        selectedItemId,
        selectedDriverId || undefined,
        selectedItem?.sourceType ?? "order"
      );
      if (!result.success) {
        setError(result.error);
      } else {
        router.push("/logistics/deliveries");
      }
    });
  }

  const itemLabel = selectedItem ? SOURCE_LABEL[selectedItem.sourceType] : "Order / Reference";

  return (
    <div className="max-w-5xl mx-auto space-y-12 pt-2 pb-20">
      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800">Create dispatch</h1>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">NEW</span>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={isPending}
              className="bg-[#d1d5db] hover:bg-[#9ca3af] text-white px-8 font-bold h-10 rounded-md"
            >
              Reset
            </Button>
            <Button
              onClick={handleDispatch}
              disabled={isPending || !selectedItemId}
              className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-8 font-bold h-10 rounded-md disabled:opacity-50"
            >
              {isPending ? "Dispatching…" : "Dispatch"}
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          {/* Order / Reference ID */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">{itemLabel}</label>
            <Select value={selectedItemId} onValueChange={(val) => setSelectedItemId(val ?? "")}>
              <SelectTrigger className="h-10 text-xs text-gray-500 border-gray-200">
                <SelectValue placeholder="Select an order or reference" />
              </SelectTrigger>
              <SelectContent>
                {orders.length === 0 && (
                  <SelectItem value="__none__" disabled>Nothing pending dispatch</SelectItem>
                )}
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    <span className="text-[10px] text-gray-400 mr-1">[{SOURCE_LABEL[o.sourceType]}]</span>
                    {o.orderNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Address — read-only, auto-filled */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">Delivery Address</label>
            <div className="h-10 px-3 flex items-center text-xs text-gray-500 border border-gray-200 rounded-md bg-gray-50">
              {selectedItem?.address ?? <span className="text-gray-300">Auto-filled from selection</span>}
            </div>
          </div>

          {/* Assign Driver */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">Assign Driver</label>
            <Select value={selectedDriverId} onValueChange={(val) => setSelectedDriverId(val ?? "")}>
              <SelectTrigger className="h-10 text-xs text-gray-400 border-gray-200">
                <SelectValue placeholder="Select a driver (optional)" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} — {d.state !== "—" ? d.state : d.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority — UI only */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">Priority</label>
            <Select value={priority} onValueChange={(val) => setPriority(val ?? "")}>
              <SelectTrigger className="h-10 text-xs text-gray-400 border-gray-200">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agent — auto-filled, read-only */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">Agent</label>
            <div className="h-10 px-3 flex items-center text-xs text-gray-500 border border-gray-200 rounded-md bg-gray-50">
              {selectedItem?.agentName ?? <span className="text-gray-300">Auto-filled from selection</span>}
            </div>
          </div>

          {/* State — auto-filled, read-only */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">State</label>
            <div className="h-10 px-3 flex items-center text-xs text-gray-500 border border-gray-200 rounded-md bg-gray-50">
              {selectedItem?.state ?? <span className="text-gray-300">Auto-filled from selection</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Available Drivers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#d1d5db] px-6 py-2.5">
          <span className="text-xs font-bold text-gray-600">Available Drivers</span>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="text-gray-400 font-bold bg-[#faf5ff] uppercase">
            <tr>
              <th className="px-6 py-4 w-10"><Checkbox className="border-gray-300" /></th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">State</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Active Deliveries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  No active drivers found.
                </td>
              </tr>
            ) : (
              drivers.map((driver) => {
                const isOnRoute = driver.activeDeliveries > 0;
                const loadPct = Math.min(100, Math.round((driver.activeDeliveries / MAX_LOAD) * 100));
                return (
                  <tr
                    key={driver.id}
                    className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedDriverId === driver.id ? "bg-[#faf5ff]" : ""}`}
                    onClick={() => setSelectedDriverId(driver.id)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        className="border-gray-300"
                        checked={selectedDriverId === driver.id}
                        onCheckedChange={() => setSelectedDriverId(driver.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">{driver.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{driver.state}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{driver.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-5 py-1 rounded-full text-[10px] font-bold ${
                        isOnRoute
                          ? "bg-[#faf5ff] text-[#ad1df4] border border-[#f3e8ff]"
                          : "bg-[#f0fdf4] text-[#22c55e] border border-[#dcfce7]"
                      }`}>
                        {isOnRoute ? "On Route" : "Available"}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-56">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${loadPct >= 80 ? "bg-[#22c55e]" : loadPct >= 40 ? "bg-[#eab308]" : "bg-gray-300"}`}
                            style={{ width: `${loadPct}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-[10px] w-8 text-right">{driver.activeDeliveries}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
