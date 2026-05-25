"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Tag,
  ChevronDown,
  Eye,
  Copy,
  Code2,
  Trash2,
  Pencil,
  Files,
  EyeOff,
} from "lucide-react";
import type { SavedForm } from "@/lib/formsStore";
import { deleteFormAction, duplicateFormAction } from "@/modules/admin/actions/forms.action";

/* ─── tiny helpers ─────────────────────────────────────────── */
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    alert(`${label} copied to clipboard!`);
  });
}

/* ─── Action button variant ────────────────────────────────── */
function ActionBtn({
  icon,
  children,
  onClick,
  variant = "purple",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "purple" | "indigo" | "slate";
}) {
  const colors = {
    purple: "bg-purple-600 hover:bg-purple-700 shadow-purple-100",
    indigo: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
    slate: "bg-slate-700 hover:bg-slate-800 shadow-slate-100",
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2.5 px-5 py-2.5 text-white text-xs font-bold rounded-lg transition-all active:scale-[0.98] shadow-sm hover:shadow-md ${colors[variant]}`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ─── Icon-only action button ──────────────────────────────── */
function IconBtn({
  icon,
  title,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        danger
          ? "text-red-400 hover:text-red-600 hover:bg-red-50"
          : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"
      }`}
    >
      {icon}
    </button>
  );
}

/* ─── Main Component ───────────────────────────────────────── */
export default function FormsListClient({ initialForms }: { initialForms: SavedForm[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());
  const [selectAction, setSelectAction] = useState("");

  const filtered = initialForms.filter((f) =>
    f.formName.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedForms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedForms.size === filtered.length) {
      setSelectedForms(new Set());
    } else {
      setSelectedForms(new Set(filtered.map((f) => f.id)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this form? This cannot be undone.")) return;
    const res = await deleteFormAction(id);
    if ("error" in res) { alert(res.error); return; }
    router.refresh();
  };

  const handleDuplicate = async (id: string) => {
    const res = await duplicateFormAction(id);
    if ("error" in res) { alert(res.error); return; }
    router.refresh();
  };

  const handleBulkAction = async () => {
    if (!selectAction || selectedForms.size === 0) return;
    if (selectAction === "delete") {
      if (!confirm(`Delete ${selectedForms.size} form(s)?`)) return;
      await Promise.all([...selectedForms].map((id) => deleteFormAction(id)));
      setSelectedForms(new Set());
      router.refresh();
    }
    setSelectAction("");
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6">
      {/* ── Page title ── */}
      <div className="flex items-center gap-3">
        <h2 className="text-[2rem] font-black text-slate-800 leading-tight">
          Forms ({initialForms.length})
        </h2>
        <button className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold hover:bg-purple-200 transition-colors">
          ?
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Forms</p>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Form selector */}
          <div className="relative w-full sm:w-56">
            <select className="w-full appearance-none border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-500 outline-none focus:border-purple-400 pr-8 bg-white">
              <option value="">Select Form</option>
              {initialForms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.formName}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Search */}
          <button
            onClick={() => {/* focus search */}}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-md px-4 py-2.5 transition-colors"
          >
            <Search size={14} />
            Search
          </button>

          {/* Add form */}
          <Link
            href="/admin/forms/add"
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-md px-4 py-2.5 transition-colors whitespace-nowrap"
          >
            <Plus size={14} />
            Add Form
          </Link>

          {/* Discount/Coupon */}
          <button className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-md px-4 py-2.5 transition-colors whitespace-nowrap">
            <Tag size={14} />
            Discount/Coupon Codes
          </button>
        </div>

        {/* Receiving emails link */}
        <p className="mt-2 text-xs text-purple-600 hover:underline cursor-pointer font-medium">
          [RECEIVING EMAILS]
        </p>
      </div>

      {/* ── Table area ── */}
      <div className="space-y-4">
        {/* Bulk action bar */}
        <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="relative">
            <select
              value={selectAction}
              onChange={(e) => setSelectAction(e.target.value)}
              className="appearance-none border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-500 outline-none focus:border-purple-400 pr-7 bg-white cursor-pointer"
            >
              <option value="">Select Action</option>
              <option value="delete">Delete Selected</option>
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
          {selectAction && selectedForms.size > 0 && (
            <button
              onClick={handleBulkAction}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Apply
            </button>
          )}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[40px_200px_1fr_280px_100px] gap-6 px-6 py-3.5 bg-slate-50/80 rounded-xl border border-slate-100/50 shadow-sm">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={selectedForms.size === filtered.length && filtered.length > 0}
              onChange={toggleAll}
              className="accent-purple-600 w-4 h-4 cursor-pointer"
            />
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide self-center">
            Form Name
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide self-center">
            Embed Order Form{" "}
            <span className="normal-case font-normal">(On Sales Page)</span>
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide self-center">
            Embed Upsell{" "}
            <span className="normal-case font-normal">(On Upsell Page)</span>
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide self-center text-right">
            Action
          </span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-100 shadow-sm">
            {initialForms.length === 0
              ? 'No forms yet. Click "Add Form" to create one.'
              : "No forms match your search."}
          </div>
        ) : (
          filtered.map((form) => {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const data = (form.data || {}) as Record<string, any>;
            const hasOptin = data.createOptinForm === "Yes";
            const hasUpsell = data.addUpsell === "Yes" && Array.isArray(data.upsellItems) && data.upsellItems.length > 0;

            const optinIframeCode = `<iframe src="${origin}/order-form/${form.id}?tab=optin" width="100%" height="700" frameborder="0" scrolling="no" style="border:none; overflow:hidden;"></iframe>`;
            const iframeCode = `<iframe src="${origin}/order-form/${form.id}?tab=order" width="100%" height="700" frameborder="0" scrolling="no" style="border:none; overflow:hidden;"></iframe>`;
            const formCode = `<div data-form-id="${form.id}"></div><script src="${origin}/embed.js"></script>`;
            const formId = form.id;

            return (
              <div
                key={form.id}
                className="grid grid-cols-[40px_200px_1fr_280px_100px] gap-6 px-6 py-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all duration-300 items-start mb-4 cursor-default"
              >
                {/* Checkbox */}
                <div className="flex items-start justify-center pt-1.5">
                  <input
                    type="checkbox"
                    checked={selectedForms.has(form.id)}
                    onChange={() => toggleSelect(form.id)}
                    className="accent-purple-600 w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Form name */}
                <div className="space-y-1">
                  <p className="text-base font-extrabold text-slate-800 leading-tight">{form.formName}</p>
                  <p className="text-xs text-purple-600 font-bold cursor-pointer hover:underline leading-relaxed">
                    ({form.orders} Orders)
                  </p>
                  <p className="text-xs text-gray-500 font-medium pt-1.5">Hits: {form.hits}</p>
                </div>

                {/* Embed buttons */}
                <div className="flex flex-col gap-3 pr-2">
                  {hasOptin && (
                    <>
                      <ActionBtn
                        icon={<Search size={12} />}
                        variant="purple"
                        onClick={() => window.open(`/order-form/${form.id}?tab=optin`, "_blank")}
                      >
                        Preview Optin Form
                      </ActionBtn>
                      <ActionBtn
                        icon={<Search size={12} />}
                        variant="purple"
                        onClick={() => window.open(`/order-form/${form.id}?tab=order`, "_blank")}
                      >
                        Preview Order Form
                      </ActionBtn>
                    </>
                  )}
                  {!hasOptin && (
                    <ActionBtn
                      icon={<Search size={12} />}
                      variant="purple"
                      onClick={() => window.open(`/order-form/${form.id}`, "_blank")}
                    >
                      Preview Order Form
                    </ActionBtn>
                  )}
                  <ActionBtn
                    icon={<Plus size={12} />}
                    variant="indigo"
                    onClick={() => router.push(`/admin/orders`)}
                  >
                    Add Order…
                  </ActionBtn>
                  {hasOptin && (
                    <ActionBtn
                      icon={<Copy size={12} />}
                      variant="indigo"
                      onClick={() => copyToClipboard(optinIframeCode, "Optin form iframe code")}
                    >
                      Copy Optin Code
                    </ActionBtn>
                  )}
                  <ActionBtn
                    icon={<Copy size={12} />}
                    variant="indigo"
                    onClick={() => copyToClipboard(iframeCode, "Iframe code")}
                  >
                    Copy Iframe Code (Iframe)
                  </ActionBtn>
                  <ActionBtn
                    icon={<Copy size={12} />}
                    variant="indigo"
                    onClick={() => copyToClipboard(formCode, "Form code")}
                  >
                    Copy Form Code (No Iframe)
                  </ActionBtn>
                  <ActionBtn
                    icon={<Copy size={12} />}
                    variant="slate"
                    onClick={() => copyToClipboard(formId, "Form ID")}
                  >
                    Copy Form ID
                  </ActionBtn>
                </div>

                {/* Upsell embed */}
                <div className="flex flex-col gap-3 pt-1">
                  {hasUpsell ? (
                    (data.upsellItems as Array<any>).map((item: any, idx: number) => {
                      const upsellIframe = `<iframe src="${origin}/order-form/${form.id}?tab=upsell&index=${idx}" width="100%" height="700" frameborder="0" scrolling="no" style="border:none; overflow:hidden;"></iframe>`;
                      return (
                        <div key={idx} className="flex flex-col gap-2 bg-slate-50/60 p-3 rounded-lg border border-slate-100 w-full">
                          <span className="text-xs font-extrabold text-slate-700">Upsell {idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.open(`/order-form/${form.id}?tab=upsell&index=${idx}`, "_blank")}
                              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => copyToClipboard(upsellIframe, `Upsell ${idx + 1} Form Code`)}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all active:scale-[0.98] shadow-sm hover:shadow-md inline-flex items-center gap-1.5"
                            >
                              <Copy size={11} />
                              Copy Upsell Form Code
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 font-medium italic pt-1">—</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-start justify-end gap-1.5 pt-0.5">
                  <IconBtn
                    icon={<Pencil size={14} />}
                    title="Edit form"
                    onClick={() => router.push(`/admin/forms/${form.id}/edit`)}
                  />
                  <IconBtn
                    icon={<Files size={14} />}
                    title="Duplicate form"
                    onClick={() => handleDuplicate(form.id)}
                  />
                  <IconBtn
                    icon={<Trash2 size={14} />}
                    title="Delete form"
                    danger
                    onClick={() => handleDelete(form.id)}
                  />
                  <IconBtn
                    icon={<EyeOff size={14} />}
                    title="Hide form"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
