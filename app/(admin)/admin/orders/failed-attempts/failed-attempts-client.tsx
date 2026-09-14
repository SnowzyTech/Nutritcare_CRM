"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, Phone, CheckCircle2 } from "lucide-react";
import { markFailedAttemptRecoveredAction } from "@/modules/orders/actions/failed-attempts.action";

export type FailedAttempt = {
  id: string;
  formId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerWhatsapp: string | null;
  productName: string | null;
  packageName: string | null;
  state: string | null;
  deliveryAddress: string | null;
  reason: string;
  httpStatus: number | null;
  recoveredAt: string | null;
  createdAt: string;
};

const REASON_LABEL: Record<string, string> = {
  timeout: "Timed out",
  network: "Connection lost",
  server_error: "Server error",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FailedAttemptsClient({ attempts }: { attempts: FailedAttempt[] }) {
  const [rows, setRows] = useState(attempts);
  const [showRecovered, setShowRecovered] = useState(false);
  const [pending, startTransition] = useTransition();

  const unrecovered = rows.filter((r) => !r.recoveredAt).length;
  const visible = showRecovered ? rows : rows.filter((r) => !r.recoveredAt);

  const recover = (id: string) => {
    startTransition(async () => {
      const res = await markFailedAttemptRecoveredAction(id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, recoveredAt: new Date().toISOString() } : r))
      );
      toast.success("Marked as recovered");
    });
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Failed Orders
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Orders that a customer tried to place on a form but that failed to save. Call the
            customer back and re-enter the order, then mark it recovered.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            {unrecovered} to recover
          </span>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showRecovered}
              onChange={(e) => setShowRecovered(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Show recovered
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
          {rows.length === 0
            ? "No failed order attempts recorded. 🎉"
            : "No unrecovered failed orders — all followed up."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Product / Package</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((r) => (
                <tr key={r.id} className={r.recoveredAt ? "bg-gray-50 text-gray-400" : "text-gray-700"}>
                  <td className="whitespace-nowrap px-4 py-3">{formatWhen(r.createdAt)}</td>
                  <td className="px-4 py-3">{r.customerName || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {r.customerPhone ? (
                      <a
                        href={`tel:${r.customerPhone}`}
                        className="inline-flex items-center gap-1 font-medium text-[#8B2FE8] hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {r.customerPhone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{r.productName || "—"}</span>
                    {r.packageName && (
                      <span className="block text-xs text-gray-400">{r.packageName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{r.state || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      {REASON_LABEL[r.reason] ?? r.reason}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {r.recoveredAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Recovered
                      </span>
                    ) : (
                      <button
                        onClick={() => recover(r.id)}
                        disabled={pending}
                        className="rounded-md bg-[#8B2FE8] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#7a29cc] disabled:opacity-50"
                      >
                        Mark recovered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
