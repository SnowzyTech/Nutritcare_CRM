"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarIcon, Trash2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { FormAgent, LocationBinRow, AgentProductStock } from "@/modules/warehouse/services/warehouse.service";
import { createReturnMovementAction, getAgentStocksAction } from "@/modules/warehouse/actions/returns.action";

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
  maxQty: number;
  locationId: string;
};

interface Props {
  agents: FormAgent[];
  locations: LocationBinRow[];
}

export default function AddReturnClient({ agents, locations }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);

  const [selectedState, setSelectedState] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [agentId, setAgentId] = useState("");
  const [damaged, setDamaged] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [notes, setNotes] = useState("");
  const [agentStocks, setAgentStocks] = useState<AgentProductStock[]>([]);

  const [productRows, setProductRows] = useState<ProductRow[]>([
    { rowId: 1, productId: "", productName: "", productCode: "", quantity: "", maxQty: 0, locationId: "" },
  ]);
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  const handleAgentChange = async (id: string) => {
    setAgentId(id);
    setProductRows([{ rowId: 1, productId: "", productName: "", productCode: "", quantity: "", maxQty: 0, locationId: "" }]);
    setAgentStocks([]);
    setError(null);
    if (!id) return;
    setIsLoadingStocks(true);
    try {
      const stocks = await getAgentStocksAction(id);
      setAgentStocks(stocks);
    } finally {
      setIsLoadingStocks(false);
    }
  };

  const alreadySelectedIds = new Set(productRows.map((r) => r.productId).filter(Boolean));

  const filteredProducts = agentStocks.filter(
    (p) =>
      !alreadySelectedIds.has(p.productId) &&
      (p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.productSku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const handleSelectProduct = (stock: AgentProductStock, index: number) => {
    const updated = [...productRows];
    updated[index] = {
      ...updated[index],
      productId: stock.productId,
      productName: stock.productName,
      productCode: stock.productSku,
      quantity: "",
      maxQty: stock.availableQty,
    };
    setProductRows(updated);
    setProductSearch("");
    setShowDropdown(false);
    setActiveRowIndex(null);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updated = [...productRows];
    const max = updated[index].maxQty;
    const num = parseInt(value);
    if (!isNaN(num) && max > 0 && num > max) {
      updated[index] = { ...updated[index], quantity: String(max) };
    } else {
      updated[index] = { ...updated[index], quantity: value };
    }
    setProductRows(updated);
  };

  const handleLocationChange = (index: number, locationId: string) => {
    const updated = [...productRows];
    updated[index] = { ...updated[index], locationId };
    setProductRows(updated);
  };

  const addProductRow = () => {
    setProductRows([
      ...productRows,
      { rowId: productRows.length + 1, productId: "", productName: "", productCode: "", quantity: "", maxQty: 0, locationId: "" },
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

    for (const row of validItems) {
      const qty = parseInt(row.quantity);
      if (qty > row.maxQty) {
        return setError(`"${row.productName}": quantity ${qty} exceeds agent's available stock of ${row.maxQty}`);
      }
      if (!row.locationId) {
        return setError(`Please select a destination shelf for "${row.productName}"`);
      }
    }

    const shelfAssignments = validItems.map((r) => ({
      productId: r.productId,
      locationId: r.locationId,
      quantity: parseInt(r.quantity),
    }));

    const fd = new FormData();
    fd.set("state", selectedState);
    fd.set("country", country);
    fd.set("date", date.toISOString());
    fd.set("agentId", agentId);
    fd.set("damaged", String(damaged));
    fd.set("remarks", remarks);
    fd.set("notes", notes);
    fd.set("items", JSON.stringify(validItems.map((r) => ({ productId: r.productId, quantity: parseInt(r.quantity) }))));
    fd.set("shelfAssignments", JSON.stringify(shelfAssignments));

    startTransition(async () => {
      const result = await createReturnMovementAction(null, fd);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="bg-white min-h-screen pb-10">
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
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8">
        {/* Header + Form Fields */}
        <div className="flex gap-12">
          <div className="flex-shrink-0 pt-2">
            <h1 className="text-[22px] font-semibold text-gray-800">Returned Stock</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Voucher</p>
          </div>

          <div className="flex-1 space-y-5">
            {/* State */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                State<span className="text-red-500">*</span>
              </label>
              <Select value={selectedState} onValueChange={(v) => v && setSelectedState(v)}>
                <SelectTrigger className="w-full max-w-[320px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent className="max-h-[240px]">
                  {nigerianStates.map((s) => (
                    <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                Country<span className="text-red-500">*</span>
              </label>
              <Select value={country} onValueChange={(v) => v && setCountry(v)}>
                <SelectTrigger className="w-full max-w-[320px] h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
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
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                Date<span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger>
                  <div
                    className={cn(
                      "w-full max-w-[320px] h-[36px] border border-gray-200 rounded-md px-3 text-[13px] flex items-center justify-between focus:outline-none cursor-pointer",
                      !date ? "text-gray-300" : "text-gray-700"
                    )}
                  >
                    {date ? format(date, "PPP") : "Select a date"}
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="rounded-md border" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Agent */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-amber-600 w-[160px] text-right">
                Agent<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 w-full max-w-[320px]">
                <Select value={agentId} onValueChange={(v) => v && handleAgentChange(v)}>
                  <SelectTrigger className="w-full h-[36px] border-gray-200 text-[13px] text-gray-400 focus:ring-[#9747FF] focus:border-[#9747FF]">
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
                {isLoadingStocks && <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />}
              </div>
            </div>

            {/* Agent stock info */}
            {agentId && !isLoadingStocks && (
              <div className="flex items-center gap-6">
                <div className="w-[160px]" />
                {agentStocks.length === 0 ? (
                  <p className="text-[12px] text-amber-600">
                    This agent has no stock available for return.
                  </p>
                ) : (
                  <p className="text-[12px] text-emerald-600">
                    {agentStocks.length} product{agentStocks.length !== 1 ? "s" : ""} available in agent's stock.
                  </p>
                )}
              </div>
            )}

            {/* Damaged */}
            <div className="flex items-center gap-6">
              <div className="w-[160px]" />
              <button
                type="button"
                onClick={() => setDamaged(!damaged)}
                className="flex items-center gap-2 text-[13px] text-gray-700 font-medium"
              >
                <span
                  className={cn(
                    "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors",
                    damaged ? "border-[#9747FF] bg-[#9747FF]" : "border-gray-300"
                  )}
                >
                  {damaged && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                Damaged
              </button>
            </div>

            {/* Remarks */}
            <div className="flex items-center gap-6">
              <label className="text-[12px] font-medium text-gray-700 w-[160px] text-right">Remarks</label>
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

        {/* Product Table */}
        <div className="mt-10 border border-gray-200 rounded-lg shadow-sm overflow-visible">
          <div className="bg-white px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[12px] text-gray-400">
              Products
              {agentId && !isLoadingStocks && agentStocks.length === 0 && (
                <span className="ml-2 text-amber-500">(agent has no stock)</span>
              )}
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[#4A0E78] text-white">
                <th className="px-4 py-2.5 text-[11px] font-medium text-left w-10">#</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-left w-28">Code</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-center w-28">Available</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-right w-28">Qty to Return</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-left w-40">Destination Shelf<span className="text-red-300 ml-0.5">*</span></th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-center w-12"></th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((row, index) => (
                <tr key={row.rowId} className="border-b border-gray-100 bg-white">
                  <td className="px-4 py-2.5 text-[12px] text-gray-500">{index + 1}</td>

                  {/* Product search */}
                  <td className="px-2 py-2.5 relative">
                    <input
                      type="text"
                      value={row.productName || (activeRowIndex === index ? productSearch : "")}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setActiveRowIndex(index);
                        setShowDropdown(true);
                        const updated = [...productRows];
                        updated[index] = { ...updated[index], productId: "", productName: "", productCode: "", maxQty: 0 };
                        setProductRows(updated);
                      }}
                      onFocus={() => {
                        setActiveRowIndex(index);
                        setShowDropdown(true);
                      }}
                      disabled={!agentId || isLoadingStocks}
                      placeholder={
                        !agentId
                          ? "Select agent first"
                          : isLoadingStocks
                          ? "Loading…"
                          : agentStocks.length === 0
                          ? "No stock available"
                          : "Search product"
                      }
                      className="w-full h-[32px] border border-gray-200 rounded-md px-3 text-[12px] text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    {showDropdown && activeRowIndex === index && agentId && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="px-3 py-2 text-[12px] text-gray-400">
                            {agentStocks.length === 0 ? "Agent has no stock" : "No matching products"}
                          </div>
                        ) : (
                          filteredProducts.map((p) => (
                            <button
                              key={p.productId}
                              type="button"
                              onMouseDown={() => handleSelectProduct(p, index)}
                              className="w-full text-left px-3 py-2 text-[12px] text-gray-600 hover:bg-purple-50 transition-colors flex items-center justify-between"
                            >
                              <span>{p.productName}</span>
                              <span className="text-[11px] text-emerald-600 font-medium ml-2">{p.availableQty} avail.</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </td>

                  {/* Code */}
                  <td className="px-4 py-2.5 text-[12px] text-gray-400">{row.productCode || "—"}</td>

                  {/* Available qty indicator */}
                  <td className="px-4 py-2.5 text-center">
                    {row.productId ? (
                      <span className="text-[12px] font-medium text-emerald-600">{row.maxQty}</span>
                    ) : (
                      <span className="text-[12px] text-gray-300">—</span>
                    )}
                  </td>

                  {/* Quantity to return */}
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min="1"
                      max={row.maxQty > 0 ? row.maxQty : undefined}
                      value={row.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      disabled={!row.productId}
                      placeholder="0"
                      className={cn(
                        "w-full h-[32px] border rounded-md px-3 text-[12px] text-gray-500 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-gray-50 disabled:cursor-not-allowed",
                        row.productId && parseInt(row.quantity) > row.maxQty
                          ? "border-red-400"
                          : "border-gray-200"
                      )}
                    />
                  </td>

                  {/* Destination Shelf */}
                  <td className="px-2 py-2.5">
                    <Select
                      value={row.locationId}
                      onValueChange={(v) => v && handleLocationChange(index, v)}
                      disabled={!row.productId}
                    >
                      <SelectTrigger className="h-[32px] text-[12px] border-gray-200 focus:ring-[#9747FF] disabled:bg-gray-50 disabled:cursor-not-allowed">
                        <SelectValue placeholder="Select shelf" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {locations.length === 0 ? (
                          <div className="px-3 py-2 text-[12px] text-gray-400">No shelves configured</div>
                        ) : (
                          locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id} className="text-[12px]">
                              <span className="font-medium">{loc.locationCode}</span>
                              <span className="text-gray-400 ml-1">
                                ({loc.currentStock} stk
                                {loc.maxCapacity ? ` / ${loc.maxCapacity}` : ""}
                                {loc.occupancyStatus === "FULL" ? " · FULL" : ""})
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Remove */}
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
              disabled={!agentId || isLoadingStocks || agentStocks.length === 0}
              className="text-[12px] text-[#9747FF] font-medium hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-8 mb-4">
          <label className="text-[12px] font-medium text-gray-600 block mb-2">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type in here"
            className="w-full h-[80px] border border-gray-200 rounded-md px-3 py-2.5 text-[13px] text-gray-400 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF] resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-[13px] mb-4 bg-red-50 border border-red-200 rounded-md px-4 py-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            type="button"
            onClick={() => router.push("/warehouse/returns")}
            className="bg-gray-200 text-gray-600 hover:bg-gray-300 text-[13px] font-medium px-5 h-[36px] rounded-md"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#9747FF] text-white hover:bg-[#7C3AED] text-[13px] font-medium px-6 h-[36px] rounded-md disabled:opacity-60"
          >
            {isPending ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
