"use client";

import React from "react";
import { Circle } from "lucide-react";
import type { HistoryGroup } from "./page";

export function HistoryClient({ groups }: { groups: HistoryGroup[] }) {
  const renderDescription = (description: string, boldText?: string) => {
    if (!boldText) return description;
    const parts = description.split("{BOLD}");
    return (
      <>
        {parts[0]}
        <span className="font-bold text-gray-700">{boldText}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col pb-20">
      <h1 className="text-[28px] font-bold text-gray-600 mb-6">History</h1>

      <div className="flex flex-col">
        {groups.map((group, groupIdx) => (
          <div key={group.id} className={groupIdx > 0 ? "mt-12" : ""}>
            {/* Group Header */}
            <div className="flex justify-end items-center mb-4">
              <p className="text-[11px] text-gray-500">
                <span className="font-bold text-gray-700">{group.labelPrefix}</span>{" "}
                {group.dateLabel}
              </p>
            </div>

            <div className="w-full flex flex-col">
              {/* Only the very first group has the column headers */}
              {groupIdx === 0 && (
                <div className="flex items-center px-6 py-5 bg-[#F8F7FB] rounded-t-xl mb-1">
                  <div className="w-24 shrink-0"></div>
                  <div className="flex-1 font-bold text-[11px] text-gray-600">Date & Time</div>
                  <div className="flex-1 font-bold text-[11px] text-gray-600">Activity Type</div>
                  <div className="flex-[1.5] font-bold text-[11px] text-gray-600">Description</div>
                </div>
              )}

              {/* Rows */}
              <div className="flex flex-col">
                {group.activities.map((activity, idx) => (
                  <div
                    key={activity.id}
                    className={`flex items-center px-6 py-5 ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#F8F7FB]"
                    }`}
                  >
                    <div className="w-24 shrink-0 flex items-center justify-center">
                      <Circle size={16} className="text-gray-400" strokeWidth={2} />
                    </div>
                    <div className="flex-1 text-xs font-medium text-gray-500 pr-4">
                      {activity.time}
                    </div>
                    <div className="flex-1 text-xs font-medium text-gray-500 pr-4">
                      {activity.type}
                    </div>
                    <div className="flex-[1.5] text-xs font-medium text-gray-500">
                      {renderDescription(activity.description, activity.boldText)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
