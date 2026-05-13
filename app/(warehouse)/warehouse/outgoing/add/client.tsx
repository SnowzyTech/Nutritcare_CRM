"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, CheckCircle, CalendarIcon, ArrowLeft, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { OutgoingFormAgent, OutgoingFormProduct } from "@/modules/warehouse/services/warehouse.service";
import { createOutgoingMovementAction } from "@/modules/warehouse/actions/outgoing.action";

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

type ProductRow = {
  rowId: number;
  productId: string;
  productName: string;
  productCode: string;
  quantity: string;
};

interface Props {
  agents: OutgoingFormAgent[];
  products: OutgoingFormProduct[];
}

export default function AddOutgoingClient({ agents, products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedState, setSelectedState] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [agentId, setAgentId] = useState("");
  const [isAgentToAgent, setIsAgentToAgent] = useState(false);
  const [supplierRef, setSupplierRef] = useState("");
  const [notes, setNotes] = useState("");

  const [productRows, setProductRows] = useState<ProductRow[]>([
    { rowId: 1, productId: "", productName: "", productCode: "", quantity: "" },
  ]);
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSelectProduct = (product: OutgoingFormProduct, index: number) => {
    const updated = [...productRows];
    updated[index] = { ...updated[index], productId: product.id, productName: product.name, productCode: product.sku };
    setProductRows(updated);
    setProductSearch("");
    setShowDropdown(false);
    setActiveRowIndex(null);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updated = [...productRows];
    updated[index] = { ...updated[index], quantity: value };
    setProductRows(updated);
  };

  const addProductRow = () => {
    setProductRows([
      ...productRows,
      { rowId: productRows.length + 1, productId: "", productName: "", productCode: "", quantity: "" },
    ]);
  };

  const removeProductRow = (index: number) => {
    if (productRows.length <= 1) return;
    setProductRows(productRows.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validItems = productRows.filter(
      (r) => r.productId && r.quantity && parseInt(r.quantity) > 0
    );

    if (!selectedState) return setError("State is required");
    if (!country) return setError("Country is required");
    if (!date) return setError("Date is required");
    if (!agentId) return setError("Agent is required");
    if (validItems.length === 0) return setError("At least one product with quantity is required");

    const fd = new FormData();
    fd.set("state", selectedState);
    fd.set("country", country);
    fd.set("date", date.toISOString());
    fd.set("agentId", agentId);
    fd.set("isAgentToAgentTransfer", String(isAgentToAgent));
    fd.set("supplierReference", supplierRef);
    fd.set("notes", notes);
    fd.set(
      "items",
      JSON.stringify(validItems.map((r) => ({ productId: r.productId, quantity: parseInt(r.quantity) })))
    );

    startTransition(async () => {
      const result = await createOutgoingMovementAction(null, fd);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="bg-white min-h-screen pb-10">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 text-[14px] font-medium hover:text-gray-900 transition-colors"
        >
          <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-600 flex items-center justify-center">
            <ArrowLeft className="w-3 h-3 stroke-[3]" />
          </div>
          Back
        </button>

        <div className="flex items-center gap-4">
          <button type="button" className="flex items-center gap-2 text-gray-500 text-[14px] font-medium hover:text-gray-700">
            <Filter className="w-[18px] h-[18px]" />
            Filter
          </button>
          <button type="button" className="text-gray-400 hover:text-gray-600">
            <ArrowUpDown className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-10 py-8">
        {/* Header + Form Fields */}
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
              <Select value={selectedState} onValueChange={(v) => v && setSelectedState(v)}>
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
                      !date ? "text-gray-300" : "text-gray-700"
                    )}
                  >
                    {date ? format(date, "PPP") : "Select a date"}
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

            {/* Agent-to-Agent Checkbox */}
            <div className="flex items-center gap-8 py-2">
              <div className="w-[180px]" />
              <button
                type="button"
                onClick={() => setIsAgentToAgent(!isAgentToAgent)}
                className="flex items-center gap-3 text-[14px] text-gray-800 font-medium"
              >
                <CheckCircle
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isAgentToAgent ? "text-[#9747FF] fill-[#9747FF] stroke-white" : "text-gray-300"
                  }`}
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
                To Agent<span className="text-amber-600">*</span>
              </label>
              <Select value={agentId} onValueChange={(v) => v && setAgentId(v)}>
                <SelectTrigger className="w-full max-w-[400px] h-[36px] border border-gray-200 text-[13px] text-gray-300 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {agents.length === 0 ? (
                    <div className="px-3 py-2 text-[13px] text-gray-400">No agents found</div>
                  ) : (
                    agents.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-[13px]">
                        {a.companyName}{a.state ? ` — ${a.state}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="mt-10 border border-gray-200 rounded-lg shadow-sm overflow-visible">
          <div className="bg-white px-4 py-2.5 border-b border-gray-100">
            <span className="text-[12px] text-gray-400">Products</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[#4A0E78] text-white">
                <th className="px-4 py-2.5 text-[11px] font-medium text-left w-12">#</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-left w-36">Product Code</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-right w-32">Quantity</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-center w-16"></th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((row, index) => (
                <tr key={row.rowId} className="border-b border-gray-100 bg-white">
                  <td className="px-4 py-2.5 text-[12px] text-gray-500">{index + 1}</td>
                  <td className="px-2 py-2.5 relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.productName || (activeRowIndex === index ? productSearch : "")}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setActiveRowIndex(index);
                          setShowDropdown(true);
                          // Clear product selection if user edits
                          const updated = [...productRows];
                          updated[index] = { ...updated[index], productId: "", productName: "", productCode: "" };
                          setProductRows(updated);
                        }}
                        onFocus={() => {
                          setActiveRowIndex(index);
                          setShowDropdown(true);
                        }}
                        placeholder="Search for a Product"
                        className="w-full h-[32px] border border-gray-200 rounded-md px-3 text-[12px] text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF]"
                      />
                    </div>
                    {showDropdown && activeRowIndex === index && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="px-3 py-2 text-[12px] text-gray-400">No products found</div>
                        ) : (
                          filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={() => handleSelectProduct(p, index)}
                              className="w-full text-left px-3 py-2 text-[12px] text-gray-600 hover:bg-purple-50 transition-colors"
                            >
                              {p.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-gray-500">{row.productCode || "—"}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      placeholder="0"
                      className="w-full h-[32px] border border-gray-200 rounded-md px-3 text-[12px] text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {productRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProductRow(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={addProductRow}
              className="text-[12px] text-[#9747FF] font-medium hover:underline"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-8 mb-8">
          <label className="text-[12px] font-medium text-gray-700 block mb-2">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type in here"
            className="w-full h-[100px] border border-gray-200 rounded-md px-4 py-3 text-[13px] text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-[13px] mb-4">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            onClick={() => router.push("/warehouse/outgoing")}
            className="bg-gray-200 text-gray-600 hover:bg-gray-300 text-[13px] font-medium px-8 h-[38px] rounded-md"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#A855F7] text-white hover:bg-[#9333EA] text-[13px] font-medium px-8 h-[38px] rounded-md disabled:opacity-60"
          >
            {isPending ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
