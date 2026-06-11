import type { Metadata } from "next";
import { Pencil, Search, Trash2 } from "lucide-react";
import AddQuickReplyDialog from "../_components/add-quick-reply-dialog";

export const metadata: Metadata = {
  title: "Quick Replies – WhatsApp Marketing",
};

const promoMessage =
  "Promo ends soon ⏳\n Don't wait till it's gone—secure your deal now and enjoy the benefits while it lasts.";

const quickReplies = [
  {
    name: "Hello there!!",
    message:
      "Hello there!! 👋\n Ready to upgrade your experience? Discover something made just for you—simple, effective, and worth it.",
  },
  { name: "Promo ends..", message: promoMessage },
  { name: "Promo ends..", message: promoMessage },
  { name: "Promo ends..", message: promoMessage },
  { name: "Promo ends..", message: promoMessage },
  { name: "Promo ends..", message: promoMessage },
  { name: "Promo ends..", message: promoMessage },
  { name: "Promo ends..", message: promoMessage },
];

export default function QuickReplyPage() {
  return (
    <div className="mx-auto max-w-[1120px]">
      <div className="min-w-0 space-y-[18px]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#333333]">
              Quick Replies
            </h1>
            <p className="mt-[6px] text-[13px] text-[#8b8b8b]">
              Respond fast by choosing from suggested answers instead of writing
              a message.
            </p>
          </div>
          <AddQuickReplyDialog />
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
        <section className="rounded-[12px] bg-white">
          {/* Header row */}
          <div className="flex items-stretch">
            <div className="grid flex-1 grid-cols-[220px_1fr] rounded-[10px] bg-[#f4f4f5] px-[24px] py-[18px]">
              <span className="text-[14px] font-bold text-[#333333]">Name</span>
              <span className="text-[14px] font-bold text-[#333333]">
                Message Text
              </span>
            </div>
            <div className="w-[120px] shrink-0" />
          </div>

          {/* Rows */}
          {quickReplies.map((row, index) => (
            <div
              key={index}
              className="flex items-stretch border-b border-[#f0f0f0] last:border-b-0"
            >
              <div className="grid flex-1 grid-cols-[220px_1fr] items-start px-[24px] py-[20px]">
                <span className="pr-4 text-[14px] text-[#444444]">
                  {row.name}
                </span>
                <span className="whitespace-pre-line text-[13px] leading-[1.6] text-[#666666]">
                  {row.message}
                </span>
              </div>
              <div className="flex w-[120px] shrink-0 items-center justify-center gap-5 border-l border-[#f0f0f0]">
                <button
                  type="button"
                  className="text-[#555555] transition-colors hover:text-[#a400f6]"
                  aria-label="Edit"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  className="text-[#555555] transition-colors hover:text-[#e44]"
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
