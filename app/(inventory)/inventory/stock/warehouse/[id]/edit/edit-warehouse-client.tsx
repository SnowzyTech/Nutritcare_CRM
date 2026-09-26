"use client";

import React, { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { updateWarehouseAction } from "@/modules/inventory/actions/stock.action";

const inputClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white";
const selectClass =
  "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-400 outline-none focus:border-[#9D00FF] focus:ring-1 focus:ring-[#9D00FF]/20 transition-all bg-white appearance-none cursor-pointer";
const labelClass = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";

export default function EditWarehouseClient({ warehouse }: { warehouse: any }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateWarehouseAction, null);

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
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Warehouse</h1>
            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">{warehouse.name}</p>
          </div>
        </div>

        {state?.error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <input type="hidden" name="id" value={warehouse.id} />

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass} htmlFor="warehouseName">Warehouse Name</label>
                <input
                  id="warehouseName"
                  type="text"
                  name="warehouseName"
                  className={inputClass}
                  required
                  defaultValue={warehouse.name}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="warehouseAddress">Warehouse Address</label>
                <input
                  id="warehouseAddress"
                  type="text"
                  name="warehouseAddress"
                  className={inputClass}
                  defaultValue={warehouse.address ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass} htmlFor="warehousePhone">Warehouse Phone Number</label>
                <input
                  id="warehousePhone"
                  type="tel"
                  name="warehousePhone"
                  className={inputClass}
                  defaultValue={warehouse.phone ?? ""}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="warehouseEmail">Warehouse Email</label>
                <input
                  id="warehouseEmail"
                  type="email"
                  name="warehouseEmail"
                  className={inputClass}
                  defaultValue={warehouse.email ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass} htmlFor="referenceCode">Warehouse Reference Code</label>
                <input
                  id="referenceCode"
                  type="text"
                  name="referenceCode"
                  className={inputClass}
                  defaultValue={warehouse.referenceCode ?? ""}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="country">Select Country</label>
                <div className="relative">
                  <select
                    id="country"
                    name="country"
                    className={selectClass}
                    defaultValue={warehouse.country ?? ""}
                  >
                    <option value="">Select an Option</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                </div>
              </div>
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
