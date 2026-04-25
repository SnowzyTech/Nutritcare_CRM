"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle } from "lucide-react";
import {
  suspendAgentAction,
  activateAgentAction,
  deleteAgentAction,
} from "@/modules/delivery/actions/agents.action";

type Props = {
  agentName: string;
  agentId: string;
  agentStatus: "ACTIVE" | "INACTIVE";
};

export default function DeliveryAgentDetailClient({ agentName, agentId, agentStatus: initialStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [agentStatus, setAgentStatus] = useState(initialStatus);
  const [modal, setModal] = useState<"delete" | "suspend" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    setModal(null);
    setError(null);
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAgentAction(agentId);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push("/admin/staff/delivery-agent");
      }
    });
  }

  function handleSuspendToggle() {
    setError(null);
    startTransition(async () => {
      const result = agentStatus === "ACTIVE"
        ? await suspendAgentAction(agentId)
        : await activateAgentAction(agentId);
      if ("error" in result) {
        setError(result.error);
      } else {
        setAgentStatus(agentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE");
        closeModal();
      }
    });
  }

  const isActive = agentStatus === "ACTIVE";

  return (
    <>
      <section>
        <h2 className="text-lg font-bold mb-4 text-slate-600">Advanced</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setModal("delete")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-[0.9rem] font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-100 min-w-[240px]"
          >
            <span className="text-lg">🗑️</span> Delete Account
          </button>
          <button
            onClick={() => setModal("suspend")}
            className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-8 py-4 rounded-xl text-[0.9rem] font-black flex items-center justify-center gap-3 transition-all min-w-[240px]"
          >
            <span className="text-lg">{isActive ? "❓" : "✅"}</span>
            {isActive ? "Suspend Account" : "Activate Account"}
          </button>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[450px] p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modal === "delete" ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"
              }`}>
                <AlertTriangle size={24} />
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {modal === "delete" && (
              <>
                <h3 className="text-xl font-black text-slate-800 mb-2">Delete Account</h3>
                <p className="text-slate-500 text-[0.95rem] leading-relaxed mb-8">
                  Permanently delete <span className="font-bold text-slate-700">{agentName}</span>? This action cannot be undone.
                </p>
                {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-rose-100 disabled:opacity-60"
                  >
                    {isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            )}

            {modal === "suspend" && (
              <>
                <h3 className="text-xl font-black text-slate-800 mb-2">
                  {isActive ? "Suspend Account" : "Activate Account"}
                </h3>
                <p className="text-slate-500 text-[0.95rem] leading-relaxed mb-8">
                  {isActive
                    ? <>Suspend <span className="font-bold text-slate-700">{agentName}</span>? They will be marked inactive.</>
                    : <>Reactivate <span className="font-bold text-slate-700">{agentName}</span>? They will resume as an active agent.</>
                  }
                </p>
                {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSuspendToggle}
                    disabled={isPending}
                    className={`flex-1 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg disabled:opacity-60 ${
                      isActive
                        ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                        : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100"
                    }`}
                  >
                    {isPending ? "Processing..." : isActive ? "Suspend" : "Activate"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
