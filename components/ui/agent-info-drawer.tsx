"use client";

import { X, Phone, MapPin, Package, Clock } from "lucide-react";

export type AgentInfo = {
  companyName: string;
  state: string | null;
  phone: string;
  totalDeliveries: number;
  activeOrders: number;
};

interface AgentInfoDrawerProps {
  agent: AgentInfo;
  isOpen: boolean;
  onClose: () => void;
}

export function AgentInfoDrawer({ agent, isOpen, onClose }: AgentInfoDrawerProps) {
  if (!isOpen) return null;

  const initials = agent.companyName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">Agent Information</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-3xl font-black border-4 border-white shadow-md">
              {initials}
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">{agent.companyName}</h3>
              <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wider">
                Delivery Agent
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
                <Phone size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Phone Number
                </span>
                <span className="text-sm font-bold text-gray-800">{agent.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm">
                <MapPin size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Location
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {agent.state ?? "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100 space-y-1">
              <div className="flex items-center gap-2 text-purple-600">
                <Package size={16} />
                <span className="text-[10px] font-black uppercase">Deliveries</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{agent.totalDeliveries}</p>
            </div>
            <div className="p-6 bg-green-50 rounded-3xl border border-green-100 space-y-1">
              <div className="flex items-center gap-2 text-green-600">
                <Clock size={16} />
                <span className="text-[10px] font-black uppercase">Active Orders</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{agent.activeOrders}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
