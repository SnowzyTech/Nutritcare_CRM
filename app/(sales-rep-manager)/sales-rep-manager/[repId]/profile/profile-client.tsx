"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Edit } from "lucide-react";
import { RepDetail, MONTHS, MOCK_MONTHLY_ANALYTICS } from "@/lib/mock-data/sales-rep-manager";

interface ProfileClientProps {
  rep: RepDetail;
  repId: string;
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
        className="flex items-center gap-1 text-xs text-gray-500 font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
      >
        {selectedMonth} <ChevronDown size={12} />
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

export function ProfileClient({ rep, repId }: ProfileClientProps) {
  const [teamMonth, setTeamMonth] = useState("March");

  const monthlyData = MOCK_MONTHLY_ANALYTICS[repId] || MOCK_MONTHLY_ANALYTICS["2"];
  const teamData = monthlyData[teamMonth] || monthlyData["March"];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(rep.name)}&background=f3f4f6&color=6b7280`}
            alt={rep.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{rep.name}'s</h1>
          <p className="text-gray-500 text-sm">Dashboard</p>
        </div>
      </div>

      {/* Page Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-600">Profile</h2>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* Profile Card */}
      <div className="bg-[#FAF5FF] rounded-2xl p-8 border border-[#E9D5FF]">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(rep.name)}&background=f3f4f6&color=6b7280`}
                alt={rep.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-gray-500 text-xs">+</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{rep.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-sm">{rep.role}</span>
                <span className="text-gray-500 text-sm">{rep.team}</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-green-200 bg-white">
                  <span className="text-[10px] font-semibold text-green-500">Online</span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                </span>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-3">
            <div>
              <p className="text-xs text-gray-400 font-medium">
                Your KPI for this month is
              </p>
              <p className="text-lg font-black text-gray-900">XXXXX</p>
            </div>
            <button className="flex items-center gap-2 border border-[#A020F0] text-[#A020F0] px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#FAF5FF] transition">
              <Edit size={14} />
              Edit Profile
            </button>
          </div>
        </div>

        <div className="w-full h-px bg-[#E9D5FF] mb-8"></div>

        {/* Contact Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div>
            <p className="text-[10px] text-gray-400 font-medium mb-1">Phone Number</p>
            <p className="text-lg font-bold text-[#3B0069]">{rep.phone}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium mb-1">Whatsapp</p>
            <p className="text-lg font-bold text-[#3B0069]">{rep.whatsapp}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium mb-1">Email</p>
            <p className="text-base font-bold text-[#3B0069] break-all">{rep.email}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium mb-2">States Handled</p>
            <div className="flex flex-wrap gap-2">
              {rep.statesHandled.map((state) => (
                <span
                  key={state}
                  className="bg-white text-gray-600 text-xs font-semibold px-3 py-1 rounded-lg border border-gray-100"
                >
                  {state}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] text-gray-400 font-medium mb-1">Team</p>
            <p className="text-base font-bold text-gray-600">{rep.team}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium mb-1">Team Lead</p>
            <p className="text-base font-bold text-gray-600">{rep.teamLead}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium mb-1">Branch</p>
            <p className="text-base font-bold text-gray-600">{rep.branch}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-900 mb-1">Team Performance</p>
              <p className="text-3xl font-black text-gray-600 leading-none">{teamData.generalPerformance}%</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <MonthDropdown selectedMonth={teamMonth} onSelect={setTeamMonth} />
              <p className="text-xs font-semibold text-green-500">
                {teamData.trend} <span className="text-gray-400 font-medium">vs last month</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Section */}
      <div className="flex items-center gap-6 pt-4">
        <div>
          <p className="text-[10px] text-gray-400 font-medium mb-1">Account Created on</p>
          <p className="text-base font-bold text-gray-600">{rep.accountCreatedDate}</p>
        </div>
        <button className="flex items-center gap-2 bg-[#FAF5FF] text-[#A020F0] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#F3E8FF] transition">
          Check Login History
          <span className="text-lg">→</span>
        </button>
      </div>
    </div>
  );
}
