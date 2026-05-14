"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { updateProfileAction } from "@/modules/users/actions/users.action";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsappNumber: string | null;
  role: string;
  createdAt: Date;
};

export function ProfileClient({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsappNumber ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    if (!name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    const result = await updateProfileAction({
      name: name.trim(),
      phone: phone.trim() || undefined,
      whatsappNumber: whatsapp.trim() || undefined,
    });
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  const formatRole = (role: string) =>
    role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-800">Profile Information</h2>
          <p className="text-xs text-gray-400 mt-0.5">Update your name and contact details.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-8 font-bold h-10 rounded-md disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Profile updated successfully.</p>
        </div>
      )}
      {error && (
        <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-700 uppercase">
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-white border-gray-200 h-11 text-xs"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-700 uppercase">Email</label>
          <Input
            value={profile.email}
            disabled
            className="bg-gray-50 border-gray-200 h-11 text-xs text-gray-400 cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-700 uppercase">Phone</label>
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. 08012345678"
            className="bg-white border-gray-200 h-11 text-xs"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-700 uppercase">WhatsApp Number</label>
          <Input
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="e.g. 08012345678"
            className="bg-white border-gray-200 h-11 text-xs"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 space-y-3">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase">Account Details</h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-semibold text-gray-400 block mb-0.5">Role</span>
            {formatRole(profile.role)}
          </div>
          <div>
            <span className="font-semibold text-gray-400 block mb-0.5">Member Since</span>
            {new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(profile.createdAt))}
          </div>
        </div>
      </div>
    </div>
  );
}
