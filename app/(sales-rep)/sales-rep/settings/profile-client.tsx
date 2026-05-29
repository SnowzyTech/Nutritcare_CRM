"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Plus, 
  MessageSquare, 
  ChevronDown, 
  X
} from "lucide-react";
import { updateProfileAction } from "@/modules/users/actions/users.action";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsappNumber: string | null;
  role: string;
  createdAt: Date;
  avatarUrl?: string | null;
};

// 12 Months mapping for metrics
const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// High fidelity performance data for month switching
const performanceData: Record<string, { value: string; diff: string; isPositive: boolean }> = {
  "January": { value: "72%", diff: "+5%", isPositive: true },
  "February": { value: "75%", diff: "+3%", isPositive: true },
  "March": { value: "85%", diff: "+10%", isPositive: true },
  "April": { value: "78%", diff: "-7%", isPositive: false },
  "May": { value: "80%", diff: "+12%", isPositive: true },
  "June": { value: "83%", diff: "+3%", isPositive: true },
  "July": { value: "79%", diff: "-4%", isPositive: false },
  "August": { value: "81%", diff: "+2%", isPositive: true },
  "September": { value: "84%", diff: "+3%", isPositive: true },
  "October": { value: "86%", diff: "+2%", isPositive: true },
  "November": { value: "88%", diff: "+2%", isPositive: true },
  "December": { value: "90%", diff: "+2%", isPositive: true }
};

// High fidelity delivery rate data for month switching
const deliveryData: Record<string, { value: string; diff: string; isPositive: boolean }> = {
  "January": { value: "70%", diff: "+2%", isPositive: true },
  "February": { value: "72%", diff: "+2%", isPositive: true },
  "March": { value: "74%", diff: "+2%", isPositive: true },
  "April": { value: "75%", diff: "+1%", isPositive: true },
  "May": { value: "78%", diff: "+12%", isPositive: true },
  "June": { value: "80%", diff: "+2%", isPositive: true },
  "July": { value: "76%", diff: "-4%", isPositive: false },
  "August": { value: "77%", diff: "+1%", isPositive: true },
  "September": { value: "79%", diff: "+2%", isPositive: true },
  "October": { value: "82%", diff: "+3%", isPositive: true },
  "November": { value: "83%", diff: "+1%", isPositive: true },
  "December": { value: "85%", diff: "+2%", isPositive: true }
};

export function ProfileClient({ profile }: { profile: Profile }) {
  // General Performance month selection states
  const [selectedPerfMonth, setSelectedPerfMonth] = useState("May");
  const [isPerfDropdownOpen, setIsPerfDropdownOpen] = useState(false);

  // Delivery Rate month selection states
  const [selectedDelivMonth, setSelectedDelivMonth] = useState("May");
  const [isDelivDropdownOpen, setIsDelivDropdownOpen] = useState(false);

  // Form edit states
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsappNumber ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fallbacks matching mockup screenshot
  const displayPhone = phone || "091524472657";
  const displayWhatsapp = whatsapp || "091524472657";
  const displayEmail = profile.email || "blessinghiejie@gamail.com";
  const displayFirstName = name.split(" ")[0] || "Blessing";

  // Active metrics based on dynamic dropdown switches
  const activePerf = performanceData[selectedPerfMonth] || performanceData["May"];
  const activeDeliv = deliveryData[selectedDelivMonth] || deliveryData["May"];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!name.trim()) { 
      setError("Name is required."); 
      return; 
    }
    setLoading(true);
    const result = await updateProfileAction({
      name: name.trim(),
      phone: phone.trim() || undefined,
      whatsappNumber: whatsapp.trim() || undefined,
    });
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Profile updated successfully");
      setSuccess(true);
      setIsEditModalOpen(false);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Dynamic Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
        <div className="flex items-center gap-3">
          {/* Quick-action 1: Plus Button */}
          <button 
            className="w-10 h-10 rounded-full bg-[#A020F0] text-white flex items-center justify-center shadow-lg shadow-purple-100 hover:bg-[#8B1ED2] active:scale-95 transition-all duration-200"
            title="Create new order"
            onClick={() => window.location.href = "/sales-rep/orders"}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
          {/* Quick-action 2: Chat Button */}
          <button 
            className="w-10 h-10 rounded-full bg-[#A020F0] text-white flex items-center justify-center shadow-lg shadow-purple-100 hover:bg-[#8B1ED2] active:scale-95 transition-all duration-200"
            title="Chat/Messages"
          >
            <MessageSquare className="w-5 h-5 fill-white stroke-none" />
          </button>
        </div>
      </div>

      {/* Main Profile Area Container (Full Width Open Card) */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8 min-h-[500px]">
        <div className="flex-1 min-w-0">
          {success && (
            <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Profile updated successfully.</p>
            </div>
          )}

          <div className="space-y-8">
            {/* Upper Section: Avatar, Basic Info, and KPI */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-gray-50/50 to-transparent p-5 rounded-2xl border border-gray-100/50">
              <div className="flex items-center gap-5">
                {/* Circular Avatar with '+' button overlay */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-purple-50">
                    <img 
                      src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F3E8FF&color=A020F0&size=128&font-size=0.35&bold=true`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-md text-gray-500 hover:text-purple-600 hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                {/* Info details */}
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{name}</h2>
                  <p className="text-sm font-medium text-gray-400">
                    Sales Rep <span className="text-gray-900 font-bold ml-1">Team 2</span>
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EBFDF5] text-[#10B981] border border-[#A7F3D0]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Widget */}
              <div className="flex items-center justify-between md:justify-end gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm md:w-auto w-full shrink-0">
                <div className="text-left space-y-0.5">
                  <p className="text-[11px] font-medium text-gray-400">
                    {displayFirstName}&apos;s KPI for this
                  </p>
                  <p className="text-[11px] font-medium text-gray-400">
                    month is <span className="font-extrabold text-gray-900">XXXXX</span>
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-2xl font-extrabold text-[#10B981] leading-none block">
                    50%
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400 block">
                    achieved
                  </span>
                </div>
              </div>
            </div>

            {/* Purple Separator Line */}
            <div className="border-t border-[#F3E8FF] my-1"></div>

            {/* Profile Details List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2.5 border-b border-gray-50 text-sm">
                <span className="text-gray-400 font-medium">Phone Number</span>
                <span className="text-gray-800 font-bold">{displayPhone}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-gray-50 text-sm">
                <span className="text-gray-400 font-medium">Whatsapp</span>
                <span className="text-gray-800 font-bold">{displayWhatsapp}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-gray-50 text-sm">
                <span className="text-gray-400 font-medium">Email</span>
                <span className="text-gray-800 font-bold lowercase">{displayEmail}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-400 font-medium">Team</span>
                <span className="text-gray-800 font-bold">Team 1</span>
              </div>
            </div>

            {/* Edit Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-8 py-2 rounded-xl border-2 border-[#A020F0] text-[#A020F0] font-bold text-sm hover:bg-[#F3E8FF] active:scale-98 transition-all duration-200"
              >
                Edit
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* General Performance Card with month switching dropdown */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-800">General Performance</span>
                  
                  {/* Custom Month Selector Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsPerfDropdownOpen(!isPerfDropdownOpen)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[11px] font-extrabold text-[#A020F0] hover:bg-gray-100 transition active:scale-95 duration-150"
                    >
                      {selectedPerfMonth === "May" ? "This Month" : selectedPerfMonth}
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    {isPerfDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsPerfDropdownOpen(false)}
                        ></div>
                        <div className="absolute right-0 mt-1.5 w-36 max-h-52 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1.5 scrollbar-none animate-in fade-in slide-in-from-top-1 duration-150">
                          {MONTHS.map(month => (
                            <button
                              key={month}
                              type="button"
                              onClick={() => {
                                setSelectedPerfMonth(month);
                                setIsPerfDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-[11px] font-bold transition-colors ${
                                selectedPerfMonth === month 
                                  ? "bg-purple-50 text-[#A020F0]" 
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              {month === "May" ? "This Month (May)" : month}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-baseline justify-between pt-2">
                  <span className="text-5xl font-black text-gray-900 tracking-tight transition-all duration-200">
                    {activePerf.value}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md transition-all duration-200 ${
                    activePerf.isPositive 
                      ? "text-[#10B981] bg-[#EBFDF5]" 
                      : "text-[#EF4444] bg-[#FDF2F2]"
                  }`}>
                    {activePerf.diff} <span className="text-gray-400 font-normal ml-0.5">vs last month</span>
                  </span>
                </div>
              </div>

              {/* Delivery Rate Card with month switching dropdown */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-800">Delivery Rate</span>
                  
                  {/* Delivery Month Selector Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsDelivDropdownOpen(!isDelivDropdownOpen)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[11px] font-extrabold text-[#A020F0] hover:bg-gray-100 transition active:scale-95 duration-150"
                    >
                      {selectedDelivMonth === "May" ? "This Month" : selectedDelivMonth}
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    {isDelivDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsDelivDropdownOpen(false)}
                        ></div>
                        <div className="absolute right-0 mt-1.5 w-36 max-h-52 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1.5 scrollbar-none animate-in fade-in slide-in-from-top-1 duration-150">
                          {MONTHS.map(month => (
                            <button
                              key={month}
                              type="button"
                              onClick={() => {
                                setSelectedDelivMonth(month);
                                setIsDelivDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-[11px] font-bold transition-colors ${
                                selectedDelivMonth === month 
                                  ? "bg-purple-50 text-[#A020F0]" 
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              {month === "May" ? "This Month (May)" : month}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-2">
                  <span className="text-5xl font-black text-gray-900 tracking-tight transition-all duration-200">
                    {activeDeliv.value}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md transition-all duration-200 ${
                    activeDeliv.isPositive 
                      ? "text-[#10B981] bg-[#EBFDF5]" 
                      : "text-[#EF4444] bg-[#FDF2F2]"
                  }`}>
                    {activeDeliv.diff} <span className="text-gray-400 font-normal ml-0.5">vs last month</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur & fade */}
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsEditModalOpen(false)}
          ></div>

          {/* Modal Container Card */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                <p className="text-xs text-gray-400 mt-0.5">Modify your details. Unsaved changes will be lost.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-5">
                {error && (
                  <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    {error}
                  </p>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-white border-gray-200 h-11 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</label>
                  <Input
                    value={profile.email}
                    disabled
                    className="bg-gray-50 border-gray-100 h-11 text-xs text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 091524472657"
                    className="bg-white border-gray-200 h-11 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">WhatsApp Number</label>
                  <Input
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="e.g. 091524472657"
                    className="bg-white border-gray-200 h-11 text-xs"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-xs hover:bg-gray-100 active:scale-98 transition"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-6 font-bold h-10 rounded-xl disabled:opacity-60"
                >
                  {loading ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
