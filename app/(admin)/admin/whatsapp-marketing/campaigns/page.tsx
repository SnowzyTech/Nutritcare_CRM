import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Campaign – WhatsApp Marketing",
};

const campaigns = [
  { title: "New Price Prosxact" },
  { title: "Flash Drop" },
  { title: "Deal Rush" },
  { title: "Product Spotlight" },
  { title: "Before It's Gone" },
  { title: "Now or Never" },
  { title: "Now or Never" },
  { title: "Now or Never" },
  { title: "Now or Never" },
  { title: "Now or Never" },
  { title: "Now or Never" },
  { title: "Now or Never" },
  { title: "Now or Never" },
];

const gridCols =
  "grid grid-cols-[1.4fr_0.9fr_0.5fr_0.9fr_1fr_0.9fr_0.8fr_0.7fr_1.1fr_72px]";

export default function CampaignsPage() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="min-w-0 space-y-[18px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold text-[#333333]">
            Campaign
          </h1>
          <Link
            href="/admin/whatsapp-marketing/campaigns/new"
            className="flex h-[40px] items-center gap-2 rounded-[8px] bg-[#a400f6] px-[20px] text-[12px] font-bold text-white transition-colors hover:bg-[#9000dd]"
          >
            <Plus size={14} strokeWidth={3} />
            Add New Campaign
          </Link>
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

        {/* Table */}
        <section className="overflow-hidden rounded-[12px] bg-white">
          {/* Header row */}
          <div
            className={`${gridCols} items-center bg-[#f4f4f5] px-[20px] py-[16px] text-[13px] font-bold text-[#333333]`}
          >
            <span>Title</span>
            <span>Status</span>
            <span>Total</span>
            <span>Sent</span>
            <span>Delivered</span>
            <span>Read</span>
            <span>SKipped</span>
            <span>Failed</span>
            <span>Created</span>
            <span />
          </div>

          {/* Rows */}
          {campaigns.map((campaign, index) => (
            <div
              key={index}
              className={`${gridCols} items-center border-b border-[#f0f0f0] px-[20px] py-[14px] text-[13px] last:border-b-0`}
            >
              <span className="font-medium text-[#cf4cff]">
                {campaign.title}
              </span>
              <span>
                <span className="inline-block rounded-full bg-[#d6f5e0] px-[12px] py-[4px] text-[11px] font-medium text-[#1f9d57]">
                  Ongoing
                </span>
              </span>
              <span className="text-[#444444]">2</span>
              <span className="text-[#444444]">2(100%)</span>
              <span className="text-[#444444]">2(100%)</span>
              <span className="font-medium text-[#16b978]">2(100%)</span>
              <span className="font-medium text-[#f5a623]">0</span>
              <span className="font-medium text-[#ef4444]">0</span>
              <span className="text-[#444444]">21- 06-2026</span>
              <span className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="cursor-pointer text-[#444444] transition-colors hover:text-[#a400f6]"
                  aria-label="View analytics"
                >
                  <BarChart3 size={17} />
                </button>
                <button
                  type="button"
                  className="cursor-pointer text-[#444444] transition-colors hover:text-[#e44]"
                  aria-label="Delete"
                >
                  <Trash2 size={17} />
                </button>
              </span>
            </div>
          ))}
        </section>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-[8px] border border-[#e5e5e5] bg-white text-[#555555] hover:bg-[#f5f5f5]"
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-[8px] text-[13px] font-semibold transition-colors ${
                page === 1
                  ? "bg-[#a400f6] text-white"
                  : "border border-[#e5e5e5] bg-white text-[#555555] hover:bg-[#f5f5f5]"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-[8px] border border-[#e5e5e5] bg-white text-[#555555] hover:bg-[#f5f5f5]"
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
