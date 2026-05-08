"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, CheckCircle, CalendarIcon, PlusCircle, ArrowLeft } from "lucide-react";
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

const agents = [
  "John",
  "Felix",
  "Pamtec",
  "Kenneth",
  "Pamtech",
  "Austin Adedeji",
  "Linus Papa",
];

export default function AddOutgoingClient() {
  const router = useRouter();
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [product, setProduct] = useState("");
  const [sendingToAgent, setSendingToAgent] = useState(true);
  const [supplierRef, setSupplierRef] = useState("");
  const [toAgent, setToAgent] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="bg-white min-h-screen pb-10">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 text-[14px] font-medium hover:text-gray-900 transition-colors"
        >
          <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-600 flex items-center justify-center">
            <ArrowLeft className="w-3 h-3 stroke-[3]" />
          </div>
          Back
        </button>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-gray-500 text-[14px] font-medium hover:text-gray-700">
            <Filter className="w-[18px] h-[18px]" />
            Filter
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <ArrowUpDown className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      <div className="px-10 py-8">
        {/* Header + Form */}
        <div className="flex gap-12">
          {/* Left — Title */}
          <div className="flex-shrink-0 pt-2 w-[180px]">
            <h1 className="text-[22px] font-medium text-gray-800">Stock Out</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">Voucher</p>
          </div>

          {/* Right — Form Fields */}
          <div className="flex-1 space-y-6">
            {/* State */}
            <div className="flex items-center gap-8">
              <label className="text-[12px] font-semibold text-amber-600 w-[180px] text-left">
                State<span className="text-amber-600">*</span>
              </label>
              <Select value={state} onValueChange={(v) => v && setState(v)}>
                <SelectTrigger className="w-full max-w-[400px] h-[36px] border border-gray-200 text-[13px] text-gray-300 focus:ring-[#9747FF] focus:border-[#9747FF]">
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
            <div className="flex items-center gap-8">
              <label className="text-[12px] font-semibold text-amber-600 w-[180px] text-left">
                Country<span className="text-amber-600">*</span>
              </label>
              <Select value={country} onValueChange={(v) => v && setCountry(v)}>
                <SelectTrigger className="w-full max-w-[400px] h-[36px] border border-gray-200 text-[13px] text-gray-300 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nigeria" className="text-[13px]">Nigeria</SelectItem>
                  <SelectItem value="Ghana" className="text-[13px]">Ghana</SelectItem>
                  <SelectItem value="Kenya" className="text-[13px]">Kenya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="flex items-center gap-8">
              <label className="text-[12px] font-semibold text-amber-600 w-[180px] text-left">
                Date<span className="text-amber-600">*</span>
              </label>
              <Popover>
                <PopoverTrigger>
                  <div
                    className={cn(
                      "w-full max-w-[400px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] cursor-pointer",
                      !date && "text-gray-300"
                    )}
                  >
                    {date ? format(date, "PPP") : "Type in here"}
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
            <div className="flex items-center gap-8">
              <label className="text-[12px] font-semibold text-amber-600 w-[180px] text-left">
                Product<span className="text-amber-600">*</span>
              </label>
              <Select value={product} onValueChange={(v) => v && setProduct(v)}>
                <SelectTrigger className="w-full max-w-[400px] h-[36px] border border-gray-200 text-[13px] text-gray-300 focus:ring-[#9747FF] focus:border-[#9747FF]">
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

            {/* Are you sending Checkbox */}
            <div className="flex items-center gap-8 py-2">
              <div className="w-[180px]" />
              <button
                onClick={() => setSendingToAgent(!sendingToAgent)}
                className="flex items-center gap-3 text-[14px] text-gray-800 font-medium"
              >
                <CheckCircle
                  className={`w-5 h-5 flex-shrink-0 ${
                    sendingToAgent ? "text-[#9747FF] fill-[#9747FF] stroke-white" : "text-gray-300"
                  } transition-colors`}
                />
                Are you sending this product from one<br />Agent to another Agent?
              </button>
            </div>

            {/* Supplier Reference */}
            <div className="flex items-center gap-8">
              <label className="text-[12px] font-bold text-gray-900 w-[180px] text-left">
                Supplier Reference
              </label>
              <input
                type="text"
                value={supplierRef}
                onChange={(e) => setSupplierRef(e.target.value)}
                placeholder="Type in here"
                className="w-full max-w-[400px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF]"
              />
            </div>

            {/* To Agent */}
            <div className="flex items-center gap-8">
              <label className="text-[12px] font-bold text-gray-900 w-[180px] text-left">
                To Agent
              </label>
              <Select value={toAgent} onValueChange={(v) => v && setToAgent(v)}>
                <SelectTrigger className="w-full max-w-[400px] h-[36px] border border-gray-200 text-[13px] text-gray-300 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a} value={a} className="text-[13px]">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity To Send */}
            <div className="flex items-center gap-8">
              <label className="text-[12px] font-bold text-gray-900 w-[180px] text-left">
                Quantity To Send
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Type in here"
                className="w-full max-w-[400px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF]"
              />
            </div>
          </div>
        </div>

        {/* Add Bulks */}
        <div className="mt-8 mb-6 border-b border-gray-100 pb-10">
          <button className="flex items-center gap-2 text-gray-300 text-[14px] font-medium hover:text-gray-500 transition-colors">
            <PlusCircle className="w-5 h-5 fill-gray-200 text-white" />
            Add Bulks
          </button>
        </div>

        {/* Notes */}
        <div className="mt-6 mb-8">
          <label className="text-[12px] font-medium text-gray-700 block mb-2">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type in here"
            className="w-full h-[100px] border border-gray-200 rounded-md px-4 py-3 text-[13px] text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-8">
          <Button
            onClick={() => router.push("/warehouse/outgoing")}
            className="bg-gray-200 text-gray-600 hover:bg-gray-300 text-[13px] font-medium px-8 h-[38px] rounded-md"
          >
            Cancel
          </Button>
          <Button className="bg-[#A855F7] text-white hover:bg-[#9333EA] text-[13px] font-medium px-8 h-[38px] rounded-md">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
