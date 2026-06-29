"use client";

import React, { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, RotateCcw } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";
import { AgentInfoDrawer } from "@/components/ui/agent-info-drawer";
import {
  confirmOrderAction,
  cancelOrderAction,
  failOrderAction,
  deliverOrderAction,
  addOrderItemsAction,
  removeOrderItemAction,
  updateOrderNotesAction,
  applyOrderDiscountAction,
  reassignOrderAgentAction,
  setOrderContactMethodAction,
  reviveOrderAction,
} from "@/modules/orders/actions/orders.action";

// Serialized types (Decimals as strings, Dates as ISO strings)
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
  contactMethod: "PHONE" | "WHATSAPP" | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
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
    failureReason: string | null;
    createdAt: string;
    updatedAt: string;
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

interface OrderDetailClientProps {
  order: SerializedOrder;
  products: ProductOption[];
  agents: AgentOption[];
}

// Each step is coloured by the stage it represents (not a generic active/done
// state): pending stays orange, confirmed is a lighter green, delivered a
// thicker green. A node only lights up once that stage has been `reached`.
type StepTone = "pending" | "confirmed" | "delivered" | "cancelled" | "failed" | "idle";

const STEP_TONE_BG: Record<StepTone, string> = {
  pending: "bg-[#FFA600]", // pending → orange
  confirmed: "bg-green-400", // confirmed → lighter green
  delivered: "bg-green-600", // delivered → thicker green
  cancelled: "bg-red-500",
  failed: "bg-red-600",
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
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${bg} ${text} flex items-center justify-center font-bold text-base sm:text-lg shrink-0`}
      >
        {done ? "✓" : number}
      </div>
      <span className="text-[10px] sm:text-xs text-gray-500 font-medium text-center w-20 sm:w-24 break-words">
        {label}
      </span>
    </div>
  );
}

type Step = {
  number: number;
  label: string;
  tone: StepTone;
  reached: boolean;
  done: boolean;
};

function getSteps(status: OrderStatus): Step[] {
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
        { number: 2, label: "Order Cancelled", tone: "cancelled", reached: true, done: false },
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

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return { bg: "bg-[#FFA600]", label: "Pending Order" };
    case "CONFIRMED":
      return { bg: "bg-green-500", label: "Confirmed Order" };
    case "DELIVERED":
      return { bg: "bg-green-500", label: "Delivered Order" };
    case "CANCELLED":
      return { bg: "bg-red-500", label: "Cancelled Order" };
    case "FAILED":
      return { bg: "bg-red-600", label: "Failed Order" };
  }
}

function FieldRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="relative group mb-1">
      <label className="text-xs text-gray-400 font-semibold">{label}</label>
      <div className="flex items-center gap-2 mt-0.5 mb-1">
        <p className="text-sm text-gray-900 font-bold">{value}</p>
        {copyable && (
          <button
            onClick={handleCopy}
            type="button"
            className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
            title={`Copy ${label}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        )}
      </div>
      <div
        className="h-[2px] w-full mt-2 mb-3"
        style={{
          backgroundImage: "linear-gradient(to right, #D1D5DB 45%, rgba(255,255,255,0) 0%)",
          backgroundPosition: "bottom",
          backgroundSize: "14px 2px",
          backgroundRepeat: "repeat-x",
        }}
      />
    </div>
  );
}

// Common reasons a pending order gets cancelled; the rep can also enter a custom one.
const CANCEL_REASONS = [
  "Customer changed their mind",
  "Unable to reach customer",
  "Duplicate order",
  "Product out of stock",
];

// Common reasons a delivery fails; the rep can also enter a custom one.
const FAIL_REASONS = [
  "Customer unavailable at delivery",
  "Customer refused the order",
  "Incorrect / incomplete address",
  "Could not reach customer",
];

export function OrderDetailClient({ order, products, agents }: OrderDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(""); // a preset reason, or ""
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [isFailOpen, setIsFailOpen] = useState(false);
  const [failReason, setFailReason] = useState(""); // a preset reason, or ""
  const [customFailReason, setCustomFailReason] = useState("");
  const [prescription, setPrescription] = useState(order.notes ?? "");
  const [contactMethod, setContactMethod] = useState<"PHONE" | "WHATSAPP" | null>(order.contactMethod);
  const [deliveryDate, setDeliveryDate] = useState("");
  // Negotiated final price (for goods, excluding delivery fee). Defaults to the
  // current net so re-opening the editor shows the price already agreed.
  const [priceInput, setPriceInput] = useState(order.netAmount);
  const [discountReason, setDiscountReason] = useState(order.discountReason ?? "");
  // Monotonic id source for product rows — avoids calling Date.now() during render.
  const rowIdRef = useRef(1);
  const [productRows, setProductRows] = useState(() => [
    { id: 0, productId: products[0]?.id ?? "", qty: "1" },
  ]);

  const steps = getSteps(order.status);
  const badge = getStatusBadge(order.status);

  const delivery = order.deliveries[0] ?? null;
  const formattedDeliveryFee =
    Number(order.deliveryFee) > 0
      ? `₦${Number(order.deliveryFee).toLocaleString("en-NG")}`
      : null;
  // Authoritative gross = sum of line totals
  const grossTotal = order.items.reduce((s, i) => s + Number(i.lineTotal), 0);
  const fmtNaira = (n: number) => `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
  const formattedTotal = fmtNaira(Number(order.netAmount));
  const canDiscount = order.status === "PENDING" || order.status === "CONFIRMED";
  const negotiatedPrice = parseFloat(priceInput) || 0;
  const liveDiscount = Math.max(0, Math.round((grossTotal - negotiatedPrice) * 100) / 100);
  const liveDiscountPct = grossTotal > 0 ? Math.round((liveDiscount / grossTotal) * 10000) / 100 : 0;
  const savedDiscount = Number(order.discountAmount);
  const primaryImage =
    order.items.find((i) => i.product.imageUrl)?.product.imageUrl ?? null;
  const productNames =
    order.items.map((i) => i.product.name).join(", ") || "No products";
  const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);
  const deliveredDate = delivery?.deliveredTime
    ? new Date(delivery.deliveredTime).toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  // Order history built from real timestamps (no hardcoded dates).
  const fmtHistory = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-CA"), // YYYY-MM-DD
      time: d.toLocaleTimeString("en-GB"), // HH:MM:SS
    };
  };
  const historyEvents: Array<{ label: string; sub?: string; date: string; time: string }> = [
    { label: "Order Created", ...fmtHistory(order.createdAt) },
    { label: "Sales Rep Assigned", sub: order.salesRep.name, ...fmtHistory(order.createdAt) },
    ...(order.status !== "PENDING" && order.status !== "CANCELLED"
      ? [{ label: "Order Confirmed", ...fmtHistory(delivery?.createdAt ?? order.updatedAt) }]
      : []),
    ...(order.status !== "PENDING" && delivery
      ? [{ label: "Prescription Sent", ...fmtHistory(delivery.createdAt) }]
      : []),
    ...(order.status === "DELIVERED" && delivery?.deliveredTime
      ? [{ label: "Order Delivered", ...fmtHistory(delivery.deliveredTime) }]
      : []),
    ...(order.status === "FAILED" && delivery
      ? [{ label: "Order Failed", ...fmtHistory(delivery.updatedAt) }]
      : []),
    ...(order.status === "CANCELLED"
      ? [{ label: "Order Cancelled", ...fmtHistory(order.updatedAt) }]
      : []),
  ];

  function addRow() {
    setProductRows([
      ...productRows,
      { id: rowIdRef.current++, productId: products[0]?.id ?? "", qty: "1" },
    ]);
  }

  function removeRow(id: number) {
    if (productRows.length > 1)
      setProductRows(productRows.filter((r) => r.id !== id));
  }

  function updateRow(id: number, field: "productId" | "qty", value: string) {
    setProductRows(
      productRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }

  function adjustQty(id: number, delta: number) {
    setProductRows(
      productRows.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          qty: String(Math.max(1, parseInt(r.qty || "1") + delta)),
        };
      }),
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
        .map((r) => ({
          productId: r.productId,
          quantity: parseInt(r.qty) || 1,
        }));
      await addOrderItemsAction(order.id, items);
      // Added items increase both gross and net by the same amount, so bump the
      // negotiated-price input to keep any existing discount intact.
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

  function handleContactMethod(method: "PHONE" | "WHATSAPP") {
    const prev = contactMethod;
    setContactMethod(method); // optimistic
    startTransition(async () => {
      try {
        await setOrderContactMethodAction(order.id, method);
      } catch (err) {
        setContactMethod(prev);
        toast.error(err instanceof Error ? err.message : "Failed to update contact method");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar: Back Button & Chat */}
      <div className="flex items-center justify-between -mt-4 sm:-mt-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-sm font-medium w-fit transition shadow-sm"
        >
          ← Back to Orders
        </button>
        <button className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[#FAF5FF] flex items-center justify-center text-[#9333EA] hover:bg-[#F3E8FF] transition shadow-sm border border-purple-50 shrink-0">
          <svg className="w-5 h-5 fill-current text-[#A855F7]" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 2.08.64 4.01 1.74 5.61L3 21l3.52-.72C8.07 21.44 9.97 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-4 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
          </svg>
        </button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-all">
            Order ID: {order.orderNumber}
          </h2>
          <span
            className={`${badge.bg} text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap`}
          >
            {badge.label}
          </span>
          {order.isReorder && (
            <span className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap">
              Reorder
            </span>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl border border-gray-100 flex flex-row items-start justify-between sm:justify-start gap-2 sm:gap-4 overflow-x-auto">
        {steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            <StepIndicator {...step} />
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-5 sm:mt-6 min-w-[20px] ${step.done ? "bg-green-500" : "bg-gray-200"}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Order Details */}
        <div className="lg:col-span-3 bg-white rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 bg-gray-100 px-5 py-3 rounded-xl mb-6">
            Order Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <FieldRow label="Full Name" value={order.customer.name} />
            <FieldRow label="Phone Number" value={order.customer.phone} copyable={true} />
            <FieldRow
              label="WhatsApp number"
              value={order.customer.whatsappNumber ?? order.customer.phone}
              copyable={true}
            />
            <FieldRow label="Email" value={order.customer.email ?? "—"} />
            <div className="sm:col-span-2">
              <FieldRow
                label="Full delivery address"
                value={order.customer.deliveryAddress}
              />
            </div>
            <FieldRow label="State" value={order.customer.state} />
            <FieldRow label="LGA" value={order.customer.lga} />
            <div className="sm:col-span-2">
              <FieldRow
                label="Landmark"
                value={order.customer.landmark ?? "—"}
              />
            </div>
          </div>

          {/* Products card */}
          <div className="mt-4 flex flex-col gap-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl flex justify-between items-center bg-[#F3F4F6] border border-gray-100"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full items-start sm:items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-1">Product(s)</p>
                    <p className="text-base sm:text-[1.1rem] font-bold text-gray-800 break-all">{item.product.name}</p>
                  </div>
                  <div className="text-left sm:text-center">
                    <p className="text-xs text-gray-400 font-semibold mb-1">Quantity</p>
                    <p className="text-base sm:text-[1.1rem] font-bold text-gray-800">{item.quantity}</p>
                  </div>
                  <div className="text-left sm:text-right flex items-center gap-2 sm:justify-end">
                    {order.status === "PENDING" && order.items.length > 1 && (
                      <button
                        type="button"
                        disabled={isPending}
                        title="Remove product"
                        onClick={() => {
                          if (confirm(`Remove ${item.product.name} from this order?`)) {
                            handleAction(
                              () => removeOrderItemAction(order.id, item.id),
                              "Product removed",
                            );
                          }
                        }}
                        className="shrink-0 p-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {order.status === "PENDING" && (
            <button
              onClick={() => setIsAddProductOpen(true)}
              type="button"
              className="w-full mt-4 border-2 border-[#A855F7] text-[#A855F7] hover:bg-[#FAF5FF] px-4 py-3.5 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 fill-current text-[#A855F7]" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Add Product
            </button>
          )}

          {/* Order History */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">
              Order History
            </h4>
            <div className="flex flex-col gap-3">
              {historyEvents.map((event, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                      <span className="text-gray-500 font-semibold text-xs">{event.label}</span>
                      {event.sub && (
                        <span className="text-gray-800 font-bold text-xs">{event.sub}</span>
                      )}
                    </div>
                    <div className="flex-1 border-b border-dotted border-gray-300 mx-2 mb-1" />
                    <span className="text-gray-400 font-semibold text-xs">{event.date}</span>
                  </div>
                  <div className="text-right text-[10px] text-gray-300 font-semibold mr-[2px]">{event.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Product & Actions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Product image */}
          <div className="relative h-[220px] rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 group">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={productNames}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-5xl text-gray-400 bg-gray-50">
                📦
              </div>
            )}
            <div className="absolute bottom-4 right-4 bg-black/85 text-white px-4 py-2 rounded-xl text-xs font-bold z-10 shadow-md">
              {totalUnits} {productNames}
            </div>
          </div>

          {/* Price / Actions */}
          <div className="flex flex-col gap-3 px-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400 font-bold">
                Source:{" "}
                <strong className="text-gray-700 font-bold">
                  {order.customer.source ?? "WhatsApp"}
                </strong>
              </span>
            </div>
            {/* Pricing & negotiated discount */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col gap-3 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Original Total</span>
                <span className={`text-sm font-bold ${savedDiscount > 0 ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {fmtNaira(grossTotal)}
                </span>
              </div>

              {canDiscount ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-800">Negotiated Price</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-400">₦</span>
                      <input
                        type="number"
                        min="0"
                        max={grossTotal}
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        className="w-32 text-right text-base font-bold text-gray-900 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Reason for discount (optional)"
                    className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-400 placeholder:text-gray-300"
                  />

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-wide">Discount</span>
                    <span className={`font-bold ${liveDiscount > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                      {liveDiscount > 0 ? `${fmtNaira(liveDiscount)} (${liveDiscountPct}%)` : "—"}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isPending || negotiatedPrice > grossTotal || priceInput === ""}
                    onClick={() =>
                      handleAction(
                        async () => {
                          await applyOrderDiscountAction(order.id, negotiatedPrice, discountReason);
                        },
                        liveDiscount > 0 ? "Discount applied" : "Price updated"
                      )
                    }
                    className="w-full bg-[#A020F0] text-white text-sm font-bold py-2 rounded-lg hover:bg-[#8B1ED2] disabled:opacity-50 transition"
                  >
                    {isPending ? "Saving…" : liveDiscount > 0 ? "Apply Discount" : "Save Price"}
                  </button>
                </>
              ) : (
                savedDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-wide">Discount</span>
                    <span className="font-bold text-emerald-600">
                      {fmtNaira(savedDiscount)} ({Number(order.discountPercent)}%)
                    </span>
                  </div>
                )
              )}

              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <span className="text-base font-bold text-gray-800">
                  {canDiscount ? "Net Total" : "Total Price"}
                </span>
                <span className="text-lg font-black text-gray-900">{formattedTotal}</span>
              </div>

              {savedDiscount > 0 && order.discountedByName && (
                <p className="text-[11px] text-gray-400">
                  Discount by <span className="font-bold text-gray-600">{order.discountedByName}</span>
                  {order.discountReason ? ` · ${order.discountReason}` : ""}
                  {order.discountedAt ? ` · ${new Date(order.discountedAt).toLocaleDateString("en-NG")}` : ""}
                </p>
              )}
            </div>

            {order.status !== "PENDING" && order.agent && (
              <div className="bg-white rounded-xl p-5 border border-gray-100 flex flex-col gap-3">
                {(order.status === "CONFIRMED" || order.status === "DELIVERED") && formattedDeliveryFee && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        Estimated Delivery
                      </span>
                      <span className="font-semibold text-gray-900">
                        {delivery?.scheduledTime
                          ? new Date(delivery.scheduledTime).toLocaleDateString("en-NG")
                          : "24 hours"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Delivery Fee</span>
                      <span className="font-semibold text-gray-900">
                        {formattedDeliveryFee}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Agent Assigned</span>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {order.agent.companyName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {order.agent.state ?? ""}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsAgentDrawerOpen(true)}
                  type="button"
                  className="w-full bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-500 font-semibold text-sm hover:bg-gray-50 transition"
                >
                  View Agent Info
                </button>
                {(order.status === "CONFIRMED" || order.status === "FAILED") && (
                  <button
                    onClick={() => { setSelectedAgentId(order.agent?.id ?? ""); setIsReassignOpen(true); }}
                    type="button"
                    className="w-full bg-purple-100 border border-purple-200 px-4 py-2 rounded-lg text-purple-600 font-semibold text-sm hover:bg-purple-50 transition"
                  >
                    Reassign Agent
                  </button>
                )}
              </div>
            )}

            {order.status === "FAILED" && !order.agent && (
              <button
                onClick={() => { setSelectedAgentId(""); setIsReassignOpen(true); }}
                type="button"
                className="w-full bg-purple-100 border border-purple-200 px-4 py-2 rounded-lg text-purple-600 font-semibold text-sm hover:bg-purple-50 transition"
              >
                Assign Agent
              </button>
            )}

            {order.status === "DELIVERED" && deliveredDate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  ✓ Order delivered on {deliveredDate}
                </p>
              </div>
            )}

            {order.status === "FAILED" && delivery?.failureReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-[11px] uppercase font-bold text-red-400 mb-1">Reason for failed order</p>
                <p className="text-sm font-semibold text-red-700">{delivery.failureReason}</p>
              </div>
            )}

            {order.status === "CANCELLED" && order.cancellationReason && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-[11px] uppercase font-bold text-orange-400 mb-1">Reason for cancellation</p>
                <p className="text-sm font-semibold text-orange-700">{order.cancellationReason}</p>
              </div>
            )}
          </div>

          {/* Contact method */}
          <div className="mt-4 px-2">
            <p className="text-xs text-gray-400 font-bold mb-3">
              Customer has been reached out to on
            </p>
            <div className="flex gap-8">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name={`contact-${order.id}`}
                  value="phone"
                  checked={contactMethod === "PHONE"}
                  onChange={() => handleContactMethod("PHONE")}
                  disabled={isPending}
                  className="h-5 w-5 border-2 border-gray-300 rounded-full text-purple-600 focus:ring-purple-500 accent-purple-600 transition"
                />
                <span className="text-sm font-semibold text-gray-500 group-hover:text-gray-700">Phone Call</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name={`contact-${order.id}`}
                  value="whatsapp"
                  checked={contactMethod === "WHATSAPP"}
                  onChange={() => handleContactMethod("WHATSAPP")}
                  disabled={isPending}
                  className="h-5 w-5 border-2 border-[#A855F7] rounded-full text-purple-600 focus:ring-purple-500 accent-purple-600 transition"
                />
                <span className="text-sm font-semibold text-gray-500 group-hover:text-gray-700">WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Order confirmation card (rendered first when PENDING) */}
          {order.status === "PENDING" && (
            <div className="bg-[#FAF5FF] rounded-2xl p-5 border border-purple-100 flex flex-col gap-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-purple-400 font-bold">Set Delivery Date</span>
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className="relative mt-2">
                <span className="absolute left-3 top-0 translate-y-[-50%] bg-white px-1.5 text-[10px] font-bold text-[#A855F7] z-10">
                  Date
                </span>
                <input
                  type="date"
                  value={deliveryDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-[52px] bg-white border-2 border-[#A855F7] rounded-lg px-4 text-sm font-bold text-gray-700 outline-none focus:ring-0 focus:border-[#9333EA]"
                />
              </div>
              <div className="flex justify-end gap-6 mt-1 text-sm font-bold text-[#A855F7]">
                <button
                  onClick={() => setDeliveryDate("")}
                  type="button"
                  className="hover:text-[#9333EA] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!deliveryDate) {
                      toast.warning("Please select a delivery date first.");
                      return;
                    }
                    toast.success(`Selected delivery date: ${deliveryDate}`);
                  }}
                  type="button"
                  className="hover:text-[#9333EA] transition"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Prescription */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-4 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 bg-gray-50 px-5 py-3.5 border-b border-gray-200">
              Set Prescription
            </h4>
            <div className="p-4">
              {order.status === "PENDING" || order.status === "CONFIRMED" ? (
                <>
                  <textarea
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    placeholder="Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days."
                    className="w-full min-h-[96px] border-2 border-[#E9D5FF] focus:border-[#A855F7] rounded-xl px-4 py-3 text-xs font-semibold text-gray-500 resize-none outline-none transition"
                  />
                  {order.status === "CONFIRMED" && (
                    <button
                      disabled={isPending}
                      onClick={() =>
                        handleAction(() => updateOrderNotesAction(order.id, prescription), "Notes saved")
                      }
                      type="button"
                      className="mt-3 w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      Save Prescription
                    </button>
                  )}
                </>
              ) : order.notes ? (
                <p className="text-xs text-gray-600 leading-relaxed p-1">{order.notes}</p>
              ) : (
                <p className="text-xs text-gray-400 italic p-1">No prescription set.</p>
              )}
            </div>
          </div>

          {/* Bottom Action buttons */}
          {order.status === "PENDING" && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                disabled={isPending}
                onClick={() => {
                  setCancelReason("");
                  setCustomCancelReason("");
                  setIsCancelOpen(true);
                }}
                type="button"
                className="bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-purple-200 text-[#A855F7] py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4 text-[#A855F7] fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
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
                    () => confirmOrderAction(order.id, prescription, deliveryDate),
                    "Order confirmed successfully"
                  );
                }}
                type="button"
                className="bg-[#A855F7] hover:bg-[#9333EA] text-white py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-purple-100"
              >
                Confirm <span className="text-lg">→</span>
              </button>
            </div>
          )}

          {/* Confirm/Fail buttons for confirmed orders */}
          {order.status === "CONFIRMED" && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                disabled={isPending}
                onClick={() => {
                  setFailReason("");
                  setCustomFailReason("");
                  setIsFailOpen(true);
                }}
                type="button"
                className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg text-red-500 font-semibold text-sm hover:bg-red-100 transition disabled:opacity-50"
              >
                ✕ Fail
              </button>
              <button
                disabled={isPending}
                onClick={() => handleAction(() => deliverOrderAction(order.id), "Order marked as delivered")}
                type="button"
                className="bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-50"
              >
                ✓ Delivered
              </button>
            </div>
          )}

          {/* Revive button for cancelled / failed orders */}
          {(order.status === "CANCELLED" || order.status === "FAILED") && (
            <button
              disabled={isPending}
              onClick={() =>
                handleAction(
                  () => reviveOrderAction(order.id),
                  order.status === "FAILED"
                    ? "Order revived — back to confirmed"
                    : "Order revived — it is now pending again",
                )
              }
              type="button"
              className="w-full mt-4 bg-[#A855F7] hover:bg-[#9333EA] text-white py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-purple-100"
            >
              <RotateCcw className="w-4 h-4" />
              Revive Order
            </button>
          )}
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

      {/* Cancel Order Modal */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsCancelOpen(false)}
          />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[500px] p-10 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800">Cancel Order</h2>
              <button
                onClick={() => setIsCancelOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Select a reason for cancelling this order, or enter your own.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {CANCEL_REASONS.map((reason) => {
                const selected = cancelReason === reason && !customCancelReason.trim();
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setCancelReason(reason);
                      setCustomCancelReason("");
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left text-sm font-bold transition-all ${
                      selected
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-slate-100 bg-slate-50 text-slate-700 hover:border-purple-200"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                        selected ? "border-purple-600 bg-purple-600" : "border-slate-300"
                      }`}
                    />
                    {reason}
                  </button>
                );
              })}
            </div>

            <div className="mb-8">
              <label className="text-xs text-gray-400 font-bold mb-2 block">
                Other reason (optional)
              </label>
              <textarea
                value={customCancelReason}
                onChange={(e) => {
                  setCustomCancelReason(e.target.value);
                  if (e.target.value.trim()) setCancelReason("");
                }}
                placeholder="Enter a custom reason…"
                className="w-full min-h-[80px] border-2 border-[#E9D5FF] focus:border-[#A855F7] rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 resize-none outline-none transition"
              />
            </div>

            {(() => {
              const effectiveReason = customCancelReason.trim() || cancelReason;
              return (
                <button
                  disabled={isPending || !effectiveReason}
                  onClick={() =>
                    handleAction(async () => {
                      await cancelOrderAction(order.id, effectiveReason);
                      setIsCancelOpen(false);
                    }, "Order cancelled")
                  }
                  type="button"
                  className="w-full bg-rose-600 text-white py-4 rounded-2xl text-[1rem] font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Confirm Cancellation
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* Fail Order Modal */}
      {isFailOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsFailOpen(false)}
          />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[500px] p-10 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800">Mark as Failed</h2>
              <button
                onClick={() => setIsFailOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Select a reason this delivery failed, or enter your own.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {FAIL_REASONS.map((reason) => {
                const selected = failReason === reason && !customFailReason.trim();
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setFailReason(reason);
                      setCustomFailReason("");
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left text-sm font-bold transition-all ${
                      selected
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-slate-100 bg-slate-50 text-slate-700 hover:border-rose-200"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                        selected ? "border-rose-500 bg-rose-500" : "border-slate-300"
                      }`}
                    />
                    {reason}
                  </button>
                );
              })}
            </div>

            <div className="mb-8">
              <label className="text-xs text-gray-400 font-bold mb-2 block">
                Other reason (optional)
              </label>
              <textarea
                value={customFailReason}
                onChange={(e) => {
                  setCustomFailReason(e.target.value);
                  if (e.target.value.trim()) setFailReason("");
                }}
                placeholder="Enter a custom reason…"
                className="w-full min-h-[80px] border-2 border-rose-200 focus:border-rose-500 rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 resize-none outline-none transition"
              />
            </div>

            {(() => {
              const effectiveReason = customFailReason.trim() || failReason;
              return (
                <button
                  disabled={isPending || !effectiveReason}
                  onClick={() =>
                    handleAction(async () => {
                      await failOrderAction(order.id, effectiveReason);
                      setIsFailOpen(false);
                    }, "Order marked as failed")
                  }
                  type="button"
                  className="w-full bg-rose-600 text-white py-4 rounded-2xl text-[1rem] font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Confirm Failure
                </button>
              );
            })()}
          </div>
        </div>
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

            <p className="text-sm text-gray-500 mb-6">
              Select a new delivery agent for this order.
              {order.status === "FAILED" && (
                <span className="block mt-1 text-purple-600 font-medium">
                  The order status will be reset to Confirmed.
                </span>
              )}
            </p>

            <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1 mb-8">
              {agents.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No active agents available.</p>
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
                  await reassignOrderAgentAction(order.id, selectedAgentId);
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
              <h2 className="text-2xl font-black text-slate-400">
                Add Product
              </h2>
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
                      {/* Product selector */}
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

                      {/* Name + price + qty row */}
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
