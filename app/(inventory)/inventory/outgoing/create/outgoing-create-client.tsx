"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, ChevronDown, ArrowLeft, Plus, MessageCircle, Check, Trash2 } from "lucide-react";
import { createOutgoingMovementAction } from "@/modules/inventory/actions/stock.action";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";
const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

const NIGERIA_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River",
  "Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe","Imo","Jigawa","Kaduna",
  "Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun",
  "Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

interface BulkItem {
  id: number;
  productId: string;
  quantity: string;
}

interface Props {
  agents: { id: string; name: string }[];
  products: { id: string; name: string; sku: string }[];
}

export default function OutgoingCreateClient({ agents, products }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    state: "",
    country: "Nigeria",
    date: "",
    productId: "",
    supplierReference: "",
    agentId: "",
    quantityToSend: "",
    notes: "",
  });

  const [isAgentToAgent, setIsAgentToAgent] = useState(false);
  const [bulks, setBulks] = useState<BulkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddBulk = () => {
    setBulks((prev) => [...prev, { id: Date.now(), productId: "", quantity: "" }]);
  };

  const handleRemoveBulk = (id: number) => {
    setBulks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleBulkChange = (id: number, field: "productId" | "quantity", value: string) => {
    setBulks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.state) { setError("State is required"); return; }
    if (!form.country) { setError("Country is required"); return; }
    if (!form.date) { setError("Date is required"); return; }
    if (!form.productId) { setError("Product is required"); return; }
    if (!form.agentId) { setError("Agent is required"); return; }
    if (!form.quantityToSend || parseInt(form.quantityToSend, 10) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    const primaryProduct = products.find((p) => p.id === form.productId);
    const items = [
      {
        productId: form.productId,
        productCode: primaryProduct?.sku ?? form.productId,
        quantity: parseInt(form.quantityToSend, 10),
      },
      ...bulks
        .filter((b) => b.productId && b.quantity)
        .map((b) => {
          const found = products.find((p) => p.id === b.productId);
          return {
            productId: b.productId,
            productCode: found?.sku ?? b.productId,
            quantity: parseInt(b.quantity, 10),
          };
        }),
    ];

    setLoading(true);
    const result = await createOutgoingMovementAction({
      state: form.state,
      country: form.country,
      date: form.date,
      agentId: form.agentId,
      supplierReference: form.supplierReference || undefined,
      isAgentToAgentTransfer: isAgentToAgent,
      notes: form.notes || undefined,
      items,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/inventory/outgoing");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-10 relative">
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Outgoing Stock
      </button>

      <div className="flex items-center gap-5 mb-8">
        <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-[#9D00FF] transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Out</h1>
          <p className="text-sm text-gray-400 mt-0.5">Voucher</p>
        </div>

        <div className="space-y-4">
          {/* State */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-48 shrink-0">State*</label>
            <div className="relative flex-1">
              <select name="state" value={form.state} onChange={handleChange} className={selectClass}>
                <option value="" disabled>Select an Option</option>
                {NIGERIA_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Country */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-48 shrink-0">Country*</label>
            <div className="relative flex-1">
              <select name="country" value={form.country} onChange={handleChange} className={selectClass}>
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-48 shrink-0">Date*</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={`${inputClass} flex-1`}
            />
          </div>

          {/* Product */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-48 shrink-0">Product*</label>
            <div className="relative flex-1">
              <select name="productId" value={form.productId} onChange={handleChange} className={selectClass}>
                <option value="" disabled>Select an Option</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Agent to Agent checkbox */}
          <div className="flex items-center gap-3 py-3">
            <button
              type="button"
              onClick={() => setIsAgentToAgent(!isAgentToAgent)}
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                isAgentToAgent ? "border-[#9D00FF] text-[#9D00FF]" : "border-gray-300 text-transparent"
              }`}
            >
              {isAgentToAgent && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </button>
            <span className="text-sm text-gray-800 font-medium">
              Are you sending this product from one Agent to another Agent?
            </span>
          </div>

          {/* Supplier Reference */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-gray-800 w-48 shrink-0">Supplier Reference</label>
            <input
              type="text"
              name="supplierReference"
              value={form.supplierReference}
              onChange={handleChange}
              placeholder="Type in here"
              className={`${inputClass} flex-1`}
            />
          </div>

          {/* To Agent */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-gray-800 w-48 shrink-0">To Agent</label>
            <div className="relative flex-1">
              <select name="agentId" value={form.agentId} onChange={handleChange} className={selectClass}>
                <option value="" disabled>Select an Option</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Quantity To Send */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-bold text-gray-800 w-48 shrink-0">Quantity To Send</label>
            <input
              type="number"
              name="quantityToSend"
              value={form.quantityToSend}
              onChange={handleChange}
              placeholder="Type in here"
              min={1}
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 my-8" />

      {/* Additional bulk items */}
      {bulks.length > 0 && (
        <div className="mb-6 space-y-6">
          {bulks.map((bulk, index) => (
            <div key={bulk.id} className="space-y-4 relative group">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Additional Item {index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBulk(bulk.id)}
                  className="p-1 text-red-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-amber-500 w-48 shrink-0">Product*</label>
                <div className="relative flex-1">
                  <select
                    value={bulk.productId}
                    onChange={(e) => handleBulkChange(bulk.id, "productId", e.target.value)}
                    className={selectClass}
                  >
                    <option value="" disabled>Select an Option</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-gray-800 w-48 shrink-0">Quantity To Send</label>
                <input
                  type="number"
                  value={bulk.quantity}
                  onChange={(e) => handleBulkChange(bulk.id, "quantity", e.target.value)}
                  placeholder="Type in here"
                  min={1}
                  className={`${inputClass} flex-1`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-8">
        <button
          type="button"
          onClick={handleAddBulk}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Bulks
        </button>
      </div>

      <div className="border-t border-gray-100 my-8" />

      {/* Notes */}
      <div className="mb-8">
        <label className="block text-xs font-semibold text-gray-800 mb-2">Notes</label>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Type in here"
            rows={4}
            className="w-full px-4 py-3 text-sm text-gray-600 placeholder:text-gray-300 outline-none resize-none bg-white"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          disabled={loading}
          className="px-6 py-2.5 rounded-md text-sm font-semibold text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-7 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
