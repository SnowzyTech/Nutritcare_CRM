"use client";

import { useState } from "react";
import { Calendar, ChevronDown, Plus, Trash2, X } from "lucide-react";

const categories = [
  {
    id: "marketing",
    title: "Marketing",
    description: "Promotional messages to sell, engage, or re-engage users.",
  },
  {
    id: "utility",
    title: "Utility",
    description:
      "Informational updates based on user actions (orders, reminders, receipts).",
  },
  {
    id: "authentication",
    title: "Authentication",
    description: "Security messages used to verify user identity (e.g., OTPs).",
  },
];

const tagChips = [
  { label: "Over 40", className: "bg-[#f5a623]" },
  { label: "Male", className: "bg-[#2ecc71]" },
  { label: "Website", className: "bg-[#ef4444]" },
  { label: "Over 40", className: "bg-[#9b9b9b]" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-[10px] block text-[13px] font-bold text-[#333333]">
      {children}
    </label>
  );
}

function SelectBox({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-[54px] w-full items-center justify-between rounded-[10px] border border-[#e5e5e5] bg-white px-[18px]">
      <span className="text-[15px] text-[#9b9b9b]">{placeholder}</span>
      <ChevronDown size={18} className="text-[#777777]" />
    </div>
  );
}

function TagChip({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11px] font-semibold text-white ${className}`}
    >
      {label}
      <X size={11} strokeWidth={3} className="cursor-pointer" />
    </span>
  );
}

export default function NewCampaignForm() {
  const [selectedCategory, setSelectedCategory] = useState("marketing");
  const [scheduleOn, setScheduleOn] = useState(true);

  return (
    <div>
      <h1 className="mb-[26px] text-[22px] font-extrabold text-[#333333]">
        New Campaign
      </h1>

      {/* Title */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <FieldLabel>Title</FieldLabel>
          <input
            type="text"
            placeholder="Template 1001"
            className="h-[56px] w-full rounded-[10px] border border-[#e5e5e5] bg-white px-[18px] text-[15px] text-[#444444] placeholder:text-[#b5b5b5] focus:border-[#a400f6] focus:outline-none"
          />
        </div>
        <button
          type="button"
          className="mt-[34px] flex h-[42px] cursor-pointer items-center gap-2 rounded-[8px] bg-[#f1ddfb] px-[18px] text-[12px] font-bold text-[#a400f6]"
        >
          <Plus size={13} strokeWidth={3} />
          Preview
        </button>
      </div>

      {/* Card */}
      <div className="mt-[22px] rounded-[12px] border border-[#e5e5e5] bg-white p-[24px]">
        {/* Category */}
        <FieldLabel>Category</FieldLabel>
        <div className="grid grid-cols-3 gap-4">
          {categories.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex cursor-pointer items-start gap-3 rounded-[10px] border bg-white px-[18px] py-[16px] text-left transition-colors ${
                  active ? "border-[#a400f6]" : "border-[#e5e5e5]"
                }`}
              >
                <span
                  className={`mt-[2px] flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? "border-[#a400f6]" : "border-[#c4c4c4]"
                  }`}
                >
                  {active && (
                    <span className="h-[8px] w-[8px] rounded-full bg-[#a400f6]" />
                  )}
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-[#333333]">
                    {category.title}
                  </span>
                  <span className="mt-[3px] block text-[12px] leading-[1.4] text-[#9b9b9b]">
                    {category.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Select Contact List */}
        <div className="mt-[26px]">
          <FieldLabel>Select Contact List</FieldLabel>
          <SelectBox placeholder="Website Leads" />
          <div className="mt-[12px] flex flex-wrap gap-[10px]">
            {["Website Lead", "Crush Your Sugar"].map((chip) => (
              <span
                key={chip}
                className="flex items-center gap-[8px] rounded-[6px] bg-[#111111] px-[12px] py-[7px] text-[12px] font-medium text-white"
              >
                {chip}
                <X size={13} strokeWidth={2.5} className="cursor-pointer" />
              </span>
            ))}
          </div>
        </div>

        {/* Exclude / Include tags */}
        <div className="mt-[24px] grid grid-cols-2 gap-12">
          <div>
            <FieldLabel>Exclude tags</FieldLabel>
            <div className="grid grid-cols-[1fr_auto] items-start gap-4">
              <div className="flex h-[48px] w-full items-center justify-between rounded-[10px] border border-[#e5e5e5] bg-white px-[16px]">
                <span className="text-[14px] text-[#9b9b9b]">Over 40</span>
                <ChevronDown size={16} className="text-[#777777]" />
              </div>
              <div className="flex max-w-[180px] flex-wrap justify-end gap-[6px]">
                {tagChips.map((chip, index) => (
                  <TagChip
                    key={index}
                    label={chip.label}
                    className={chip.className}
                  />
                ))}
              </div>
            </div>
          </div>
          <div>
            <FieldLabel>Include tags</FieldLabel>
            <div className="grid grid-cols-[1fr_auto] items-start gap-4">
              <div className="flex h-[48px] w-full items-center justify-between rounded-[10px] border border-[#e5e5e5] bg-white px-[16px]">
                <span className="text-[14px] text-[#9b9b9b]">Over 40</span>
                <ChevronDown size={16} className="text-[#777777]" />
              </div>
              <div className="flex max-w-[180px] flex-wrap justify-end gap-[6px]">
                {tagChips.map((chip, index) => (
                  <TagChip
                    key={index}
                    label={chip.label}
                    className={chip.className}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule toggle */}
        <div className="mt-[28px] flex items-center gap-4">
          <button
            type="button"
            onClick={() => setScheduleOn((value) => !value)}
            className={`flex h-[28px] w-[52px] shrink-0 cursor-pointer items-center rounded-full px-[3px] transition-colors ${
              scheduleOn ? "justify-end bg-[#2ecc71]" : "justify-start bg-[#d5d5d5]"
            }`}
            aria-pressed={scheduleOn}
          >
            <span className="h-[22px] w-[22px] rounded-full bg-white shadow" />
          </button>
          <p className="text-[13px] text-[#555555]">
            <span className="font-bold text-[#333333]">Schedule:</span> Create a
            message, post, or campaign now and set a specific date and time for it
            to be sent automatically.
          </p>
        </div>

        {/* Scheduled item */}
        <div className="mt-[18px] flex items-stretch overflow-hidden rounded-[10px] bg-[#f4f4f5]">
          <div className="flex w-[44px] shrink-0 items-center justify-center text-[15px] font-medium text-[#555555]">
            1
          </div>
          <div className="flex-1 py-[18px] pr-[18px]">
            <FieldLabel>Message Template</FieldLabel>
            <div className="flex h-[52px] w-full items-center justify-between rounded-[10px] border border-[#e5e5e5] bg-white px-[18px]">
              <span className="text-[15px] text-[#9b9b9b]">Website Leads</span>
              <ChevronDown size={18} className="text-[#777777]" />
            </div>

            <div className="mt-[18px]">
              <FieldLabel>Schedule Campaign</FieldLabel>
              <div className="flex h-[52px] w-[280px] items-center justify-between rounded-[10px] border border-[#e5e5e5] bg-white px-[18px]">
                <span className="text-[15px] text-[#444444]">
                  20th July 2026
                </span>
                <Calendar size={18} className="text-[#777777]" />
              </div>
            </div>
          </div>
          <div className="flex w-[64px] shrink-0 items-center justify-center">
            <button
              type="button"
              className="cursor-pointer text-[#555555] transition-colors hover:text-[#e44]"
              aria-label="Remove"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Add template */}
        <button
          type="button"
          className="mt-[18px] flex h-[40px] cursor-pointer items-center gap-2 rounded-[8px] bg-[#f1ddfb] px-[18px] text-[12px] font-bold text-[#a400f6]"
        >
          <Plus size={13} strokeWidth={3} />
          Add New Massage Template
        </button>
      </div>

      {/* Save */}
      <div className="mt-[26px] flex justify-end">
        <button
          type="button"
          className="h-[54px] cursor-pointer rounded-[10px] bg-[#b800f8] px-[34px] text-[15px] font-bold text-white transition-colors hover:bg-[#a400f6]"
        >
          Save and Send
        </button>
      </div>
    </div>
  );
}
