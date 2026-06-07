"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
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
        toast.error(result.error);
      } else {
        toast.success("Delivery agent deleted");
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
        toast.error(result.error);
      } else {
        toast.success(agentStatus === "ACTIVE" ? "Agent suspended" : "Agent activated");
        setAgentStatus(agentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE");
        closeModal();
      }
    });
  }

  const isActive = agentStatus === "ACTIVE";

  return (
    <>
      <section>
        <h2 className="text-lg font-bold mb-6 text-gray-600">Advanced</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setModal("delete")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all min-w-[180px]"
          >
            <Trash2 size={16} /> Delete Account
          </button>
          <button
            onClick={() => setModal("suspend")}
            className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all min-w-[180px]"
          >
            <Shield size={16} /> {isActive ? "Suspend Account" : "Activate Account"}
          </button>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[450px] p-6 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                modal === "delete" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
              }`}>
                <AlertTriangle size={24} />
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {modal === "delete" && (
              <>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Account</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  Permanently delete <span className="font-bold text-gray-700">{agentName}</span>? This action cannot be undone.
                </p>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-3 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-60"
                  >
                    {isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            )}

            {modal === "suspend" && (
              <>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {isActive ? "Suspend Account" : "Activate Account"}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  {isActive
                    ? <>Suspend <span className="font-bold text-gray-700">{agentName}</span>? They will be marked inactive.</>
                    : <>Reactivate <span className="font-bold text-gray-700">{agentName}</span>? They will resume as an active agent.</>
                  }
                </p>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-3 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSuspendToggle}
                    disabled={isPending}
                    className={`flex-1 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-60 ${
                      isActive
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-green-500 hover:bg-green-600"
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
