"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, ArrowLeft, CheckCircle, CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const products = [
  "Balm",
  "Shred Belly",
  "Trim & Tone",
  "NutriShake Vanilla",
  "NutriShake Chocolate",
  "Balm Recovery",
  "Protein Plus",
];

const agentWarehouses = [
  "John",
  "Felix",
  "Pamtec",
  "Kenneth",
  "Pamtech",
  "Abuja Warehouse",
  "Lagos Warehouse",
];

export default function AddReturnClient() {
  const router = useRouter();
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [product, setProduct] = useState("");
  const [damaged, setDamaged] = useState(true);
  const [quantity, setQuantity] = useState("");
  const [agentWarehouse, setAgentWarehouse] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="bg-white min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center gap-4 px-8 py-6 border-b border-gray-100">
        <Link
          href="/warehouse/returns"
          className="flex items-center gap-2 text-gray-500 text-[14px] font-medium hover:text-gray-700 transition-colors"
        >
          <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-500 flex items-center justify-center">
            <ArrowLeft className="w-3 h-3 stroke-[3]" />
          </div>
          Back
        </Link>
        <div className="flex items-center gap-4 ml-auto">
          <button className="flex items-center gap-2 text-gray-500 text-[14px] font-medium hover:text-gray-700">
            <Filter className="w-[18px] h-[18px]" />
            Filter
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <ArrowUpDown className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Header + Form */}
        <div className="flex gap-12">
          {/* Left — Title */}
          <div className="flex-shrink-0 pt-2">
            <h1 className="text-[22px] font-semibold text-gray-800">Returned Stock</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Voucher</p>
          </div>

          {/* Right — Form Fields */}
          <div className="flex-1 space-y-5">
            {/* State */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                State<span className="text-red-500">*</span>
              </label>
              <Select value={state} onValueChange={(v) => v && setState(v)}>
                <SelectTrigger className="w-full max-w-[320px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {nigerianStates.map((s) => (
                    <SelectItem key={s} value={s} className="text-[13px]">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                Country<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Type in here"
                className="w-full max-w-[320px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] text-gray-400 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF]"
              />
            </div>

            {/* Date */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                Date<span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger>
                  <div
                    className={cn(
                      "w-full max-w-[320px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] cursor-pointer",
                      !date && "text-gray-400"
                    )}
                  >
                    {date ? format(date, "PPP") : "Type in here"}
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Product */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                Product<span className="text-red-500">*</span>
              </label>
              <Select value={product} onValueChange={(v) => v && setProduct(v)}>
                <SelectTrigger className="w-full max-w-[320px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p} value={p} className="text-[13px]">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Damaged Checkbox */}
            <div className="flex items-center gap-6">
              <div className="w-[160px]" />
              <button
                onClick={() => setDamaged(!damaged)}
                className="flex items-center gap-2 text-[13px] text-gray-700 font-medium"
              >
                <CheckCircle
                  className={`w-[20px] h-[20px] ${
                    damaged ? "text-[#9747FF] fill-[#9747FF] stroke-white" : "text-gray-300"
                  } transition-colors`}
                />
                Damaged
              </button>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-700 w-[160px] text-right">
                Quantity
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Type in here"
                className="w-full max-w-[320px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] text-gray-400 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF]"
              />
            </div>

            {/* Agent/Warehouse */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-700 w-[160px] text-right">
                Agent/Warehouse
              </label>
              <Select value={agentWarehouse} onValueChange={(v) => v && setAgentWarehouse(v)}>
                <SelectTrigger className="w-full max-w-[320px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  {agentWarehouses.map((a) => (
                    <SelectItem key={a} value={a} className="text-[13px]">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Remarks */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-700 w-[160px] text-right">
                Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Type in here"
                className="w-full max-w-[320px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] text-gray-400 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF]"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-10">
          <label className="text-[12px] font-medium text-gray-600 block mb-2">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type in here"
            className="w-full h-[80px] border border-gray-200 rounded-md px-3 py-2.5 text-[13px] text-gray-400 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-8">
          <Button
            onClick={() => router.push("/warehouse/returns")}
            className="bg-gray-200 text-gray-600 hover:bg-gray-300 text-[13px] font-medium px-5 h-[36px] rounded-md"
          >
            Cancel
          </Button>
          <Button className="bg-[#9747FF] text-white hover:bg-[#7C3AED] text-[13px] font-medium px-6 h-[36px] rounded-md">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
