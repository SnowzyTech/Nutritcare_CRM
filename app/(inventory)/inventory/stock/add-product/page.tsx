"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

// ─── Shared style tokens ───────────────────────────────────────────────────────
const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";

const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-500 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

const labelClass = "block text-sm font-semibold text-gray-700 mb-0.5";
const subClass = "text-[11px] text-gray-400 mb-1.5";

// ─── Repeatable pricing section ────────────────────────────────────────────────
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
}: {
  section: PricingSection;
  onChange: (id: number, field: keyof PricingSection, value: string) => void;
  onDelete: (id: number) => void;
  showDelete: boolean;
}) {
  return (
    <div className="border-t border-gray-100 pt-5 mt-2 relative">
      {/* Delete button */}
      {showDelete && (
        <button
          type="button"
          onClick={() => onDelete(section.id)}
          className="absolute top-4 right-0 text-gray-300 hover:text-red-400 transition-colors"
          title="Remove section"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Cost Price */}
      <div className="mb-4">
        <label className={labelClass}>Cost Price (1 Unit )</label>
        <p className={subClass}>How much are YOU buying this from your supplier/manufacturer/seller?</p>
        <input
          type="number"
          value={section.costPrice}
          onChange={(e) => onChange(section.id, "costPrice", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Quantity | Unit | Recurring */}
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

      {/* Selling Price */}
      <div>
        <label className={labelClass}>Selling Price</label>
        <p className={subClass}>How much are YOU Selling this Product?</p>
        <input
          type="number"
          value={section.sellingPrice}
          onChange={(e) => onChange(section.id, "sellingPrice", e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
}

// ─── Offer Section ─────────────────────────────────────────────────────────────
interface OfferForm {
  offerName: string;
  offerQuantity: string;
  offerRecurring: string;
  offerUnit: string;
  offerSellingPrice: string;
  showQuantityUnit: string;
  combo: Array<{ product: string; quantity: string }>;
  freeGift: Array<{ product: string; quantity: string }>;
}

const emptyOffer = (): OfferForm => ({
  offerName: "",
  offerQuantity: "",
  offerRecurring: "",
  offerUnit: "",
  offerSellingPrice: "",
  showQuantityUnit: "",
  combo: Array.from({ length: 6 }, () => ({ product: "", quantity: "" })),
  freeGift: Array.from({ length: 6 }, () => ({ product: "", quantity: "" })),
});

const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

function OfferSection({
  offer,
  onChange,
}: {
  offer: OfferForm;
  onChange: (updated: OfferForm) => void;
}) {
  const set = (field: keyof OfferForm, value: string) =>
    onChange({ ...offer, [field]: value });

  const setCombo = (idx: number, key: "product" | "quantity", value: string) => {
    const next = offer.combo.map((c, i) => (i === idx ? { ...c, [key]: value } : c));
    onChange({ ...offer, combo: next });
  };

  const setFree = (idx: number, key: "product" | "quantity", value: string) => {
    const next = offer.freeGift.map((g, i) => (i === idx ? { ...g, [key]: value } : g));
    onChange({ ...offer, freeGift: next });
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-xl p-5 bg-gray-50/50">
      {/* Description */}
      <p className="text-[12px] text-gray-600 mb-1">
        <span className="font-semibold">Offer Name:</span>{" "}
        What customers will see on your form (eg Big Zooby, Papito, Buy 2 Get 1 Free OR Buy 3 Get 30% Discount!)
      </p>
      <p className="text-[12px] text-gray-600 mb-5">
        <span className="font-semibold">Offer Quantity:</span>{" "}
        If your offer is Buy 2 Get 1 Free, offer quantity will be 3
      </p>

      {/* Row 1: Offer Name | Offer Quantity | Recurring */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelClass}>Offer Name</label>
          <input type="text" value={offer.offerName} onChange={(e) => set("offerName", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Offer Quantity</label>
          <input type="text" placeholder="Piece, Unit, Pack, Bottle." value={offer.offerQuantity} onChange={(e) => set("offerQuantity", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Recurring</label>
          <div className="relative">
            <select value={offer.offerRecurring} onChange={(e) => set("offerRecurring", e.target.value)} className={selectClass}>
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

      {/* Row 2: Offer Unit | Selling Price | Show Quantity & Unit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className={labelClass}>Offer Unit</label>
          <input type="text" value={offer.offerUnit} onChange={(e) => set("offerUnit", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Selling price</label>
          <input type="number" value={offer.offerSellingPrice} onChange={(e) => set("offerSellingPrice", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Show Quantity &amp; Unit</label>
          <div className="relative">
            <select value={offer.showQuantityUnit} onChange={(e) => set("showQuantityUnit", e.target.value)} className={selectClass}>
              <option value=""></option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
          </div>
        </div>
      </div>

      {/* Combo Products grid: 3 columns × 2 rows = 6 items */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {offer.combo.map((c, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">{ordinals[i]} Combo Product</label>
              <div className="relative">
                <select value={c.product} onChange={(e) => setCombo(i, "product", e.target.value)} className={selectClass}>
                  <option value=""></option>
                  <option value="prod1">Product 1</option>
                  <option value="prod2">Product 2</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Quantity</label>
              <input type="number" value={c.quantity} onChange={(e) => setCombo(i, "quantity", e.target.value)} className={inputClass} />
            </div>
          </div>
        ))}
      </div>

      {/* Free Gift Products grid */}
      <div className="grid grid-cols-3 gap-3">
        {offer.freeGift.map((g, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">{ordinals[i]} Free Gift Product</label>
              <div className="relative">
                <select value={g.product} onChange={(e) => setFree(i, "product", e.target.value)} className={selectClass}>
                  <option value=""></option>
                  <option value="prod1">Product 1</option>
                  <option value="prod2">Product 2</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Quantity</label>
              <input type="number" value={g.quantity} onChange={(e) => setFree(i, "quantity", e.target.value)} className={inputClass} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Select wrapper ────────────────────────────────────────────────────────────
function SelectField({
  label,
  sub,
  children,
  value,
  onChange,
  name,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  name: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {sub && <p className={subClass}>{sub}</p>}
      <div className="relative">
        <select name={name} value={value} onChange={onChange} className={selectClass}>
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
let nextId = 2;

export default function AddProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    pasteFormLink: "",
    country: "",
    productDescription: "",
    productCategory: "",
    productName: "",
    hasVariations: "Yes",
    hasOffer: "No",
    textToShow: "",
    fileDownloadLink: "",
    lowStockAgents: "",
    lowStockTotal: "",
    lowStockEmails: "",
  });

  const [offers, setOffers] = useState<Array<OfferForm & { id: number }>>([{ ...emptyOffer(), id: 1 }]);

  const [sections, setSections] = useState<PricingSection[]>([
    { id: 1, costPrice: "", quantity: "", unit: "", recurring: "", sellingPrice: "" },
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSectionChange = (id: number, field: keyof PricingSection, value: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Context-aware: adds offer section when hasOffer=Yes, otherwise pricing section
  const handleAddMore = () => {
    if (form.hasOffer === "Yes") {
      setOffers((prev) => [...prev, { ...emptyOffer(), id: nextId++ }]);
    } else {
      setSections((prev) => [
        ...prev,
        { id: nextId++, costPrice: "", quantity: "", unit: "", recurring: "", sellingPrice: "" },
      ]);
    }
  };

  const handleDeleteSection = (id: number) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleOfferChange = (id: number, updated: OfferForm) => {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...updated, id } : o)));
  };

  const handleDeleteOffer = (id: number) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const handleCancel = () => router.back();
  const handleSave = () => {
    // TODO: wire to API
    router.back();
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Stock
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">New</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-md text-sm font-semibold text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-7 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* ── Section: Paste Form Link ── */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <label className={labelClass}>Paste Form Link Here</label>
          <input
            type="url"
            name="pasteFormLink"
            value={form.pasteFormLink}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* ── Section: Country / Description / Category ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <SelectField
            label="Country To Sell This Product"
            name="country"
            value={form.country}
            onChange={handleChange}
          >
            <option value="" disabled></option>
            <option value="nigeria">Nigeria</option>
            <option value="ghana">Ghana</option>
            <option value="kenya">Kenya</option>
          </SelectField>

          <div>
            <label className={labelClass}>Product Description</label>
            <p className={subClass}>For your View only</p>
            <input
              type="text"
              name="productDescription"
              value={form.productDescription}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <SelectField
            label="Product Category"
            sub="All products under this category will carry this brand phone number"
            name="productCategory"
            value={form.productCategory}
            onChange={handleChange}
          >
            <option value="" disabled></option>
            <option value="cat1">December Batch 1</option>
            <option value="cat2">December Batch 2</option>
          </SelectField>
        </div>

        {/* ── Section: Product Name / Variations / Offer ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <SelectField
            label="Product Name"
            name="productName"
            value={form.productName}
            onChange={handleChange}
          >
            <option value="" disabled></option>
            <option value="prod1">Product 1</option>
            <option value="prod2">Product 2</option>
          </SelectField>

          <div>
            <label className={labelClass}>Does this product have variations?</label>
            <p className={subClass}>Colours, sizes, Batches, etc?</p>
            <div className="relative">
              <select
                name="hasVariations"
                value={form.hasVariations}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Do you have an offer for this product?</label>
            <p className={subClass}>Select this if you have offer for this product</p>
            <div className="relative">
              <select
                name="hasOffer"
                value={form.hasOffer}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
            </div>
          </div>
        </div>

        {/* ── Section: Text to show / File download link ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className={labelClass}>Text to show</label>
            <p className={subClass}>example: Click here to download your FREE PDF guide</p>
            <input
              type="text"
              name="textToShow"
              value={form.textToShow}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Link to file download for successful delivery</label>
            <p className={subClass}>
              If you have a PDF or Video file to share to customers that bought this product, paste the link here. It will appear on the invoice sent to customers email once you mark their order as Delivered
            </p>
            <input
              type="url"
              name="fileDownloadLink"
              value={form.fileDownloadLink}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* ── Section: Low Stock Alerts ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 pb-6 border-b border-gray-100">
          <div>
            <label className={labelClass}>Low Stock Alert Quantity (Agents) *</label>
            <p className={subClass}>All products under this category will carry the brand phone number</p>
            <input
              type="number"
              name="lowStockAgents"
              value={form.lowStockAgents}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <SelectField
            label="Low Stock Alert Quantity (Total) *"
            sub="Set Low Stock Quantity Alert"
            name="lowStockTotal"
            value={form.lowStockTotal}
            onChange={handleChange}
          >
            <option value="" disabled></option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </SelectField>

          <SelectField
            label="Email(s) to receive low stock alert (separate each with comma) *"
            sub="Select this if you have offer for the product?"
            name="lowStockEmails"
            value={form.lowStockEmails}
            onChange={handleChange}
          >
            <option value="" disabled></option>
            <option value="yusuf@gmail.com">yusuf@gmail.com</option>
          </SelectField>
        </div>

        {/* ── Repeatable Pricing Sections ── */}
        {sections.map((section) => (
          <PricingSectionRow
            key={section.id}
            section={section}
            onChange={handleSectionChange}
            onDelete={handleDeleteSection}
            showDelete={sections.length > 1}
          />
        ))}

        {/* ── Offer Sections (visible only when hasOffer = Yes) ── */}
        {form.hasOffer === "Yes" && offers.map((ofr) => (
          <div key={ofr.id} className="relative">
            {offers.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteOffer(ofr.id)}
                className="absolute top-8 right-0 z-10 text-gray-300 hover:text-red-400 transition-colors"
                title="Remove offer section"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <OfferSection offer={ofr} onChange={(updated) => handleOfferChange(ofr.id, updated)} />
          </div>
        ))}

        {/* Add More */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleAddMore}
            className="px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
          >
            Add more
          </button>
        </div>
      </div>
    </div>
  );
}
