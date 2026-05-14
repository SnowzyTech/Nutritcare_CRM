"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Trash2, User, Phone, MapPin, Globe, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteAgentAction } from "@/modules/inventory/actions/stock.action";

export default function AgentDetailClient({ agent }: { agent: any }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteAgentAction(agent.id);
    if (result?.error) {
      alert(result.error);
      setIsDeleting(false);
      setShowConfirm(false);
    } else {
      router.push("/inventory/stock?tab=Agents");
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Stock
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#3D0066] to-[#5C0099] p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{agent.companyName}</h1>
                <p className="text-white/60 text-sm mt-1">Status: {agent.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/inventory/stock/add-agent`)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phones
                </h3>
                <div className="space-y-2">
                  {agent.phone1 && <p className="text-gray-900 font-semibold py-2 border-b border-gray-50">{agent.phone1}</p>}
                  {agent.phone2 && <p className="text-gray-900 font-semibold py-2 border-b border-gray-50">{agent.phone2}</p>}
                  {agent.phone3 && <p className="text-gray-900 font-semibold py-2 border-b border-gray-50">{agent.phone3}</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Financials
                </h3>
                <div className="bg-[#FAF5FF] p-6 rounded-2xl border border-[#9D00FF]/10">
                  <p className="text-[#9D00FF] text-xs mb-1 font-bold uppercase">Delivery Fee</p>
                  <p className="text-3xl font-black text-gray-900">{formatCurrency(agent.deliveryFee || 0)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location & Coverage
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase mb-1">Country</span>
                    <span className="text-gray-900 font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      {agent.country || "Nigeria"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase mb-1">State</span>
                    <span className="text-gray-900 font-semibold">{agent.state || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase mb-1">States Covered</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(agent.statesCovered || []).map((s: string) => (
                        <span key={s} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{s}</span>
                      ))}
                      {(!agent.statesCovered || agent.statesCovered.length === 0) && <span className="text-gray-400 text-sm italic">No specific states listed</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl">
                 <p className="text-gray-500 text-xs mb-1 uppercase font-bold tracking-tight">Added By</p>
                 <p className="text-gray-900 font-semibold">{agent.addedBy?.name || "System"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Agent?</h2>
            <p className="text-gray-500 text-sm mb-8">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{agent.companyName}"</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600">
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
