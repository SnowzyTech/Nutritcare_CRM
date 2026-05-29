"use client";

import React, { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { updateProductCategoryAction } from "@/modules/inventory/actions/stock.action";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";

export default function EditCategoryClient({ category }: { category: any }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProductCategoryAction, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="max-w-[1400px] mx-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product Category</h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">{category.categoryName}</p>
          </div>
        </div>

        {state?.error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <input type="hidden" name="id" value={category.id} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="categoryName">
                Category Name
              </label>
              <input
                id="categoryName"
                type="text"
                name="categoryName"
                className={inputClass}
                required
                defaultValue={category.categoryName}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-0.5" htmlFor="brandName">
                Brand Name (shown on invoices)
              </label>
              <p className="text-[11px] text-gray-400 mb-1.5">
                All products under this category will carry this brand name
              </p>
              <input
                id="brandName"
                type="text"
                name="brandName"
                className={inputClass}
                required
                defaultValue={category.brandName}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-0.5" htmlFor="brandPhoneNumber">
                Brand Phone Number (shown on invoices)
              </label>
              <p className="text-[11px] text-gray-400 mb-1.5">
                All products under this category will carry this brand phone number
              </p>
              <input
                id="brandPhoneNumber"
                type="tel"
                name="brandPhoneNumber"
                className={inputClass}
                defaultValue={category.brandPhone ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-0.5 uppercase tracking-wide" htmlFor="brandWhatsappNumber">
                Brand Business Whatsapp Number
              </label>
              <p className="text-[11px] text-gray-400 mb-1.5">For Automatic Messaging</p>
              <input
                id="brandWhatsappNumber"
                type="tel"
                name="brandWhatsappNumber"
                className={inputClass}
                defaultValue={category.brandWhatsappNumber ?? ""}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-0.5" htmlFor="brandEmail">
                Brand Email (shown on invoices)
              </label>
              <p className="text-[11px] text-gray-400 mb-1.5">
                All products under this category will carry this brand email
              </p>
              <input
                id="brandEmail"
                type="email"
                name="brandEmail"
                className={inputClass}
                defaultValue={category.brandEmail ?? ""}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-0.5" htmlFor="smsSenderId">
                SMS Sender ID
              </label>
              <p className="text-[11px] text-gray-400 mb-1.5">
                All products under this category will use this sender ID
              </p>
              <input
                id="smsSenderId"
                type="text"
                name="smsSenderId"
                className={inputClass}
                defaultValue={category.smsSenderId ?? ""}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-8">
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
              {pending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
