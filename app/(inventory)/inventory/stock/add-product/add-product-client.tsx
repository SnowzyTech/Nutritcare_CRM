"use client";

import React, { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { addProductAction, updateProductAction } from "@/modules/inventory/actions/stock.action";
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

const ALL_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Brazzaville)",
  "Congo (DRC)","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
  "Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea",
  "Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia",
  "Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia",
  "Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco",
  "Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand",
  "Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine",
  "Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia",
  "Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan",
  "Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo",
  "Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

let nextId = 2;

export function AddProductClient({
  categories,
  product,
}: {
  categories: StockCategoryRow[];
  product?: any;
}) {
  const isEdit = !!product;
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    isEdit ? updateProductAction : addProductAction,
    null
  );
  const [hasOffer, setHasOffer] = useState(product?.hasOffer || false);

  const initialSections: PricingSection[] = product
    ? [
        {
          id: 1,
          costPrice: product.costPrice.toString(),
          quantity: product.quantity.toString(),
          unit: "Unit", // Standard unit
          recurring: "",
          sellingPrice: product.sellingPrice.toString(),
        },
      ]
    : [{ id: 1, costPrice: "", quantity: "", unit: "", recurring: "", sellingPrice: "" }];

  const [sections, setSections] = useState<PricingSection[]>(initialSections);

  const offer = product?.offers?.[0];

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
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">
              {isEdit ? "Update Existing" : "New"}
            </p>
          </div>
        </div>

        {state?.error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          {isEdit && <input type="hidden" name="id" value={product.id} />}
          {/* Country / Description / Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className={labelClass} htmlFor="country">Country To Sell This Product</label>
              <div className="relative">
                <select
                  id="country"
                  name="country"
                  className={selectClass}
                  defaultValue={product?.country || ""}
                >
                  <option value="">Select a country</option>
                  {ALL_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="imageUrl">Product Image URL</label>
              <p className={subClass}>Paste an image URL or upload (Cloudinary)</p>
              <input
                id="imageUrl"
                type="text"
                name="imageUrl"
                placeholder="https://example.com/image.jpg"
                className={inputClass}
                defaultValue={product?.imageUrl || ""}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="quantity">Initial Stock Quantity</label>
              <p className={subClass}>Starting stock level for this product</p>
              <input
                id="quantity"
                type="number"
                name="quantity"
                placeholder="0"
                min="0"
                className={inputClass}
                defaultValue={product?.quantity || ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className={labelClass} htmlFor="productDescription">Product Description</label>
              <p className={subClass}>For your view only</p>
              <input
                id="productDescription"
                type="text"
                name="productDescription"
                className={inputClass}
                defaultValue={product?.description || ""}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="categoryId">Product Category</label>
              <p className={subClass}>All products under this category will carry this brand phone number</p>
              <div className="relative">
                <select
                  id="categoryId"
                  name="categoryId"
                  className={selectClass}
                  required
                  defaultValue={product?.categoryId || ""}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </option>
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
                defaultValue={product?.name || ""}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="hasVariations">Does this product have variations?</label>
              <p className={subClass}>Colours, sizes, Batches, etc?</p>
              <div className="relative">
                <select
                  id="hasVariations"
                  name="hasVariations"
                  className={selectClass}
                  defaultValue={product?.hasVariations ? "Yes" : "No"}
                >
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
                <select
                  id="hasOffer"
                  name="hasOffer"
                  className={selectClass}
                  value={hasOffer ? "Yes" : "No"}
                  onChange={(e) => setHasOffer(e.target.value === "Yes")}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
            </div>
          </div>

          {/* Offer Details — shown only when hasOffer is Yes */}
          {hasOffer && (
            <div className="mb-5 p-5 rounded-lg border border-[#9D00FF]/20 bg-[#F6E8FF]/30">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Special Offer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                <div>
                  <label className={labelClass} htmlFor="offerName">Offer Name</label>
                  <p className={subClass}>e.g. Buy 2 Get 1 Free, Summer Promo</p>
                  <input
                    id="offerName"
                    type="text"
                    name="offerName"
                    className={inputClass}
                    defaultValue={offer?.offerName || ""}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="offerSellingPrice">Offer Selling Price</label>
                  <p className={subClass}>Special price when this offer applies</p>
                  <input
                    id="offerSellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    name="offerSellingPrice"
                    className={inputClass}
                    defaultValue={offer?.sellingPrice?.toString() || ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                <div>
                  <label className={labelClass} htmlFor="offerQuantity">Offer Quantity</label>
                  <input
                    id="offerQuantity"
                    type="number"
                    min="1"
                    name="offerQuantity"
                    className={inputClass}
                    defaultValue={offer?.offerQuantity || ""}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="offerUnit">Offer Unit</label>
                  <input
                    id="offerUnit"
                    type="text"
                    placeholder="Piece, Pack, Bottle..."
                    name="offerUnit"
                    className={inputClass}
                    defaultValue={offer?.offerUnit || ""}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="offerRecurring">Recurring</label>
                  <div className="relative">
                    <select
                      id="offerRecurring"
                      name="offerRecurring"
                      className={selectClass}
                      defaultValue={offer?.recurring || ""}
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
              <div className="flex items-center gap-2">
                <input
                  id="showQuantityAndUnit"
                  type="checkbox"
                  name="showQuantityAndUnit"
                  value="true"
                  className="accent-[#9D00FF] w-4 h-4"
                  defaultChecked={offer?.showQuantityAndUnit}
                />
                <label htmlFor="showQuantityAndUnit" className="text-sm text-gray-600 cursor-pointer">
                  Show quantity and unit to customers
                </label>
              </div>
            </div>
          )}

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
                defaultValue={product?.displayText || ""}
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
                defaultValue={product?.fileDownloadLink || ""}
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
                defaultValue={product?.lowStockAlertQtyAgent || ""}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="lowStockTotal">Low Stock Alert Quantity (Total)</label>
              <p className={subClass}>Set Low Stock Quantity Alert</p>
              <div className="relative">
                <select
                  id="lowStockTotal"
                  name="lowStockTotal"
                  className={selectClass}
                  defaultValue={product?.lowStockAlertQtyTotal?.toString() || ""}
                >
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
                defaultValue={product?.alertEmails || ""}
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
