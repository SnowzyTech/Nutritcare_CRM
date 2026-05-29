"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteDriverAction } from "@/modules/delivery/actions/logistics-agents.action";

type Driver = {
  id: string;
  name: string;
  phone1: string;
  phone2: string | null;
  phone3: string | null;
  address: string | null;
  state: string | null;
  country: string | null;
  vehicleNo: string | null;
  status: string;
  addedBy: { name: string };
};

export default function DriverDetailClient({ driver }: { driver: Driver }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteDriverAction(driver.id);
      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Driver deleted");
        router.push("/logistics/agents");
      }
    });
  };

  const phones = [driver.phone1, driver.phone2, driver.phone3].filter(Boolean).join(", ");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 min-h-[500px] flex flex-col relative">
      <div className="flex justify-between flex-1">
        {/* Left: Title & Status */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800">{driver.name}</h1>
          <div className={`inline-block px-2 py-0.5 text-white text-[10px] font-bold rounded-sm ${driver.status === "ACTIVE" ? "bg-emerald-600" : "bg-red-500"}`}>
            {driver.status}
          </div>
        </div>

        {/* Right: Details Card */}
        <div className="w-[450px]">
          <div className="bg-[#f8f9fa] rounded-xl p-6 space-y-4">
            <DetailRow label="Driver Name:" value={driver.name} />
            <DetailRow label="Country:" value={driver.country ?? "—"} />
            <DetailRow label="State / Address:" value={[driver.state, driver.address].filter(Boolean).join(", ") || "—"} />
            <DetailRow label="Phone 1, 2, 3:" value={phones || "—"} />
            <DetailRow label="Vehicle No:" value={driver.vehicleNo ?? "—"} />
            <DetailRow label="Added By:" value={driver.addedBy.name} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-8">
        {showConfirm ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <span className="text-sm text-red-700 font-medium">Delete this driver?</span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Confirm"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-gray-500 hover:text-gray-700 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowConfirm(true)}
            className="bg-[#f1f5f9] border-none text-gray-500 hover:bg-red-50 hover:text-red-500 gap-2 px-6 h-10 rounded-lg text-xs"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px,1fr] gap-4">
      <span className="text-[11px] font-bold text-gray-500 uppercase">{label}</span>
      <span className="text-[11px] font-bold text-gray-700">{value}</span>
    </div>
  );
}
