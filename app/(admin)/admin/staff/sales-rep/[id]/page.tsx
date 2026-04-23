'use client';

import React, { useState } from "react";
import { ChevronDown, ChevronRight, UserCircle, LayoutDashboard, X, AlertTriangle } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

const salesReps = [
  { id: 1, name: "Blessing Ehijie", role: "Sales Rep", team: "Team 2", phone: "091524472657", whatsapp: "091524472657", email: "blessingehijie@gmail.com", performance: 80, deliveryRate: 78 },
  { id: 2, name: "Chiamaka Okorie", role: "Sales Rep", team: "Team 1", phone: "07063814402", whatsapp: "07063814402", email: "chiamaka@gmail.com", performance: 87, deliveryRate: 82 },
];

export default function StaffDetailsPage({ params }: Props) {
  const { id } = React.use(params);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  const staffId = parseInt(id);
  const staff = salesReps.find(s => s.id === staffId) || salesReps[0];


  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      {/* ── Header ── */}
      <div className="flex justify-between items-baseline mb-8">
        <h1 className="text-2xl font-bold">{staff.name}’s Profile</h1>
        <span className="text-[0.95rem] text-slate-400">Sales Representatives</span>
      </div>

      {/* ── Order Section ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Order</h2>

        <div className="bg-white rounded-xl p-4 px-6 flex gap-8 items-center shadow-sm border border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-[0.9rem] font-bold">All</span>
            <span className="bg-purple-50 text-purple-600 text-[0.7rem] font-black px-2 py-0.5 rounded-[4px]">38</span>
          </div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Pending(10)</div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Confirmed(8)</div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Delivered(7)</div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Cancelled(2)</div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Failed(2)</div>
        </div>

        <button className="mt-4 bg-purple-50 hover:bg-purple-100 text-purple-600 px-6 py-2.5 rounded-lg text-[0.85rem] font-bold transition-colors">
          See All Orders
        </button>
      </section>

      {/* ── Profile Section ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Profile</h2>

        <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50 relative">
          <div className="flex gap-6 mb-10">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden shadow-inner shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://github.com/shadcn.png" alt="Profile" className="w-full h-full object-cover" />
            </div>

            {/* Name & Role */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-[1.5rem] font-bold">{staff.name}</h3>
                <span className="bg-slate-900 text-white text-[0.65rem] font-black px-2 py-0.5 rounded-[4px] uppercase tracking-wider">Team Lead</span>
              </div>
              <p className="text-[1rem] text-slate-400 mt-1 mb-3">
                {staff.role} <span className="font-bold text-slate-600">{staff.team}</span>
              </p>

              <div className="inline-flex items-center gap-2 border border-emerald-500 rounded-full px-3 py-0.5 text-emerald-500 text-[0.75rem] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
              </div>
            </div>

            {/* KPI Section */}
            <div className="text-right">
              <p className="text-[0.8rem] text-slate-400 leading-tight">
                {staff.name.split(" ")[0]}&apos;s KPI for this<br />
                month is <span className="font-bold text-slate-900">XXXXX</span>
              </p>
              <div className="mt-2">
                <span className="text-[1.6rem] font-black text-emerald-500 leading-none">50%</span>
                <p className="text-[0.75rem] text-slate-400 font-medium">achieved</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end gap-10">
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Phone Number</p>
                <p className="text-[1.1rem] font-bold text-purple-900">{staff.phone}</p>
              </div>
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Whatsapp</p>
                <p className="text-[1.1rem] font-bold text-purple-900">{staff.whatsapp}</p>
              </div>
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Email</p>
                <p className="text-[1.1rem] font-bold text-purple-900">{staff.email}</p>
              </div>
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Team</p>
                <p className="text-[1.1rem] font-bold text-slate-600">Team 1</p>
              </div>
            </div>

            <Link 
              href={`/admin/staff/sales-rep/${id}/profile`}
              className="border-2 border-purple-600 bg-transparent hover:bg-purple-50 text-purple-600 px-6 py-2.5 rounded-xl text-[0.85rem] font-bold flex items-center gap-3 transition-all shrink-0 no-underline"
            >
              <UserCircle size={18} /> See Full Profile <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Analytics Section ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Analytics</h2>

        <div className="grid grid-cols-3 gap-6">
          {/* General Performance */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[0.85rem] font-bold text-slate-700">General Performance</span>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold text-slate-500 border border-slate-100">
                This Month <ChevronDown size={12} />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[2.8rem] font-black leading-none">80%</span>
              <div className="text-right">
                <span className="text-[0.85rem] font-bold text-emerald-500">+12%</span>
                <p className="text-[0.65rem] text-slate-400 font-medium">vs last month</p>
              </div>
            </div>
          </div>

          {/* Delivery Rate */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[0.85rem] font-bold text-slate-700">Delivery Rate</span>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold text-slate-500 border border-slate-100">
                This Month <ChevronDown size={12} />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[2.8rem] font-black leading-none">78%</span>
              <div className="text-right">
                <span className="text-[0.85rem] font-bold text-emerald-500">+12%</span>
                <p className="text-[0.65rem] text-slate-400 font-medium">vs last month</p>
              </div>
            </div>
          </div>

          {/* Mini Chart Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[0.75rem] font-bold text-slate-700">Sales</p>
                <p className="text-[0.6rem] text-slate-400 font-medium leading-none mt-1">Winning Report Lorem ipsum</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 cursor-pointer">
                <div className="flex gap-[2px]">
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <div className="w-4 h-4 rounded-[4px] bg-blue-500"></div>
              <span className="text-[1.4rem] font-black leading-none">540</span>
              <span className="text-[0.7rem] text-slate-400 font-bold mt-1 uppercase tracking-wider">Sales</span>
            </div>

            {/* Chart Mockup */}
            <div className="flex items-end gap-1.5 h-[60px] mt-6">
              {[30, 50, 40, 85, 60, 45, 75, 55, 65, 40].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-[2px] transition-all duration-500 ${i === 3 ? "bg-blue-500" : "bg-blue-100 hover:bg-blue-200"}`}
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        <Link
          href={`/admin/staff/sales-rep/${id}/analytics`}
          className="mt-6 border-2 border-purple-600 bg-transparent hover:bg-purple-50 text-purple-600 px-6 py-2.5 rounded-xl text-[0.85rem] font-bold flex items-center gap-3 transition-all inline-flex no-underline"
        >
          <LayoutDashboard size={18} /> See Full Analytics <ChevronRight size={16} />
        </Link>
      </section>

      {/* ── Advanced Section ── */}
      <section>
        <h2 className="text-lg font-bold mb-4 text-slate-600">Advanced</h2>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-[0.9rem] font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-200 min-w-[220px]"
          >
            <span className="text-lg">🗑️</span> Delete Account
          </button>
          <button 
            onClick={() => setIsSuspendModalOpen(true)}
            className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-8 py-4 rounded-xl text-[0.9rem] font-bold flex items-center justify-center gap-3 transition-all min-w-[220px]"
          >
            <span className="text-lg">❓</span> Suspend Account
          </button>
          <button className="bg-slate-50 text-slate-300 px-8 py-4 rounded-xl text-[0.9rem] font-bold flex items-center justify-center gap-3 cursor-not-allowed min-w-[220px]">
            <span className="text-lg">👤</span> Assign as Team Lead
          </button>
          <button className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-xl text-[0.9rem] font-bold transition-all min-w-[180px]">
            Level 2 Access
          </button>
          <button className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-xl text-[0.9rem] font-bold transition-all min-w-[180px]">
            View Login History
          </button>
          <button className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-xl text-[0.9rem] font-bold transition-all min-w-[180px]">
            Reset Password
          </button>
          <button className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-xl text-[0.9rem] font-bold transition-all min-w-[180px]">
            Change Team
          </button>
        </div>
      </section>

      {/* ── Confirmation Modals ── */}
      {(isDeleteModalOpen || isSuspendModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => { setIsDeleteModalOpen(false); setIsSuspendModalOpen(false); }}
          />
          
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[450px] p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDeleteModalOpen ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"}`}>
                <AlertTriangle size={24} />
              </div>
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setIsSuspendModalOpen(false); }}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-2">
              {isDeleteModalOpen ? "Delete Account" : "Suspend Account"}
            </h3>
            <p className="text-slate-500 text-[0.95rem] leading-relaxed mb-8">
              Are you sure you want to {isDeleteModalOpen ? "permanently delete" : "temporarily suspend"} this account? This action will {isDeleteModalOpen ? "remove all data" : "restrict access"} for <span className="font-bold text-slate-700">{staff.name}</span>.
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setIsSuspendModalOpen(false); }}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                className={`flex-1 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg ${
                  isDeleteModalOpen 
                    ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100" 
                    : "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
