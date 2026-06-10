"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  User, 
  Building2, 
  Save, 
  CheckCircle2, 
  Upload, 
  ShieldCheck 
} from "lucide-react";
import { updateProfileAction } from "@/modules/users/actions/users.action";
import { cn } from "@/lib/utils";

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

export function SettingsClient({ profile }: { profile: Profile }) {
  // Split full name for presentation in First / Last inputs
  const nameParts = profile.name.split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsappNumber ?? "");
  
  // Warehouse preferences state (held locally)
  const [defaultZone, setDefaultZone] = useState("Zone A");
  const [qcThreshold, setQcThreshold] = useState("5 items");
  const [autoAssign, setAutoAssign] = useState("Enabled");
  const [lowStock, setLowStock] = useState("10 units");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl ?? null);
  // Holds the Cloudinary secure_url returned after a successful upload.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  // True when the user removed their saved photo (persist avatarUrl = null on save).
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatRole = (r: string) => {
    return r
      .split("_")
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }
    setError(null);
    // Instant local preview while the upload runs.
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        setAvatarPreview(profile.avatarUrl ?? null);
        return;
      }
      // Store only the Cloudinary URL — that is what gets saved to the DB.
      setAvatarUrl(data.url);
      setAvatarPreview(data.url);
      setRemoveAvatar(false);
    } catch {
      setError("Upload failed. Please try again.");
      setAvatarPreview(profile.avatarUrl ?? null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      setError("First Name and Last Name are required.");
      return;
    }
    if (avatarUploading) {
      setError("Please wait for the image to finish uploading.");
      return;
    }

    setLoading(true);
    const result = await updateProfileAction({
      name: fullName,
      phone: phone.trim() || undefined,
      whatsappNumber: whatsapp.trim() || undefined,
      avatarUrl: removeAvatar ? null : avatarUrl ?? undefined,
    });
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Profile updated successfully");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  // Avatar resolution
  const displayInitials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "WM";

  return (
    <div className="space-y-8 max-w-6xl animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your personal profile details and warehouse environment preferences.</p>
        </div>
        
        {/* Success Alert Toast Banner */}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 shadow-md shadow-emerald-50/50 animate-slideDown">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold text-emerald-800">Changes saved successfully!</span>
          </div>
        )}

        {/* Error Alert Toast Banner */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-3 shadow-md shadow-red-50/50 animate-slideDown">
            <span className="text-sm font-bold text-red-800">{error}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Section: Profile Info (2 Columns wide) */}
        <div className="lg:col-span-2 bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-gray-50 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 text-[#A020F0]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                <p className="text-xs text-gray-400">Update your account credentials and personal details.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              Personal Account
            </span>
          </div>

          {/* Avatar Upload block */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50/40 p-5 rounded-2xl border border-gray-100/50">
            <input
              type="file"
              id="warehouse-avatar-input"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile Avatar"
                onClick={() => document.getElementById("warehouse-avatar-input")?.click()}
                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md shrink-0 cursor-pointer hover:opacity-90 transition"
              />
            ) : (
              <div
                onClick={() => document.getElementById("warehouse-avatar-input")?.click()}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-[#A020F0] to-[#7B1FA2] text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white shrink-0 cursor-pointer hover:opacity-90 transition"
              >
                {displayInitials}
              </div>
            )}
            <div className="space-y-2 text-center sm:text-left">
              <h4 className="font-bold text-gray-800 text-base">Profile Photo</h4>
              <p className="text-xs text-gray-400">JPG, PNG or GIF. Recommended size 400x400px.</p>
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => document.getElementById("warehouse-avatar-input")?.click()}
                  disabled={avatarUploading}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                  {avatarUploading ? (
                    <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-[#A020F0] rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  {avatarUploading ? "Uploading..." : "Upload Photo"}
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPreview(null);
                      setAvatarUrl(null);
                      setRemoveAvatar(true);
                      setError(null);
                      const input = document.getElementById("warehouse-avatar-input") as HTMLInputElement | null;
                      if (input) input.value = "";
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline px-2 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form input fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#A020F0] transition-all bg-white"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#A020F0] transition-all bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#A020F0] transition-all bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              System Role
            </label>
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed">
              <span>{formatRole(profile.role)}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          </div>
        </div>

        {/* Right Section: Warehouse Preferences (1 Column wide) */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-5">
              <div className="p-2 rounded-xl bg-purple-50 text-[#A020F0]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Preferences</h2>
                <p className="text-[10px] text-gray-400">Configure warehouse rules.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  Default Zone
                </label>
                <input
                  type="text"
                  value={defaultZone}
                  onChange={(e) => setDefaultZone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#A020F0] transition-all bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  QC Alert Threshold
                </label>
                <input
                  type="text"
                  value={qcThreshold}
                  onChange={(e) => setQcThreshold(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#A020F0] transition-all bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  Auto-Assign Pickers
                </label>
                <input
                  type="text"
                  value={autoAssign}
                  onChange={(e) => setAutoAssign(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#A020F0] transition-all bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  Low Stock Alert
                </label>
                <input
                  type="text"
                  value={lowStock}
                  onChange={(e) => setLowStock(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#A020F0] transition-all bg-white"
                />
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            type="submit"
            disabled={loading || avatarUploading}
            className="w-full flex items-center justify-center gap-2 bg-[#A020F0] hover:bg-[#8B1ED2] disabled:bg-purple-300 text-white text-sm font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-md hover:shadow-purple-200/50 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4 shrink-0" />
            {loading ? "Saving Changes..." : avatarUploading ? "Uploading image..." : "Save Changes"}
          </button>
        </div>

      </form>
    </div>
  );
}
