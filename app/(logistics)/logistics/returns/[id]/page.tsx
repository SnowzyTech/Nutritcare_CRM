"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  Trash2, 
  Printer 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReturnDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  // Mock data for the specific return
  const returnData = {
    rsId: `RS-00000${id}`,
    agent: "PAMTECH",
    qtyReturned: "120",
    status: "Damaged",
    recordedBy: "YUSUF",
    date: "15-03-2026",
    state: "Lagos State",
    warehouse: "Main Warehouse",
    remarks: "Damaged during transit",
    productName: "Shred Belly",
    productCode: "1252385252",
    unit: "150",
    quantity: "200"
  };

  return (
    <div className="space-y-10 pb-20 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-3 text-gray-500 font-bold hover:text-[#ad1df4] transition-all"
        >
          <div className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="text-lg">Back</span>
        </button>

        <div className="relative w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
          <input
            type="text"
            placeholder="search"
            className="w-full pl-10 pr-4 py-2.5 text-lg border-none rounded-lg focus:outline-none bg-white/50 text-gray-400 placeholder:text-gray-300 shadow-sm border border-gray-50"
          />
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-50 p-12 space-y-12 min-h-[600px] flex flex-col justify-between">
        <div className="flex justify-between items-start">
          {/* Left: Title & Badge */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-800">Returned</h1>
            <p className="text-sm text-gray-400 font-medium">Voucher</p>
            <div className="mt-4">
              <span className="px-3 py-1 bg-[#22c55e] text-white text-[10px] font-bold rounded-sm">
                RECORDED
              </span>
            </div>
          </div>

          {/* Right: Info Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm w-[400px]">
            <div className="text-gray-500 font-bold">RS-ID:</div>
            <div className="text-gray-700 font-bold">{returnData.rsId}</div>
            
            <div className="text-gray-500 font-bold">Agent:</div>
            <div className="text-gray-700 font-bold">{returnData.agent}</div>
            
            <div className="text-gray-500 font-bold">Quantity Returned:</div>
            <div className="text-gray-700 font-bold">{returnData.qtyReturned}</div>
            
            <div className="text-gray-500 font-bold">Status:</div>
            <div className="text-gray-700 font-bold">
              {returnData.status === "Damaged" ? (
                <span><span className="text-gray-700">Da</span><span className="text-gray-400">maged</span></span>
              ) : returnData.status}
            </div>
            
            <div className="text-gray-500 font-bold">Recorded By:</div>
            <div className="text-gray-700 font-bold">{returnData.recordedBy}UF</div>
            
            <div className="text-gray-500 font-bold">Date:</div>
            <div className="text-gray-700 font-bold">{returnData.date}</div>

            {/* Additional details requested by user */}
            <div className="text-gray-500 font-bold">State:</div>
            <div className="text-gray-700 font-bold">{returnData.state}</div>

            <div className="text-gray-500 font-bold">Warehouse:</div>
            <div className="text-gray-700 font-bold">{returnData.warehouse}</div>

            <div className="text-gray-500 font-bold">Remarks:</div>
            <div className="text-gray-700 font-bold">{returnData.remarks}</div>
          </div>
        </div>

        {/* Table Area */}
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-[#4a0b79] text-white">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Product Code</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr className="text-gray-500 font-medium">
                <td className="px-6 py-6">{returnData.productName}</td>
                <td className="px-6 py-6">{returnData.productCode}</td>
                <td className="px-6 py-6">{returnData.unit}</td>
                <td className="px-6 py-6 text-right">{returnData.quantity}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button variant="outline" className="bg-[#f3f4f6] border-none text-gray-500 font-bold px-8 h-10 gap-2">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button className="bg-[#f3f4f6] border-none text-gray-500 font-bold px-8 h-10 gap-2">
            <Printer className="w-4 h-4" />
            PDF/Print
          </Button>
        </div>
      </div>
    </div>
  );
}
