"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MessageCircle, X } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderStatus } from "@prisma/client";
import {
  adminConfirmOrderAction,
  adminCancelOrderAction,
  adminFailOrderAction,
  adminDeliverOrderAction,
  adminAddOrderItemsAction,
} from "@/modules/orders/actions/admin-orders.action";

export type SerializedOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: string;
  netAmount: string;
  deliveryFee: string;
  notes: string | null;
  createdAt: string;
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
  agent: { id: string; companyName: string; state: string | null } | null;
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

export type ProductOption = {
  id: string;
  name: string;
  sellingPrice: string;
  sku: string;
};

interface AdminOrderDetailClientProps {
  order: SerializedOrder;
  products: ProductOption[];
}

const STATUS_BADGE: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: "bg-amber-100",   text: "text-amber-600",   label: "Pending Order" },
  CONFIRMED: { bg: "bg-emerald-100", text: "text-emerald-600", label: "Confirmed Order" },
  DELIVERED: { bg: "bg-emerald-500", text: "text-white",       label: "Delivered Order" },
  CANCELLED: { bg: "bg-rose-100",    text: "text-rose-600",    label: "Cancelled Order" },
  FAILED:    { bg: "bg-red-100",     text: "text-red-600",     label: "Failed Order" },
};

function getStepState(status: OrderStatus) {
  const steps = [
    { label: "Order Pending", active: false, completed: false },
    { label: "Order Confirmed", active: false, completed: false },
    { label: "Order Delivered", active: false, completed: false },
  ];

  switch (status) {
    case "PENDING":
      steps[0].active = true;
      break;
    case "CONFIRMED":
      steps[0].completed = true;
      steps[1].active = true;
      break;
    case "DELIVERED":
      steps[0].completed = true;
      steps[1].completed = true;
      steps[2].completed = true;
      break;
    case "CANCELLED":
      steps[0].completed = true;
      steps[1] = { label: "Cancelled", active: true, completed: false };
      steps[2] = { label: "N/A", active: false, completed: false };
      break;
    case "FAILED":
      steps[0].completed = true;
      steps[1] = { label: "Failed", active: true, completed: false };
      steps[2] = { label: "N/A", active: false, completed: false };
      break;
  }
  return steps;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 group">
      <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-[0.9rem] font-bold text-slate-700 border-b-2 border-slate-100 pb-2 group-hover:border-purple-200 transition-colors">
        {value}
      </p>
    </div>
  );
}

export function AdminOrderDetailClient({
  order,
  products,
}: AdminOrderDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productRows, setProductRows] = useState([
    { id: Date.now(), productId: products[0]?.id ?? "", qty: "1" },
  ]);

  const steps = getStepState(order.status);
  const badge = STATUS_BADGE[order.status];
  const delivery = order.deliveries[0] ?? null;
  const formattedTotal = `₦${Number(order.totalAmount).toLocaleString("en-NG")}`;
  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const productNames = order.items.map((i) => i.product.name).join(", ") || "—";

  function addRow() {
    setProductRows([
      ...productRows,
      { id: Date.now(), productId: products[0]?.id ?? "", qty: "1" },
    ]);
  }

  function removeRow(id: number) {
    if (productRows.length > 1)
      setProductRows(productRows.filter((r) => r.id !== id));
  }

  function updateRow(id: number, field: "productId" | "qty", value: string) {
    setProductRows(
      productRows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function adjustQty(id: number, delta: number) {
    setProductRows(
      productRows.map((r) => {
        if (r.id !== id) return r;
        return { ...r, qty: String(Math.max(1, parseInt(r.qty || "1") + delta)) };
      })
    );
  }

  function handleAction(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function handleAddProducts() {
    handleAction(async () => {
      const items = productRows
        .filter((r) => r.productId)
        .map((r) => ({ productId: r.productId, quantity: parseInt(r.qty) || 1 }));
      await adminAddOrderItemsAction(order.id, items);
      setIsAddProductOpen(false);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors w-fit font-bold text-sm"
      >
        <ChevronLeft size={16} />
        Back to Orders
      </button>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
            <Image
              src="https://avatar.iran.liara.run/public/60"
              alt="Avatar"
              width={48}
              height={48}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {order.salesRep.name}&apos;s
            </h1>
            <p className="text-sm text-slate-500">Order</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg">
          <MessageCircle size={20} />
        </button>
      </div>

      {/* Order Title & Badge */}
      <div className="flex items-center gap-4 mt-2">
        <h2 className="text-lg font-bold text-slate-700">
          Order ID: {order.orderNumber}
        </h2>
        <span
          className={`${badge.bg} ${badge.text} px-4 py-1 rounded-full text-sm font-bold`}
        >
          {badge.label}
        </span>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between px-10 relative">
        <div className="absolute top-5 left-20 right-20 h-0.5 bg-slate-200 -z-10" />
        {steps.map((step, idx) => {
          const bg = step.completed
            ? "bg-emerald-400"
            : step.active
              ? "bg-amber-400"
              : "bg-slate-200";
          const textColor = step.completed || step.active ? "text-white" : "text-slate-400";
          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-2 text-center max-w-[120px]"
            >
              <div
                className={`w-10 h-10 rounded-full ${bg} ${textColor} flex items-center justify-center font-bold`}
              >
                {step.completed ? "✓" : idx + 1}
              </div>
              <span className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-tight">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Order Details Card */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-100/50 px-8 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-700">Order Details</h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-x-12 gap-y-10 mb-12">
                <DetailItem label="Full Name" value={order.customer.name} />
                <DetailItem label="Phone Number" value={order.customer.phone} />
                <DetailItem
                  label="WhatsApp Number"
                  value={order.customer.whatsappNumber ?? order.customer.phone}
                />
                <DetailItem label="Email" value={order.customer.email ?? "—"} />
                <div className="col-span-2">
                  <DetailItem
                    label="Full Delivery Address"
                    value={order.customer.deliveryAddress}
                  />
                </div>
                <DetailItem label="State" value={order.customer.state} />
                <DetailItem label="LGA" value={order.customer.lga} />
                <div className="col-span-2">
                  <DetailItem
                    label="Landmark"
                    value={order.customer.landmark ?? "—"}
                  />
                </div>
              </div>

              {/* Products */}
              <div className="flex flex-col gap-4">
                {order.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-100"
                  >
                    <div>
                      <p className="text-[0.7rem] font-bold text-slate-400 uppercase mb-1">
                        {idx === 0 ? "Product(s)" : "Added Product"}
                      </p>
                      <p className="text-xl font-bold text-slate-700">
                        {item.product.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.7rem] font-bold text-slate-400 uppercase mb-1">
                        Quantity
                      </p>
                      <p className="text-2xl font-bold text-slate-700">
                        {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {order.status === "PENDING" && (
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="w-full mt-4 bg-purple-100 border border-purple-200 px-4 py-3 rounded-lg text-purple-600 font-semibold text-sm hover:bg-purple-50 transition flex items-center justify-center gap-2"
                >
                  <span className="text-lg">+</span> Add Product
                </button>
              )}
            </div>
          </div>

          {/* Order History */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-tight">
              Order History
            </h4>
            <div className="flex flex-col gap-6">
              <HistoryRow
                event="Order Created"
                dateStr={order.createdAt}
              />
              <HistoryRow
                event="Sales Rep Assigned"
                detail={order.salesRep.name}
                dateStr={order.createdAt}
              />
              {order.status !== "PENDING" && (
                <HistoryRow
                  event="Order Confirmed"
                  dateStr={order.createdAt}
                />
              )}
              {order.agent && (
                <HistoryRow
                  event="Delivery Agent Assigned"
                  detail={order.agent.companyName}
                  dateStr={order.createdAt}
                />
              )}
              {order.status === "DELIVERED" && delivery?.deliveredTime && (
                <HistoryRow
                  event="Order Delivered"
                  dateStr={delivery.deliveredTime}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Product Image Card */}
          <div className="relative h-[240px] rounded-[2rem] overflow-hidden group">
            <Image
              src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=2070&auto=format&fit=crop"
              alt="Product"
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
              <p className="text-white text-2xl font-bold">{productNames}</p>
            </div>
            <div className="absolute bottom-12 left-8 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1">
              <span className="text-white text-lg font-bold">
                {totalQty} units
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-slate-400">
                Source:{" "}
                <span className="text-slate-800">
                  {order.customer.source ?? "WhatsApp"}
                </span>
              </span>
            </div>

            <div className="flex justify-between items-center py-4 border-b border-slate-200">
              <span className="text-lg font-bold text-slate-700">Total Price</span>
              <span className="text-xl font-bold text-slate-800">{formattedTotal}</span>
            </div>

            {(order.status === "CONFIRMED" || order.status === "DELIVERED") && (
              <>
                <div className="flex justify-between items-center py-4 border-b border-slate-200">
                  <span className="text-sm font-bold text-slate-700">
                    Estimated Delivery Date
                  </span>
                  <span className="text-sm font-bold text-slate-500">
                    {delivery?.scheduledTime
                      ? new Date(delivery.scheduledTime).toLocaleDateString("en-NG")
                      : "24 hours"}
                  </span>
                </div>

                {order.agent && (
                  <div className="flex justify-between items-center py-4">
                    <span className="text-sm font-bold text-slate-700">
                      Agent Assigned
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-700">
                        {order.agent.companyName}
                      </p>
                      <p className="text-[0.7rem] font-bold text-slate-400 uppercase">
                        {order.agent.state}
                      </p>
                    </div>
                  </div>
                )}

                <button className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold py-3 rounded-xl border border-purple-100 text-sm transition-colors">
                  View Agent Info
                </button>
              </>
            )}

            {/* Contact method */}
            <div className="mt-2">
              <p className="text-[0.8rem] font-bold text-slate-400 mb-4">
                Customer has been reached out to on
              </p>
              <div className="flex gap-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`contact-${order.id}`}
                    value="phone"
                    className="accent-purple-600"
                  />
                  <span className="text-sm font-bold text-slate-500">Phone Call</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`contact-${order.id}`}
                    value="whatsapp"
                    defaultChecked
                    className="accent-purple-600"
                  />
                  <span className="text-sm font-bold text-slate-500">WhatsApp</span>
                </label>
              </div>
            </div>

            {/* Admin action buttons */}
            {order.status === "PENDING" && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  disabled={isPending}
                  onClick={() => handleAction(() => adminCancelOrderAction(order.id))}
                  className="bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl text-rose-600 font-bold text-sm hover:bg-rose-100 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleAction(() => adminConfirmOrderAction(order.id))}
                  className="bg-purple-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition disabled:opacity-50"
                >
                  Confirm →
                </button>
              </div>
            )}

            {order.status === "CONFIRMED" && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  disabled={isPending}
                  onClick={() => handleAction(() => adminFailOrderAction(order.id))}
                  className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-red-600 font-bold text-sm hover:bg-red-100 transition disabled:opacity-50"
                >
                  ✕ Fail
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleAction(() => adminDeliverOrderAction(order.id))}
                  className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  ✓ Delivered
                </button>
              </div>
            )}

            {order.status !== "PENDING" && (
              <div className="mt-4">
                <div className="bg-slate-200 p-3 rounded-t-xl text-[0.8rem] font-bold text-slate-500 uppercase">
                  Prescription
                </div>
                <div className="bg-white p-6 rounded-b-xl border border-t-0 border-slate-200 shadow-sm relative group">
                  <textarea
                    placeholder="Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days."
                    defaultValue={order.notes ?? ""}
                    className="w-full min-h-20 text-[0.9rem] font-bold text-slate-600 leading-relaxed outline-none resize-none bg-transparent"
                  />
                  <button className="absolute top-4 right-4 p-1 rounded-md border border-purple-200 text-purple-600 text-[0.6rem] font-bold hover:bg-purple-50">
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsAddProductOpen(false)}
          />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[650px] p-12 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-slate-400">Add Product</h2>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-8 max-h-[350px] overflow-y-auto pr-2">
              {productRows.map((row) => (
                <div key={row.id} className="flex gap-3 items-center">
                  <div className="flex-1 bg-slate-50 rounded-2xl p-6 flex gap-4 items-center border border-slate-100">
                    <div className="flex-1">
                      <Select
                        value={row.productId}
                        onValueChange={(val) =>
                          val && updateRow(row.id, "productId", val)
                        }
                      >
                        <SelectTrigger className="w-full h-[48px] border-none bg-white/50 rounded-xl text-[1.1rem] font-black shadow-sm px-4">
                          <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-[140px] flex items-center justify-between bg-white/50 rounded-xl h-[48px] px-2 shadow-sm border border-slate-100">
                      <button
                        onClick={() => adjustQty(row.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-colors font-bold"
                      >
                        -
                      </button>
                      <span className="text-[1.1rem] font-black text-slate-800">
                        {row.qty}
                      </span>
                      <button
                        onClick={() => adjustQty(row.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {productRows.length > 1 && (
                    <button
                      onClick={() => removeRow(row.id)}
                      className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors flex items-center justify-center shrink-0 border border-rose-100"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={addRow}
                className="w-full border-2 border-purple-600 text-purple-600 py-4 rounded-2xl text-[1rem] font-black hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
              >
                Add Another Product <span className="text-xl">→</span>
              </button>
              <button
                disabled={isPending}
                onClick={handleAddProducts}
                className="w-full bg-purple-600 text-white py-4 rounded-2xl text-[1rem] font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue <span className="text-xl">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryRow({
  event,
  detail,
  dateStr,
}: {
  event: string;
  detail?: string;
  dateStr: string;
}) {
  const d = new Date(dateStr);
  return (
    <div className="flex items-center gap-4 group">
      <div className="min-w-[140px]">
        <p className="text-[0.8rem] font-bold text-slate-700">{event}</p>
        {detail && (
          <p className="text-[0.8rem] font-bold text-slate-700">{detail}</p>
        )}
      </div>
      <div className="flex-1 border-b border-dotted border-slate-300 mb-1" />
      <div className="text-right">
        <p className="text-[0.8rem] font-bold text-slate-500">
          {d.toLocaleDateString("en-NG")}
        </p>
        <p className="text-[0.7rem] text-slate-400 font-medium">
          {d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
