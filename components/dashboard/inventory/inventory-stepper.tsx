"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Order in", completed: true },
  { label: "Confirm stock", completed: true },
  { label: "Pick & Pack", completed: true },
  { label: "Dispatch", active: true },
  { label: "Delivered", disabled: true },
];

export function InventoryStepper() {
  return (
    <div className="flex items-center gap-4 bg-[#FDF8FF] p-4 rounded-2xl border border-purple-50/50 mb-8 w-fit">
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div className="flex items-center gap-2">
            <div 
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                step.completed ? "bg-black text-white" : 
                step.active ? "bg-[#9D00FF] text-white" : 
                "bg-gray-200 text-gray-400"
              )}
            >
              {step.completed ? <Check className="w-3 h-3" /> : index + 1}
            </div>
            <span 
              className={cn(
                "text-xs font-medium",
                step.disabled ? "text-gray-400" : "text-gray-700"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="text-gray-300 text-xs font-light"> &gt; </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
