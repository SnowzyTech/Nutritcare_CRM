"use client";

import React from "react";
import Link from "next/link";
import { 
  Search, 
  PlusCircle, 
  Filter, 
  ArrowUpDown, 
  ArrowLeft 
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReturnsPage() {
  const mockReturns = [
    { id: 1, date: "24 Feb 2026", product: "Balm", state: "Abia State", agent: "John", qty: "120", damaged: "Yes", remarks: "Note", addedBy: "Yusuf Adeyemi" },
    { id: 2, date: "25 Feb 2026", product: "Shred Belly", state: "Lagos State", agent: "Femi", qty: "120", damaged: "Yes", remarks: "Note", addedBy: "Yusuf Adeyemi" },
    { id: 3, date: "27 Feb 2026", product: "Trim & Tone", state: "Lagos State", agent: "Pamtec", qty: "120", damaged: "Yes", remarks: "Note", addedBy: "Yusuf Adeyemi" },
    { id: 4, date: "01 Mar 2026", product: "Shred Belly", state: "Enugu State", agent: "John", qty: "120", damaged: "Yes", remarks: "Note", addedBy: "Yusuf Adeyemi" },
    { id: 5, date: "04 Mar 2026", product: "Balm", state: "Abia State", agent: "Kenneth", qty: "120", damaged: "Yes", remarks: "Note", addedBy: "Yusuf Adeyemi" },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Toolbar Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-gray-500 font-medium hover:text-gray-700">
            <Filter className="w-5 h-5 text-gray-400" />
            Filter
          </button>
          <Link href="/logistics/returns/new">
            <button className="flex items-center gap-2 text-gray-500 font-medium hover:text-gray-700">
              Add New
              <PlusCircle className="w-5 h-5 text-gray-400" />
            </button>
          </Link>
          <button className="text-gray-400 hover:text-gray-600">
            <ArrowUpDown className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="search"
            className="w-full pl-10 pr-4 py-2 text-sm border-none rounded-lg focus:outline-none bg-white"
          />
        </div>
      </div>

      {/* Bulk Action Section */}
      <div className="flex items-center gap-4">
        <Select>
          <SelectTrigger className="w-48 h-10 text-xs text-gray-400 bg-white border-gray-200">
            <SelectValue placeholder="Select Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delete">Delete Selected</SelectItem>
            <SelectItem value="export">Export Selected</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-8 h-10 font-bold rounded-md">
          Go
        </Button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] text-left">
            <thead className="bg-[#faf5ff] text-gray-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-4 w-10"><Checkbox className="border-gray-300" /></th>
                <th className="px-4 py-4">ID</th>
                <th className="px-4 py-4">DATE</th>
                <th className="px-4 py-4">Product Name</th>
                <th className="px-4 py-4">State</th>
                <th className="px-4 py-4">Agent</th>
                <th className="px-4 py-4">Qty Returned</th>
                <th className="px-4 py-4">Damaged</th>
                <th className="px-4 py-4">Remarks</th>
                <th className="px-4 py-4">Added By:</th>
                <th className="px-4 py-4 text-right">
                  <Search className="w-4 h-4 ml-auto text-gray-800 cursor-pointer" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockReturns.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-4"><Checkbox className="border-gray-300" /></td>
                  <td className="px-4 py-4 text-gray-600 font-medium">{item.id}</td>
                  <td className="px-4 py-4 text-gray-500">{item.date}</td>
                  <td className="px-4 py-4 text-gray-500">{item.product}</td>
                  <td className="px-4 py-4 text-gray-500">{item.state}</td>
                  <td className="px-4 py-4 text-gray-500">{item.agent}</td>
                  <td className="px-4 py-4 text-gray-500">{item.qty}</td>
                  <td className="px-4 py-4 text-gray-500">{item.damaged}</td>
                  <td className="px-4 py-4 text-gray-500">{item.remarks}</td>
                  <td className="px-4 py-4 text-gray-500">{item.addedBy}</td>
                  <td className="px-4 py-4"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex justify-end pt-12">
        <button className="flex items-center gap-2 text-gray-800 font-bold hover:text-[#ad1df4] transition-colors">
          <div className="w-8 h-8 rounded-full border-2 border-gray-800 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </div>
          Back
        </button>
      </div>
    </div>
  );
}
