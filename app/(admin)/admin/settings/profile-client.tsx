"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import {
  User,
  Save,
  CheckCircle2,
  Upload,
  ShieldCheck,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Users,
  Lock,
  Globe,
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

export function ProfileClient({ profile }: { profile: Profile }) {
  const nameParts = profile.name.split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsappNumber ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatarUrl ?? null
  );
  // Holds the Cloudinary secure_url returned after a successful upload.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayInitials = (
    (firstName.charAt(0) + (lastName.charAt(0) || "")).toUpperCase() || "AD"
  );

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });

  const fullDisplayName = `${firstName} ${lastName}`.trim() || "Administrator";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }
    // Instant local preview while the upload runs.
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed. Try another image.");
        setAvatarPreview(profile.avatarUrl ?? null);
        return;
      }
      // Store only the Cloudinary URL — that is what gets saved to the DB.
      setAvatarUrl(data.url);
      setAvatarPreview(data.url);
    } catch {
      toast.error("Upload failed. Please try again.");
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
    if (!firstName.trim()) {
      setError("First Name is required.");
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
      ...(avatarUrl ? { avatarUrl } : {}),
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

  return (
    <div className="max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your administrator profile and account details.
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 shadow-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold text-emerald-800">Changes saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-3">
            <span className="text-sm font-bold text-red-700">{error}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column — Profile card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8 flex flex-col items-center text-center">

            {/* Avatar with gradient ring */}
            <div className="relative group mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div
                className="w-36 h-36 rounded-full p-[3.5px] bg-gradient-to-tr from-[#AE00FF] via-purple-400 to-[#FF00C8] shadow-[0_10px_30px_rgba(174,0,255,0.18)] hover:scale-[1.03] transition-all duration-300 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white bg-white flex items-center justify-center">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#A020F0] to-[#7B1FA2] text-white flex items-center justify-center text-4xl font-black">
                      {displayInitials}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={avatarUploading}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-500 hover:text-[#AE00FF] hover:border-purple-200 transition-all active:scale-90 disabled:opacity-60 disabled:cursor-wait"
                title="Upload photo"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUploading ? (
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-[#AE00FF] rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </button>
            </div>

            <h2 className="text-xl font-extrabold text-gray-900">{fullDisplayName}</h2>

            <span className="mt-2 px-3 py-1 bg-purple-50 text-[#A020F0] text-xs font-bold rounded-full border border-purple-100 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              Super Administrator
            </span>

            {/* Quick info */}
            <div className="w-full mt-6 pt-5 border-t border-gray-50 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              {phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{phone}</span>
                </div>
              )}
              {whatsapp && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MessageCircle className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{whatsapp}</span>
                </div>
              )}
              {profile.teamName && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{profile.teamName}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Member since {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Access privileges card */}
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
              <div className="p-2 rounded-xl bg-purple-50 text-[#A020F0]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Access Privileges</h3>
                <p className="text-[10px] text-gray-400">System-wide permissions</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: "User Management", icon: Users },
                { label: "Full System Access", icon: Globe },
                { label: "Role Assignment", icon: ShieldCheck },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    {label}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Granted
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — Edit form (2 cols wide) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave}>
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8 space-y-8">

              {/* Section header */}
              <div className="flex items-center justify-between border-b border-gray-50 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50 text-[#A020F0]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                    <p className="text-xs text-gray-400">Update your personal details below.</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  Personal Account
                </span>
              </div>

              {/* Avatar upload row */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50/40 p-5 rounded-2xl border border-gray-100/50">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 bg-gradient-to-br from-[#A020F0] to-[#7B1FA2] flex items-center justify-center">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-black">{displayInitials}</span>
                  )}
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="font-bold text-gray-800 text-base">Profile Photo</h4>
                  <p className="text-xs text-gray-400">JPG, PNG or GIF. Max 5MB.</p>
                  <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-400" />
                      {avatarUploading ? "Uploading…" : "Upload Photo"}
                    </button>
                    {avatarPreview && !avatarUploading && (
                      <button
                        type="button"
                        onClick={() => { setAvatarPreview(null); setAvatarUrl(null); }}
                        className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline px-2 py-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="e.g. Emmanuel"
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
                    placeholder="e.g. Adeyemi"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#A020F0] transition-all bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
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
                    placeholder="+234 000 000 0000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#A020F0] transition-all bg-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+234 000 000 0000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[#A020F0] transition-all bg-white"
                  />
                </div>
              </div>

              {/* System Role (read-only) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  System Role
                </label>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed">
                  <span>Super Administrator</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              </div>

              {/* Save button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || avatarUploading}
                  className="w-full flex items-center justify-center gap-2 bg-[#A020F0] hover:bg-[#8B1ED2] disabled:bg-purple-300 text-white text-sm font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-md hover:shadow-purple-200/50 active:scale-[0.99] cursor-pointer"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  {loading ? "Saving..." : avatarUploading ? "Uploading image..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
