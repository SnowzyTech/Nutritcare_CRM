"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

type Props = {
  agentName: string;
};

export default function DeliveryAgentDetailClient({ agentName }: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  return (
    <>
      <section>
        <h2 className="text-lg font-bold mb-4 text-slate-600">Advanced</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-[0.9rem] font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-100 min-w-[240px]"
          >
            <span className="text-lg">🗑️</span> Delete Account
          </button>
          <button
            onClick={() => setIsSuspendModalOpen(true)}
            className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-8 py-4 rounded-xl text-[0.9rem] font-black flex items-center justify-center gap-3 transition-all min-w-[240px]"
          >
            <span className="text-lg">❓</span> Suspend Account
          </button>
        </div>
      </section>

      {(isDeleteModalOpen || isSuspendModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => { setIsDeleteModalOpen(false); setIsSuspendModalOpen(false); }}
          />
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[450px] p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDeleteModalOpen ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"}`}>
                <AlertTriangle size={24} />
              </div>
              <button
                onClick={() => { setIsDeleteModalOpen(false); setIsSuspendModalOpen(false); }}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">
              {isDeleteModalOpen ? "Delete Account" : "Suspend Account"}
            </h3>
            <p className="text-slate-500 text-[0.95rem] leading-relaxed mb-8">
              Are you sure you want to {isDeleteModalOpen ? "permanently delete" : "temporarily suspend"} this account? This action will {isDeleteModalOpen ? "remove all data" : "restrict access"} for <span className="font-bold text-slate-700">{agentName}</span>.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setIsSuspendModalOpen(false); }}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold transition-all"
              >
                Cancel
              </button>
              <button className={`flex-1 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg ${
                isDeleteModalOpen ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100" : "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
              }`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
