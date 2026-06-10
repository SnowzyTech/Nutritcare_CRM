"use client";

import React, { useState } from "react";
import { User, Mail, Phone, Briefcase, Calendar, MessageCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateProfileAction } from "@/modules/users/actions/users.action";
import { formatDate, getInitials } from "@/lib/utils";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsappNumber: string | null;
  role: string;
  createdAt: Date;
  avatarUrl: string | null;
};

export default function SettingsClient({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsappNumber ?? "");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl);
  // Holds the Cloudinary secure_url returned after a successful upload.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  // True when the user removed their saved photo (persist avatarUrl = null on save).
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isDirty =
    name !== profile.name ||
    phone !== (profile.phone ?? "") ||
    whatsapp !== (profile.whatsappNumber ?? "") ||
    avatarUrl !== null ||
    removeAvatar;

  const handleReset = () => {
    setName(profile.name);
    setPhone(profile.phone ?? "");
    setWhatsapp(profile.whatsappNumber ?? "");
    setAvatarPreview(profile.avatarUrl);
    setAvatarUrl(null);
    setRemoveAvatar(false);
    setError("");
    setSuccess(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarUrl(null);
    setRemoveAvatar(true);
    setError("");
    const input = document.getElementById("logistics-avatar-input") as HTMLInputElement | null;
    if (input) input.value = "";
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
    setError("");
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
        setAvatarPreview(profile.avatarUrl);
        return;
      }
      // Store only the Cloudinary URL — that is what gets saved to the DB.
      setAvatarUrl(data.url);
      setAvatarPreview(data.url);
      setRemoveAvatar(false);
    } catch {
      setError("Upload failed. Please try again.");
      setAvatarPreview(profile.avatarUrl);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess(false);
    if (!name.trim()) return setError("Full name is required.");
    if (avatarUploading) return setError("Please wait for the image to finish uploading.");

    setLoading(true);
    const result = await updateProfileAction({
      name: name.trim(),
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
    }
  };

  const roleLabel = profile.role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-2">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-gray-800">Profile Settings</h1>
        <p className="text-sm text-gray-400 font-medium">
          Manage your personal information.
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative">
            <input
              type="file"
              id="logistics-avatar-input"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div
              onClick={() => document.getElementById("logistics-avatar-input")?.click()}
              className="w-24 h-24 rounded-full bg-[#f3e8ff] flex items-center justify-center border-4 border-white shadow-md overflow-hidden text-2xl font-bold text-[#ad1df4] cursor-pointer hover:opacity-90 transition"
              title="Upload photo"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(name || profile.name)
              )}
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("logistics-avatar-input")?.click()}
              disabled={avatarUploading}
              title="Upload photo"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-gray-100 shadow flex items-center justify-center text-gray-500 hover:text-[#ad1df4] transition active:scale-90 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {avatarUploading ? (
                <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-[#ad1df4] rounded-full animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          {avatarPreview && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-[11px] font-bold text-red-500 hover:text-red-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-1.5">
          <h2 className="text-xl font-bold text-gray-800">{name || profile.name}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-[#ad1df4]" />
              {roleLabel}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
              <Mail className="w-3.5 h-3.5 text-[#ad1df4]" />
              {profile.email}
            </span>
          </div>
          <div className="pt-1">
            <span className="px-3 py-1 bg-[#faf5ff] text-[#ad1df4] text-[10px] font-bold rounded-full border border-[#f3e8ff]">
              Active Account
            </span>
          </div>
        </div>

        <div className="flex gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!isDirty || loading}
            className="border-gray-200 text-gray-600 font-bold px-6 h-10 disabled:opacity-40"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || loading || avatarUploading}
            className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-8 h-10 font-bold shadow-lg shadow-purple-100 disabled:opacity-40"
          >
            {loading ? "Saving..." : avatarUploading ? "Uploading..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
          Profile updated successfully.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Information — editable */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <div className="p-2 bg-[#faf5ff] rounded-lg">
              <User className="w-5 h-5 text-[#ad1df4]" />
            </div>
            <h3 className="font-bold text-gray-800">Personal Information</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Full Name <span className="text-red-400">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="h-10 text-xs border-gray-200 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border border-gray-100 rounded-md text-xs text-gray-400 font-medium">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {profile.email}
              </div>
              <p className="text-[9px] text-gray-400">Contact admin to change your email.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="h-10 text-xs border-gray-200 bg-white pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                WhatsApp Number
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="h-10 text-xs border-gray-200 bg-white pl-8"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Work Information — read-only */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <div className="p-2 bg-[#faf5ff] rounded-lg">
              <Briefcase className="w-5 h-5 text-[#ad1df4]" />
            </div>
            <h3 className="font-bold text-gray-800">Work Information</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</label>
              <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border border-gray-100 rounded-md text-xs text-gray-600 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {roleLabel}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Member Since
              </label>
              <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border border-gray-100 rounded-md text-xs text-gray-600 font-medium">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {formatDate(profile.createdAt)}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Account Status
              </label>
              <div className="flex items-center gap-2 h-10 px-3 bg-emerald-50 border border-emerald-100 rounded-md text-xs text-emerald-600 font-bold">
                Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
