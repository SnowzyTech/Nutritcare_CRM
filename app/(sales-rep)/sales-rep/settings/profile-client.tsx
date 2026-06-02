"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Plus,
  MessageSquare,
  X,
  Camera,
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
  teamName?: string | null;
};

type Metrics = {
  generalPerformance: number;
  deliveryRate: number;
  confirmationRate: number;
  performanceTrend: string;
  deliveryTrend: string;
};

/** Classifies a trend label ("+5%", "-7%", "—") for colour styling. */
function trendTone(trend: string): "up" | "down" | "flat" {
  if (trend.startsWith("-")) return "down";
  if (trend === "—" || trend === "+0%") return "flat";
  return "up";
}

/**
 * Reads an image File and returns a downscaled JPEG data URL (max 256×256).
 * Keeps the stored avatar small enough for the `avatarUrl` text column while
 * avoiding the need for external blob storage.
 */
function resizeImageToDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        const scale = Math.min(max / img.width, max / img.height, 1);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function MetricCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend: string;
}) {
  const tone = trendTone(trend);
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.01)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-gray-800">{label}</span>
        <span className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[11px] font-extrabold text-[#A020F0]">
          This Month
        </span>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 pt-2">
        <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
          {value}%
        </span>
        <span
          className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md ${
            tone === "up"
              ? "text-[#10B981] bg-[#EBFDF5]"
              : tone === "down"
                ? "text-[#EF4444] bg-[#FDF2F2]"
                : "text-gray-500 bg-gray-50"
          }`}
        >
          {trend} <span className="text-gray-400 font-normal ml-0.5">vs last month</span>
        </span>
      </div>
    </div>
  );
}

export function ProfileClient({ profile, metrics }: { profile: Profile; metrics: Metrics }) {
  // Form edit states
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsappNumber ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl ?? null);
  // Pending avatar selected in the modal but not yet saved
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=F3E8FF&color=A020F0&size=128&font-size=0.35&bold=true`;

  const displayPhone = phone || "Not set";
  const displayWhatsapp = whatsapp || "Not set";
  const displayEmail = profile.email || "Not set";
  const displayTeam = profile.teamName || "Unassigned";
  const displayFirstName = name.split(" ")[0] || "You";
  const modalAvatar = pendingAvatar ?? avatarUrl ?? fallbackAvatar;

  const openEditModal = () => {
    setPendingAvatar(null);
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPendingAvatar(dataUrl);
    } catch {
      toast.error("Could not process that image. Try another one.");
    }
  };

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
      // Only send the avatar when a new one was picked
      ...(pendingAvatar ? { avatarUrl: pendingAvatar } : {}),
    });
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      toast.error(result.error);
    } else {
      if (pendingAvatar) {
        setAvatarUrl(pendingAvatar);
        setPendingAvatar(null);
      }
      toast.success("Profile updated successfully");
      setSuccess(true);
      setIsEditModalOpen(false);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6 mt-[-10px] ">
      {/* Dynamic Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
        <div className="flex items-center justify-end w-full sm:w-auto gap-3">
          <button
            className="w-10 h-10 rounded-full bg-[#A020F0] text-white flex items-center justify-center shadow-lg shadow-purple-100 hover:bg-[#8B1ED2] active:scale-95 transition-all duration-200"
            title="Create new order"
            onClick={() => (window.location.href = "/sales-rep/orders")}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            className="w-10 h-10 rounded-full bg-[#A020F0] text-white flex items-center justify-center shadow-lg shadow-purple-100 hover:bg-[#8B1ED2] active:scale-95 transition-all duration-200"
            title="Chat/Messages"
          >
            <MessageSquare className="w-5 h-5 fill-white stroke-none" />
          </button>
        </div>
      </div>

      {/* Main Profile Area Container */}
      <div className="bg-white rounded-2xl sm:rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-4 sm:p-8 min-h-[500px]">
        <div className="flex-1 min-w-0">
          {success && (
            <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Profile updated successfully.</p>
            </div>
          )}

          <div className="space-y-8">
            {/* Upper Section: Avatar, Basic Info, and KPI */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 bg-gradient-to-r from-gray-50/50 to-transparent p-4 sm:p-5 rounded-2xl border border-gray-100/50">
              <div className="flex flex-col items-center gap-4 sm:gap-5 w-full md:w-auto">
                {/* Circular Avatar with edit button overlay */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-purple-50">
                    <img
                      src={avatarUrl || fallbackAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={openEditModal}
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-md text-gray-500 hover:text-purple-600 hover:scale-105 active:scale-95 transition-all duration-200"
                    title="Edit profile picture"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info details */}
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{name}</h2>
                  <p className="text-sm font-medium text-gray-400">
                    Sales Rep <span className="text-gray-900 font-bold ml-1">{displayTeam}</span>
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EBFDF5] text-[#10B981] border border-[#A7F3D0]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Widget — real general-performance score */}
              <div className="flex items-center justify-between md:justify-end gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm md:w-auto w-full shrink-0">
                <div className="text-left space-y-0.5">
                  <p className="text-[11px] font-medium text-gray-400">{displayFirstName}&apos;s KPI</p>
                  <p className="text-[11px] font-medium text-gray-400">for this month</p>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-2xl font-extrabold text-[#10B981] leading-none block">
                    {metrics.generalPerformance}%
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400 block">achieved</span>
                </div>
              </div>
            </div>

            {/* Purple Separator Line */}
            <div className="border-t border-[#F3E8FF] my-1"></div>

            {/* Profile Details List — real data */}
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
                <span className="text-gray-800 font-bold">{displayTeam}</span>
              </div>
            </div>

            {/* Edit Button */}
            <div className="pt-2 w-full sm:w-auto">
              <button
                onClick={openEditModal}
                className="w-full sm:w-auto px-8 py-2.5 sm:py-2 rounded-xl border-2 border-[#A020F0] text-[#A020F0] font-bold text-sm hover:bg-[#F3E8FF] active:scale-98 transition-all duration-200"
              >
                Edit
              </button>
            </div>

            {/* Metrics Grid — real computed metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4">
              <MetricCard
                label="General Performance"
                value={metrics.generalPerformance}
                trend={metrics.performanceTrend}
              />
              <MetricCard
                label="Delivery Rate"
                value={metrics.deliveryRate}
                trend={metrics.deliveryTrend}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsEditModalOpen(false)}
          ></div>

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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

                {/* Profile picture uploader */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-purple-50 shrink-0">
                    <img src={modalAvatar} alt="Avatar preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#A020F0] text-[#A020F0] font-bold text-xs hover:bg-[#F3E8FF] active:scale-95 transition"
                    >
                      <Camera className="w-4 h-4" />
                      {avatarUrl || pendingAvatar ? "Change Photo" : "Upload Photo"}
                    </button>
                    <p className="text-[10px] text-gray-400">JPG or PNG, up to 5MB.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 09152447265"
                    className="bg-white border-gray-200 h-11 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">WhatsApp Number</label>
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. 09152447265"
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
