"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Search, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DriverDetailsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-4 pb-20">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <Link 
          href="/logistics/agents" 
          className="flex items-center gap-2 text-gray-500 hover:text-[#ad1df4] transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="search"
            className="w-full pl-10 pr-4 py-2 text-sm border-none rounded-lg focus:outline-none bg-white/50"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 min-h-[500px] flex flex-col relative">
        <div className="flex justify-between flex-1">
          {/* Left Side: Driver Title & Status */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-800">Driver</h1>
            <div className="inline-block px-2 py-0.5 bg-[#854d0e] text-white text-[10px] font-bold rounded-sm">
              ACTIVE
            </div>
          </div>

          {/* Right Side: Details Card */}
          <div className="w-[450px]">
            <div className="bg-[#f8f9fa] rounded-xl p-6 space-y-4">
              <DetailRow label="AGENT NAME:" value="JOHN" />
              <DetailRow label="COUNTRY:" value="NIGERIA" />
              <DetailRow label="STATE/ADDRESS:" value="OWERRI, IMO STATE" />
              <DetailRow label="PHONE 1,2,3:" value="08096963632" />
              <DetailRow label="VEHICLE NO:" value="IKJ106FJ" />
              <DetailRow label="STATE COVERED:" value="LAGOS" />
            </div>
          </div>
        </div>

        {/* Action Buttons at Bottom Right */}
        <div className="flex justify-end gap-3 mt-8">
          <Button 
            variant="outline" 
            className="bg-[#f1f5f9] border-none text-gray-500 hover:bg-gray-200 gap-2 px-6 h-10 rounded-lg text-xs"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
          <Button 
            variant="outline" 
            className="bg-[#f1f5f9] border-none text-gray-500 hover:bg-gray-200 gap-2 px-6 h-10 rounded-lg text-xs"
          >
            <Printer className="w-4 h-4" /> PDF/Print
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px,1fr] gap-4">
      <span className="text-[11px] font-bold text-gray-500 uppercase">{label}</span>
      <span className="text-[11px] font-bold text-gray-700 uppercase">{value}</span>
    </div>
  );
}
