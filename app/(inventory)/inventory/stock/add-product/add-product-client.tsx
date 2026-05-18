"use client";

import React, { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload, X } from "lucide-react";
import {
  addProductAction,
  updateProductAction,
} from "@/modules/inventory/actions/stock.action";
import { uploadProductImageAction } from "@/modules/inventory/actions/upload.action";
import type {
  StockCategoryRow,
  ProductDropdownOption,
} from "@/modules/inventory/services/inventory.service";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";

const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-500 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

const labelClass = "block text-sm font-semibold text-gray-700 mb-0.5";
const subClass = "text-[11px] text-gray-400 mb-1.5";

const ALL_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium",
  "Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria",
  "Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad",
  "Chile","China","Colombia","Comoros","Congo (Brazzaville)","Congo (DRC)","Costa Rica","Croatia","Cuba",
  "Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar",
  "Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico",
  "Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia",
  "Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia",
  "Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis",
  "Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan",
  "Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste",
  "Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

interface Package {
  id: number;
  name: string;
  quantity: string;
  price: string;
}

interface ComboItem {
  id: number;
  productId: string;
  quantity: string;
}

let nextPkgId = 4;
let nextComboId = 7;
let nextGiftId = 7;

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
    </div>
  );
}

export function AddProductClient({
  categories,
  products,
  product,
}: {
  categories: StockCategoryRow[];
  products: ProductDropdownOption[];
  product?: any;
}) {
  const isEdit = !!product;
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    isEdit ? updateProductAction : addProductAction,
    null
  );

  const [hasOffer, setHasOffer] = useState<string>(
    product?.hasOffer ? "Yes" : "No"
  );

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  // imagePreview = what the <img> shows (local blob URL while uploading, then Cloudinary URL)
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl || "");
  // imageUrl = the committed Cloudinary URL submitted with the form
  const [imageUrl, setImageUrl] = useState<string>(product?.imageUrl || "");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string>("");

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");
    setImageUploading(true);

    // Show an instant local preview while uploading
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadProductImageAction(fd);

    if (result.url) {
      setImageUrl(result.url);
      setImagePreview(result.url);
      URL.revokeObjectURL(localUrl);
    } else {
      setImageError(result.error ?? "Upload failed");
      setImagePreview(imageUrl); // revert to last good image
    }

    setImageUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearImage = () => {
    setImagePreview("");
    setImageUrl("");
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Packages (1st is always the primary saved to DB)
  const [packages, setPackages] = useState<Package[]>(() => {
    if (product) {
      return [
        {
          id: 1,
          name: "",
          quantity: product.quantity?.toString() ?? "",
          price: product.sellingPrice?.toString() ?? "",
        },
      ];
    }
    return [
      { id: 1, name: "", quantity: "", price: "" },
      { id: 2, name: "", quantity: "", price: "" },
      { id: 3, name: "", quantity: "", price: "" },
    ];
  });

  const offer = product?.offers?.[0];

  // Combo products
  const [combos, setCombos] = useState<ComboItem[]>(() => {
    const initial = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      productId: "",
      quantity: "",
    }));
    return initial;
  });

  // Gift products
  const [gifts, setGifts] = useState<ComboItem[]>(() => {
    const initial = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      productId: "",
      quantity: "",
    }));
    return initial;
  });

  const handlePackageChange = (id: number, field: keyof Package, value: string) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleAddPackage = () => {
    setPackages((prev) => [...prev, { id: nextPkgId++, name: "", quantity: "", price: "" }]);
  };

  const handleDeletePackage = (id: number) => {
    if (packages.length <= 1) return;
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleComboChange = (id: number, field: "productId" | "quantity", value: string) => {
    setCombos((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleAddCombo = () => {
    setCombos((prev) => [...prev, { id: nextComboId++, productId: "", quantity: "" }]);
  };

  const handleGiftChange = (id: number, field: "productId" | "quantity", value: string) => {
    setGifts((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const handleAddGift = () => {
    setGifts((prev) => [...prev, { id: nextGiftId++, productId: "", quantity: "" }]);
  };

  const ordinals = ["1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th"];

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">
              {isEdit ? "Update Existing" : "New"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 rounded-md text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              form="add-product-form"
              type="submit"
              disabled={pending}
              className="px-7 py-2 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {state?.error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <form id="add-product-form" action={formAction}>
          {isEdit && <input type="hidden" name="id" value={product.id} />}

          {/* Hidden: submit hasOffer and imageUrl values */}
          <input type="hidden" name="hasOffer" value={hasOffer} />
          <input type="hidden" name="imageUrl" value={imageUrl} />

          {/* Product Image Upload */}
          <div className="mb-6">
            <label className={labelClass}>Product Image</label>
            <div className="flex items-start gap-4 mt-1">
              {/* Preview box */}
              <div
                onClick={() => !imageUploading && fileInputRef.current?.click()}
                className={`relative w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors overflow-hidden flex-shrink-0 ${
                  imageUploading
                    ? "cursor-wait border-gray-200"
                    : imagePreview
                    ? "cursor-pointer border-[#9D00FF]/40"
                    : "cursor-pointer border-gray-200 hover:border-[#9D00FF]/60"
                }`}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className={`w-full h-full object-cover transition-opacity ${imageUploading ? "opacity-50" : ""}`}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-[11px] text-gray-400 leading-tight">
                      Click to upload
                    </span>
                  </div>
                )}

                {/* Uploading overlay */}
                {imageUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <svg className="animate-spin w-6 h-6 text-[#9D00FF]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Buttons + feedback */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  disabled={imageUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  <Upload className="w-4 h-4" />
                  {imageUploading ? "Uploading…" : "Upload Image"}
                </button>

                {imageUrl && !imageUploading && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                )}

                {imageError && (
                  <p className="text-[11px] text-red-500">{imageError}</p>
                )}

                {imageUrl && !imageUploading && (
                  <p className="text-[11px] text-emerald-600">Uploaded successfully</p>
                )}

                <p className="text-[11px] text-gray-400">PNG, JPG, WEBP · max 5 MB</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>

          {/* Row 1: Country | Product Description | Product Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className={labelClass} htmlFor="country">
                Country To Sell This Product
              </label>
              <SelectWrapper>
                <select
                  id="country"
                  name="country"
                  className={selectClass}
                  defaultValue={product?.country || ""}
                >
                  <option value=""></option>
                  {ALL_COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </SelectWrapper>
            </div>

            <div>
              <label className={labelClass} htmlFor="productDescription">
                Product Description
              </label>
              <p className={subClass}>For your View only</p>
              <input
                id="productDescription"
                type="text"
                name="productDescription"
                className={inputClass}
                defaultValue={product?.description || ""}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="categoryId">
                Product Category
              </label>
              <p className={subClass}>
                All products under this category will carry this brand phone number
              </p>
              <SelectWrapper>
                <select
                  id="categoryId"
                  name="categoryId"
                  className={selectClass}
                  required
                  defaultValue={product?.categoryId || ""}
                >
                  <option value=""></option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
                  ))}
                </select>
              </SelectWrapper>
            </div>
          </div>

          {/* Row 2: Product Name | Has Variations? | Has Offer? */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className={labelClass} htmlFor="productName">
                Product Name
              </label>
              <input
                id="productName"
                type="text"
                name="productName"
                className={inputClass}
                required
                defaultValue={product?.name || ""}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="hasVariations">
                Does this product have variations?
              </label>
              <p className={subClass}>Colours, sizes, Batches, etc?</p>
              <SelectWrapper>
                <select
                  id="hasVariations"
                  name="hasVariations"
                  className={selectClass}
                  defaultValue={product?.hasVariations ? "Yes" : "No"}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </SelectWrapper>
            </div>

            <div>
              <label className={labelClass} htmlFor="hasOfferSelect">
                Do you have an offer for this product?
              </label>
              <p className={subClass}>Select this if you have offer for this product</p>
              <SelectWrapper>
                <select
                  id="hasOfferSelect"
                  className={selectClass}
                  value={hasOffer}
                  onChange={(e) => setHasOffer(e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </SelectWrapper>
            </div>
          </div>

          {/* Row 3: Text to show | Link to file download */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className={labelClass} htmlFor="displayText">
                Text to show
              </label>
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
              <label className={labelClass} htmlFor="fileDownloadLink">
                Link to file download for successful delivery
              </label>
              <p className={subClass}>
                If you have a PDF or Video file to share to customers that bought this product,
                paste the link here. It will appear on the invoice sent to customers email once you
                mark their order as Delivered.
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

          {/* Row 4: Low Stock Agents | Low Stock Total | Alert Emails */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div>
              <label className={labelClass} htmlFor="lowStockAgents">
                Low Stock Alert Quantity (Agents) *
              </label>
              <p className={subClass}>
                All products under this category will carry this brand phone number
              </p>
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
              <label className={labelClass} htmlFor="lowStockTotal">
                Low Stock Alert Quantity (Total)*
              </label>
              <p className={subClass}>Set Low Stock Quantity Alert</p>
              <SelectWrapper>
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
                  <option value="200">200</option>
                  <option value="500">500</option>
                </select>
              </SelectWrapper>
            </div>

            <div>
              <label className={labelClass} htmlFor="alertEmails">
                Email(s) to receive low stock alert (separate each with comma) *
              </label>
              <p className={subClass}>Select this if you have offer for this product</p>
              <input
                id="alertEmails"
                type="text"
                name="alertEmails"
                className={inputClass}
                defaultValue={product?.alertEmails || ""}
              />
            </div>
          </div>

          {/* Cost Price | Selling Price | Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className={labelClass} htmlFor="costPrice">
                Cost Price (1 Unit)
              </label>
              <p className={subClass}>
                How much are YOU buying this from your supplier/manufacturer/seller?
              </p>
              <input
                id="costPrice"
                name="costPrice"
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                required
                defaultValue={product?.costPrice?.toString() || ""}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="sellingPrice">
                Selling Price (1 Unit)
              </label>
              <p className={subClass}>
                How much are YOU selling this product for?
              </p>
              <input
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                required
                defaultValue={product?.sellingPrice?.toString() || ""}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="unit">
                Unit
              </label>
              <p className={subClass}>
                e.g. Piece, Pack, Bottle, Kg, Carton
              </p>
              <input
                id="unit"
                name="unit"
                type="text"
                placeholder="Piece, Pack, Bottle…"
                className={inputClass}
                defaultValue={product?.unit || ""}
              />
            </div>
          </div>

          {/* Pricing Packages — columnar layout */}
          <div className="mb-2">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${Math.min(packages.length, 3)}, 1fr)` }}
            >
              {packages.map((pkg, idx) => (
                <div key={pkg.id} className="border border-gray-100 rounded-lg p-4 relative">
                  {packages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                    {ordinals[idx] ?? `${idx + 1}th`} Package
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>Package Name</label>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => handlePackageChange(pkg.id, "name", e.target.value)}
                        className={inputClass}
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Package Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={pkg.quantity}
                        onChange={(e) => handlePackageChange(pkg.id, "quantity", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Package Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pkg.price}
                        onChange={(e) => handlePackageChange(pkg.id, "price", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={handleAddPackage}
              className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
            >
              Add more
            </button>
          </div>

          {/* ── Offer Section ─────────────────────────────────────────────── */}
          {hasOffer === "Yes" && (
            <div className="border-t border-gray-100 pt-6">
              {/* Offer description labels */}
              <div className="mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold underline">Offer Name:</span>{" "}
                  What customers will see on your form (eg Big Zaddy, Papilo, Buy 2 Get 1 Free OR
                  Buy 3 Get 30% Discount)
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-semibold underline">Offer Quantity:</span>{" "}
                  If your offer is Buy 2 Get 1 Free, offer quantity will be 3
                </p>
              </div>

              {/* Offer Name | Offer Quantity | Recurring */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className={labelClass} htmlFor="offerName">Offer Name</label>
                  <input
                    id="offerName"
                    type="text"
                    name="offerName"
                    className={inputClass}
                    defaultValue={offer?.offerName || ""}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="offerQuantity">Offer Quantity</label>
                  <input
                    id="offerQuantity"
                    type="number"
                    min="1"
                    name="offerQuantity"
                    placeholder="Piece, Unit, Pack, Bottle."
                    className={inputClass}
                    defaultValue={offer?.offerQuantity || ""}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="offerRecurring">Recurring</label>
                  <SelectWrapper>
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
                  </SelectWrapper>
                </div>
              </div>

              {/* Offer Unit | Selling Price | Show Quantity & Unit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className={labelClass} htmlFor="offerUnit">Offer Unit</label>
                  <input
                    id="offerUnit"
                    type="text"
                    name="offerUnit"
                    className={inputClass}
                    defaultValue={offer?.offerUnit || ""}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="offerSellingPrice">Selling price</label>
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
                <div>
                  <label className={labelClass} htmlFor="showQuantityAndUnit">
                    Show Quanitity &amp; Unit
                  </label>
                  <SelectWrapper>
                    <select
                      id="showQuantityAndUnit"
                      name="showQuantityAndUnit"
                      className={selectClass}
                      defaultValue={offer?.showQuantityAndUnit ? "true" : "false"}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </SelectWrapper>
                </div>
              </div>

              {/* Combo Products */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {combos.map((combo, idx) => (
                    <div key={combo.id} className="grid grid-cols-[1fr_auto] gap-2 items-end">
                      <div>
                        <label className={labelClass}>
                          {ordinals[idx] ?? `${idx + 1}th`} Combo Product
                        </label>
                        <SelectWrapper>
                          <select
                            name="comboProductId"
                            className={selectClass}
                            value={combo.productId}
                            onChange={(e) => handleComboChange(combo.id, "productId", e.target.value)}
                          >
                            <option value=""></option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </SelectWrapper>
                      </div>
                      <div className="w-24">
                        <label className={labelClass}>Quantity</label>
                        <input
                          type="number"
                          min="1"
                          name="comboQuantity"
                          value={combo.quantity}
                          onChange={(e) => handleComboChange(combo.id, "quantity", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Free Gift Products */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gifts.map((gift, idx) => (
                    <div key={gift.id} className="grid grid-cols-[1fr_auto] gap-2 items-end">
                      <div>
                        <label className={labelClass}>
                          {ordinals[idx] ?? `${idx + 1}th`} Free Gift Product
                        </label>
                        <SelectWrapper>
                          <select
                            name="giftProductId"
                            className={selectClass}
                            value={gift.productId}
                            onChange={(e) => handleGiftChange(gift.id, "productId", e.target.value)}
                          >
                            <option value=""></option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </SelectWrapper>
                      </div>
                      <div className="w-24">
                        <label className={labelClass}>Quantity</label>
                        <input
                          type="number"
                          min="1"
                          name="giftQuantity"
                          value={gift.quantity}
                          onChange={(e) => handleGiftChange(gift.id, "quantity", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddCombo}
                  className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-[#9D00FF] hover:bg-[#8500d9] transition-colors"
                >
                  Add more
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
