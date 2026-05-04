import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, UserCircle } from "lucide-react";
import { getStaffMemberById } from "@/modules/users/services/users.service";
import { formatDate } from "@/lib/utils";
import StaffDetailAdvancedClient from "./staff-detail-advanced-client";

const ROLE_LABELS: Record<string, string> = {
  INVENTORY_MANAGER: "Inventory Manager",
  ACCOUNTANT: "Accountant",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  DATA_ANALYST: "Data Analyst",
  SALES_REP: "Sales Representative",
  SALES_REP_MANAGER: "Sales Rep Manager",
  LOGISTICS_MANAGER: "Logistics Manager",
  DELIVERY_AGENT: "Delivery Agent",
  ADMIN: "Administrator",
};

type Props = {
  id: string;
  roleLabel: string;
  basePath: string;
};

export default async function StaffDetailPage({ id, roleLabel, basePath }: Props) {
  const member = await getStaffMemberById(id);
  if (!member) notFound();

  const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const roleDisplay = ROLE_LABELS[member.role] ?? member.role;

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      <div className="flex justify-between items-baseline mb-8">
        <h1 className="text-2xl font-bold">{member.name}&apos;s Profile</h1>
        <span className="text-[0.95rem] text-slate-400">{roleLabel}</span>
      </div>

      {/* Profile Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Profile</h2>
        <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50">
          <div className="flex gap-6 mb-10">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              {member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-purple-600">{initials}</span>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-[1.5rem] font-bold">{member.name}</h3>
              <p className="text-[1rem] text-slate-400 mt-1 mb-3">{roleDisplay}</p>
              <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-0.5 text-[0.75rem] font-bold ${
                member.isActive ? "border-emerald-500 text-emerald-500" : "border-slate-300 text-slate-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                {member.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end gap-10">
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Phone Number</p>
                <p className="text-[1.1rem] font-bold text-purple-900">{member.phone ?? "—"}</p>
              </div>
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">WhatsApp</p>
                <p className="text-[1.1rem] font-bold text-purple-900">{member.whatsappNumber ?? member.phone ?? "—"}</p>
              </div>
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Email</p>
                <p className="text-[1.1rem] font-bold text-purple-900">{member.email}</p>
              </div>
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Member Since</p>
                <p className="text-[1.1rem] font-bold text-slate-600">{formatDate(member.createdAt)}</p>
              </div>
            </div>

            <Link
              href={`${basePath}/${id}/profile`}
              className="border-2 border-purple-600 bg-transparent hover:bg-purple-50 text-purple-600 px-6 py-2.5 rounded-xl text-[0.85rem] font-bold flex items-center gap-3 transition-all shrink-0 no-underline"
            >
              <UserCircle size={18} /> See Full Profile <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Analytics</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <p className="text-[0.85rem] font-bold text-slate-700 mb-10">Account Status</p>
            <div className="flex justify-between items-end">
              <span className={`text-[2rem] font-black leading-none ${member.isActive ? "text-emerald-500" : "text-slate-400"}`}>
                {member.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <p className="text-[0.85rem] font-bold text-slate-700 mb-10">Role</p>
            <div className="flex justify-between items-end">
              <span className="text-[1.5rem] font-black leading-none text-slate-800">{roleDisplay}</span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <p className="text-[0.85rem] font-bold text-slate-700 mb-10">Account Age</p>
            <div className="flex justify-between items-end">
              <span className="text-[2.2rem] font-black leading-none">
                {Math.floor((Date.now() - new Date(member.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </span>
              <div className="text-right">
                <p className="text-[0.65rem] text-slate-400 font-medium">days since joining</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Section */}
      <StaffDetailAdvancedClient
        staffName={member.name}
        staffId={id}
        isActive={member.isActive}
        backPath={basePath}
      />
    </div>
  );
}
