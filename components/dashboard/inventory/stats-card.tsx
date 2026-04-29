import React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string;
  status: string;
  statusColor: string;
  bgColor?: string;
  textColor?: string;
  labelColor?: string;
}

export function StatsCard({ 
  label, 
  value, 
  status, 
  statusColor, 
  bgColor = "bg-white",
  textColor = "text-gray-900",
  labelColor = "text-gray-500"
}: StatsCardProps) {
  return (
    <div className={cn("p-5 rounded-2xl border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden shadow-sm", bgColor)}>
      <div className="flex justify-between items-start">
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          labelColor
        )}>
          {label}
        </span>
      </div>
      <div className="flex justify-between items-end mt-auto">
        <span className={cn(
          "text-3xl font-bold",
          textColor
        )}>
          {value}
        </span>
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-md uppercase", 
          statusColor
        )}>
          {status}
        </span>
      </div>
    </div>
  );
}
