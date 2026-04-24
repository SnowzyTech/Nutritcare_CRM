"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MONTHS, MOCK_MONTHLY_ANALYTICS } from "@/lib/mock-data/sales-rep-manager";

interface AnalyticsSectionProps {
  repId: string;
  repName: string;
  defaultAnalytics: { generalPerformance: number; deliveryRate: number; salesTotal: number };
}

function MonthDropdown({ selectedMonth, onSelect }: { selectedMonth: string; onSelect: (month: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-gray-500 font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
      >
        {selectedMonth} <ChevronDown size={14} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-40 max-h-60 overflow-y-auto">
          {MONTHS.map((month) => (
            <button
              key={month}
              onClick={() => {
                onSelect(month);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors ${
                selectedMonth === month ? "text-[#A020F0] font-semibold bg-purple-50" : "text-gray-700"
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnalyticsSection({ repId, repName, defaultAnalytics }: AnalyticsSectionProps) {
  const [selectedMonth, setSelectedMonth] = useState("March");
  const [teamMonth, setTeamMonth] = useState("March");

  const monthlyData = MOCK_MONTHLY_ANALYTICS[repId] || MOCK_MONTHLY_ANALYTICS["2"];
  const currentData = monthlyData[selectedMonth] || monthlyData["March"];
  const teamData = monthlyData[teamMonth] || monthlyData["March"];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-600 mb-6">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* General Performance Card */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[180px]">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-gray-900">General Performance</p>
              <MonthDropdown selectedMonth={selectedMonth} onSelect={setSelectedMonth} />
            </div>
            <div className="flex items-end justify-between">
              <p className="text-[56px] font-bold text-gray-600 leading-none">{currentData.generalPerformance}%</p>
              <p className="text-xs font-semibold text-green-500 mb-2">
                {currentData.trend} <span className="text-gray-400 font-medium">vs last month</span>
              </p>
            </div>
          </div>

          <Link
            href={`/sales-rep-manager/${repId}/analytics`}
            className="flex items-center justify-center gap-2 border border-[#E9D5FF] text-[#A020F0] bg-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-[#FAF5FF] transition shadow-sm"
          >
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">📊</span>
            See Full Analytics →
          </Link>
        </div>

        {/* Delivery Rate Card */}
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-gray-900">Delivery Rate</p>
            <MonthDropdown selectedMonth={selectedMonth} onSelect={setSelectedMonth} />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-[56px] font-bold text-gray-600 leading-none">{currentData.deliveryRate}%</p>
            <p className="text-xs font-semibold text-green-500 mb-2">
              {currentData.trend} <span className="text-gray-400 font-medium">vs last month</span>
            </p>
          </div>
        </div>

        {/* Sales Chart Card */}
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col h-[180px] relative">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-gray-900 mb-0.5">Sales</p>
              <p className="text-[8px] text-gray-400">Timing Report: Lorem Ipsum</p>
            </div>
            <p className="text-[6px] text-gray-300 mr-2 mt-1">i</p>
          </div>

          <div className="flex-1 flex gap-4 mt-2">
            <div className="w-8 shrink-0 flex flex-col justify-end items-end gap-1 pb-4">
              <div className="w-4 h-4 bg-blue-500 rounded-sm mb-auto mt-2"></div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 leading-none">{currentData.salesTotal}</p>
                <p className="text-[8px] text-gray-400 uppercase">Sales</p>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between relative pl-4 pb-4">
              <div className="absolute inset-x-0 bottom-[16px] border-t border-gray-50"></div>
              <div className="absolute inset-x-0 bottom-[40px] border-t border-gray-50"></div>
              <div className="absolute inset-x-0 bottom-[64px] border-t border-gray-50"></div>
              <div className="absolute inset-x-0 bottom-[88px] border-t border-gray-50"></div>

              {[
                { label: "Mo", h1: "30%", h2: "0%", color: "bg-blue-300" },
                { label: "Tu", h1: "40%", h2: "20%", color: "bg-blue-300" },
                { label: "We", h1: "50%", h2: "30%", color: "bg-blue-300" },
                { label: "Th", h1: "70%", h2: "40%", color: "bg-blue-400" },
                { label: "Fr", h1: "60%", h2: "40%", color: "bg-blue-500" },
                { label: "Sa", h1: "40%", h2: "20%", color: "bg-blue-500" },
                { label: "Su", h1: "50%", h2: "30%", color: "bg-blue-500" },
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center z-10 w-4 h-full justify-end">
                  <div className="w-2.5 flex flex-col-reverse items-center justify-start h-full">
                    <div className={`w-full rounded-b-sm ${bar.color}`} style={{ height: bar.h1 }}></div>
                    {bar.h2 !== "0%" && (
                      <div className={`w-full rounded-t-sm mb-0.5 bg-blue-200`} style={{ height: bar.h2 }}></div>
                    )}
                  </div>
                  <span className="text-[8px] text-gray-400 font-medium absolute -bottom-1">{bar.label}</span>
                </div>
              ))}

              <div className="absolute left-0 top-0 bottom-4 w-4 flex flex-col justify-between text-[6px] text-gray-300 py-1 font-medium">
                <span>500</span>
                <span>400</span>
                <span>300</span>
                <span>200</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Card */}
      <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900 mb-1">Team Performance</p>
          <p className="text-[56px] font-bold text-gray-600 leading-none">{teamData.generalPerformance}%</p>
        </div>
        <div className="flex items-center gap-6">
          <MonthDropdown selectedMonth={teamMonth} onSelect={setTeamMonth} />
          <p className="text-xs font-semibold text-green-500">
            {teamData.trend} <span className="text-gray-400 font-medium">vs last month</span>
          </p>
        </div>
      </div>
    </div>
  );
}
