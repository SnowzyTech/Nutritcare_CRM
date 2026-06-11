"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronDown, Move, Plus, Trash2 } from "lucide-react";

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

function Divider() {
  return <div className="my-[26px] h-px w-full bg-[#ececec]" />;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-[10px] block text-[13px] font-bold text-[#333333]">
      {children}
    </label>
  );
}

export default function AddTemplateForm() {
  const [selectedCategory, setSelectedCategory] = useState("marketing");

  return (
    <div>
      <Link
        href="/admin/whatsapp-marketing/templates"
        className="mb-[18px] inline-flex items-center gap-2 text-[13px] font-semibold text-[#777777] transition-colors hover:text-[#a400f6]"
      >
        <ArrowLeft size={16} strokeWidth={2.5} />
        Back to Templates
      </Link>

      <h1 className="mb-[26px] text-[22px] font-extrabold text-[#333333]">
        Add Message Templates
      </h1>

      {/* Template Name */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <FieldLabel>Template Name</FieldLabel>
          <input
            type="text"
            placeholder="Template 1001"
            className="h-[56px] w-full rounded-[10px] border border-[#e5e5e5] bg-white px-[18px] text-[15px] text-[#444444] placeholder:text-[#b5b5b5] focus:border-[#a400f6] focus:outline-none"
          />
        </div>
        <button
          type="button"
          className="mt-[34px] flex h-[42px] items-center gap-2 rounded-[8px] bg-[#f1ddfb] px-[18px] text-[12px] font-bold text-[#a400f6]"
        >
          <Plus size={13} strokeWidth={3} />
          Preview
        </button>
      </div>

      {/* Category */}
      <div className="mt-[24px]">
        <FieldLabel>Category</FieldLabel>
        <div className="grid grid-cols-3 gap-4">
          {categories.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-start gap-3 rounded-[10px] border bg-white px-[18px] py-[16px] text-left transition-colors ${
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
      </div>

      {/* Header */}
      <div className="mt-[28px]">
        <h2 className="text-[15px] font-bold text-[#333333]">
          Header
          <span className="ml-1 font-medium text-[#9b9b9b]">(Optional)</span>
        </h2>
        <div className="mt-[18px] grid grid-cols-2 gap-6">
          <div>
            <FieldLabel>Header Type</FieldLabel>
            <div className="flex items-stretch gap-2">
              <div className="flex h-[52px] flex-1 items-center rounded-[10px] border border-[#e5e5e5] bg-white px-[18px] text-[14px] text-[#444444]">
                Text
              </div>
              <div className="flex h-[52px] w-[48px] items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-white">
                <ChevronDown size={18} className="text-[#777777]" />
              </div>
            </div>
          </div>
          <div>
            <FieldLabel>Value</FieldLabel>
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                placeholder="Add text"
                className="h-[52px] flex-1 rounded-[10px] border border-[#e5e5e5] bg-white px-[18px] text-[14px] text-[#444444] placeholder:text-[#b5b5b5] focus:border-[#a400f6] focus:outline-none"
              />
              <div className="h-[52px] w-[24px] rounded-[10px] border border-[#e5e5e5] bg-white" />
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Body */}
      <div>
        <h2 className="text-[15px] font-bold text-[#333333]">Body</h2>
        <p className="mt-[6px] text-[12px] text-[#8b8b8b]">
          Enter the body of your message
        </p>

        <div className="mt-[20px]">
          <FieldLabel>Type your message</FieldLabel>
          <div className="relative rounded-[10px] border border-[#e5e5e5] bg-white p-[20px]">
            <textarea
              rows={5}
              defaultValue="This is a sample message used to demonstrate how longer text will appear within this input field or message container. It helps visualize spacing, line breaks, and readability across different screen sizes. Replace this text with your actual content when ready to publish or send."
              className="w-full resize-none text-[15px] leading-[1.6] text-[#444444] focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="flex h-[28px] items-center gap-[6px] rounded-[6px] bg-[#f1ddfb] px-[12px] text-[11px] font-bold text-[#a400f6]"
              >
                <Plus size={11} strokeWidth={3} />
                Add Place Holder
              </button>
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Footer */}
      <div>
        <h2 className="text-[15px] font-bold text-[#333333]">Footer</h2>
        <p className="mt-[6px] text-[12px] text-[#8b8b8b]">
          Provides supporting information and secondary navigation
        </p>

        <div className="mt-[20px]">
          <FieldLabel>Footer Text</FieldLabel>
          <input
            type="text"
            defaultValue="Sent by Nucle"
            className="h-[56px] w-full rounded-[10px] border border-[#e5e5e5] bg-white px-[18px] text-[15px] text-[#444444] focus:border-[#a400f6] focus:outline-none"
          />
        </div>
      </div>

      <Divider />

      {/* Button */}
      <div>
        <h2 className="text-[15px] font-bold text-[#333333]">
          Button
          <span className="ml-1 font-medium text-[#9b9b9b]">(optional)</span>
        </h2>
        <p className="mt-[6px] text-[12px] text-[#8b8b8b]">
          Trigger something—like submitting a form, sending a message, or moving
          to the next step.
        </p>

        <button
          type="button"
          className="mt-[18px] flex h-[64px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#a400f6] bg-white text-[15px] font-bold text-[#a400f6]"
        >
          Add A Button
          <ChevronDown size={18} />
        </button>
      </div>

      <Divider />

      {/* Custom Button */}
      <div>
        <h3 className="text-[13px] font-bold text-[#333333]">Custom Button</h3>

        <div className="mt-[18px] space-y-[18px]">
          {["Yes", "No"].map((value, index) => (
            <div key={index}>
              <FieldLabel>Button Text</FieldLabel>
              <div className="flex items-center gap-4">
                <Move size={20} className="shrink-0 text-[#9b9b9b]" />
                <input
                  type="text"
                  defaultValue={value}
                  className="h-[56px] flex-1 rounded-[10px] border border-[#e5e5e5] bg-white px-[18px] text-[15px] text-[#444444] focus:border-[#a400f6] focus:outline-none"
                />
                <button
                  type="button"
                  className="shrink-0 text-[#9b9b9b] hover:text-[#e44]"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom CTA */}
      <div className="mt-[28px]">
        <h3 className="text-[13px] font-bold text-[#333333]">Custom CTA</h3>

        <div className="mt-[16px] flex items-end gap-4">
          <Move size={20} className="mb-[18px] shrink-0 text-[#9b9b9b]" />
          <div className="flex-1">
            <FieldLabel>Button Text</FieldLabel>
            <input
              type="text"
              defaultValue="Visit Website"
              className="h-[56px] w-full rounded-[10px] border border-[#e5e5e5] bg-white px-[18px] text-[15px] text-[#444444] focus:border-[#a400f6] focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <FieldLabel>URL</FieldLabel>
            <input
              type="text"
              defaultValue="www.nucle.com"
              className="h-[56px] w-full rounded-[10px] border border-[#e5e5e5] bg-white px-[18px] text-[15px] text-[#444444] focus:border-[#a400f6] focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="mb-[18px] shrink-0 text-[#9b9b9b] hover:text-[#e44]"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="mt-[34px]">
        <button
          type="button"
          className="h-[56px] w-[160px] rounded-[10px] bg-[#b800f8] text-[15px] font-bold text-white transition-colors hover:bg-[#a400f6]"
        >
          save
        </button>
      </div>
    </div>
  );
}
