import React from "react";
import type { AlertRow } from "@/modules/inventory/services/inventory.service";

export function AlertsList({ alerts }: { alerts: AlertRow[] }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm h-full">
      <div className="bg-white px-6 py-4 border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-400">Alerts</h3>
      </div>
      <div className="p-6 space-y-6">
        {alerts.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium">No active alerts.</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="flex gap-4">
              <div
                className="w-2 h-2 rounded-full shrink-0 mt-2"
                style={{ backgroundColor: alert.color }}
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
          ))
        )}
      </div>
    </div>
  );
}
