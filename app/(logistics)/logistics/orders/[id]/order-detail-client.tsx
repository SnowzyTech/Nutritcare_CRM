"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";

type SerializedOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: string;
  netAmount: string;
  deliveryFee: string;
  notes: string | null;
  createdAt: string;
  date: string;
  customer: {
    name: string;
    phone: string;
    whatsappNumber: string | null;
    email: string | null;
    deliveryAddress: string;
    state: string;
    lga: string;
    landmark: string | null;
    source: string | null;
  };
  agent: {
    id: string;
    companyName: string;
    state: string | null;
    phone: string;
    totalDeliveries: number;
    activeOrders: number;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    product: { id: string; name: string };
  }>;
  salesRep: { id: string; name: string };
  deliveries: Array<{
    scheduledTime: string | null;
    deliveredTime: string | null;
    status: string;
  }>;
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { badge: string; label: string; steps: Array<{ label: string; completed: boolean; active: boolean }> }
> = {
  PENDING: {
    badge: "bg-amber-400 text-white",
    label: "Pending Order",
    steps: [
      { label: "Order Placed", completed: false, active: true },
      { label: "Order Confirmed", completed: false, active: false },
      { label: "Dispatched & Delivered", completed: false, active: false },
    ],
  },
  CONFIRMED: {
    badge: "bg-green-500 text-white",
    label: "Confirmed Order",
    steps: [
      { label: "Order Placed", completed: true, active: false },
      { label: "Order Confirmed", completed: false, active: true },
      { label: "Dispatched & Delivered", completed: false, active: false },
    ],
  },
  DELIVERED: {
    badge: "bg-green-600 text-white",
    label: "Delivered Order",
    steps: [
      { label: "Order Placed", completed: true, active: false },
      { label: "Order Confirmed", completed: true, active: false },
      { label: "Dispatched & Delivered", completed: true, active: false },
    ],
  },
  CANCELLED: {
    badge: "bg-red-500 text-white",
    label: "Cancelled Order",
    steps: [
      { label: "Order Placed", completed: true, active: false },
      { label: "Order Cancelled", completed: false, active: true },
      { label: "N/A", completed: false, active: false },
    ],
  },
  FAILED: {
    badge: "bg-red-600 text-white",
    label: "Failed Order",
    steps: [
      { label: "Order Placed", completed: true, active: false },
      { label: "Order Failed", completed: false, active: true },
      { label: "N/A", completed: false, active: false },
    ],
  },
};

function StepIndicator({ number, label, isActive, isCompleted }: {
  number: number; label: string; isActive: boolean; isCompleted: boolean;
}) {
  const bg = isActive ? "bg-[#ad1df4]" : isCompleted ? "bg-green-500" : "bg-gray-200";
  const text = isActive || isCompleted ? "text-white" : "text-gray-400";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-full ${bg} ${text} flex items-center justify-center font-bold text-lg`}>
        {isCompleted ? "✓" : number}
      </div>
      <span className="text-xs text-gray-500 font-medium text-center max-w-24">{label}</span>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-semibold">{label}</label>
      <p className="text-sm text-gray-900 font-medium mt-1 mb-3">{value}</p>
      <div className="border-b border-dashed border-gray-200 mb-2" />
    </div>
  );
}

export function LogisticsOrderDetailClient({ order }: { order: SerializedOrder }) {
  const router = useRouter();

  const config = STATUS_CONFIG[order.status];
  const delivery = order.deliveries[0] ?? null;
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-sm font-medium w-fit transition"
      >
        ← Back to Orders
      </button>

      <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Order ID: {order.orderNumber}</h2>
        <span className={`${config.badge} px-5 py-2 rounded-full text-sm font-semibold`}>{config.label}</span>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
        {config.steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <StepIndicator number={idx + 1} label={step.label} isActive={step.active} isCompleted={step.completed} />
            {idx < config.steps.length - 1 && (
              <div className={`flex-1 h-0.5 mt-6 ${step.completed ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-2 rounded-lg mb-5">Order Details</h3>
          <div className="grid grid-cols-2 gap-x-4">
            <FieldRow label="Full Name" value={order.customer.name} />
            <FieldRow label="Phone Number" value={order.customer.phone} />
            <FieldRow label="WhatsApp Number" value={order.customer.whatsappNumber ?? order.customer.phone} />
            <FieldRow label="Email" value={order.customer.email ?? "—"} />
            <div className="col-span-2"><FieldRow label="Full Delivery Address" value={order.customer.deliveryAddress} /></div>
            <FieldRow label="State" value={order.customer.state} />
            <FieldRow label="LGA" value={order.customer.lga} />
            <div className="col-span-2"><FieldRow label="Landmark" value={order.customer.landmark ?? "—"} /></div>
            <FieldRow label="Product(s)" value={order.items.map((i) => i.product.name).join(", ") || "—"} />
            <FieldRow label="Quantity" value={String(totalQty)} />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Items Breakdown</h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-gray-600">
                  <span>{item.product.name} × {item.quantity}</span>
                  <span className="font-medium">{formatCurrency(Number(item.lineTotal))}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 mb-4 uppercase">Order History</h4>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Order Created</span>
                <span>{new Date(order.createdAt).toLocaleString("en-NG")}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Sales Rep</span>
                <span className="font-medium text-gray-900">{order.salesRep.name}</span>
              </div>
              {delivery?.scheduledTime && (
                <div className="flex justify-between text-gray-500">
                  <span>Scheduled Delivery</span>
                  <span>{new Date(delivery.scheduledTime).toLocaleString("en-NG")}</span>
                </div>
              )}
              {delivery?.deliveredTime && (
                <div className="flex justify-between text-gray-500">
                  <span>Delivered At</span>
                  <span>{new Date(delivery.deliveredTime).toLocaleString("en-NG")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-6">
          <div className="bg-gray-50 rounded-xl min-h-40 flex items-center justify-center text-gray-400 text-sm border border-gray-200 p-4 text-center">
            📦 {order.items.map((i) => i.product.name).join(", ") || "No products"} — {totalQty} units
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Source</span>
              <span className="font-semibold text-gray-900">{order.customer.source ?? "WhatsApp"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-bold text-gray-900">{formatCurrency(Number(order.totalAmount))}</span>
            </div>
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="font-semibold text-gray-900">{formatCurrency(Number(order.deliveryFee))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Net Amount</span>
              <span className="font-semibold text-gray-900">{formatCurrency(Number(order.netAmount))}</span>
            </div>

            {order.agent && (
              <div className="border-t border-gray-100 pt-3 mt-1">
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-gray-500">Agent Assigned</span>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{order.agent.companyName}</div>
                    <div className="text-xs text-gray-400">{order.agent.state ?? ""}</div>
                    <div className="text-xs text-gray-400">{order.agent.phone}</div>
                  </div>
                </div>
              </div>
            )}

            {order.status === "DELIVERED" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  ✓ Order delivered{delivery?.deliveredTime ? ` on ${new Date(delivery.deliveredTime).toLocaleDateString("en-NG")}` : ""}
                </p>
              </div>
            )}

            {(order.status === "CANCELLED" || order.status === "FAILED") && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">
                  Order {order.status === "CANCELLED" ? "cancelled" : "failed"}
                </p>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Prescription / Notes</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
