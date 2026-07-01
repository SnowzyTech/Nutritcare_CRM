"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderDetail } from "@/lib/mock-data/sales-rep-manager";

interface OrderDetailClientProps {
  repId: string;
  repName: string;
  order: OrderDetail;
}

// Each step is coloured by the stage it represents: pending stays orange,
// confirmed is a lighter green, delivered a thicker green. A node lights up
// only once that stage is `reached`.
type StepTone = "pending" | "confirmed" | "delivered" | "cancelled" | "failed" | "idle";

const STEP_TONE_BG: Record<StepTone, string> = {
  pending: "bg-amber-400", // pending → orange
  confirmed: "bg-green-400", // confirmed → lighter green
  delivered: "bg-green-600", // delivered → thicker green
  cancelled: "bg-orange-500",
  failed: "bg-red-500",
  idle: "bg-gray-200",
};

function StepIndicator({
  number,
  label,
  tone,
  reached,
  done,
}: {
  number: number;
  label: string;
  tone: StepTone;
  reached: boolean;
  done: boolean;
}) {
  const bg = reached ? STEP_TONE_BG[tone] : "bg-gray-200";
  const text = reached ? "text-white" : "text-gray-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-12 h-12 rounded-full ${bg} ${text} flex items-center justify-center font-bold text-lg`}
      >
        {done ? "✓" : number}
      </div>
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center max-w-[100px]">
        {label}
      </span>
    </div>
  );
}

type Step = { number: number; label: string; tone: StepTone; reached: boolean; done: boolean };

function getSteps(status: OrderDetail["status"]): Step[] {
  switch (status) {
    case "PENDING":
      return [
        { number: 1, label: "Order is Pending", tone: "pending", reached: true, done: false },
        { number: 2, label: "Order is yet to be Confirmed", tone: "confirmed", reached: false, done: false },
        { number: 3, label: "Order is yet to be Delivered", tone: "delivered", reached: false, done: false },
      ];
    case "CONFIRMED":
      return [
        { number: 1, label: "Order Pending", tone: "pending", reached: true, done: true },
        { number: 2, label: "Order has been Confirmed", tone: "confirmed", reached: true, done: false },
        { number: 3, label: "Order is yet to be Delivered", tone: "delivered", reached: false, done: false },
      ];
    case "DELIVERED":
      return [
        { number: 1, label: "Order Pending", tone: "pending", reached: true, done: true },
        { number: 2, label: "Order Confirmed", tone: "confirmed", reached: true, done: true },
        { number: 3, label: "Order Delivered", tone: "delivered", reached: true, done: true },
      ];
    case "CANCELLED":
      return [
        { number: 1, label: "Order Pending", tone: "pending", reached: true, done: true },
        { number: 2, label: "Order has been Cancelled", tone: "cancelled", reached: true, done: false },
        { number: 3, label: "N/A", tone: "idle", reached: false, done: false },
      ];
    case "FAILED":
      return [
        { number: 1, label: "Order Pending", tone: "pending", reached: true, done: true },
        { number: 2, label: "Order Confirmed", tone: "confirmed", reached: true, done: true },
        { number: 3, label: "Order Failed", tone: "failed", reached: true, done: false },
      ];
  }
}

function getStatusBadge(status: OrderDetail["status"]) {
  switch (status) {
    case "PENDING": return { bg: "bg-amber-400", label: "Pending Order" };
    case "CONFIRMED": return { bg: "bg-green-500", label: "Confirmed Order" };
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

export function OrderDetailClient({ repName, order }: OrderDetailClientProps) {
  const router = useRouter();
  const steps = getSteps(order.status);
  const badge = getStatusBadge(order.status);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors w-fit"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-200">
          {repName.charAt(0)}
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{repName}&apos;s Dashboard</h1>
      </div>

      <div className="flex flex-wrap gap-3 justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 break-all">Order ID: {order.orderId}</h2>
        <span className={`${badge.bg} text-white px-5 py-2 rounded-full text-[10px] uppercase font-bold tracking-wider`}>
          {badge.label}
        </span>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-2xl flex items-start gap-2 md:gap-4 shadow-sm border border-gray-100">
        {steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            <StepIndicator {...step} />
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-6 ${
                  step.done ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 md:p-8 border border-gray-100 shadow-sm flex flex-col">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
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
              {order.history.map((event, i) => {
                const label = typeof event === "string" ? event : event.label;
                const date = typeof event === "string" ? order.orderDate ?? "" : event.date;
                return (
                  <div key={i} className="flex gap-4 relative z-10">
                    <div className="w-4 h-4 rounded-full bg-purple-600 border-4 border-white shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{label}</p>
                      {date && <p className="text-xs font-medium text-gray-400">{date}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-purple-100 rounded-2xl h-64 flex flex-col items-center justify-center text-purple-600 text-sm border border-purple-200 overflow-hidden relative">
            {order.productImage ? (
              <Image
                src={order.productImage}
                alt={order.product}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            ) : (
              <span className="text-5xl mb-2">💊</span>
            )}
            <span className="absolute bottom-4 font-bold text-lg z-10 bg-white/80 px-4 py-1 rounded-full">{order.product}</span>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            {order.pricing?.discount ? (
              <div className="flex flex-col gap-2 pb-4 border-b border-dashed border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Original Total</span>
                  <span className="text-sm font-bold text-gray-400 line-through">{order.pricing.original}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Discount</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {order.pricing.discount}{order.pricing.discountPercent ? ` (${order.pricing.discountPercent}%)` : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Net Total</span>
                  <span className="text-2xl font-black text-gray-900">{order.pricing.net}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center pb-4 border-b border-dashed border-gray-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total Price</span>
                <span className="text-2xl font-black text-gray-900">{order.totalPrice}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">Date</span>
              <span className="text-sm font-bold text-gray-900">{order.orderDate ?? "—"}</span>
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

          {order.status !== "PENDING" && order.agent && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-3">
              {order.deliveryFee && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Estimated Delivery</span>
                    <span className="text-sm font-bold text-gray-900">{order.estimatedDelivery ?? "24 hours"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Delivery Fee</span>
                    <span className="text-sm font-bold text-gray-900">{order.deliveryFee}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Agent Assigned</span>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{order.agent.companyName}</div>
                  <div className="text-xs text-gray-400">
                    {[order.agent.state, order.agent.phone].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {order.status === "DELIVERED" && order.deliveredDate && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-sm font-bold text-green-700">✓ Order delivered on {order.deliveredDate}</p>
            </div>
          )}

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
              </div>
              <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                {order.prescription || "No prescription set."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
