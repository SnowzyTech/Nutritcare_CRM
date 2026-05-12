"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Copy, Check, Warehouse } from "lucide-react";
import {
  deleteUserAction,
  suspendUserAction,
  activateUserAction,
  resetUserPasswordAction,
  assignWarehouseAction,
} from "@/modules/users/actions/users.action";

type WarehouseOption = { id: string; name: string };

type Props = {
  staffName: string;
  staffId: string;
  isActive: boolean;
  backPath: string;
  role?: string;
  warehouses?: WarehouseOption[];
  currentWarehouseId?: string | null;
};

type ModalType = "delete" | "suspend" | "resetPassword" | "assignWarehouse" | null;

export default function StaffDetailAdvancedClient({
  staffName,
  staffId,
  isActive: initialIsActive,
  backPath,
  role,
  warehouses,
  currentWarehouseId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(initialIsActive);
  const [modal, setModal] = useState<ModalType>(null);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(currentWarehouseId ?? "");
  const [assignedWarehouseId, setAssignedWarehouseId] = useState<string | null>(currentWarehouseId ?? null);

  function openModal(type: ModalType) {
    setError(null);
    setTempPassword(null);
    setCopied(false);
    if (type === "assignWarehouse") {
      setSelectedWarehouseId(assignedWarehouseId ?? "");
    }
    setModal(type);
  }

  function closeModal() {
    setModal(null);
    setError(null);
    setTempPassword(null);
    setCopied(false);
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteUserAction(staffId);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push(backPath);
      }
    });
  }

  function handleSuspendToggle() {
    setError(null);
    startTransition(async () => {
      const result = isActive
        ? await suspendUserAction(staffId)
        : await activateUserAction(staffId);
      if ("error" in result) {
        setError(result.error);
      } else {
        setIsActive(!isActive);
        closeModal();
      }
    });
  }

  function handleResetPassword() {
    setError(null);
    startTransition(async () => {
      const result = await resetUserPasswordAction(staffId);
      if ("error" in result) {
        setError(result.error);
      } else {
        setTempPassword(result.tempPassword);
      }
    });
  }

  function handleCopyPassword() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleAssignWarehouse() {
    setError(null);
    startTransition(async () => {
      const result = await assignWarehouseAction(staffId, selectedWarehouseId || null);
      if ("error" in result) {
        setError(result.error);
      } else {
        setAssignedWarehouseId(selectedWarehouseId || null);
        closeModal();
        router.refresh();
      }
    });
  }

  return (
    <>
      <section>
        <h2 className="text-lg font-bold mb-4 text-slate-600">Advanced</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => openModal("delete")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-[0.9rem] font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-200 min-w-[220px]"
          >
            <span className="text-lg">🗑️</span> Delete Account
          </button>
          <button
            onClick={() => openModal("suspend")}
            className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-8 py-4 rounded-xl text-[0.9rem] font-bold flex items-center justify-center gap-3 transition-all min-w-[220px]"
          >
            <span className="text-lg">{isActive ? "❓" : "✅"}</span>
            {isActive ? "Suspend Account" : "Activate Account"}
          </button>
          <button
            onClick={() => openModal("resetPassword")}
            className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-xl text-[0.9rem] font-bold transition-all min-w-[180px]"
          >
            Reset Password
          </button>
          {role === "WAREHOUSE_MANAGER" && (
            <button
              onClick={() => openModal("assignWarehouse")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-[0.9rem] font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-200 min-w-[220px]"
            >
              <Warehouse size={18} /> Assign Warehouse
            </button>
          )}
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[450px] p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                modal === "delete" ? "bg-rose-50 text-rose-500" :
                modal === "suspend" ? "bg-amber-50 text-amber-500" :
                modal === "assignWarehouse" ? "bg-emerald-50 text-emerald-500" :
                "bg-purple-50 text-purple-500"
              }`}>
                {modal === "assignWarehouse" ? <Warehouse size={24} /> : <AlertTriangle size={24} />}
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
                  Permanently delete <span className="font-bold text-slate-700">{staffName}</span>&apos;s account? This cannot be undone.
                </p>
                {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-4">
                  <button onClick={closeModal} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold transition-all">Cancel</button>
                  <button onClick={handleDelete} disabled={isPending} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-rose-100 disabled:opacity-60">
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
                    ? <><span className="font-bold text-slate-700">{staffName}</span> will lose access until reactivated.</>
                    : <><span className="font-bold text-slate-700">{staffName}</span> will regain full access.</>
                  }
                </p>
                {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-4">
                  <button onClick={closeModal} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold transition-all">Cancel</button>
                  <button
                    onClick={handleSuspendToggle}
                    disabled={isPending}
                    className={`flex-1 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg disabled:opacity-60 ${
                      isActive ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100"
                    }`}
                  >
                    {isPending ? "Processing..." : isActive ? "Suspend" : "Activate"}
                  </button>
                </div>
              </>
            )}

            {modal === "resetPassword" && !tempPassword && (
              <>
                <h3 className="text-xl font-black text-slate-800 mb-2">Reset Password</h3>
                <p className="text-slate-500 text-[0.95rem] leading-relaxed mb-8">
                  Generate a new temporary password for <span className="font-bold text-slate-700">{staffName}</span>? Share it with them securely.
                </p>
                {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-4">
                  <button onClick={closeModal} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold transition-all">Cancel</button>
                  <button onClick={handleResetPassword} disabled={isPending} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-purple-100 disabled:opacity-60">
                    {isPending ? "Resetting..." : "Reset"}
                  </button>
                </div>
              </>
            )}

            {modal === "resetPassword" && tempPassword && (
              <>
                <h3 className="text-xl font-black text-slate-800 mb-2">Password Reset</h3>
                <p className="text-slate-500 text-[0.95rem] leading-relaxed mb-4">
                  Temporary password for <span className="font-bold text-slate-700">{staffName}</span>:
                </p>
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-5 py-4 mb-4">
                  <code className="flex-1 text-lg font-black text-purple-700 tracking-wider">{tempPassword}</code>
                  <button onClick={handleCopyPassword} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-purple-600 transition-colors">
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-amber-600 text-[0.8rem] font-semibold mb-6">The user should change this password on first login.</p>
                <button onClick={closeModal} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-2xl font-bold transition-all">Done</button>
              </>
            )}

            {modal === "assignWarehouse" && (
              <>
                <h3 className="text-xl font-black text-slate-800 mb-2">Assign Warehouse</h3>
                <p className="text-slate-500 text-[0.95rem] leading-relaxed mb-6">
                  Select a warehouse to assign to <span className="font-bold text-slate-700">{staffName}</span>.
                </p>
                <div className="flex flex-col gap-2 mb-6 max-h-[280px] overflow-y-auto pr-1">
                  {warehouses && warehouses.length > 0 ? (
                    warehouses.map((wh) => (
                      <button
                        key={wh.id}
                        onClick={() => setSelectedWarehouseId(wh.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                          selectedWarehouseId === wh.id
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-100 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40"
                        }`}
                      >
                        <Warehouse size={16} className={selectedWarehouseId === wh.id ? "text-emerald-500" : "text-slate-400"} />
                        <span className="font-bold text-[0.9rem]">{wh.name}</span>
                        {assignedWarehouseId === wh.id && (
                          <span className="ml-auto text-[0.7rem] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Current</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 text-sm py-6">No warehouses found in the system.</p>
                  )}
                </div>
                {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-4">
                  <button onClick={closeModal} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold transition-all">Cancel</button>
                  <button
                    onClick={handleAssignWarehouse}
                    disabled={isPending || !selectedWarehouseId}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100 disabled:opacity-60"
                  >
                    {isPending ? "Assigning..." : "Assign"}
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
