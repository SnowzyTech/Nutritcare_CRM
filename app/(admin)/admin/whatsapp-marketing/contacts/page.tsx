import type { Metadata } from "next";
import Image from "next/image";
import {
  ChevronDown,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contacts – WhatsApp Marketing",
};

const tags = [
  { label: "Over 40", className: "bg-[#f5a623] text-white" },
  { label: "Landing Page", className: "bg-[#2ecc71] text-white" },
  { label: "Male", className: "bg-[#cb1fd6] text-white" },
  { label: "Returning", className: "bg-[#f9736b] text-white" },
];

const contacts = [
  { list: "Prosxact", avatar: 12 },
  { list: "After-Natal", avatar: 25 },
  { list: "After-Natal", avatar: 33 },
  { list: "Nuero-Vive Balm", avatar: 48 },
  { list: "Prosxact", avatar: 5 },
  { list: "Prosxact", avatar: 19 },
  { list: "After-Natal", avatar: 40 },
  { list: "Prosxact", avatar: 8 },
  { list: "Nuero-Vive Balm", avatar: 29 },
];

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="min-w-0 space-y-[18px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[22px] font-extrabold text-[#333333]">
              Contacts
            </h1>
            <span className="rounded-[6px] border border-[#d5d5d5] px-[12px] py-[5px] text-[12px] text-[#777777]">
              32405 contacts
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-[40px] cursor-pointer items-center gap-2 rounded-[8px] bg-[#a400f6] px-[18px] text-[12px] font-bold text-white transition-colors hover:bg-[#9000dd]"
            >
              <Plus size={14} strokeWidth={3} />
              Add New Contact
            </button>
            <button
              type="button"
              className="flex h-[40px] cursor-pointer items-center rounded-[8px] bg-[#f0ddfc] px-[18px] text-[12px] font-bold text-[#a400f6] transition-colors hover:bg-[#e9cdf8]"
            >
              Import/Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex h-[48px] items-center gap-3 rounded-[10px] border border-[#e5e5e5] bg-white px-[18px]">
          <Search size={18} className="text-[#9b9b9b]" />
          <input
            type="text"
            placeholder="search"
            className="w-full bg-transparent text-[14px] text-[#444444] placeholder:text-[#9b9b9b] focus:outline-none"
          />
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-[14px] font-semibold text-[#555555]">
              <Filter size={18} className="text-[#777777]" />
              Filter
            </span>
            <button
              type="button"
              className="flex h-[34px] cursor-pointer items-center gap-2 rounded-[8px] bg-[#111111] px-[16px] text-[12px] font-semibold text-white"
            >
              Tags
              <ChevronDown size={14} />
            </button>
            <button
              type="button"
              className="flex h-[34px] cursor-pointer items-center gap-2 rounded-[8px] bg-[#111111] px-[16px] text-[12px] font-semibold text-white"
            >
              List
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-[34px] cursor-pointer items-center rounded-[8px] bg-[#f1ddfb] px-[16px] text-[11px] font-bold text-[#a400f6]"
            >
              View List/Tags
            </button>
            <button
              type="button"
              className="flex h-[34px] cursor-pointer items-center gap-2 rounded-[8px] bg-[#f1ddfb] px-[16px] text-[11px] font-bold text-[#a400f6]"
            >
              Select Bulk Action
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Table */}
        <section className="overflow-hidden rounded-[12px] bg-white">
          {/* Header row */}
          <div className="grid grid-cols-[52px_1.5fr_1fr_1.3fr_100px] items-center bg-[#f4f4f5] px-[20px] py-[16px]">
            <span />
            <span className="text-[14px] font-bold text-[#333333]">Name</span>
            <span className="text-[14px] font-bold text-[#333333]">List</span>
            <span className="text-[14px] font-bold text-[#333333]">Tags</span>
            <span />
          </div>

          {/* Rows */}
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="grid grid-cols-[52px_1.5fr_1fr_1.3fr_100px] items-center border-b border-[#f0f0f0] px-[20px] py-[16px] last:border-b-0"
            >
              <input
                type="checkbox"
                className="h-[18px] w-[18px] cursor-pointer rounded-[4px] border-[#d5d5d5] accent-[#a400f6]"
              />

              <div className="flex items-center gap-3">
                <Image
                  src={`https://avatar.iran.liara.run/public/${contact.avatar}`}
                  alt="Joshua Nke"
                  width={40}
                  height={40}
                  className="h-[40px] w-[40px] rounded-full object-cover"
                  unoptimized
                />
                <div className="leading-tight">
                  <p className="text-[15px] font-medium text-[#333333]">
                    Joshua Nke
                  </p>
                  <p className="text-[12px] text-[#9b9b9b]">
                    +234 273 828 3824
                  </p>
                </div>
              </div>

              <span className="text-[14px] text-[#555555]">{contact.list}</span>

              <div className="flex max-w-[240px] flex-wrap gap-[6px]">
                {tags.map((tag) => (
                  <span
                    key={tag.label}
                    className={`rounded-full px-[10px] py-[3px] text-[10px] font-semibold ${tag.className}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-end gap-4 border-l border-[#f0f0f0] pl-4">
                <button
                  type="button"
                  className="cursor-pointer text-[#444444] transition-colors hover:text-[#a400f6]"
                  aria-label="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  className="cursor-pointer text-[#444444] transition-colors hover:text-[#e44]"
                  aria-label="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
