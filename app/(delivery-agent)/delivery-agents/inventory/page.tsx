"use client";

import React from "react";
import { Settings, Bell } from "lucide-react";

export default function InventoryPage() {
  const inventoryItems = [
    {
      name: "Prosxact",
      count: 19,
      scheduled: 14,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=100",
      theme: "bg-[#ad1df4] text-white",
      subTextTheme: "text-purple-100"
    },
    {
      name: "Neuro-Vive Balm",
      count: 20,
      scheduled: 20,
      image: "https://images.unsplash.com/photo-1550572017-ed200f550547?auto=format&fit=crop&q=80&w=100",
      theme: "bg-[#f3e8ff] text-[#ad1df4]",
      subTextTheme: "text-purple-400"
    },
    {
      name: "After-Natal",
      count: 26,
      scheduled: 19,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=100",
      theme: "bg-[#f97316] text-white",
      subTextTheme: "text-orange-100"
    },
    {
      name: "Fonio-Mill",
      count: 31,
      scheduled: 11,
      image: "https://images.unsplash.com/photo-1550572017-ed200f550547?auto=format&fit=crop&q=80&w=100",
      theme: "bg-white text-[#4b5563] border border-gray-100",
      subTextTheme: "text-gray-400"
    },
    {
      name: "Trim and Tone",
      count: 31,
      scheduled: 21,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=100",
      theme: "bg-[#c084fc] text-white",
      subTextTheme: "text-purple-100"
    },
    {
      name: "Linix",
      count: 31,
      scheduled: 21,
      image: "https://images.unsplash.com/photo-1550572017-ed200f550547?auto=format&fit=crop&q=80&w=100",
      theme: "bg-[#ea580c] text-white",
      subTextTheme: "text-orange-100"
    },
    {
      name: "Shred Belly",
      count: 31,
      scheduled: 21,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=100",
      theme: "bg-[#4c1d95] text-white",
      subTextTheme: "text-purple-100"
    }
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

      {/* Inventory Grid */}
      <div className="grid grid-cols-2 gap-4">
        {inventoryItems.map((item, index) => (
          <div 
            key={index} 
            className={`rounded-[32px] p-6 pt-5 flex flex-col justify-between h-[180px] shadow-sm ${item.theme} transition-transform hover:scale-[1.02] cursor-pointer`}
          >
            <div className="flex justify-between items-start">
              <h3 className="text-base font-black leading-tight max-w-[100px]">{item.name}</h3>
              <div className="w-12 h-12 rounded-xl bg-white/20 p-1 backdrop-blur-sm overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-auto">
              <span className="text-6xl font-black tracking-tighter">{item.count}</span>
              <div className="text-right max-w-[80px]">
                <p className={`text-[10px] font-bold leading-tight ${item.subTextTheme}`}>
                  {item.scheduled} scheduled for delivery
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
