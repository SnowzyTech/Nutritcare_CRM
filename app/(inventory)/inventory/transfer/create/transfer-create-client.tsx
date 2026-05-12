"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, ChevronDown, MessageCircle, ArrowLeft, Plus, Copy, Trash2 } from "lucide-react";
import { createStockTransferAction } from "@/modules/inventory/actions/stock.action";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";
const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

interface ProductRow {
  id: number;
  productId: string;
  quantity: string;
}

interface Props {
  nodes: { id: string; name: string; type: "WAREHOUSE" | "AGENT" }[];
  products: { id: string; name: string; sku: string }[];
}

let rowId = 2;

export default function TransferCreateClient({ nodes, products }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    sourceNodeId: "",
    targetNodeId: "",
    date: "",
    notes: "",
  });

  const [rows, setRows] = useState<ProductRow[]>([
    { id: 1, productId: "", quantity: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const warehouses = nodes.filter((n) => n.type === "WAREHOUSE");
  const agents = nodes.filter((n) => n.type === "AGENT");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRowField = (id: number, field: keyof ProductRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, { id: rowId++, productId: "", quantity: "" }]);
  };

  const handleDuplicateRow = (id: number) => {
    const row = rows.find((r) => r.id === id);
    if (row) setRows((prev) => [...prev, { ...row, id: rowId++ }]);
  };

  const handleDeleteRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const resolveNode = (nodeId: string): { id: string; type: "WAREHOUSE" | "AGENT" } | null => {
    const node = nodes.find((n) => n.id === nodeId);
    return node ? { id: node.id, type: node.type } : null;
  };

  const handleSubmit = async (status: "DRAFT" | "SUBMITTED") => {
    setError(null);

    const source = resolveNode(form.sourceNodeId);
    const target = resolveNode(form.targetNodeId);

    if (!source) { setError("Source Warehouse/Agent is required"); return; }
    if (!target) { setError("Target Warehouse/Agent is required"); return; }
    if (!form.date) { setError("Date is required"); return; }

    const items = rows
      .filter((r) => r.productId && r.quantity)
      .map((r) => ({ productId: r.productId, quantity: parseInt(r.quantity, 10) }));

    if (items.length === 0) { setError("Add at least one product with a quantity"); return; }

    setLoading(true);
    const result = await createStockTransferAction({
      sourceType: source.type,
      sourceId: source.id,
      targetType: target.type,
      targetId: target.id,
      date: form.date,
      notes: form.notes || undefined,
      status,
      items,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/inventory/transfer");
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
        Back to Stock Transfer
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
          <h1 className="text-2xl font-bold text-gray-900">Stock Transfer</h1>
          <p className="text-sm text-gray-400 mt-0.5">Voucher</p>
        </div>

        <div className="space-y-4">
          {/* Source */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-56 shrink-0">Source Warehouse/Agent *</label>
            <div className="relative flex-1">
              <select name="sourceNodeId" value={form.sourceNodeId} onChange={handleChange} className={selectClass}>
                <option value="" disabled>Select an Option</option>
                {warehouses.length > 0 && (
                  <optgroup label="Warehouses">
                    {warehouses.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </optgroup>
                )}
                {agents.length > 0 && (
                  <optgroup label="Agents">
                    {agents.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Target */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-56 shrink-0">Target Warehouse/Agent *</label>
            <div className="relative flex-1">
              <select name="targetNodeId" value={form.targetNodeId} onChange={handleChange} className={selectClass}>
                <option value="" disabled>Select an Option</option>
                {warehouses.length > 0 && (
                  <optgroup label="Warehouses">
                    {warehouses.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </optgroup>
                )}
                {agents.length > 0 && (
                  <optgroup label="Agents">
                    {agents.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-56 shrink-0">Date*</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-2 bg-white">
          <span className="text-xs text-gray-400">Products to Transfer</span>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#3D0066" }}>
              <th className="text-left text-xs font-semibold text-white py-3 px-4 w-10">#</th>
              <th className="text-left text-xs font-semibold text-white py-3 px-4">Product</th>
              <th className="text-left text-xs font-semibold text-white py-3 px-4 w-32">Quantity</th>
              <th className="py-3 px-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-500">{idx + 1}</td>
                <td className="py-3 px-4">
                  <div className="relative">
                    <select
                      value={row.productId}
                      onChange={(e) => handleRowField(row.id, "productId", e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 appearance-none bg-white outline-none focus:border-[#9D00FF] cursor-pointer"
                    >
                      <option value="">Search for a Product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={(e) => handleRowField(row.id, "quantity", e.target.value)}
                    placeholder="0"
                    min={1}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] bg-white"
                  />
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicateRow(row.id)}
                      title="Duplicate row"
                      className="text-gray-300 hover:text-[#9D00FF] transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row.id)}
                        title="Delete row"
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            <tr className="border-t border-gray-100">
              <td colSpan={4} className="px-4 py-3">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 text-sm text-[#9D00FF] hover:text-[#8500d9] font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
          onClick={() => handleSubmit("DRAFT")}
          disabled={loading}
          className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-gray-300 hover:bg-gray-400 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={() => handleSubmit("SUBMITTED")}
          disabled={loading}
          className="px-7 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
