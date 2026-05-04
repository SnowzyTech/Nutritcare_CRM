"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
};

const avatarColors = [
  "bg-purple-600", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-blue-500",
  "bg-red-500", "bg-green-500", "bg-cyan-500", "bg-orange-500",
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

type Props = {
  staff: StaffMember[];
  roleLabel: string;
  detailBasePath: string;
};

export default function StaffListClient({ staff, roleLabel, detailBasePath }: Props) {
  const [search, setSearch] = useState("");

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone ?? "").includes(search)
  );

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900">
      <div className="flex justify-end mb-4">
        <span className="text-[0.95rem] text-slate-400 font-medium">{roleLabel}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-[0.85rem] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          <SlidersHorizontal size={15} />
          Filter
        </button>
        <button className="flex items-center gap-1 px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowUpDown size={15} />
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 bg-white min-w-[280px] shadow-sm">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-none outline-none text-[0.85rem] text-slate-700 bg-transparent w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.07)] overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1.2fr_0.8fr] px-6 py-4 border-b border-slate-100 bg-[#ddd]">
          {["Name", "Email", "Phone Number", "Status"].map(h => (
            <span key={h} className="text-[0.8rem] font-bold text-slate-600 uppercase tracking-tight">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400 text-[0.9rem]">No staff found.</div>
          ) : (
            filtered.map((member, i) => (
              <Link
                key={member.id}
                href={`${detailBasePath}/${member.id}`}
                className="grid grid-cols-[2fr_2fr_1.2fr_0.8fr] px-6 py-4 items-center hover:bg-slate-50/80 transition-all duration-200 group no-underline"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-[0.75rem] font-bold shrink-0 shadow-sm`}>
                    {getInitials(member.name)}
                  </div>
                  <span className="text-[0.9rem] font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                    {member.name}
                  </span>
                </div>
                <div className="text-[0.9rem] text-slate-600 font-medium truncate pr-4">{member.email}</div>
                <div className="text-[0.9rem] text-slate-600 font-medium">{member.phone ?? "—"}</div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.75rem] font-bold border ${
                    member.isActive
                      ? "border-emerald-500 text-emerald-500"
                      : "border-slate-300 text-slate-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
