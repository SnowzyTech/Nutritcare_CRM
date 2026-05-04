"use client";

import React, { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { addProductAction } from "@/modules/inventory/actions/stock.action";
import type { StockCategoryRow } from "@/modules/inventory/services/inventory.service";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";

const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-500 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

const labelClass = "block text-sm font-semibold text-gray-700 mb-0.5";
const subClass = "text-[11px] text-gray-400 mb-1.5";

interface PricingSection {
  id: number;
  costPrice: string;
  quantity: string;
  unit: string;
  recurring: string;
  sellingPrice: string;
}

function PricingSectionRow({
  section,
  onChange,
  onDelete,
  showDelete,
  isFirst,
}: {
  section: PricingSection;
  onChange: (id: number, field: keyof PricingSection, value: string) => void;
  onDelete: (id: number) => void;
  showDelete: boolean;
  isFirst: boolean;
}) {
  return (
    <div className="border-t border-gray-100 pt-5 mt-2 relative">
      {showDelete && (
        <button
          type="button"
          onClick={() => onDelete(section.id)}
          className="absolute top-4 right-0 text-gray-300 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div className="mb-4">
        <label className={labelClass} htmlFor={isFirst ? "costPrice" : undefined}>Cost Price (1 Unit)</label>
        <p className={subClass}>How much are YOU buying this from your supplier/manufacturer/seller?</p>
        <input
          id={isFirst ? "costPrice" : undefined}
          name={isFirst ? "costPrice" : undefined}
          type="number"
          step="0.01"
          min="0"
          value={section.costPrice}
          onChange={(e) => onChange(section.id, "costPrice", e.target.value)}
          className={inputClass}
          required={isFirst}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelClass}>Quantity</label>
          <input
            type="number"
            value={section.quantity}
            onChange={(e) => onChange(section.id, "quantity", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Unit</label>
          <input
            type="text"
            placeholder="Piece, Unit, Pack, Bottle."
            value={section.unit}
            onChange={(e) => onChange(section.id, "unit", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Recurring</label>
          <div className="relative">
            <select
              value={section.recurring}
              onChange={(e) => onChange(section.id, "recurring", e.target.value)}
              className={selectClass}
            >
              <option value=""></option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={isFirst ? "sellingPrice" : undefined}>Selling Price</label>
        <p className={subClass}>How much are YOU Selling this Product?</p>
        <input
          id={isFirst ? "sellingPrice" : undefined}
          name={isFirst ? "sellingPrice" : undefined}
          type="number"
          step="0.01"
          min="0"
          value={section.sellingPrice}
          onChange={(e) => onChange(section.id, "sellingPrice", e.target.value)}
          className={inputClass}
          required={isFirst}
        />
      </div>
    </div>
  );
}

let nextId = 2;

export function AddProductClient({ categories }: { categories: StockCategoryRow[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(addProductAction, null);

  const [sections, setSections] = useState<PricingSection[]>([
    { id: 1, costPrice: "", quantity: "", unit: "", recurring: "", sellingPrice: "" },
  ]);

  const handleSectionChange = (id: number, field: keyof PricingSection, value: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleDeleteSection = (id: number) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSection = () => {
    setSections((prev) => [
      ...prev,
      { id: nextId++, costPrice: "", quantity: "", unit: "", recurring: "", sellingPrice: "" },
    ]);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Stock
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">New</p>
          </div>
        </div>

        {state?.error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          {/* Paste Form Link */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <label className={labelClass} htmlFor="pasteFormLink">Paste Form Link Here</label>
            <input
              id="pasteFormLink"
              type="url"
              name="pasteFormLink"
              className={inputClass}
            />
          </div>

          {/* Country / Description / Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className={labelClass} htmlFor="country">Country To Sell This Product</label>
              <div className="relative">
                <select id="country" name="country" className={selectClass}>
                  <option value=""></option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="productDescription">Product Description</label>
              <p className={subClass}>For your view only</p>
              <input
                id="productDescription"
                type="text"
                name="productDescription"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="categoryId">Product Category</label>
              <p className={subClass}>All products under this category will carry this brand phone number</p>
              <div className="relative">
                <select id="categoryId" name="categoryId" className={selectClass} required>
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
            </div>
          </div>

          {/* Product Name / Variations / Offer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className={labelClass} htmlFor="productName">Product Name</label>
              <input
                id="productName"
                type="text"
                name="productName"
                placeholder="Enter product name"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="hasVariations">Does this product have variations?</label>
              <p className={subClass}>Colours, sizes, Batches, etc?</p>
              <div className="relative">
                <select id="hasVariations" name="hasVariations" className={selectClass}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="hasOffer">Do you have an offer for this product?</label>
              <p className={subClass}>Select this if you have an offer for this product</p>
              <div className="relative">
                <select id="hasOffer" name="hasOffer" className={selectClass}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
            </div>
          </div>

          {/* Text to show / File download link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className={labelClass} htmlFor="displayText">Text to show</label>
              <p className={subClass}>example: Click here to download your FREE PDF guide</p>
              <input
                id="displayText"
                type="text"
                name="displayText"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="fileDownloadLink">Link to file download for successful delivery</label>
              <p className={subClass}>
                If you have a PDF or Video file to share to customers that bought this product, paste the link here.
              </p>
              <input
                id="fileDownloadLink"
                type="url"
                name="fileDownloadLink"
                className={inputClass}
              />
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 pb-6 border-b border-gray-100">
            <div>
              <label className={labelClass} htmlFor="lowStockAgents">Low Stock Alert Quantity (Agents)</label>
              <p className={subClass}>Alert when stock with agents falls below this number</p>
              <input
                id="lowStockAgents"
                type="number"
                name="lowStockAgents"
                min="0"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="lowStockTotal">Low Stock Alert Quantity (Total)</label>
              <p className={subClass}>Set Low Stock Quantity Alert</p>
              <div className="relative">
                <select id="lowStockTotal" name="lowStockTotal" className={selectClass}>
                  <option value=""></option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="alertEmails">Email(s) to receive low stock alert</label>
              <p className={subClass}>Separate each email with a comma</p>
              <input
                id="alertEmails"
                type="text"
                name="alertEmails"
                placeholder="e.g. admin@example.com, manager@example.com"
                className={inputClass}
              />
            </div>
          </div>

          {/* Pricing Sections */}
          {sections.map((section, idx) => (
            <PricingSectionRow
              key={section.id}
              section={section}
              onChange={handleSectionChange}
              onDelete={handleDeleteSection}
              showDelete={sections.length > 1}
              isFirst={idx === 0}
            />
          ))}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddSection}
              className="px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
            >
              Add more pricing
            </button>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-md text-sm font-semibold text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-7 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
