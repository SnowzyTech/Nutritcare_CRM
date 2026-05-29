"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, ChevronDown, Trash2, Plus, Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { updateIncomingMovementAction } from "@/modules/inventory/actions/stock.action";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";
const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

interface ProductRow {
  id: string | number;
  productId: string;
  productCode: string;
  quantity: string;
}

interface Props {
  movement: any;
  warehouses: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  products: { id: string; name: string; sku: string }[];
}

export default function IncomingEditClient({ movement, warehouses, suppliers, products }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    warehouseId: movement.warehouseId || "",
    supplierId: movement.supplierId || "",
    supplierReference: movement.supplierReference || "",
    date: movement.date || "",
    notes: movement.notes || "",
  });

  const [rows, setRows] = useState<ProductRow[]>(
    movement.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productCode: item.productCode,
      quantity: String(item.quantity),
    }))
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRowField = (id: string | number, field: keyof ProductRow, value: string) => {
    setRows((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (field === "productId") {
          const found = products.find((pr) => pr.id === value);
          return { ...p, productId: value, productCode: found?.sku ?? "" };
        }
        return { ...p, [field]: value };
      })
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, { id: Date.now(), productId: "", productCode: "", quantity: "" }]);
  };

  const handleDuplicateRow = (id: string | number) => {
    const row = rows.find((p) => p.id === id);
    if (row) setRows((prev) => [...prev, { ...row, id: Date.now() }]);
  };

  const handleDeleteRow = (id: string | number) => {
    setRows((prev) => prev.filter((p) => p.id !== id));
  };

  const buildItems = () =>
    rows
      .filter((r) => r.productId && r.quantity)
      .map((r) => ({
        productId: r.productId,
        productCode: r.productCode || (products.find((p) => p.id === r.productId)?.sku ?? r.productId),
        quantity: parseInt(r.quantity, 10),
      }));

  const handleSubmit = async (status: "DRAFT" | "RECORDED") => {
    setError(null);

    const items = buildItems();
    if (!form.warehouseId) { setError("Warehouse is required"); return; }
    if (!form.date) { setError("Date is required"); return; }
    if (items.length === 0) { setError("Add at least one product with a quantity"); return; }

    setLoading(true);
    const result = await updateIncomingMovementAction({
      id: movement.id,
      warehouseId: form.warehouseId,
      supplierId: form.supplierId || undefined,
      supplierReference: form.supplierReference || undefined,
      date: form.date,
      notes: form.notes || undefined,
      status,
      items,
    });

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Incoming movement updated");
      router.push("/inventory/incoming");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Stock In</h1>
          <p className="text-sm text-gray-400 mt-0.5">Voucher: {movement.referenceNumber}</p>
        </div>
        <div className="flex items-center gap-3">
           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
             movement.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
           }`}>
             {movement.status}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4 md:col-start-2">
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

          {/* Supplier */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 w-40 shrink-0">Supplier</label>
            <div className="relative flex-1">
              <select
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">Select an Option</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Supplier Reference */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 w-40 shrink-0">Supplier Reference</label>
            <input
              type="text"
              name="supplierReference"
              value={form.supplierReference}
              onChange={handleChange}
              placeholder="Type in here"
              className={`${inputClass} flex-1`}
            />
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
        </div>
      </div>

      {/* Product Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-2 bg-white">
          <span className="text-xs text-gray-400">Product</span>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#3D0066" }}>
              <th className="text-left text-xs font-semibold text-white py-3 px-4 w-10">#</th>
              <th className="text-left text-xs font-semibold text-white py-3 px-4">Product</th>
              <th className="text-left text-xs font-semibold text-white py-3 px-4">Product Code</th>
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
                    type="text"
                    value={row.productCode}
                    onChange={(e) => handleRowField(row.id, "productCode", e.target.value)}
                    placeholder="Product code"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] bg-white"
                  />
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
              <td colSpan={5} className="px-4 py-3">
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
            placeholder="Type a note"
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
