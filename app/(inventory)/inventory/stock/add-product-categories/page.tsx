"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";

const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";

export default function AddProductCategoriesPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    categoryName: "",
    brandName: "",
    brandPhoneNumber: "",
    brandWhatsappNumber: "",
    brandEmail: "",
    smsSenderId: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Product Categories</h1>
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

        {/* Form — Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              name="categoryName"
              value={form.categoryName}
              onChange={handleChange}
              placeholder="Type in here"
              className={inputClass}
            />
          </div>

          {/* Brand Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-0.5">
              Brand Name (shown on invoices)
            </label>
            <p className="text-[11px] text-gray-400 mb-1.5">
              All products under this category will carry this brand name
            </p>
            <input
              type="text"
              name="brandName"
              value={form.brandName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Brand Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-0.5">
              Brand Phone Number (shown on invoices)
            </label>
            <p className="text-[11px] text-gray-400 mb-1.5">
              All products under this category will carry this brand phone number
            </p>
            <input
              type="tel"
              name="brandPhoneNumber"
              value={form.brandPhoneNumber}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Form — Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand Business WhatsApp Number */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-0.5 uppercase tracking-wide text-[11px]">
              Brand Business Whatsapp Number
            </label>
            <p className="text-[11px] text-gray-400 mb-1.5">
              For Automatic Messaging (if any number is active under WhatsApp &gt; Setup)
            </p>
            <div className="relative">
              <select
                name="brandWhatsappNumber"
                value={form.brandWhatsappNumber}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="" disabled></option>
                <option value="08012345678">08012345678</option>
                <option value="08098765432">08098765432</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                ▾
              </span>
            </div>
          </div>

          {/* Brand Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-0.5">
              Brand email (shown on invoices)
            </label>
            <p className="text-[11px] text-gray-400 mb-1.5">
              All products under this category will carry this brand email
            </p>
            <input
              type="email"
              name="brandEmail"
              value={form.brandEmail}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* SMS Sender ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-0.5">
              SMS Sender ID
            </label>
            <p className="text-[11px] text-gray-400 mb-1.5">
              All products under this category will use this sender ID while sending SMS to your customers
            </p>
            <input
              type="text"
              name="smsSenderId"
              value={form.smsSenderId}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
