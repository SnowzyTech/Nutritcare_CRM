"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, ArrowUpDown, ChevronDown, Trash2, Plus, Copy, ArrowLeft } from "lucide-react";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";
const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

interface ProductRow {
  id: number;
  product: string;
  productCode: string;
  quantity: string;
}

let rowId = 2;

export default function CreateIncomingPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    warehouse: "",
    supplier: "",
    supplierReference: "",
    date: "",
    notes: "",
  });

  const [products, setProducts] = useState<ProductRow[]>([
    { id: 1, product: "", productCode: "", quantity: "" },
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProductField = (
    id: number,
    field: keyof ProductRow,
    value: string
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleAddRow = () => {
    setProducts((prev) => [
      ...prev,
      { id: rowId++, product: "", productCode: "", quantity: "" },
    ]);
  };

  const handleDuplicateRow = (id: number) => {
    const row = products.find((p) => p.id === id);
    if (row) {
      setProducts((prev) => [
        ...prev,
        { ...row, id: rowId++ },
      ]);
    }
  };

  const handleDeleteRow = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Incoming Stock
      </button>

      {/* Toolbar */}
      <div className="flex items-center gap-5 mb-8">
        <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-[#9D00FF] transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Two-column layout: title left, form right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left: Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock In</h1>
          <p className="text-sm text-gray-400 mt-0.5">Voucher</p>
        </div>

        {/* Right: Form fields */}
        <div className="space-y-4">
          {/* Warehouse* */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-40 shrink-0">
              Warehouse*
            </label>
            <div className="relative flex-1">
              <select
                name="warehouse"
                value={form.warehouse}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled>Select an Option</option>
                <option value="pamtech">PAMTECH</option>
                <option value="femtech">FEMTECH</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Supplier */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 w-40 shrink-0">
              Supplier
            </label>
            <div className="relative flex-1">
              <select
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled>Select an Option</option>
                <option value="austin">Austin</option>
                <option value="james">James</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Supplier Reference */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 w-40 shrink-0">
              Supplier Reference
            </label>
            <input
              type="text"
              name="supplierReference"
              value={form.supplierReference}
              onChange={handleChange}
              placeholder="Type in here"
              className={`${inputClass} flex-1`}
            />
          </div>

          {/* Date* */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-amber-500 w-40 shrink-0">
              Date*
            </label>
            <input
              type="text"
              name="date"
              value={form.date}
              onChange={handleChange}
              placeholder="Type in here"
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
              {/* Actions column */}
              <th className="py-3 px-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {products.map((row, idx) => (
              <tr key={row.id} className="border-t border-gray-100">
                {/* Row number */}
                <td className="py-3 px-4 text-sm text-gray-500">{idx + 1}</td>

                {/* Product select */}
                <td className="py-3 px-4">
                  <div className="relative">
                    <select
                      value={row.product}
                      onChange={(e) => handleProductField(row.id, "product", e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500 appearance-none bg-white outline-none focus:border-[#9D00FF] cursor-pointer"
                    >
                      <option value="">Search for a Product</option>
                      <option value="Shred Belly">Shred Belly</option>
                      <option value="Product 2">Product 2</option>
                      <option value="Product 3">Product 3</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </td>

                {/* Product Code input */}
                <td className="py-3 px-4">
                  <input
                    type="text"
                    value={row.productCode}
                    onChange={(e) => handleProductField(row.id, "productCode", e.target.value)}
                    placeholder="Product code"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] bg-white"
                  />
                </td>

                {/* Quantity input */}
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={(e) => handleProductField(row.id, "quantity", e.target.value)}
                    placeholder="0"
                    min={0}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] bg-white"
                  />
                </td>

                {/* Duplicate + Delete */}
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
                    {products.length > 1 && (
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

            {/* Add row */}
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

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-md text-sm font-semibold text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          Save as Draft
        </button>
        <button
          onClick={() => router.back()}
          className="px-7 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
