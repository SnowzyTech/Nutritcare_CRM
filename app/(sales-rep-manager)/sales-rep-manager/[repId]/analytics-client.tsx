"use client";

import React from "react";
import Link from "next/link";

interface AnalyticsSectionProps {
  repId: string;
  repName?: string;
  currentAnalytics: {
    generalPerformance: number;
    deliveryRate: number;
    salesTotal: number;
    trend: string;
  };
}

export function AnalyticsSection({ repId, repName, currentAnalytics }: AnalyticsSectionProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-600 mb-6">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* General Performance Card */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[180px]">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-gray-900">General Performance</p>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-[56px] font-bold text-gray-600 leading-none">{currentAnalytics.generalPerformance}%</p>
              <p className="text-xs font-semibold text-green-500 mb-2">
                {currentAnalytics.trend} <span className="text-gray-400 font-medium">vs last month</span>
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
          </div>
          <div className="flex items-end justify-between">
            <p className="text-[56px] font-bold text-gray-600 leading-none">{currentAnalytics.deliveryRate}%</p>
            <p className="text-xs font-semibold text-green-500 mb-2">
              {currentAnalytics.trend} <span className="text-gray-400 font-medium">vs last month</span>
            </p>
          </div>
        </div>

        {/* Sales Total Card */}
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-gray-900">Products Sold</p>
            <p className="text-[8px] text-gray-300">i</p>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[56px] font-bold text-gray-600 leading-none">{currentAnalytics.salesTotal}</p>
              <p className="text-[8px] text-gray-400 uppercase">Units</p>
            </div>
            <p className="text-xs font-semibold text-green-500 mb-2">
              {currentAnalytics.trend} <span className="text-gray-400 font-medium">vs last month</span>
            </p>
          </div>
        </div>
      </div>

      {/* Team Performance Card */}
      <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900 mb-1">Performance this month</p>
          <p className="text-[56px] font-bold text-gray-600 leading-none">{currentAnalytics.generalPerformance}%</p>
        </div>
        <p className="text-xs font-semibold text-green-500">
          {currentAnalytics.trend} <span className="text-gray-400 font-medium">vs last month</span>
        </p>
      </div>
    </div>
  );
}
