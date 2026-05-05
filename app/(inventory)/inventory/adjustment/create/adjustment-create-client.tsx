"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, ChevronDown, Trash2, Plus, Copy, ArrowLeft } from "lucide-react";
import { createAdjustmentAction } from "@/modules/inventory/actions/stock.action";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";
const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

interface ItemRow {
  id: number;
  productId: string;
  quantityBefore: string;
  quantityAfter: string;
}

interface Props {
  warehouses: { id: string; name: string }[];
  products: { id: string; name: string; sku: string }[];
}

let rowId = 2;

export default function AdjustmentCreateClient({ warehouses, products }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    warehouseId: "",
    reason: "",
    date: "",
    notes: "",
  });

  const [rows, setRows] = useState<ItemRow[]>([
    { id: 1, productId: "", quantityBefore: "", quantityAfter: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRowField = (id: number, field: keyof ItemRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, { id: rowId++, productId: "", quantityBefore: "", quantityAfter: "" }]);
  };

  const handleDuplicateRow = (id: number) => {
    const row = rows.find((r) => r.id === id);
    if (row) setRows((prev) => [...prev, { ...row, id: rowId++ }]);
  };

  const handleDeleteRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const getVariance = (row: ItemRow) => {
    const before = parseInt(row.quantityBefore, 10);
    const after = parseInt(row.quantityAfter, 10);
    if (isNaN(before) || isNaN(after)) return null;
    return after - before;
  };

  const buildItems = () =>
    rows
      .filter((r) => r.productId && r.quantityBefore !== "" && r.quantityAfter !== "")
      .map((r) => ({
        productId: r.productId,
        quantityBefore: parseInt(r.quantityBefore, 10),
        quantityAfter: parseInt(r.quantityAfter, 10),
      }));

  const handleSubmit = async (status: "DRAFT" | "RECORDED") => {
    setError(null);

    if (!form.warehouseId) { setError("Warehouse is required"); return; }
    if (!form.date) { setError("Date is required"); return; }
    if (status === "RECORDED" && !form.reason.trim()) {
      setError("Reason is required when submitting");
      return;
    }

    const items = buildItems();
    if (items.length === 0) {
      setError("Add at least one product with expected and actual quantities");
      return;
    }

    setLoading(true);
    const result = await createAdjustmentAction({
      warehouseId: form.warehouseId,
      reason: form.reason || "—",
      notes: form.notes || undefined,
      date: form.date,
      status,
      items,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/inventory/adjustment");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Stock Adjustment
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

      {/* Two-column: title left, form right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Adjustment</h1>
          <p className="text-sm text-gray-400 mt-0.5">Voucher</p>
        </div>

        <div className="space-y-4">
          {/* Warehouse */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-40 shrink-0">Warehouse*</label>
            <div className="relative flex-1">
              <select
                name="warehouseId"
                value={form.warehouseId}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled>Select an Option</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-40 shrink-0">Date*</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={`${inputClass} flex-1`}
            />
          </div>

          {/* Reason */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-40 shrink-0">Reason*</label>
            <input
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="e.g. Physical count discrepancy"
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>
      </div>

      {/* Product Adjustment Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-2 bg-white">
          <span className="text-xs text-gray-400">Products — Expected vs Actual count</span>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#3D0066" }}>
              <th className="text-left text-xs font-semibold text-white py-3 px-4 w-10">#</th>
              <th className="text-left text-xs font-semibold text-white py-3 px-4">Product</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-4 w-36">Expected Qty</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-4 w-36">Actual Qty</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-4 w-28">Variance</th>
              <th className="py-3 px-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const variance = getVariance(row);
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-500">{idx + 1}</td>

                  {/* Product select */}
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

                  {/* Expected Qty */}
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={row.quantityBefore}
                      onChange={(e) => handleRowField(row.id, "quantityBefore", e.target.value)}
                      placeholder="0"
                      min={0}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] bg-white text-center"
                    />
                  </td>

                  {/* Actual Qty */}
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={row.quantityAfter}
                      onChange={(e) => handleRowField(row.id, "quantityAfter", e.target.value)}
                      placeholder="0"
                      min={0}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] bg-white text-center"
                    />
                  </td>

                  {/* Variance (auto-calculated) */}
                  <td className="py-3 px-4 text-center">
                    {variance === null ? (
                      <span className="text-sm text-gray-300">—</span>
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          variance > 0
                            ? "text-emerald-600"
                            : variance < 0
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      >
                        {variance > 0 ? `+${variance}` : variance}
                      </span>
                    )}
                  </td>

                  {/* Row actions */}
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
              );
            })}

            <tr className="border-t border-gray-100">
              <td colSpan={6} className="px-4 py-3">
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

      {/* Notes */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Additional details about this adjustment"
            rows={4}
            className="w-full px-4 py-3 text-sm text-gray-600 placeholder:text-gray-300 outline-none resize-none bg-white"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          onClick={() => handleSubmit("DRAFT")}
          disabled={loading}
          className="px-5 py-2.5 rounded-md text-sm font-semibold text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save as Draft"}
        </button>
        <button
          onClick={() => handleSubmit("RECORDED")}
          disabled={loading}
          className="px-7 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
