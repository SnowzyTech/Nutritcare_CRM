"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MessageCircle, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AgentInfoDrawer } from "@/components/ui/agent-info-drawer";
import Image from "next/image";
import type { OrderStatus } from "@prisma/client";
import {
  adminConfirmOrderAction,
  adminCancelOrderAction,
  adminFailOrderAction,
  adminDeliverOrderAction,
  adminAddOrderItemsAction,
  adminRemoveOrderItemAction,
  adminApplyOrderDiscountAction,
  adminReassignOrderAgentAction,
  adminUpdateOrderNotesAction,
} from "@/modules/orders/actions/admin-orders.action";

export type SerializedOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  isReorder: boolean;
  totalAmount: string;
  netAmount: string;
  deliveryFee: string;
  discountAmount: string;
  discountPercent: string;
  discountReason: string | null;
  discountedAt: string | null;
  discountedByName: string | null;
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
    isUpsell: boolean;
    product: { id: string; name: string; imageUrl: string | null };
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

export type AgentOption = {
  id: string;
  companyName: string;
  state: string | null;
  phone: string;
  activeOrders: number;
  totalDeliveries: number;
};

interface AdminOrderDetailClientProps {
  order: SerializedOrder;
  products: ProductOption[];
  agents: AgentOption[];
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
  agents,
}: AdminOrderDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [priceInput, setPriceInput] = useState(order.netAmount);
  const [discountReason, setDiscountReason] = useState(order.discountReason ?? "");
  const [prescription, setPrescription] = useState(order.notes ?? "");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [productRows, setProductRows] = useState([
    { id: Date.now(), productId: products[0]?.id ?? "", qty: "1" },
  ]);

  const steps = getStepState(order.status);
  const badge = STATUS_BADGE[order.status];
  const delivery = order.deliveries[0] ?? null;
  const grossTotal = order.items.reduce((s, i) => s + Number(i.lineTotal), 0);
  const fmtNaira = (n: number) => `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
  const formattedTotal = fmtNaira(Number(order.netAmount));
  const canDiscount = order.status === "PENDING" || order.status === "CONFIRMED";
  const negotiatedPrice = parseFloat(priceInput) || 0;
  const liveDiscount = Math.max(0, Math.round((grossTotal - negotiatedPrice) * 100) / 100);
  const liveDiscountPct = grossTotal > 0 ? Math.round((liveDiscount / grossTotal) * 10000) / 100 : 0;
  const savedDiscount = Number(order.discountAmount);
  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const productNames = order.items.map((i) => i.product.name).join(", ") || "—";
  const primaryImage =
    order.items.find((i) => i.product.imageUrl)?.product.imageUrl ?? null;

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

  function handleAction(action: () => Promise<void>, successMsg?: string) {
    startTransition(async () => {
      try {
        await action();
        if (successMsg) toast.success(successMsg);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  function handleAddProducts() {
    handleAction(async () => {
      const items = productRows
        .filter((r) => r.productId)
        .map((r) => ({ productId: r.productId, quantity: parseInt(r.qty) || 1 }));
      await adminAddOrderItemsAction(order.id, items);
      const added = productRows
        .filter((r) => r.productId)
        .reduce((sum, r) => {
          const price = Number(products.find((p) => p.id === r.productId)?.sellingPrice ?? 0);
          return sum + price * (parseInt(r.qty) || 1);
        }, 0);
      setPriceInput(String(Number(priceInput) + added));
      setIsAddProductOpen(false);
    }, "Products added to order");
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
        {order.isReorder && (
          <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-bold">
            Reorder
          </span>
        )}
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
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-6 rounded-2xl flex justify-between items-center border ${
                      item.isUpsell
                        ? "bg-purple-50 border-purple-200"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div>
                      <p className="text-[0.7rem] font-bold uppercase mb-1 flex items-center gap-2">
                        <span className="text-slate-400">
                          {item.isUpsell ? "Upsold Product" : "Product(s)"}
                        </span>
                        {item.isUpsell && (
                          <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-[0.6rem] tracking-wide">
                            UPSELL
                          </span>
                        )}
                      </p>
                      <p className="text-xl font-bold text-slate-700">
                        {item.product.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[0.7rem] font-bold text-slate-400 uppercase mb-1">
                          Quantity
                        </p>
                        <p className="text-2xl font-bold text-slate-700">
                          {item.quantity}
                        </p>
                      </div>
                      {order.status === "PENDING" && order.items.length > 1 && (
                        <button
                          type="button"
                          disabled={isPending}
                          title="Remove product"
                          onClick={() => {
                            if (confirm(`Remove ${item.product.name} from this order?`)) {
                              handleAction(
                                () => adminRemoveOrderItemAction(order.id, item.id),
                                "Product removed",
                              );
                            }
                          }}
                          className="shrink-0 p-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-50 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
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
          <div className="relative h-[240px] rounded-[2rem] overflow-hidden group bg-slate-100">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={productNames}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-5xl">
                📦
              </div>
            )}
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

            {/* Pricing & negotiated discount */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Original Total</span>
                <span className={`text-sm font-bold ${savedDiscount > 0 ? "text-slate-400 line-through" : "text-slate-800"}`}>
                  {fmtNaira(grossTotal)}
                </span>
              </div>

              {canDiscount ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">Negotiated Price</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-slate-400 font-bold">₦</span>
                      <input
                        type="number"
                        min="0"
                        max={grossTotal}
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        className="w-36 text-right text-lg font-bold text-slate-800 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Reason for discount (optional)"
                    className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-purple-400 placeholder:text-slate-300"
                  />

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wide">Discount</span>
                    <span className={`font-bold ${liveDiscount > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {liveDiscount > 0 ? `${fmtNaira(liveDiscount)} (${liveDiscountPct}%)` : "—"}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isPending || negotiatedPrice > grossTotal || priceInput === ""}
                    onClick={() =>
                      handleAction(
                        async () => {
                          await adminApplyOrderDiscountAction(order.id, negotiatedPrice, discountReason);
                        },
                        liveDiscount > 0 ? "Discount applied" : "Price updated"
                      )
                    }
                    className="w-full bg-purple-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                  >
                    {isPending ? "Saving…" : liveDiscount > 0 ? "Apply Discount" : "Save Price"}
                  </button>
                </>
              ) : (
                savedDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wide">Discount</span>
                    <span className="font-bold text-emerald-600">
                      {fmtNaira(savedDiscount)} ({Number(order.discountPercent)}%)
                    </span>
                  </div>
                )
              )}

              <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                <span className="text-lg font-bold text-slate-700">
                  {canDiscount ? "Net Total" : "Total Price"}
                </span>
                <span className="text-xl font-bold text-slate-800">{formattedTotal}</span>
              </div>

              {savedDiscount > 0 && order.discountedByName && (
                <p className="text-[11px] text-slate-400">
                  Discount by <span className="font-bold text-slate-600">{order.discountedByName}</span>
                  {order.discountReason ? ` · ${order.discountReason}` : ""}
                  {order.discountedAt ? ` · ${new Date(order.discountedAt).toLocaleDateString("en-NG")}` : ""}
                </p>
              )}
            </div>

            {order.status !== "PENDING" && order.agent && (
              <>
                {(order.status === "CONFIRMED" || order.status === "DELIVERED") && (
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
                )}

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

                <button
                  onClick={() => setIsAgentDrawerOpen(true)}
                  className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold py-3 rounded-xl border border-purple-100 text-sm transition-colors"
                >
                  View Agent Info
                </button>
                {(order.status === "CONFIRMED" || order.status === "FAILED") && (
                  <button
                    onClick={() => { setSelectedAgentId(order.agent?.id ?? ""); setIsReassignOpen(true); }}
                    className="w-full bg-purple-100 border border-purple-200 py-3 rounded-xl text-purple-600 font-bold text-sm hover:bg-purple-50 transition-colors"
                  >
                    Reassign Agent
                  </button>
                )}
              </>
            )}

            {order.status === "FAILED" && !order.agent && (
              <button
                onClick={() => { setSelectedAgentId(""); setIsReassignOpen(true); }}
                className="w-full bg-purple-100 border border-purple-200 py-3 rounded-xl text-purple-600 font-bold text-sm hover:bg-purple-50 transition-colors"
              >
                Assign Agent
              </button>
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

            {order.status === "CONFIRMED" && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  disabled={isPending}
                  onClick={() => handleAction(() => adminFailOrderAction(order.id), "Order marked as failed")}
                  className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-red-600 font-bold text-sm hover:bg-red-100 transition disabled:opacity-50"
                >
                  ✕ Fail
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleAction(() => adminDeliverOrderAction(order.id), "Order marked as delivered")}
                  className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  ✓ Delivered
                </button>
              </div>
            )}

            <div className="mt-4">
              <div className="bg-slate-200 p-3 rounded-t-xl text-[0.8rem] font-bold text-slate-500 uppercase">
                {order.status === "PENDING" || order.status === "CONFIRMED"
                  ? "Set Prescription"
                  : "Prescription"}
              </div>
              <div className="bg-white p-4 rounded-b-xl border border-t-0 border-slate-200 shadow-sm">
                {order.status === "PENDING" || order.status === "CONFIRMED" ? (
                  <>
                    <textarea
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      placeholder="Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days."
                      className="w-full min-h-20 text-[0.85rem] text-slate-600 leading-relaxed outline-none resize-none bg-transparent border border-slate-200 rounded-lg px-3 py-2 focus:border-purple-400"
                    />
                    <button
                      disabled={isPending}
                      onClick={() =>
                        handleAction(
                          () => adminUpdateOrderNotesAction(order.id, prescription),
                          "Notes saved"
                        )
                      }
                      className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      Save Prescription
                    </button>
                  </>
                ) : order.notes ? (
                  <p className="text-[0.85rem] text-slate-600 leading-relaxed">{order.notes}</p>
                ) : (
                  <p className="text-[0.85rem] text-slate-400 italic">No prescription set.</p>
                )}
              </div>
            </div>

            {/* Order confirmation card (rendered last) */}
            {order.status === "PENDING" && (
              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={isPending}
                    onClick={() => handleAction(() => adminCancelOrderAction(order.id), "Order cancelled")}
                    className="bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl text-rose-600 font-bold text-sm hover:bg-rose-100 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => {
                      if (!deliveryDate) {
                        toast.warning("Please select a delivery date before confirming.");
                        return;
                      }
                      handleAction(
                        () => adminConfirmOrderAction(order.id, deliveryDate),
                        "Order confirmed successfully"
                      );
                    }}
                    className="bg-purple-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    Confirm →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Info Drawer */}
      {order.agent && (
        <AgentInfoDrawer
          agent={order.agent}
          isOpen={isAgentDrawerOpen}
          onClose={() => setIsAgentDrawerOpen(false)}
        />
      )}

      {/* Reassign Agent Modal */}
      {isReassignOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsReassignOpen(false)}
          />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[500px] p-10 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-800">Reassign Agent</h2>
              <button
                onClick={() => setIsReassignOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-6">
              Select a new delivery agent for this order.
              {order.status === "FAILED" && (
                <span className="block mt-1 text-purple-600 font-medium">
                  The order status will be reset to Confirmed.
                </span>
              )}
            </p>

            <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1 mb-8">
              {agents.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No active agents available.</p>
              )}
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedAgentId === agent.id
                      ? "border-purple-600 bg-purple-50"
                      : "border-slate-100 bg-slate-50 hover:border-purple-200"
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{agent.companyName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{agent.state ?? "—"} · {agent.phone}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-slate-500">{agent.activeOrders} active orders</p>
                    <p className="text-xs text-slate-400">{agent.totalDeliveries} deliveries</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              disabled={isPending || !selectedAgentId}
              onClick={() =>
                handleAction(async () => {
                  await adminReassignOrderAgentAction(order.id, selectedAgentId);
                  setIsReassignOpen(false);
                }, "Agent reassigned successfully")
              }
              className="w-full bg-purple-600 text-white py-4 rounded-2xl text-[1rem] font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Confirm Reassignment →
            </button>
          </div>
        </div>
      )}

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
              {productRows.map((row) => {
                const selectedProduct = products.find((p) => p.id === row.productId);
                return (
                  <div key={row.id} className="flex gap-3 items-center group">
                    <div className="flex-1 bg-slate-50 rounded-2xl p-4 flex flex-col gap-3 border border-slate-100">
                      <select
                        value={row.productId}
                        onChange={(e) => updateRow(row.id, "productId", e.target.value)}
                        className="w-full h-[48px] bg-white border border-slate-200 rounded-xl px-4 text-sm font-semibold text-slate-800 outline-none focus:border-purple-400 cursor-pointer"
                      >
                        <option value="" disabled>Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ₦{Number(p.sellingPrice).toLocaleString("en-NG")}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-800 truncate">
                            {selectedProduct?.name ?? "—"}
                          </span>
                          <span className="text-xs text-purple-600 font-semibold">
                            ₦{selectedProduct ? Number(selectedProduct.sellingPrice).toLocaleString("en-NG") : "0"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-white rounded-xl h-[44px] px-2 shadow-sm border border-slate-100 shrink-0 w-[130px]">
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
                );
              })}
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
