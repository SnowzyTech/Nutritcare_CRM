"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Bell,
  Copy,
  Calendar as CalendarIcon,
  XCircle,
  CheckCircle,
  ArrowLeft,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<"reschedule" | "fail" | "deliver" | null>(null);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());
  const [viewDate, setViewDate] = useState(new Date());

  // Unified Mock Data
  const orders = [
    { id: "1", name: "Adewale Johnson", email: "adewale.johnson.ng@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Rescheduled", phone: "08022390437", address: "8 Pipeline Road, Tanke Area, Ilorin, Kwara State", landmark: "Opposite University of Ilorin Main Gate", rep: "Blessing Ehijie", repPhone: "0803 547 2198", products: [{ name: "Prosxact", qty: 4, price: "N30,000" }], fee: "N3000" },
    { id: "2", name: "Tunde Adebayo", email: "tunde.adebayo89@gmail.com", product: "6 Prosxact", time: "Today 10:36", status: "Pending", phone: "08022390437", address: "45 Taiwo Road, Offa Garage Area, Ilorin, Kwara State", landmark: "Near Shoprite Ilorin (Kwara Mall), Fate Road", rep: "Blessing Ehijie", repPhone: "0803 547 2198", products: [{ name: "Prosxact", qty: 6, price: "N45,000" }], fee: "N4000" },
    { id: "13", name: "Daniel Okafor", email: "daniel.okafor23@gmail.com", product: "4 Neuro-Vive Balm", time: "Today 10:36", status: "Delivered", phone: "08022390437", address: "12 Unity Road, GRA, Ilorin, Kwara State, Nigeria", landmark: "Near Shoprite Ilorin", rep: "Blessing Ehijie", repPhone: "0803 547 2198", products: [{ name: "Neuro-Vive Balm", qty: 4 }, { name: "Shred Belly", qty: 4 }], fee: "N5000" },
    { id: "25", name: "Blessing Chukwu", email: "blessing.chukwu01@gmail.com", product: "3 Fonio-Mill", time: "Today 10:36", status: "Failed", phone: "08022390437", address: "45 Taiwo Road, Offa Garage Area, Ilorin, Kwara State", landmark: "Close to University of Ilorin Teaching Hospital (UITH)", rep: "Funmilayo Ogunleye", repPhone: "0803 547 2198", products: [{ name: "Prosxact", qty: 4 }], fee: "N3500" },
  ];

  const order = orders.find(o => o.id === id) || orders[0];

  const statusStyles = {
    Rescheduled: { badge: "Rescheduled Order", color: "bg-[#f59e0b]" },
    Pending: { badge: "Pending Order", color: "bg-[#f59e0b]" },
    Delivered: { badge: "Delivered Order", color: "bg-[#22c55e]" },
    Failed: { badge: "Failed Order", color: "bg-[#ef4444]" },
  };

  const currentStyle = statusStyles[order.status as keyof typeof statusStyles];

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 relative">
      {/* Modals Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            {activeModal === "fail" && (
              <div className="space-y-6">
                <h2 className="text-gray-500 font-medium text-lg">Reason for order failure</h2>
                <div className="space-y-3">
                  <ReasonChip label="Customer not available at point of delivery" active={failReason === "1"} onClick={() => setFailReason("1")} />
                  <ReasonChip label="Customer not available at point of delivery" active={failReason === "2"} onClick={() => setFailReason("2")} />
                  <ReasonChip label="Customer reject product" active={failReason === "3"} onClick={() => setFailReason("3")} />
                </div>
                <div className="relative">
                  <textarea
                    placeholder="type in other reason"
                    className="w-full h-32 border-2 border-[#ad1df4] rounded-2xl p-4 text-sm placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-3 pt-2">
                  <button className="w-full bg-[#ad1df4] text-white font-bold h-14 rounded-2xl hover:bg-[#8e14cc] transition-colors shadow-lg shadow-purple-100">
                    Fail
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
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
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
                  <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>
                <div className="bg-gray-50 rounded-3xl p-6 min-h-[300px] border border-gray-100">
                  {/* Interactive Calendar */}
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-between">
                      <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4 text-[#ad1df4]" />
                      </button>
                      <div className="text-xl font-bold text-[#ad1df4]">{months[currentMonth]} {currentYear}</div>
                      <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg transition-colors rotate-180">
                        <ArrowLeft className="w-4 h-4 text-[#ad1df4]" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-[10px] font-bold text-gray-300">
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: daysInMonth }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedDate(i + 1)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${selectedDate === i + 1 ? 'bg-[#ad1df4] text-white scale-110 shadow-md' : 'text-gray-600 hover:bg-white'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    alert(`Rescheduled to ${months[currentMonth]} ${selectedDate}, ${currentYear}`);
                    setActiveModal(null);
                  }}
                  className="w-full bg-[#ad1df4] text-white font-bold h-14 rounded-2xl hover:bg-[#8e14cc] transition-colors shadow-lg shadow-purple-100"
                >
                  Reschedule Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
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
          <button className="p-2 rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-3 w-1.5 h-1.5 bg-[#ad1df4] rounded-full"></span>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ml-1">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Desktop Header with Back */}
      <div className="hidden lg:flex items-center gap-4 mb-4">
        <Link href="/delivery-agents" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-bold transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </Link>
      </div>

      {/* Title & Status Badge */}
      <div className="flex items-center justify-between mt-4">
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-[#1e1e2d]">Order ID: 012994{order.id.padStart(3, '0')}</h1>
          <p className="text-xs text-gray-400 font-medium">{order.time}</p>
        </div>
        <div className={`${currentStyle.color} text-white px-4 py-1.5 rounded-lg text-[10px] font-bold`}>
          {currentStyle.badge}
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-50 p-6 space-y-8">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-b border-gray-50 pb-6">
          <InfoItem label="Full Name" value={order.name} />
          <InfoItem label="Phone Number" value={order.phone} hasCopy />
          <InfoItem
            label="Full Delivery Address"
            value={order.address}
            className="col-span-1"
          />
          <InfoItem label="LandMark" value={order.landmark} />
          <InfoItem label="Sales Rep" value={order.rep} />
          <InfoItem label="Sales Rep Number" value={order.repPhone} hasCopy />
        </div>

        {/* Product Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <span className="bg-gray-100 text-gray-400 text-[10px] px-3 py-1 rounded-lg font-bold uppercase">Order</span>
            <div className="flex-1 h-[1px] bg-gray-100"></div>
          </div>

          <div className="space-y-6">
            {order.products.map((p, i) => (
              <ProductRow
                key={i}
                image={p.name === "Prosxact" ? "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=100" : "https://images.unsplash.com/photo-1550572017-ed200f550547?auto=format&fit=crop&q=80&w=100"}
                name={p.name}
                qty={p.qty}
                price={p.price}
              />
            ))}
          </div>
        </div>

        {/* Delivery Fee Section */}
        <div className="pt-2">
          {order.fee ? (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-400">Delivery Fee</label>
              <span className="text-gray-700 font-bold text-base">{order.fee}</span>
            </div>
          ) : (order.status === "Pending" || order.status === "Rescheduled") && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Delivery Fee</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="N 0000"
                  className="w-full h-14 bg-white border border-gray-100 rounded-xl px-6 text-gray-500 font-bold"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#ad1df4] text-white text-[10px] font-bold px-4 py-2.5 rounded-lg hover:bg-[#8e14cc] transition-colors">
                  Set Fee
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (Only for active orders) */}
        {(order.status === "Pending" || order.status === "Rescheduled") && (
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
      className={`w-full text-left p-4 rounded-xl border-2 transition-all text-xs font-medium ${active ? 'border-[#ad1df4] bg-purple-50 text-[#ad1df4]' : 'border-gray-100 text-gray-400'}`}
    >
      {label}
    </button>
  );
}

function InfoItem({ label, value, hasCopy, className }: { label: string; value: string; hasCopy?: boolean; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-gray-700 leading-tight">{value}</h2>
        {hasCopy && <Copy className="w-3.5 h-3.5 text-gray-300 cursor-pointer hover:text-gray-500" />}
      </div>
    </div>
  );
}

function ProductRow({ image, name, qty, price }: { image: string; name: string; qty: number; price?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden border border-gray-100">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
        <h3 className="font-bold text-gray-700 text-base">{name}</h3>
      </div>
      <div className="text-right">
        <p className="text-gray-400 text-sm font-medium">Quantity: <span className="text-gray-700 font-black">{qty}</span></p>
        {price && <p className="text-gray-400 text-xs font-medium">Price:{price}</p>}
      </div>
    </div>
  );
}
