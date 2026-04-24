"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export interface AnalyticsData {
  totalProductsSold: { value: string; trend: string };
  totalOrderCustomer: { value: string; trend: string };
  bestSellingProduct: { name: string; subtitle: string };
  generalPerformance: { value: string; trend: string };
  upsellingRate: { value: string; trend: string };
  confirmationRate: { value: string; trend: string };
  deliveryRate: { value: string; trend: string };
  cancellationRate: { value: string; trend: string };
  recoveryRate: { value: string; trend: string };
  kpi: { value: string; trend: string; target: string };
  bestSellingTable: Array<{ product: string; amountSold: number }>;
  upsellingTable: Array<{ product: string; noOfUpsell: number }>;
}

export interface AnalyticsHeaderProps {
  type: "team" | "rep";
  repName?: string;
  repTeam?: string;
}

interface AnalyticsDashboardClientProps {
  header: AnalyticsHeaderProps;
  data: AnalyticsData;
  showReports?: boolean;
}

function StatCard({ 
  label, 
  value, 
  trend, 
  hasDropdown = true 
}: { 
  label: string; 
  value: string; 
  trend?: string; 
  hasDropdown?: boolean 
}) {
  return (
    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[150px]">
      <div className="flex justify-between items-start">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        {hasDropdown && (
          <div className="relative">
            <select className="appearance-none bg-[#FAFAFA] border border-gray-100 rounded-lg pl-3 pr-8 py-1.5 text-[10px] text-gray-500 font-medium outline-none hover:bg-gray-100 transition-colors cursor-pointer">
              <option>January</option>
              <option>February</option>
              <option>March</option>
              <option>April</option>
              <option>May</option>
              <option>June</option>
              <option>July</option>
              <option>August</option>
              <option>September</option>
              <option>October</option>
              <option>November</option>
              <option>December</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between mt-auto">
        <p className="text-[52px] font-bold text-gray-800 leading-none">{value}</p>
        {trend && (
          <p className="text-[11px] font-semibold text-green-500 mb-2">
            {trend} <span className="text-gray-400 font-medium">vs last month</span>
          </p>
        )}
      </div>
    </div>
  );
}

function BestSellingCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[150px]">
      <div className="flex justify-between items-start">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <div className="relative">
          <select className="appearance-none bg-[#FAFAFA] border border-gray-100 rounded-lg pl-3 pr-8 py-1.5 text-[10px] text-gray-500 font-medium outline-none hover:bg-gray-100 transition-colors cursor-pointer">
            <option>January</option>
            <option>February</option>
            <option>March</option>
            <option>April</option>
            <option>May</option>
            <option>June</option>
            <option>July</option>
            <option>August</option>
            <option>September</option>
            <option>October</option>
            <option>November</option>
            <option>December</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <p className="text-[32px] font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-[9px] text-green-500 font-bold text-right mb-2 leading-tight max-w-[100px]">
          {subtitle.split('\n')[0]}<br/>
          <span className="text-gray-400 font-medium">{subtitle.split('\n')[1]}</span>
        </p>
      </div>
    </div>
  );
}

export function AnalyticsDashboardClient({ header, data, showReports }: AnalyticsDashboardClientProps) {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-20">
      
      {/* Header */}
      {header.type === "rep" ? (
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden shrink-0">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(header.repName || "")}&background=f3f4f6&color=6b7280`} 
              alt={header.repName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-4 mb-1">
              <h1 className="text-[28px] font-bold text-gray-800 leading-tight">{header.repName}’s</h1>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-semibold text-sm">Manager Mode</span>
                <span className="bg-[#F3E8FF] text-[#A020F0] text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                  {header.repTeam}
                </span>
              </div>
            </div>
            <p className="text-gray-500 font-medium">Dashboard</p>
          </div>
        </div>
      ) : (
        <h1 className="text-3xl font-bold text-gray-800">Team's Analytics</h1>
      )}

      {header.type === "rep" && (
        <h2 className="text-2xl font-bold text-gray-600 -mb-4">Analytics</h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Row 1 */}
        <StatCard label="Total Products Sold" value={data.totalProductsSold.value} trend={data.totalProductsSold.trend} />
        <StatCard label="Total Order/Customer" value={data.totalOrderCustomer.value} trend={data.totalOrderCustomer.trend} />
        <BestSellingCard label="Best Selling Product" value={data.bestSellingProduct.name} subtitle={data.bestSellingProduct.subtitle} />

        {/* Row 2 */}
        <StatCard label="General Performance" value={data.generalPerformance.value} trend={data.generalPerformance.trend} />
        <StatCard label="Upselling Rate" value={data.upsellingRate.value} trend={data.upsellingRate.trend} />
        <StatCard label="Comfirmation Rate" value={data.confirmationRate.value} trend={data.confirmationRate.trend} />

        {/* Row 3 */}
        <StatCard label="Delivery Rate" value={data.deliveryRate.value} trend={data.deliveryRate.trend} />
        <StatCard label="Cancellation Rate" value={data.cancellationRate.value} trend={data.cancellationRate.trend} />
        <StatCard label="Recovery Rate" value={data.recoveryRate.value} trend={data.recoveryRate.trend} />
      </div>

      {/* Row 4: KPI Block */}
      <div className="bg-[#3B0069] rounded-[24px] p-8 text-white w-full md:w-[32%] flex flex-col justify-between h-[150px]">
         <div className="flex justify-between items-start">
            <p className="text-sm font-bold">KPI</p>
            <div className="text-right">
              <p className="text-[11px] text-purple-200">Target for the month:</p>
              <p className="text-lg font-bold">{data.kpi.target}</p>
            </div>
         </div>
         <div className="flex justify-between items-end">
            <p className="text-[52px] font-bold leading-none">{data.kpi.value}</p>
            <p className="text-[11px] font-bold text-white mb-2">{data.kpi.trend} <span className="text-purple-200 font-medium">vs last month</span></p>
         </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gray-200 my-4"></div>

      {/* Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Left Table */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Best Selling Product</h3>
            <div className="relative">
              <select className="appearance-none bg-[#FAFAFA] border border-gray-100 rounded-lg pl-3 pr-8 py-1.5 text-[10px] text-gray-500 font-medium outline-none hover:bg-gray-100 transition-colors cursor-pointer">
                <option>January</option>
                <option>February</option>
                <option>March</option>
                <option>April</option>
                <option>May</option>
                <option>June</option>
                <option>July</option>
                <option>August</option>
                <option>September</option>
                <option>October</option>
                <option>November</option>
                <option>December</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#F8F7FB]">
                <th className="px-6 py-4 font-bold text-gray-500 rounded-l-xl w-1/2">Product</th>
                <th className="px-6 py-4 font-bold text-gray-500 rounded-r-xl text-center">Amount Sold</th>
              </tr>
            </thead>
            <tbody>
              {data.bestSellingTable.map((row, idx) => (
                <tr key={idx} className={idx % 2 !== 0 ? "bg-[#F8F7FB]" : "bg-white"}>
                  <td className="px-6 py-5 font-medium text-gray-500 rounded-l-xl">{row.product}</td>
                  <td className="px-6 py-5 font-medium text-gray-500 text-center rounded-r-xl">{row.amountSold}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {showReports && (
            <div className="flex items-center gap-4 mt-4">
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 transition-colors cursor-pointer">
                  <option>September</option>
                  <option>August</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <button className="bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#A020F0] px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">↻</span>
                Generate Weekly Report →
              </button>
            </div>
          )}
        </div>

        {/* Right Table */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Upselling Rate</h3>
            <div className="relative">
              <select className="appearance-none bg-[#FAFAFA] border border-gray-100 rounded-lg pl-3 pr-8 py-1.5 text-[10px] text-gray-500 font-medium outline-none hover:bg-gray-100 transition-colors cursor-pointer">
                <option>January</option>
                <option>February</option>
                <option>March</option>
                <option>April</option>
                <option>May</option>
                <option>June</option>
                <option>July</option>
                <option>August</option>
                <option>September</option>
                <option>October</option>
                <option>November</option>
                <option>December</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#F8F7FB]">
                <th className="px-6 py-4 font-bold text-gray-500 rounded-l-xl w-1/2">Product</th>
                <th className="px-6 py-4 font-bold text-gray-500 rounded-r-xl text-center">No of Upsell</th>
              </tr>
            </thead>
            <tbody>
              {data.upsellingTable.map((row, idx) => (
                <tr key={idx} className={idx % 2 !== 0 ? "bg-[#F8F7FB]" : "bg-white"}>
                  <td className="px-6 py-5 font-medium text-gray-500 rounded-l-xl">{row.product}</td>
                  <td className="px-6 py-5 font-medium text-gray-500 text-center rounded-r-xl">{row.noOfUpsell}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {showReports && (
            <div className="flex items-center gap-4 mt-4">
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 transition-colors cursor-pointer">
                  <option>September</option>
                  <option>August</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <button className="bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#A020F0] px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">↻</span>
                Generate Montly Report →
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
