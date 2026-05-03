import React from "react";
import { Mail, Phone, Calendar, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getUserById } from "@/modules/auth/services/auth.service";
import { formatDate, getInitials } from "@/lib/utils";

function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default async function SettingsProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const user = userId ? await getUserById(userId) : null;

  const name = user?.name ?? session?.user?.name ?? "Unknown";
  const email = user?.email ?? session?.user?.email ?? "—";
  const phone = user?.phone ?? null;
  const role = (user?.role ?? session?.user?.role ?? "INVENTORY_MANAGER") as string;
  const createdAt = user?.createdAt ?? null;
  const avatarUrl = user?.avatarUrl ?? null;
  const initials = getInitials(name);

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header section with cover & avatar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {/* Cover photo */}
        <div className="h-40 bg-gradient-to-r from-[#9D00FF]/20 to-[#9D00FF]/5 relative" />

        {/* Profile info block */}
        <div className="px-8 pb-8 relative flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:-mt-12">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-purple-100 flex items-center justify-center shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#9D00FF] font-bold text-3xl">{initials}</span>
            )}
          </div>

          {/* Title / Role */}
          <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <p className="text-[#9D00FF] font-semibold text-sm flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4" />
              {formatRole(role)}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Email Address
                </p>
                <p className="text-sm font-medium text-gray-800">{email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Phone Number
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {phone ?? <span className="text-gray-400 italic">Not set</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Work Details</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#9D00FF]" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  System Role
                </p>
                <p className="text-sm font-medium text-gray-800">{formatRole(role)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Joined Date
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {createdAt ? formatDate(createdAt) : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
