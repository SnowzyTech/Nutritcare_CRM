"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Camera } from "lucide-react";
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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  SALES_REP: "Sales Rep",
  SALES_REP_MANAGER: "Sales Rep Manager",
  DELIVERY_AGENT: "Delivery Agent",
  ACCOUNTANT: "Accountant",
  INVENTORY_MANAGER: "Inventory Manager",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  LOGISTICS_MANAGER: "Logistics Manager",
  DATA_ANALYST: "Data Analyst",
};

/**
 * Reads an image File and returns a downscaled JPEG data URL (max 256×256),
 * small enough for the `avatarUrl` text column without external blob storage.
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

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 text-sm ${last ? "" : "border-b border-gray-50"}`}
    >
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="text-gray-800 font-bold">{value}</span>
    </div>
  );
}

export function ProfileClient({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsappNumber ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl ?? null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=F3E8FF&color=A020F0&size=128&font-size=0.35&bold=true`;

  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;
  const displayPhone = phone || "Not set";
  const displayWhatsapp = whatsapp || "Not set";
  const displayEmail = profile.email || "Not set";
  const displayTeam = profile.teamName || "Unassigned";
  const memberSince = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(profile.createdAt));
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
    <div className="max-w-[900px] space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and update your account details.
        </p>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-4 sm:p-8">
        {success && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-800">Profile updated successfully.</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Avatar + identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-gradient-to-r from-gray-50/50 to-transparent p-4 sm:p-5 rounded-2xl border border-gray-100/50">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-purple-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{name}</h2>
              <p className="text-sm font-medium text-gray-400">{roleLabel}</p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EBFDF5] text-[#10B981] border border-[#A7F3D0]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#F3E8FF]"></div>

          {/* Details */}
          <div className="space-y-1">
            <DetailRow label="Full Name" value={name} />
            <DetailRow label="Phone Number" value={displayPhone} />
            <DetailRow label="WhatsApp" value={displayWhatsapp} />
            <DetailRow label="Email" value={displayEmail} />
            <DetailRow label="Role" value={roleLabel} />
            <DetailRow label="Team" value={displayTeam} />
            <DetailRow label="Member Since" value={memberSince} last />
          </div>

          <div className="pt-1">
            <button
              onClick={openEditModal}
              className="w-full sm:w-auto px-8 py-2.5 rounded-xl border-2 border-[#A020F0] text-[#A020F0] font-bold text-sm hover:bg-[#F3E8FF] active:scale-98 transition-all duration-200"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsEditModalOpen(false)}
          ></div>

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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

            <form onSubmit={handleSave}>
              <div className="p-6 space-y-5">
                {error && (
                  <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    {error}
                  </p>
                )}

                {/* Avatar uploader */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-purple-50 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
