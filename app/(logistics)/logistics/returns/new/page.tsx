"use client";

import React from "react";
import Link from "next/link";
import { Filter, ArrowUpDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReturnedStockPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-4 pb-20">
      {/* Toolbar */}
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 text-gray-500 font-medium hover:text-gray-700">
          <Filter className="w-5 h-5 text-gray-400" />
          Filter
        </button>
        <button className="text-gray-400 hover:text-gray-600">
          <ArrowUpDown className="w-5 h-5" />
        </button>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 min-h-[600px] flex flex-col relative">
        <div className="grid grid-cols-2 gap-12">
          {/* Left: Title */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-800">Returned Stock</h1>
            <p className="text-xs text-gray-400 font-medium uppercase">Voucher</p>
          </div>

          {/* Right: Form Fields */}
          <div className="space-y-6">
            <FormRow label="State*">
              <Select>
                <SelectTrigger className="h-10 text-xs text-gray-400 border-gray-200 bg-white">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lagos">Lagos</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>

            <FormRow label="Country*">
              <Select>
                <SelectTrigger className="h-10 text-xs text-gray-400 border-gray-200 bg-white">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nigeria">Nigeria</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>

            <FormRow label="Date*">
              <Input placeholder="Type in here" className="h-10 text-xs border-gray-200" />
            </FormRow>

            <FormRow label="Product*">
              <Select>
                <SelectTrigger className="h-10 text-xs text-gray-400 border-gray-200 bg-white">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balm">Balm</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>

            {/* Damaged Checkbox */}
            <div className="grid grid-cols-[120px,1fr] gap-4 items-center">
              <div></div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#faf5ff] border border-[#ad1df4] flex items-center justify-center cursor-pointer">
                  <CheckCircle2 className="w-4 h-4 text-[#ad1df4]" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Damaged</span>
              </div>
            </div>

            <FormRow label="Quantity">
              <Input placeholder="Type in here" className="h-10 text-xs border-gray-200" />
            </FormRow>

            <FormRow label="Agent">
              <Select>
                <SelectTrigger className="h-10 text-xs text-gray-400 border-gray-200 bg-white">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>

            <FormRow label="Remarks">
              <Input placeholder="Type in here" className="h-10 text-xs border-gray-200" />
            </FormRow>
          </div>
        </div>

        {/* Notes Area */}
        <div className="mt-16 space-y-3">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Notes</label>
          <Textarea 
            placeholder="Type in here" 
            className="min-h-[120px] bg-white border-gray-200 text-xs focus:ring-[#ad1df4]"
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-10">
          <Link href="/logistics/returns">
            <Button 
              variant="outline" 
              className="bg-[#d1d5db] border-none text-white hover:bg-[#9ca3af] px-10 h-10 font-bold rounded-lg text-sm"
            >
              Cancel
            </Button>
          </Link>
          <Button 
            className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-10 h-10 font-bold rounded-lg text-sm"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px,1fr] gap-4 items-center">
      <label className="text-[11px] font-bold text-yellow-600 uppercase text-right">{label}</label>
      {children}
    </div>
  );
}
