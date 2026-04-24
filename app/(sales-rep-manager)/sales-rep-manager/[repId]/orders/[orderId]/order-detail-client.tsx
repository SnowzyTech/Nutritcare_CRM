"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OrderDetail } from "@/lib/mock-data/sales-rep-manager";

interface OrderDetailClientProps {
  repId: string;
  repName: string;
  order: OrderDetail;
}

function StepIndicator({
  number,
  label,
  isActive,
  isCompleted,
  isFailed,
}: {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  isFailed?: boolean;
}) {
  const bg = isFailed
    ? "bg-red-500"
    : isActive
    ? "bg-amber-400"
    : isCompleted
    ? "bg-green-500"
    : "bg-gray-200";
  const text = isActive || isCompleted || isFailed ? "text-white" : "text-gray-400";
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-12 h-12 rounded-full ${bg} ${text} flex items-center justify-center font-bold text-lg`}
      >
        {isCompleted ? "✓" : number}
      </div>
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center max-w-[100px]">
        {label}
      </span>
    </div>
  );
}

function getSteps(status: OrderDetail["status"]) {
  switch (status) {
    case "PENDING":
      return [
        { number: 1, label: "Order is Pending", isActive: true, isCompleted: false },
        { number: 2, label: "Order is yet to be Confirmed", isActive: false, isCompleted: false },
        { number: 3, label: "Order is yet to Delivered", isActive: false, isCompleted: false },
      ];
    case "CONFIRMED":
      return [
        { number: 1, label: "Order Processed", isActive: false, isCompleted: true },
        { number: 2, label: "Order has been confirmed", isActive: true, isCompleted: false },
        { number: 3, label: "Order is yet to Delivered", isActive: false, isCompleted: false },
      ];
    case "DELIVERED":
      return [
        { number: 1, label: "Order is Pending", isActive: false, isCompleted: true }, // As requested in prompt: amber/green/green layout ? Actually prompt says: Pending -> amber -> green -> green. Let's make it green/green/green for completed
        { number: 2, label: "Order is yet to be Confirmed", isActive: false, isCompleted: true },
        { number: 3, label: "Order is yet to Delivered", isActive: false, isCompleted: true },
      ];
    case "CANCELLED":
      return [
        { number: 1, label: "Order Processed", isActive: false, isCompleted: true },
        { number: 2, label: "Order has been Cancelled", isActive: true, isCompleted: false, isFailed: true },
        { number: 3, label: "Order is yet to Delivered", isActive: false, isCompleted: false },
      ];
    case "FAILED":
      return [
        { number: 1, label: "Order Processed", isActive: false, isCompleted: true },
        { number: 2, label: "Order has been confirmed", isActive: false, isCompleted: true },
        { number: 3, label: "Order Failed", isActive: false, isCompleted: false, isFailed: true },
      ];
  }
}

function getStatusBadge(status: OrderDetail["status"]) {
  switch (status) {
    case "PENDING": return { bg: "bg-amber-400", label: "Pending Order" };
    case "CONFIRMED": return { bg: "bg-blue-500", label: "Confirmed Order" };
    case "DELIVERED": return { bg: "bg-emerald-500", label: "Delivered Order" };
    case "CANCELLED": return { bg: "bg-orange-500", label: "Cancelled Order" };
    case "FAILED": return { bg: "bg-red-500", label: "Failed Order" };
  }
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{label}</label>
      <p className="text-sm text-gray-900 font-bold mt-1 mb-4">{value}</p>
      <div className="border-b border-dashed border-gray-200 mb-4" />
    </div>
  );
}

export function OrderDetailClient({ repId, repName, order }: OrderDetailClientProps) {
  const steps = getSteps(order.status);
  const badge = getStatusBadge(order.status);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-200">
          {repName.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{repName}s Dashboard</h1>
      </div>

      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Order ID: {order.orderId}</h2>
        <span className={`${badge.bg} text-white px-5 py-2 rounded-full text-[10px] uppercase font-bold tracking-wider`}>
          {badge.label}
        </span>
      </div>

      <div className="bg-white p-8 rounded-2xl flex items-start gap-4 shadow-sm border border-gray-100">
        {steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            <StepIndicator {...step} />
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-6 ${
                  step.isCompleted ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col">
          <div className="grid grid-cols-2 gap-x-8">
            <FieldRow label="Full Name" value={order.customer.fullName} />
            <FieldRow label="Phone Number" value={order.customer.phone} />
            <FieldRow label="WhatsApp number" value={order.customer.whatsapp} />
            <FieldRow label="Email" value={order.customer.email} />
            <div className="col-span-2">
              <FieldRow label="Full delivery address" value={order.customer.address} />
            </div>
            <FieldRow label="State" value={order.customer.state} />
            <FieldRow label="LGA" value={order.customer.lga} />
            <div className="col-span-2">
              <FieldRow label="Landmark" value={order.customer.landmark} />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mt-4 mb-8 flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Product(s)</p>
              <p className="text-sm font-bold text-purple-900 mt-1">{order.product}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Quantity</p>
              <p className="text-sm font-bold text-purple-900 mt-1">{order.quantity}</p>
            </div>
          </div>

          {order.upsell && (
            <div className="mb-8">
              <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-3">Added Product (Upsold)</h3>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold">Product</p>
                  <p className="text-sm font-bold text-green-900 mt-1">{order.upsell.product}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold">Quantity</p>
                  <p className="text-sm font-bold text-green-900 mt-1">{order.upsell.quantity}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto">
            <h4 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider">Order History</h4>
            <div className="flex flex-col gap-6 relative">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100" />
              {order.history.map((event, i) => (
                <div key={i} className="flex gap-4 relative z-10">
                  <div className="w-4 h-4 rounded-full bg-purple-600 border-4 border-white shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{event}</p>
                    <p className="text-xs font-medium text-gray-400">2025-11-08 14:37:52</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-6">
          <div className="bg-purple-100 rounded-2xl h-64 flex flex-col items-center justify-center text-purple-600 text-sm border border-purple-200 overflow-hidden relative">
            <span className="text-5xl mb-2">💊</span>
            <span className="font-bold text-lg z-10 bg-white/80 px-4 py-1 rounded-full">{order.product}</span>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center pb-4 border-b border-dashed border-gray-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total Price</span>
              <span className="text-2xl font-black text-gray-900">{order.totalPrice}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">Date</span>
              <span className="text-sm font-bold text-gray-900">12 Nov 2025</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">Source:</span>
              <span className="text-sm font-bold text-gray-900">{order.source}</span>
            </div>

            {order.status === "FAILED" && order.failReason && (
              <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-[10px] uppercase font-bold text-red-400 mb-1">Reason for failed Order</p>
                <p className="text-sm font-bold text-red-700">{order.failReason}</p>
              </div>
            )}
            
            {order.status === "CANCELLED" && order.cancelReason && (
              <div className="mt-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                <p className="text-[10px] uppercase font-bold text-orange-400 mb-1">Reason for cancellation</p>
                <p className="text-sm font-bold text-orange-700">{order.cancelReason}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-4 tracking-wider">Customer has been reached out on</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${order.contactedVia === 'phone' ? 'border-purple-600' : 'border-gray-300'}`}>
                  {order.contactedVia === 'phone' && <div className="w-2 h-2 rounded-full bg-purple-600" />}
                </div>
                <span className="text-sm font-bold text-gray-900">Phone Call</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${order.contactedVia === 'whatsapp' ? 'border-purple-600' : 'border-gray-300'}`}>
                  {order.contactedVia === 'whatsapp' && <div className="w-2 h-2 rounded-full bg-purple-600" />}
                </div>
                <span className="text-sm font-bold text-gray-900">WhatsApp</span>
              </label>
            </div>
          </div>

          {order.status !== "PENDING" && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prescription</h4>
                <button className="text-xs font-bold text-purple-600 hover:text-purple-700">Edit</button>
              </div>
              <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                {order.prescription}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
