"use client";

import React, { useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction } from "@/modules/users/actions/users.action";

/**
 * Inventory settings has no edit form (read-only page), so this uploader
 * uploads to Cloudinary and persists the new avatar immediately via
 * updateProfileAction (keeping the existing name unchanged).
 */
export function AvatarUploaderClient({
  name,
  initials,
  avatarUrl,
}: {
  name: string;
  initials: string;
  avatarUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }
    // Instant local preview while the upload runs.
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed.");
        setPreview(avatarUrl);
        return;
      }
      const result = await updateProfileAction({ name, avatarUrl: data.url });
      if ("error" in result) {
        toast.error(result.error);
        setPreview(avatarUrl);
        return;
      }
      setPreview(data.url);
      toast.success("Profile photo updated");
    } catch {
      toast.error("Upload failed. Please try again.");
      setPreview(avatarUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const result = await updateProfileAction({ name, avatarUrl: null });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPreview(null);
      toast.success("Profile photo removed");
    } catch {
      toast.error("Failed to remove photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative">
        <input
          type="file"
          id="inventory-avatar-input"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        <div
          onClick={() => document.getElementById("inventory-avatar-input")?.click()}
          title="Upload photo"
          className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-purple-100 flex items-center justify-center cursor-pointer hover:opacity-90 transition"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#9D00FF] font-bold text-3xl">{initials}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => document.getElementById("inventory-avatar-input")?.click()}
          disabled={uploading}
          title="Upload photo"
          className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white border border-gray-100 shadow flex items-center justify-center text-gray-500 hover:text-[#9D00FF] transition active:scale-90 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {uploading ? (
            <span className="w-4 h-4 border-2 border-gray-300 border-t-[#9D00FF] rounded-full animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>
      </div>
      {preview && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={uploading}
          className="text-[11px] font-bold text-red-500 hover:text-red-600 hover:underline disabled:opacity-60 disabled:cursor-wait"
        >
          Remove
        </button>
      )}
    </div>
  );
}
