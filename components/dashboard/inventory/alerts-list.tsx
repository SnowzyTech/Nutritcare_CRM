import React from "react";
import { recentAlerts } from "@/lib/mock-data/inventory";

export function AlertsList() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm h-full">
      <div className="bg-white px-6 py-4 border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-400">Alerts</h3>
      </div>
      <div className="p-6 space-y-6">
        {recentAlerts.map((alert) => (
          <div key={alert.id} className="flex gap-4">
            <div 
              className="w-2 h-2 rounded-full shrink-0 mt-2" 
              style={{ backgroundColor: alert.color || '#9D00FF' }}
            />
            <div>
              <p className="text-xs text-gray-700 font-medium leading-relaxed">
                {alert.message}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-400 font-medium">{alert.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
