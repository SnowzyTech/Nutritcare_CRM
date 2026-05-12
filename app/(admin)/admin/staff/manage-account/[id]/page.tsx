import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail, Phone, MessageCircle, Clock, Shield } from "lucide-react";
import { getPendingRequestById } from "@/modules/users/services/users.service";
import ManageAccountDetailClient from "./manage-account-detail-client";

type Props = { params: Promise<{ id: string }> };

const ROLE_LABELS: Record<string, string> = {
  SALES_REP: "Sales Representative",
  SALES_REP_MANAGER: "Sales Rep Manager",
  DELIVERY_AGENT: "Delivery Agent",
  DATA_ANALYST: "Data Analyst",
  ACCOUNTANT: "Accountant",
  INVENTORY_MANAGER: "Inventory Manager",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  LOGISTICS_MANAGER: "Logistics Manager",
  ADMIN: "Admin",
};

const AVATAR_COLORS = [
  "bg-purple-600",
  "bg-rose-500",
  "bg-blue-500",
  "bg-emerald-600",
  "bg-amber-600",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getPendingRequestById(id);
  return { title: user ? `${user.name} — Activation Request` : "Activation Request" };
}

export default async function ManageAccountDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getPendingRequestById(id);

  if (!user || user.accountActivationStatus !== "PENDING") notFound();

  const avatarColor = getAvatarColor(user.name);
  const initials = getInitials(user.name);

  const joinedDate = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(user.createdAt));

  const joinedTime = new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(user.createdAt));

  return (
    <div className="max-w-[800px] mx-auto font-inter text-slate-900 pb-20">
      {/* Back navigation */}
      <Link
        href="/admin/staff/manage-account"
        className="inline-flex items-center gap-1.5 text-[0.85rem] font-bold text-slate-400 hover:text-purple-600 transition-colors mb-8 no-underline"
      >
        <ChevronLeft size={16} />
        Back to Manage Account
      </Link>

      {/* Header */}
      <div className="flex justify-between items-baseline mb-8">
        <h1 className="text-2xl font-bold">Activation Request</h1>
        <span className="flex items-center gap-1.5 text-[0.8rem] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Approval
        </span>
      </div>

      {/* Profile Card */}
      <section className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50 mb-6">
        <div className="flex gap-6 mb-8">
          {/* Avatar */}
          <div
            className={`w-24 h-24 rounded-full ${avatarColor} flex items-center justify-center shrink-0 shadow-md`}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-3xl font-black text-white/90">{initials}</span>
            )}
          </div>

          {/* Name & Role */}
          <div className="flex-1">
            <h2 className="text-[1.6rem] font-black text-slate-900 leading-tight">
              {user.name}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Shield size={14} className="text-purple-500" />
              <p className="text-[0.9rem] font-bold text-purple-600">
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-[0.78rem] text-slate-400 font-medium">
              <Clock size={13} />
              <span>
                Requested on {joinedDate} at {joinedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-x divide-slate-100 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Mail size={16} className="text-purple-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                Email
              </p>
              <p className="text-[0.88rem] font-bold text-slate-800 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Phone size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                Phone
              </p>
              <p className="text-[0.88rem] font-bold text-slate-800">
                {user.phone ?? "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <MessageCircle size={16} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                WhatsApp
              </p>
              <p className="text-[0.88rem] font-bold text-slate-800">
                {user.whatsappNumber ?? user.phone ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Actions Section */}
      <section className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50">
        <h2 className="text-[1rem] font-black text-slate-900 mb-1">
          Review Request
        </h2>
        <p className="text-[0.85rem] text-slate-400 mb-6">
          Approving will grant{" "}
          <span className="font-bold text-slate-600">{user.name}</span> immediate
          access to the system as a{" "}
          <span className="font-bold text-slate-600">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
          . Rejecting will deny access.
        </p>

        <ManageAccountDetailClient userId={user.id} userName={user.name} />
      </section>
    </div>
  );
}
