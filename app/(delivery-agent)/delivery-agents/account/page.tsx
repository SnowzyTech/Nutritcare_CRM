"use client";

import React from "react";
import { Settings, Bell, LogOut } from "lucide-react";

export default function AccountPage() {
  const accountData = [
    { product: "Prosxact", delivered: 30, total: "280,0000", fee: "40,000" },
    { product: "Shred Belly", delivered: 20, total: "280,0000", fee: "40,000" },
    { product: "Neuro-Vive Balm", delivered: 12, total: "280,0000", fee: "40,000" },
    { product: "After-Natal", delivered: 6, total: "280,0000", fee: "40,000" },
    { product: "Trim and Tone", delivered: 28, total: "280,0000", fee: "40,000" },
    { product: "Fonio Mill", delivered: 19, total: "280,0000", fee: "40,000" },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/nuycle-logo.png" alt="Nuycle Logo" className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-full border border-gray-100 bg-white text-gray-400 shadow-sm hover:text-gray-600 transition-colors">
            <Settings className="w-5 h-5 stroke-[1.5px]" />
          </button>
          <button className="p-2.5 rounded-full border border-gray-100 bg-white text-gray-400 shadow-sm hover:text-gray-600 transition-colors">
            <Bell className="w-5 h-5 stroke-[1.5px]" />
          </button>
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-md ml-1">
            <img 
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Account Table Card */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4 text-center">Del.</th>
                <th className="px-4 py-4 text-center">Total</th>
                <th className="px-4 py-4 text-right">Total Del. fee</th>
              </tr>
            </thead>
            <tbody className="text-[13px] font-medium text-gray-600">
              {accountData.map((row, index) => (
                <tr 
                  key={index} 
                  className={index % 2 === 0 ? "bg-[#fafafa]" : "bg-white"}
                >
                  <td className="px-4 py-4 rounded-l-2xl">{row.product}</td>
                  <td className="px-4 py-4 text-center">{row.delivered}</td>
                  <td className="px-4 py-4 text-center">{row.total}</td>
                  <td className="px-4 py-4 text-right rounded-r-2xl">{row.fee}</td>
                </tr>
              ))}
              <tr className="bg-[#f1f2f4] text-gray-700 font-black">
                <td className="px-4 py-5 rounded-l-2xl">Total</td>
                <td className="px-4 py-5 text-center">115</td>
                <td className="px-4 py-5 text-center">380,000</td>
                <td className="px-4 py-5 text-right rounded-r-2xl">89,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-4 px-2">
        <button className="w-full bg-[#faf5ff] text-red-500 font-bold h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-50 transition-colors border border-red-100">
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>

      <p className="text-xs text-gray-300 font-bold text-left px-2">
        Last Updated: 21st of January, 2026
      </p>
    </div>
  );
}
