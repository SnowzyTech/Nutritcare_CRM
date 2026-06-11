"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function AddQuickReplyDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[40px] shrink-0 cursor-pointer items-center gap-2 rounded-[8px] bg-[#a400f6] px-[20px] text-[12px] font-bold text-white transition-colors hover:bg-[#9000dd]"
      >
        <Plus size={14} strokeWidth={3} />
        Add Quick Reply
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[460px] rounded-[14px] bg-white p-[28px] shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-extrabold text-[#6f6f6f]">
                Add a Quick Reply
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-full border border-[#9b9b9b] text-[#777777] transition-colors hover:bg-[#f5f5f5]"
                aria-label="Close"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Title */}
            <div className="mt-[24px]">
              <label className="mb-[10px] block text-[14px] font-bold text-[#333333]">
                Title
              </label>
              <input
                type="text"
                placeholder="Enter a Title"
                className="h-[54px] w-full rounded-[10px] border border-[#e5e5e5] bg-white px-[18px] text-[15px] text-[#444444] placeholder:text-[#9b9b9b] focus:border-[#a400f6] focus:outline-none"
              />
            </div>

            {/* Message Content */}
            <div className="mt-[20px]">
              <label className="mb-[10px] block text-[14px] font-bold text-[#333333]">
                Message Content
              </label>
              <div className="relative rounded-[10px] border border-[#e5e5e5] bg-white p-[16px]">
                <textarea
                  rows={4}
                  className="w-full resize-none text-[15px] leading-[1.6] text-[#444444] focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="flex h-[28px] cursor-pointer items-center gap-[6px] rounded-[6px] bg-[#f1ddfb] px-[12px] text-[11px] font-bold text-[#a400f6]"
                  >
                    <Plus size={11} strokeWidth={3} />
                    Add Place Holder
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-[26px] flex items-center gap-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-[40px] cursor-pointer rounded-[8px] bg-[#f1ddfb] px-[22px] text-[13px] font-bold text-[#a400f6] transition-colors hover:bg-[#e9cdf8]"
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-[40px] cursor-pointer rounded-[8px] bg-[#b800f8] px-[28px] text-[13px] font-bold text-white transition-colors hover:bg-[#a400f6]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
