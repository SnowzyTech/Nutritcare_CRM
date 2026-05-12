'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  MessageCircle, 
  Bookmark, 
  Download, 
  ChevronDown,
  User
} from 'lucide-react';

export default function LedgerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const ledgerId = params.ledgerId as string;

  const orders = Array(16).fill('ORD-1001');

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F9FAFB]/50 font-sans">
      {/* Navigation Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center text-[#AE00FF] bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-[#AE00FF] bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
          <ChevronRight size={18} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-[#AE00FF] bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <h1 className="text-[32px] font-bold text-gray-800 tracking-tight">Reference Info</h1>

        {/* Chat Button */}
        <button className="w-14 h-14 bg-[#F4E6FF] rounded-full flex items-center justify-center text-[#AE00FF] shadow-sm ml-auto z-10 hover:scale-105 transition-transform">
          <MessageCircle fill="currentColor" size={24} />
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          
          {/* Reference Info Card */}
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
            <h2 className="text-[28px] font-bold text-gray-800 mb-8">{ledgerId || 'REM-1023'}</h2>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#A7F3D0] text-[#065F46] font-bold text-[18px] flex items-center justify-center">
                  I
                </div>
                <div>
                  <p className="text-[12px] text-gray-400 font-medium mb-0.5">Agent Name</p>
                  <p className="text-[16px] font-bold text-gray-800">Ibrahim Lawal</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-gray-400 font-medium mb-0.5">Date</p>
                <p className="text-[16px] font-bold text-gray-800">2026-03-01</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[12px] text-gray-400 font-medium mb-1">Orders Covered</p>
              <p className="text-[16px] font-bold text-gray-800 mb-4">16 Orders</p>
              
              <div className="flex flex-wrap gap-2">
                {orders.map((order, index) => (
                  <span key={index} className="px-4 py-1.5 bg-[#F4E6FF] text-[#AE00FF] text-[11px] font-bold rounded-full">
                    {order}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#F3F4F6] rounded-xl p-6 flex items-center justify-between mb-4">
              <span className="text-[15px] text-gray-600 font-medium">Amount Remitted</span>
              <span className="text-[28px] font-bold text-gray-800">₦270,000</span>
            </div>

            <div className="flex items-center justify-between px-2">
              <span className="text-[13px] text-gray-500 font-medium">Auto Running Balance</span>
              <span className="text-[15px] font-bold text-gray-400">₦60,000</span>
            </div>
          </div>

          {/* Recorded By */}
          <div>
            <h3 className="text-[15px] text-gray-500 font-medium mb-3">Recorded by</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                <User size={20} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-800 leading-tight">Victoria Nwachukwu</p>
                <p className="text-[12px] text-gray-400 font-medium">Accountant</p>
              </div>
            </div>
          </div>

          {/* Adjustment History */}
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 mt-2">
            <h3 className="text-[18px] font-bold text-gray-800 mb-6">Adjustment History</h3>
            
            <div className="relative pl-6 border-l-2 border-[#EAEBFA] space-y-8 py-2">
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 bg-[#AE00FF] rounded-full ring-4 ring-white" />
                <div>
                  <p className="text-[15px] font-bold text-gray-800">Remittance Entry</p>
                  <p className="text-[14px] text-gray-500">{ledgerId || 'REM-1023'}</p>
                  <p className="text-[12px] text-gray-400 font-medium mt-1">2026-03-02</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 bg-[#AE00FF] rounded-full ring-4 ring-white" />
                <div>
                  <p className="text-[15px] font-bold text-gray-800">Correction</p>
                  <p className="text-[14px] text-gray-500">ADJ-0031</p>
                  <p className="text-[12px] text-gray-400 font-medium mt-1">2026-03-02</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar) */}
        <div className="xl:col-span-4">
          <div className="bg-[#9CA3AF] rounded-[24px] p-4 shadow-sm flex flex-col gap-4 sticky top-8">
            
            <div className="bg-white rounded-[20px] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-[16px] font-bold text-gray-800">Summary</h3>
                <span className="text-[13px] text-gray-500 font-medium">{ledgerId || 'REM-1023'}</span>
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A7F3D0] text-[#065F46] font-bold text-[15px] flex items-center justify-center">
                    I
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">Agent Name</p>
                    <p className="text-[14px] font-bold text-gray-800">Ibrahim Lawal</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 font-medium mb-0.5">Date</p>
                  <p className="text-[14px] font-bold text-gray-800">2026-03-01</p>
                </div>
              </div>

              <div className="mb-6 border-b border-gray-100 pb-6">
                <p className="text-[11px] text-gray-400 font-medium mb-1">Orders Covered</p>
                <p className="text-[14px] font-bold text-gray-800 mb-4">16 Orders</p>
                
                <div className="flex flex-wrap gap-1.5">
                  {orders.map((order, index) => (
                    <span key={index} className="px-3 py-1 bg-[#F4E6FF] text-[#AE00FF] text-[9px] font-bold rounded-full">
                      {order}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#F3F4F6] rounded-xl p-4 flex flex-col items-center justify-center mb-4 gap-1">
                <span className="text-[12px] text-gray-500 font-medium">Amount Remitted</span>
                <span className="text-[24px] font-bold text-gray-800">₦270,000</span>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-gray-500 font-medium">Auto Running Balance</span>
                <span className="text-[13px] font-bold text-gray-400">₦60,000</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 bg-white text-gray-800 rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold text-[14px] hover:bg-gray-50 transition-colors">
                <Bookmark size={18} className="text-gray-400" /> Save
              </button>
              <button className="flex-1 bg-white text-gray-800 rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold text-[14px] hover:bg-gray-50 transition-colors">
                <Download size={18} className="text-gray-400" /> Download <ChevronDown size={16} className="text-gray-400" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
