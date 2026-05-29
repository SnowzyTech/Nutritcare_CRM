"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  approveAccountAction,
  rejectAccountAction,
} from "@/modules/users/actions/users.action";

type Props = {
  userId: string;
  userName: string;
};

type ModalType = "approve" | "reject" | null;

export default function ManageAccountDetailClient({ userId, userName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<ModalType>(null);
  const [error, setError] = useState<string | null>(null);

  function openModal(type: ModalType) {
    setError(null);
    setModal(type);
  }

  function closeModal() {
    setModal(null);
    setError(null);
  }

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveAccountAction(userId);
      if ("error" in result) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Account approved");
        router.push("/admin/staff/manage-account");
      }
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectAccountAction(userId);
      if ("error" in result) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Account rejected");
        router.push("/admin/staff/manage-account");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-4 mt-2">
        <button
          onClick={() => openModal("approve")}
          className="flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-[0.9rem] font-bold transition-all shadow-lg shadow-purple-200"
        >
          <CheckCircle size={20} />
          Approve Account
        </button>
        <button
          onClick={() => openModal("reject")}
          className="flex items-center gap-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-8 py-4 rounded-xl text-[0.9rem] font-bold transition-all"
        >
          <XCircle size={20} />
          Reject Account
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[450px] p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  modal === "approve"
                    ? "bg-purple-50 text-purple-500"
                    : "bg-rose-50 text-rose-500"
                }`}
              >
                <AlertTriangle size={24} />
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {modal === "approve" && (
              <>
                <h3 className="text-xl font-black text-slate-800 mb-2">
                  Approve Account
                </h3>
                <p className="text-slate-500 text-[0.95rem] leading-relaxed mb-8">
                  Approve{" "}
                  <span className="font-bold text-slate-700">{userName}</span>
                  &apos;s account? They will gain access to the system
                  immediately.
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
                    onClick={handleApprove}
                    disabled={isPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-purple-100 disabled:opacity-60"
                  >
                    {isPending ? "Approving..." : "Approve"}
                  </button>
                </div>
              </>
            )}

            {modal === "reject" && (
              <>
                <h3 className="text-xl font-black text-slate-800 mb-2">
                  Reject Account
                </h3>
                <p className="text-slate-500 text-[0.95rem] leading-relaxed mb-8">
                  Reject{" "}
                  <span className="font-bold text-slate-700">{userName}</span>
                  &apos;s account request? They will not be able to access the
                  system.
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
                    onClick={handleReject}
                    disabled={isPending}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-rose-100 disabled:opacity-60"
                  >
                    {isPending ? "Rejecting..." : "Reject"}
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
