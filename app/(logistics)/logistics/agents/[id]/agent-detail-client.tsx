"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAgentLogisticsAction } from "@/modules/delivery/actions/logistics-agents.action";

type Agent = {
  id: string;
  companyName: string;
  state: string | null;
  phone1: string;
  phone2: string | null;
  phone3: string | null;
  status: string;
  statesCovered: unknown;
};

export default function AgentDetailClient({ agent }: { agent: Agent }) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statesCoveredText = Array.isArray(agent.statesCovered)
    ? (agent.statesCovered as string[]).join(", ")
    : "—";

  const phones = [agent.phone1, agent.phone2, agent.phone3].filter(Boolean).join(", ");

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAgentLogisticsAction(agent.id);
      if (result && "error" in result) {
        setError(result.error);
        setShowDeleteDialog(false);
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-4 pb-20">
      {/* Top Header Section */}
      <div className="flex items-center justify-between">
        <Link
          href="/logistics/agents"
          className="flex items-center gap-2 text-gray-500 hover:text-[#ad1df4] transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="search"
            className="w-full pl-10 pr-4 py-2 text-sm border-none rounded-lg focus:outline-none bg-white/50"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 min-h-[500px] flex flex-col relative">
        <div className="flex justify-between flex-1">
          {/* Left Side: Agent Name & Status */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-800">{agent.companyName}</h1>
            <div
              className={`inline-block px-2 py-0.5 text-white text-[10px] font-bold rounded-sm ${
                agent.status === "ACTIVE" ? "bg-[#854d0e]" : "bg-gray-400"
              }`}
            >
              {agent.status}
            </div>
          </div>

          {/* Right Side: Details Card */}
          <div className="w-[450px]">
            <div className="bg-[#f8f9fa] rounded-xl p-6 space-y-4">
              <DetailRow label="AGENT NAME:" value={agent.companyName} />
              <DetailRow label="STATE/ADDRESS:" value={agent.state ?? "—"} />
              <DetailRow label="PHONE:" value={phones || "—"} />
              <DetailRow label="STATES COVERED:" value={statesCoveredText} />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm font-medium mt-4">{error}</p>
        )}

        {/* Action Buttons at Bottom Right */}
        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
            className="bg-[#f1f5f9] border-none text-gray-500 hover:bg-gray-200 gap-2 px-6 h-10 rounded-lg text-xs disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="bg-[#f1f5f9] border-none text-gray-500 hover:bg-gray-200 gap-2 px-6 h-10 rounded-lg text-xs"
          >
            <Printer className="w-4 h-4" /> PDF/Print
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[420px]">
            <h2 className="text-[16px] font-semibold text-gray-800 mb-2">Delete Agent</h2>
            <p className="text-[13px] text-gray-500 mb-1">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{agent.companyName}</span>?
            </p>
            <p className="text-[13px] text-red-500 font-medium mb-6">
              This will soft-delete the agent and hide them from all lists.
            </p>
            {error && (
              <p className="text-red-500 text-[13px] font-medium mb-4">{error}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteDialog(false); setError(null); }}
                disabled={isPending}
                className="px-5 h-[36px] rounded-md text-[13px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-5 h-[36px] rounded-md text-[13px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px,1fr] gap-4">
      <span className="text-[11px] font-bold text-gray-500 uppercase">{label}</span>
      <span className="text-[11px] font-bold text-gray-700 uppercase">{value}</span>
    </div>
  );
}
