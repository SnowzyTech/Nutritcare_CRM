"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { LocationBin } from "@/lib/mock-data/warehouse";

interface Props {
  initialBins: LocationBin[];
  summaryData: { bin: string; product: string; qty: string }[];
}

const binColour: Record<string, string> = {
  Full: "bg-[#059669] text-white", // Green
  Partial: "bg-[#F59E0B] text-white", // Orange
  Reserved: "bg-[#DC2626] text-white", // Red
  Empty: "bg-[#ad1df4] text-white", // Purple
  Damage: "bg-[#9CA3AF] text-white", // Gray
};

const legendItems = [
  { label: "Full", color: "bg-[#059669]" },
  { label: "Partial", color: "bg-[#F59E0B]" },
  { label: "Reserved", color: "bg-[#DC2626]" },
  { label: "Empty", color: "bg-[#ad1df4]" },
  { label: "Damage", color: "bg-[#9CA3AF]" },
];

export default function LocationManagementClient({ initialBins, summaryData }: Props) {
  const [zones, setZones] = useState<string[]>(["A", "B", "C", "D"]);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const cols = ["1", "2", "3", "4", "5", "6"];

  const handleAddLocation = () => {
    // Determine the next zone letter (e.g. 'E' after 'D')
    const lastZone = zones[zones.length - 1];
    const nextZone = String.fromCharCode(lastZone.charCodeAt(0) + 1);
    setZones([...zones, nextZone]);
  };

  const handleRemoveLocation = () => {
    if (window.confirm("Are you sure you want to delete the last added shelf?")) {
      setZones(zones.slice(0, -1));
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 mt-4 max-w-7xl">
        {/* Left Column: Map */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#d1d5db] text-gray-500 text-[11px] font-medium px-4 py-2.5 rounded-md flex-1 shadow-sm">
              Shelf / Bin Map
            </div>
            {zones.length > 4 && (
              <button
                onClick={handleRemoveLocation}
                className="bg-[#DC2626] text-white text-[11px] font-bold px-4 py-2.5 rounded-md hover:bg-red-700 transition-colors shadow-sm"
              >
                - Remove Location
              </button>
            )}
            <button
              onClick={handleAddLocation}
              className="bg-[#ad1df4] text-white text-[11px] font-bold px-8 py-2.5 rounded-md hover:bg-[#9b19dc] transition-colors shadow-sm"
            >
              + Add Location
            </button>
          </div>
          <p className="text-[10px] text-gray-500">Click any bin to view content</p>

          <div className="grid grid-cols-6 gap-2.5 mt-2">
            {zones.flatMap((zone) =>
              cols.map((col) => {
                const bin = initialBins.find((b) => b.zone === zone && b.bin === col);
                // Default new shelves to 'Empty' (Purple)
                const colour = bin ? binColour[bin.status] : binColour["Empty"];
                const binId = `${zone}${col}`;

                return (
                  <button
                    key={binId}
                    onClick={() => setSelectedBin(binId)}
                    className={`${colour} rounded-[4px] flex items-center justify-center font-bold text-2xl hover:opacity-90 transition-opacity cursor-pointer aspect-square shadow-sm`}
                    title={bin?.status || "Empty"}
                  >
                    {binId}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-1">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                <div className={`w-2.5 h-2.5 rounded-[1px] ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Location Summary */}
        <div>
          <div className="bg-white overflow-hidden shadow-sm rounded-md">
            <div className="bg-[#d1d5db] px-5 py-2.5 rounded-t-md">
              <h2 className="text-[11px] font-medium text-gray-600">Location Summery</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-[#faf5ff]">
                  <tr className="text-gray-500 text-left font-medium">
                    <th className="px-5 py-4 w-12 font-medium">
                      <Checkbox className="border-gray-300" />
                    </th>
                    <th className="px-4 py-4 font-medium">BIN</th>
                    <th className="px-4 py-4 font-medium">Product</th>
                    <th className="px-4 py-4 font-medium">QTY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 border-t border-white">
                  {summaryData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <Checkbox className="border-gray-300" />
                      </td>
                      <td className="px-4 py-4 text-gray-500">{row.bin}</td>
                      <td className="px-4 py-4 text-gray-500">{row.product}</td>
                      <td className="px-4 py-4 text-gray-500">{row.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bin Details Modal */}
      {selectedBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-10 relative shadow-2xl">
            <button
              onClick={() => setSelectedBin(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
            >
              âœ•
            </button>

            <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
              {/* Left side header */}
              <div>
                <h2 className="text-[32px] font-medium text-gray-900 mb-1 leading-tight">
                  {selectedBin} Shelve
                </h2>
                <p className="text-[13px] text-gray-400 mb-3">Voucher</p>
                <span className="inline-block bg-[#c2841b] text-white text-[11px] tracking-wide px-3 py-0.5 rounded shadow-sm">
                  RECORDED
                </span>
              </div>

              {/* Right side Info Card */}
              <div className="bg-[#f8f9fa] rounded-xl p-6 w-full md:w-[360px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold text-[15px]">Shelf:</span>
                    <span className="text-gray-700 text-[15px]">{selectedBin}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold text-[15px]">Supplier:</span>
                    <span className="text-gray-700 text-[15px] uppercase tracking-wide">
                      Austin
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold text-[15px]">Recorded By:</span>
                    <span className="text-gray-700 text-[15px] uppercase tracking-wide">
                      Yusuf
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-bold text-[15px]">Date Received:</span>
                    <span className="text-gray-700 text-[15px]">15-03-2026</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 shadow-sm rounded-lg p-0.5 bg-white overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-[#4a0b79] text-white">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-normal text-[13px]">#</th>
                    <th className="px-5 py-3.5 text-left font-normal text-[13px]">Product</th>
                    <th className="px-5 py-3.5 text-left font-normal text-[13px]">Product Code</th>
                    <th className="px-5 py-3.5 text-right font-normal text-[13px]">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-5 text-gray-400 text-[13px]">1</td>
                    <td className="px-5 py-5 text-gray-500 text-[13px]">Shred Belly</td>
                    <td className="px-5 py-5 text-gray-400 text-[13px]">123456789</td>
                    <td className="px-5 py-5 text-gray-500 text-[13px] text-right">200</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
