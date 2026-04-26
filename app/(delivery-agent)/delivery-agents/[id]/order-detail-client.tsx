"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Settings,
  Bell,
  Copy,
  Calendar as CalendarIcon,
  XCircle,
  CheckCircle,
  ArrowLeft,
  X,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  markOrderFailedAction,
  rescheduleOrderAction,
  updateDeliveryFeeAction,
} from "@/modules/delivery/actions/delivery-agent-portal.action";

type OrderStatus = "PENDING" | "CONFIRMED" | "DELIVERED" | "FAILED" | "CANCELLED";

interface OrderItem {
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: Date;
  deliveryFee: number;
  netAmount: number;
  notes: string | null;
  failureReason: string | null;
  customer: {
    name: string;
    phone: string;
    email: string | null;
    deliveryAddress: string;
    landmark: string | null;
  };
  salesRep: { name: string; phone: string | null };
  items: OrderItem[];
}

interface Props {
  order: Order;
  user: { name?: string | null; image?: string | null } | undefined;
}

const failureReasons = [
  "Customer not available at point of delivery",
  "Customer rejected product",
  "Wrong delivery address",
  "Other",
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const statusStyles: Record<string, { badge: string; color: string }> = {
  PENDING:   { badge: "Pending Order",   color: "bg-[#f59e0b]" },
  CONFIRMED: { badge: "Confirmed Order", color: "bg-[#f59e0b]" },
  DELIVERED: { badge: "Delivered Order", color: "bg-[#22c55e]" },
  FAILED:    { badge: "Failed Order",    color: "bg-[#ef4444]" },
  CANCELLED: { badge: "Cancelled Order", color: "bg-[#ef4444]" },
};

export function OrderDetailClient({ order, user }: Props) {
  const [activeModal, setActiveModal] = useState<"reschedule" | "fail" | "deliver" | null>(null);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());
  const [viewDate, setViewDate] = useState(new Date());
  const [verifyCode, setVerifyCode] = useState<string[]>(Array(6).fill(""));
  const [feeInput, setFeeInput] = useState(order.deliveryFee > 0 ? String(order.deliveryFee) : "");
  const [feeSaved, setFeeSaved] = useState(order.deliveryFee > 0);
  const [isPending, startTransition] = useTransition();

  const currentStyle = statusStyles[order.status] ?? statusStyles.PENDING;
  const isActive = order.status === "PENDING" || order.status === "CONFIRMED";

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const avatarUrl = user?.name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f3e8ff&color=ad1df4`
    : "https://ui-avatars.com/api/?name=Agent&background=f3e8ff&color=ad1df4";

  function handleVerifyInput(idx: number, val: string) {
    const next = [...verifyCode];
    next[idx] = val.slice(-1);
    setVerifyCode(next);
    if (val && idx < 5) {
      document.getElementById(`verify-${idx + 1}`)?.focus();
    }
  }

  function handleFail() {
    const reason = failReason === "Other" ? customReason : (failReason ?? "No reason provided");
    startTransition(async () => {
      await markOrderFailedAction(order.id, reason);
      setActiveModal(null);
    });
  }

  function handleReschedule() {
    if (!selectedDate) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
    startTransition(async () => {
      await rescheduleOrderAction(order.id, dateStr);
      setActiveModal(null);
    });
  }

  function handleSetFee() {
    const fee = parseFloat(feeInput.replace(/[^0-9.]/g, ""));
    if (isNaN(fee) || fee < 0) return;
    startTransition(async () => {
      const result = await updateDeliveryFeeAction(order.id, fee);
      if (!result.error) setFeeSaved(true);
    });
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 relative">
      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">

            {activeModal === "fail" && (
              <div className="space-y-6">
                <h2 className="text-gray-500 font-medium text-lg">Reason for order failure</h2>
                <div className="space-y-3">
                  {failureReasons.map((r) => (
                    <ReasonChip key={r} label={r} active={failReason === r} onClick={() => setFailReason(r)} />
                  ))}
                </div>
                {failReason === "Other" && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Type your reason here"
                    className="w-full h-28 border-2 border-[#ad1df4] rounded-2xl p-4 text-sm placeholder:text-gray-400 focus:outline-none"
                  />
                )}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleFail}
                    disabled={!failReason || isPending}
                    className="w-full bg-[#ad1df4] text-white font-bold h-14 rounded-2xl hover:bg-[#8e14cc] transition-colors shadow-lg shadow-purple-100 disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Fail"}
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full bg-white text-[#ad1df4] border-2 border-[#ad1df4] font-bold h-14 rounded-2xl hover:bg-purple-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {activeModal === "deliver" && (
              <div className="space-y-8 text-center py-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-[#1e1e2d]">Verification Code</h2>
                  <p className="text-sm text-gray-400">Enter the 6-digit code sent to customer</p>
                </div>
                <div className="flex justify-between gap-2 px-2">
                  {verifyCode.map((v, i) => (
                    <input
                      key={i}
                      id={`verify-${i}`}
                      type="text"
                      maxLength={1}
                      value={v}
                      onChange={(e) => handleVerifyInput(i, e.target.value)}
                      className="w-10 h-12 border-2 border-gray-100 rounded-xl text-center font-bold text-lg focus:border-[#ad1df4] focus:outline-none transition-colors"
                    />
                  ))}
                </div>
                <div className="space-y-3 pt-4">
                  <button className="w-full bg-[#ad1df4] text-white font-bold h-14 rounded-2xl hover:bg-[#8e14cc] transition-colors shadow-lg shadow-purple-100">
                    Verify & Deliver
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full text-gray-400 font-bold hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {activeModal === "reschedule" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-[#1e1e2d]">Select New Date</h2>
                  <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="bg-gray-50 rounded-3xl p-6 min-h-[300px] border border-gray-100">
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-[#ad1df4]" />
                      </button>
                      <div className="text-xl font-bold text-[#ad1df4]">
                        {months[currentMonth]} {currentYear}
                      </div>
                      <button
                        onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}
                        className="p-2 hover:bg-white rounded-lg transition-colors rotate-180"
                      >
                        <ArrowLeft className="w-4 h-4 text-[#ad1df4]" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-[10px] font-bold text-gray-300">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                        <span key={i}>{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: daysInMonth }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedDate(i + 1)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            selectedDate === i + 1
                              ? "bg-[#ad1df4] text-white scale-110 shadow-md"
                              : "text-gray-600 hover:bg-white"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReschedule}
                  disabled={isPending}
                  className="w-full bg-[#ad1df4] text-white font-bold h-14 rounded-2xl hover:bg-[#8e14cc] transition-colors shadow-lg shadow-purple-100 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Reschedule Order"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <Link href="/delivery-agents" className="p-2 -ml-2 text-gray-500">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <img src="/nuycle-logo.png" alt="Nuycle Logo" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ml-1">
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Desktop Back */}
      <div className="hidden lg:flex items-center gap-4 mb-4">
        <Link href="/delivery-agents" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-bold transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </Link>
      </div>

      {/* Title & Status */}
      <div className="flex items-center justify-between mt-4">
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-[#1e1e2d]">Order #{order.orderNumber}</h1>
          <p className="text-xs text-gray-400 font-medium">{formatDate(order.createdAt)}</p>
        </div>
        <div className={`${currentStyle.color} text-white px-4 py-1.5 rounded-lg text-[10px] font-bold`}>
          {currentStyle.badge}
        </div>
      </div>

      {/* Failure reason banner */}
      {order.status === "FAILED" && order.failureReason && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Failure Reason</p>
            <p className="text-sm font-medium text-red-600">{order.failureReason}</p>
          </div>
        </div>
      )}

      {/* Details Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-50 p-6 space-y-8">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-b border-gray-50 pb-6">
          <InfoItem label="Full Name" value={order.customer.name} />
          <InfoItem label="Phone Number" value={order.customer.phone} hasCopy />
          <InfoItem label="Full Delivery Address" value={order.customer.deliveryAddress} />
          <InfoItem label="Landmark" value={order.customer.landmark ?? "—"} />
          <InfoItem label="Sales Rep" value={order.salesRep.name} />
          <InfoItem label="Sales Rep Number" value={order.salesRep.phone ?? "—"} hasCopy />
        </div>

        {/* Products */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <span className="bg-gray-100 text-gray-400 text-[10px] px-3 py-1 rounded-lg font-bold uppercase">Order</span>
            <div className="flex-1 h-[1px] bg-gray-100" />
          </div>
          <div className="space-y-6">
            {order.items.map((item, i) => (
              <ProductRow
                key={i}
                name={item.product.name}
                qty={item.quantity}
                price={formatCurrency(item.unitPrice)}
              />
            ))}
          </div>
        </div>

        {/* Delivery Fee */}
        <div className="pt-2 space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Delivery Fee</p>
          {isActive ? (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
              <input
                type="number"
                min="0"
                value={feeInput}
                onChange={(e) => { setFeeInput(e.target.value); setFeeSaved(false); }}
                placeholder="0"
                className="w-full h-14 bg-white border border-gray-100 rounded-xl pl-8 pr-28 text-gray-700 font-bold focus:outline-none focus:border-[#ad1df4] transition-colors"
              />
              <button
                onClick={handleSetFee}
                disabled={isPending || !feeInput}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-white text-[10px] font-bold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 ${
                  feeSaved ? "bg-[#22c55e] hover:bg-green-600" : "bg-[#ad1df4] hover:bg-[#8e14cc]"
                }`}
              >
                {isPending ? "Saving…" : feeSaved ? "Saved ✓" : "Set Fee"}
              </button>
            </div>
          ) : (
            <p className="text-gray-700 font-bold text-base">
              {order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "Not set"}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {isActive && (
          <div className="space-y-3 pt-4">
            <button
              onClick={() => setActiveModal("reschedule")}
              className="w-full bg-[#faf5ff] text-[#ad1df4] font-bold h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#f3e8ff] transition-colors"
            >
              <CalendarIcon className="w-5 h-5" />
              Reschedule
            </button>
            <button
              onClick={() => setActiveModal("fail")}
              className="w-full bg-[#faf5ff] text-[#ad1df4] font-bold h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#f3e8ff] transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Fail
            </button>
            <button
              onClick={() => setActiveModal("deliver")}
              className="w-full bg-[#ad1df4] text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#8e14cc] transition-colors shadow-lg shadow-purple-100"
            >
              <CheckCircle className="w-5 h-5" />
              Delivered
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReasonChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all text-xs font-medium ${
        active ? "border-[#ad1df4] bg-purple-50 text-[#ad1df4]" : "border-gray-100 text-gray-400"
      }`}
    >
      {label}
    </button>
  );
}

function InfoItem({ label, value, hasCopy, className }: { label: string; value: string; hasCopy?: boolean; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-gray-700 leading-tight">{value}</h2>
        {hasCopy && (
          <button onClick={() => navigator.clipboard.writeText(value)}>
            <Copy className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}

function ProductRow({ name, qty, price }: { name: string; qty: number; price?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
          <span className="text-lg font-black text-gray-300">{name[0]}</span>
        </div>
        <h3 className="font-bold text-gray-700 text-base">{name}</h3>
      </div>
      <div className="text-right">
        <p className="text-gray-400 text-sm font-medium">Qty: <span className="text-gray-700 font-black">{qty}</span></p>
        {price && <p className="text-gray-400 text-xs font-medium">{price}</p>}
      </div>
    </div>
  );
}
