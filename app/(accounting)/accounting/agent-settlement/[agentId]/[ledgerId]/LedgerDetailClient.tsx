'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle,
  Bookmark,
  Download,
  ChevronDown,
  User,
} from 'lucide-react';

interface LedgerEntry {
  id: string;
  referenceId: string;
  referenceType: string;
  date: string;
  debit: string;
  credit: string;
  runningBalance: string;
  agentName: string;
  agentId: string;
  agentInitial: string;
}

interface AdjustmentRecord {
  id: string;
  type: string;
  referenceId: string;
  amount: string;
  note: string | null;
  date: string;
}

interface Recorder {
  name: string;
  role: string;
  avatarUrl: string | null;
}

interface Props {
  entry: LedgerEntry;
  ordersCovered: string[];
  adjustmentHistory: AdjustmentRecord[];
  recorder: Recorder | null;
  agentId: string;
}

export function LedgerDetailClient({ entry, ordersCovered, adjustmentHistory, recorder, agentId }: Props) {
  const router = useRouter();

  // Amount displayed: use debit if non-zero, else credit
  const displayAmount = entry.debit !== '₦0' ? entry.debit : entry.credit;

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F9FAFB]/50 font-sans">
      {/* Navigation Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center text-[#AE00FF] bg-purple-50 rounded-md hover:bg-purple-100 transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => router.forward()}
          className="w-8 h-8 flex items-center justify-center text-[#AE00FF] bg-purple-50 rounded-md hover:bg-purple-100 transition-colors cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => router.refresh()}
          className="w-8 h-8 flex items-center justify-center text-[#AE00FF] bg-purple-50 rounded-md hover:bg-purple-100 transition-colors cursor-pointer"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <h1 className="text-[32px] font-bold text-gray-800 tracking-tight">Reference Info</h1>
        <button className="w-14 h-14 bg-[#F4E6FF] rounded-full flex items-center justify-center text-[#AE00FF] shadow-sm ml-auto hover:scale-105 transition-transform cursor-pointer">
          <MessageCircle fill="currentColor" size={24} />
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Left Column */}
        <div className="xl:col-span-8 flex flex-col gap-8">

          {/* Reference Info Card */}
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
            <h2 className="text-[28px] font-bold text-gray-800 mb-8">{entry.referenceId}</h2>

            {/* Agent & Date row */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#A7F3D0] text-[#065F46] font-bold text-[18px] flex items-center justify-center shrink-0">
                  {entry.agentInitial}
                </div>
                <div>
                  <p className="text-[12px] text-gray-400 font-medium mb-0.5">Agent Name</p>
                  <p className="text-[16px] font-bold text-gray-800">{entry.agentName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-gray-400 font-medium mb-0.5">Date</p>
                <p className="text-[16px] font-bold text-gray-800">{entry.date}</p>
              </div>
            </div>

            {/* Orders Covered */}
            <div className="mb-8">
              <p className="text-[12px] text-gray-400 font-medium mb-1">Orders Covered</p>
              <p className="text-[16px] font-bold text-gray-800 mb-4">
                {ordersCovered.length} Order{ordersCovered.length !== 1 ? 's' : ''}
              </p>
              {ordersCovered.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ordersCovered.map((order) => (
                    <span
                      key={order}
                      className="px-4 py-1.5 bg-[#F4E6FF] text-[#AE00FF] text-[11px] font-bold rounded-full"
                    >
                      {order}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 italic">No order references linked to this entry.</p>
              )}
            </div>

            {/* Amount Remitted block */}
            <div className="bg-[#F3F4F6] rounded-xl p-6 flex items-center justify-between mb-4">
              <span className="text-[15px] text-gray-600 font-medium">
                {entry.debit !== '₦0' ? 'Amount Debited' : 'Amount Credited'}
              </span>
              <span className="text-[28px] font-bold text-gray-800">{displayAmount}</span>
            </div>

            <div className="flex items-center justify-between px-2">
              <span className="text-[13px] text-gray-500 font-medium">Auto Running Balance</span>
              <span className="text-[15px] font-bold text-gray-400">{entry.runningBalance}</span>
            </div>
          </div>

          {/* Recorded By */}
          {recorder && (
            <div>
              <h3 className="text-[15px] text-gray-500 font-medium mb-3">Recorded by</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                  {recorder.avatarUrl ? (
                    <img src={recorder.avatarUrl} alt={recorder.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-800 leading-tight">{recorder.name}</p>
                  <p className="text-[12px] text-gray-400 font-medium">{recorder.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Adjustment History */}
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
            <h3 className="text-[18px] font-bold text-gray-800 mb-6">Adjustment History</h3>

            {adjustmentHistory.length === 0 ? (
              <>
                {/* Always show the entry itself as first timeline item */}
                <div className="relative pl-6 border-l-2 border-[#EAEBFA] space-y-8 py-2">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 bg-[#AE00FF] rounded-full ring-4 ring-white" />
                    <div>
                      <p className="text-[15px] font-bold text-gray-800">{entry.referenceType}</p>
                      <p className="text-[14px] text-gray-500">{entry.referenceId}</p>
                      <p className="text-[12px] text-gray-400 font-medium mt-1">{entry.date}</p>
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-gray-400 italic mt-4 pl-2">No corrections or adjustments recorded.</p>
              </>
            ) : (
              <div className="relative pl-6 border-l-2 border-[#EAEBFA] space-y-8 py-2">
                {/* The entry itself — always first */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 bg-[#AE00FF] rounded-full ring-4 ring-white" />
                  <div>
                    <p className="text-[15px] font-bold text-gray-800">{entry.referenceType}</p>
                    <p className="text-[14px] text-gray-500">{entry.referenceId}</p>
                    <p className="text-[12px] text-gray-400 font-medium mt-1">{entry.date}</p>
                  </div>
                </div>

                {/* Adjustments */}
                {adjustmentHistory.map((adj) => (
                  <div key={adj.id} className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 bg-[#7C3AED] rounded-full ring-4 ring-white" />
                    <div>
                      <p className="text-[15px] font-bold text-gray-800">{adj.type}</p>
                      <p className="text-[14px] text-gray-500">{adj.referenceId}</p>
                      {adj.note && <p className="text-[12px] text-gray-500 italic mt-0.5">{adj.note}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[12px] text-gray-400 font-medium">{adj.date}</p>
                        <span className="text-[11px] font-bold text-[#AE00FF]">{adj.amount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column — Summary Sidebar */}
        <div className="xl:col-span-4">
          <div className="bg-[#9CA3AF] rounded-[24px] p-4 shadow-sm flex flex-col gap-4 sticky top-8">

            {/* Summary White Card */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-[16px] font-bold text-gray-800">Summary</h3>
                <span className="text-[13px] text-gray-500 font-medium">{entry.referenceId}</span>
              </div>

              {/* Agent row */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A7F3D0] text-[#065F46] font-bold text-[15px] flex items-center justify-center shrink-0">
                    {entry.agentInitial}
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">Agent Name</p>
                    <p className="text-[14px] font-bold text-gray-800">{entry.agentName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 font-medium mb-0.5">Date</p>
                  <p className="text-[14px] font-bold text-gray-800">{entry.date}</p>
                </div>
              </div>

              {/* Orders Covered Summary */}
              <div className="mb-6 border-b border-gray-100 pb-6">
                <p className="text-[11px] text-gray-400 font-medium mb-1">Orders Covered</p>
                <p className="text-[14px] font-bold text-gray-800 mb-4">
                  {ordersCovered.length} Order{ordersCovered.length !== 1 ? 's' : ''}
                </p>
                {ordersCovered.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ordersCovered.map((order) => (
                      <span
                        key={order}
                        className="px-3 py-1 bg-[#F4E6FF] text-[#AE00FF] text-[9px] font-bold rounded-full"
                      >
                        {order}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="bg-[#F3F4F6] rounded-xl p-4 flex flex-col items-center justify-center mb-4 gap-1">
                <span className="text-[12px] text-gray-500 font-medium">
                  {entry.debit !== '₦0' ? 'Amount Debited' : 'Amount Credited'}
                </span>
                <span className="text-[24px] font-bold text-gray-800">{displayAmount}</span>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-gray-500 font-medium">Auto Running Balance</span>
                <span className="text-[13px] font-bold text-gray-400">{entry.runningBalance}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button className="flex-1 bg-white text-gray-800 rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold text-[14px] hover:bg-gray-50 transition-colors cursor-pointer">
                <Bookmark size={18} className="text-gray-400" /> Save
              </button>
              <button className="flex-1 bg-white text-gray-800 rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold text-[14px] hover:bg-gray-50 transition-colors cursor-pointer">
                <Download size={18} className="text-gray-400" /> Download <ChevronDown size={16} className="text-gray-400" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
