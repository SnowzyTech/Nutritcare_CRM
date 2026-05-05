'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle,
  Plus,
  Calendar as CalendarIcon,
  ChevronDown,
  Paperclip,
  X
} from 'lucide-react';
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const tabs = [
  { id: 'new', label: 'New Expense' },
  { id: 'history', label: 'Expense History' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'po', label: 'Purchase Order' },
  { id: 'po-history', label: 'Purchase Order History' },
];

export function ExpensesClient() {
  const [activeTab, setActiveTab] = useState('new');
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 5, 12));

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F9FAFB] font-sans">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button className="p-2 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-xl">
            <ChevronLeft size={20} />
          </button>
          <button className="p-2 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-xl">
            <ChevronRight size={20} />
          </button>
          <button className="p-2 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-xl">
            <RotateCcw size={18} />
          </button>
        </div>
        <div className="w-14 h-14 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-200 hover:scale-105 transition-transform cursor-pointer">
          <MessageCircle size={26} fill="currentColor" />
        </div>
      </div>

      <h1 className="text-[36px] font-black text-gray-800 mb-10 tracking-tight leading-none">Expense Entry</h1>

      <div className="flex gap-12 items-start">
        {/* Secondary Sidebar */}
        <div className="w-[320px] bg-white rounded-[40px] p-8 shadow-sm border border-gray-100/50 min-h-[600px]">
          <div className="space-y-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-8 py-5 rounded-2xl text-[15px] font-bold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-[#F3E8FF] text-[#AE00FF] shadow-inner'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-[48px] p-16 shadow-sm border border-gray-100/50 relative overflow-hidden">
          {/* Decorative Gradient Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50/50 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

          {/* Form Header */}
          <div className="flex items-center justify-between mb-16 relative z-10">
            <div className="flex items-center gap-12">
              <h2 className="text-[32px] font-black text-gray-800 tracking-tight">New Expense Entry</h2>
              <div className="flex items-center gap-3">
                <span className="text-[20px] text-gray-400 font-bold tracking-widest uppercase">REF:</span>
                <span className="text-[24px] font-black text-gray-700">EXP 1023</span>
              </div>
            </div>
            <button className="bg-[#4A0A77] text-white px-8 py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-[#3B0069] transition-all shadow-lg shadow-purple-100 active:scale-95">
              Import Charts of Accounts
            </button>
          </div>

          {/* Form Content */}
          <div className="space-y-12 relative z-10">
            {/* Row 1: Category */}
            <div className="grid grid-cols-5 gap-8 items-end">
              <div className="col-span-4 space-y-4">
                <label className="text-[14px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  Expense Category
                </label>
                <div className="relative group">
                  <select className="w-full h-[72px] bg-[#F9FAFB] border border-gray-100 rounded-[24px] px-8 text-[16px] text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-bold">
                    <option>Please Select</option>
                  </select>
                  <ChevronDown size={22} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
              <button className="h-[72px] bg-white border-2 border-gray-100 border-dashed rounded-[24px] flex items-center justify-center gap-3 text-gray-400 hover:border-purple-200 hover:text-purple-400 transition-all group font-bold">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-purple-50 group-hover:text-purple-400">
                  <Plus size={18} strokeWidth={3} />
                </div>
                Add New Category
              </button>
            </div>

            {/* Row 2: Paid From */}
            <div className="space-y-4">
              <label className="text-[14px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                Paid From Account
              </label>
              <div className="relative group">
                <select className="w-full h-[72px] bg-[#F9FAFB] border border-gray-100 rounded-[24px] px-8 text-[16px] text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-bold">
                  <option>Please Select</option>
                </select>
                <ChevronDown size={22} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-purple-400 transition-colors" />
              </div>
            </div>

            {/* Row 3: Add More Category Button */}
            <button className="w-[280px] h-[72px] bg-white border-2 border-gray-100 border-dashed rounded-[24px] flex items-center justify-center gap-3 text-gray-400 hover:border-purple-200 hover:text-purple-400 transition-all group font-bold">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-purple-50 group-hover:text-purple-400">
                <Plus size={18} strokeWidth={3} />
              </div>
              Add New Category
            </button>

            {/* Row 4: Date */}
            <div className="space-y-4">
              <label className="text-[14px] font-black text-gray-700 uppercase tracking-widest">Date</label>
              <Popover>
                <PopoverTrigger className="w-full h-[72px] bg-[#F9FAFB] border border-gray-100 rounded-[24px] px-8 flex items-center justify-between text-[16px] text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all">
                  <span>{date ? format(date, "dd-MM-yy") : "Pick a date"}</span>
                  <CalendarIcon size={22} className="text-gray-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[24px] border-none shadow-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="rounded-[24px]"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Row 5: Amount and Tax */}
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-[14px] font-black text-gray-700 uppercase tracking-widest">Amount</label>
                <div className="relative group">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[20px] font-bold text-gray-400 group-hover:text-purple-400 transition-colors">₦</span>
                  <input
                    type="text"
                    placeholder="0.00"
                    className="w-full h-[72px] bg-[#F9FAFB] border border-gray-100 rounded-[24px] pl-16 pr-8 text-[18px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-black"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[14px] font-black text-gray-700 uppercase tracking-widest">Tax</label>
                <div className="relative group">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[20px] font-bold text-gray-400 group-hover:text-purple-400 transition-colors">₦</span>
                  <input
                    type="text"
                    placeholder="0.00"
                    className="w-full h-[72px] bg-[#F9FAFB] border border-gray-100 rounded-[24px] pl-16 pr-8 text-[18px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-black"
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Notes */}
            <div className="space-y-4">
              <label className="text-[14px] font-black text-gray-700 uppercase tracking-widest">Notes</label>
              <textarea
                placeholder="Type here"
                className="w-full h-[180px] bg-[#F9FAFB] border border-gray-100 rounded-[32px] p-8 text-[16px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium resize-none placeholder-gray-300"
              />
            </div>

            {/* Row 7: Attachment */}
            <div className="border-2 border-dashed border-gray-100 rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 bg-gray-50/30 hover:bg-purple-50/30 transition-all cursor-pointer group">
              <div className="text-center">
                <p className="text-[13px] font-black text-[#AE00FF] uppercase tracking-[0.2em] mb-2">Add Attachment</p>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Max file size: 20 MB</p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-12 border-t border-gray-50">
              <button className="px-12 py-5 border-2 border-purple-200 text-[#AE00FF] rounded-[24px] text-[16px] font-black uppercase tracking-widest hover:bg-purple-50 transition-all active:scale-95">
                Cancel
              </button>
              <div className="flex gap-6">
                <button className="px-12 py-5 border-2 border-gray-100 text-gray-400 rounded-[24px] text-[16px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95">
                  Save & Add Another
                </button>
                <button className="px-16 py-5 bg-[#AE00FF] text-white rounded-[24px] text-[18px] font-black uppercase tracking-[0.1em] shadow-2xl shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all">
                  Save Expense Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}