"use client";

import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { stockMovementData } from "@/lib/mock-data/inventory";

export function StockMovementChart() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm h-full flex flex-col">
      <div className="bg-white px-6 py-4 border-b border-gray-50 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-400">Stock movement - 7 Days</h3>
      </div>
      <div className="p-6 flex-1 bg-white">
        <div className="flex gap-12 mb-8">
          <div>
            <div className="text-lg font-bold text-gray-700">2,340</div>
            <div className="text-[10px] text-gray-400 font-medium">Received</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-700">1,876</div>
            <div className="text-[10px] text-gray-400 font-medium">Dispatched</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-700">464</div>
            <div className="text-[10px] text-gray-400 font-medium">Net</div>
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stockMovementData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={0}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#9CA3AF", fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#9CA3AF", fontWeight: 500 }}
                domain={[0, 500]}
                ticks={[100, 200, 300, 400, 500]}
              />
              <Tooltip 
                cursor={{ fill: "transparent" }}
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
              />
              <Bar 
                dataKey="received" 
                stackId="a" 
                fill="#C6E2FF" 
                radius={[0, 0, 0, 0]} 
                barSize={16}
              />
              <Bar 
                dataKey="dispatched" 
                stackId="a" 
                fill="#2E85FF" 
                radius={[4, 4, 0, 0]} 
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
