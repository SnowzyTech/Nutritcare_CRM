"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Package,
  MapPin,
  Calendar,
  ChevronDown,
  Monitor,
  Copy,
  ArrowRight,
  Check,
} from "lucide-react";
import type { MediaBuyerFormRow } from "@/modules/media-buyer/services/media-buyer.service";
import { buildFormEmbedCodes } from "@/lib/forms/embed-codes";

const BRAND = "#8B2FE8";

type Row = MediaBuyerFormRow & { status: "Active" | "Disabled" };

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => alert(`${label} copied to clipboard!`));
}

/* ── Black pill filter dropdown (custom popover menu) ─────────────────────── */
function FilterPill({
  icon,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  value: string;
  onChange?: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-between gap-2 min-w-[160px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 px-4 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <span className="text-slate-300">{icon}</span>
          <span className="text-sm font-semibold">{current?.label}</span>
        </span>
        <ChevronDown
          size={15}
          className={`text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-30 w-56 bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/60 p-1.5">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange?.(o.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors cursor-pointer ${
                  active ? "bg-purple-50 text-purple-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {o.label}
                {active && <Check size={15} className="text-purple-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Action buttons ──────────────────────────────────────────────────────── */
function OutlineBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-white border border-purple-300 rounded-md px-2.5 py-1.5 hover:bg-purple-50 transition-colors whitespace-nowrap cursor-pointer"
    >
      <Monitor size={11} />
      {children}
    </button>
  );
}
function SoftBtn({
  children,
  onClick,
  icon = true,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap cursor-pointer"
    >
      {icon && <Copy size={11} />}
      {children}
    </button>
  );
}
function SolidBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap hover:opacity-90 cursor-pointer"
      style={{ background: BRAND }}
    >
      <Copy size={11} />
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  const styles =
    status === "Disabled"
      ? "bg-rose-100 text-rose-600"
      : "bg-emerald-100 text-emerald-600";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md ${styles}`}
    >
      {status}
      <ChevronDown size={10} />
    </span>
  );
}

const GRID = "grid grid-cols-[1.3fr_0.75fr_1fr_0.55fr_0.55fr_0.7fr_2.7fr] gap-3";

export default function MediaBuyerFormsClient({ rows }: { rows: MediaBuyerFormRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState("");
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = useState("");

  const withStatus: Row[] = useMemo(
    () => rows.map((r) => ({ ...r, status: r.disabled ? "Disabled" : "Active" })),
    [rows]
  );

  const inRange = (iso: string) => {
    if (!dateRange) return true;
    const d = new Date(iso);
    const now = new Date();
    if (dateRange === "today") return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateRange === "month") return d >= new Date(now.getFullYear(), now.getMonth(), 1);
    if (dateRange === "7" || dateRange === "30") {
      const s = new Date(now);
      s.setDate(now.getDate() - Number(dateRange));
      return d >= s;
    }
    return true;
  };

  const productOptions = useMemo(() => {
    const names = [...new Set(rows.map((r) => r.productName).filter((n) => n && n !== "—"))];
    return [{ label: "Product", value: "" }, ...names.map((n) => ({ label: n, value: n }))];
  }, [rows]);

  const filtered = withStatus.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (product && r.productName !== product) return false;
    if (status && r.status !== status) return false;
    if (!inRange(r.createdAt)) return false;
    return true;
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-4">
      {/* ── Filter toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterPill
            icon={<Package size={15} />}
            value={product}
            onChange={setProduct}
            options={productOptions}
          />
          <FilterPill
            icon={<MapPin size={15} />}
            value={status}
            onChange={setStatus}
            options={[
              { label: "Status", value: "" },
              { label: "Active", value: "Active" },
              { label: "Disabled", value: "Disabled" },
            ]}
          />
          <FilterPill
            icon={<Calendar size={15} />}
            value={dateRange}
            onChange={setDateRange}
            options={[
              { label: "Date Range", value: "" },
              { label: "Today", value: "today" },
              { label: "Last 7 days", value: "7" },
              { label: "Last 30 days", value: "30" },
              { label: "This month", value: "month" },
            ]}
          />
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search"
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-purple-400 transition-colors"
          />
        </div>
      </div>

      <p className="text-sm font-bold text-slate-800">All Forms</p>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <div className="min-w-[1040px]">
          {/* Header */}
          <div
            className={`${GRID} px-5 py-3.5 bg-slate-200/70 rounded-t-xl text-[13px] font-bold text-slate-600`}
          >
            <span>Form Name</span>
            <span>Status</span>
            <span>Product</span>
            <span>Views</span>
            <span>Leads</span>
            <span>Conv.</span>
            <span>Action</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-slate-400 border border-t-0 border-slate-100 rounded-b-xl">
              {rows.length === 0
                ? "No forms yet. Click “Create Form” to build your first one."
                : "No forms match your filters."}
            </div>
          ) : (
            filtered.map((f, idx) => {
              const c = buildFormEmbedCodes(f.id, origin);
              return (
                <div
                  key={f.id}
                  className={`${GRID} px-5 py-4 items-center ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                >
                  {/* Form name */}
                  <button
                    onClick={() => router.push(`/media-buyer/forms/${f.id}`)}
                    className="text-left cursor-pointer"
                  >
                    <p className="text-sm font-bold text-slate-800 leading-tight hover:text-purple-700 transition-colors">
                      {f.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{f.createdAt.slice(0, 10)}</p>
                  </button>

                  {/* Status */}
                  <div>
                    <StatusBadge status={f.status} />
                  </div>

                  {/* Product */}
                  <span className="text-sm text-slate-600">{f.productName}</span>

                  {/* Views / Leads */}
                  <span className="text-sm font-semibold text-slate-700">{f.views.toLocaleString()}</span>
                  <span className="text-sm font-semibold text-slate-700">{f.leads.toLocaleString()}</span>

                  {/* Conv. */}
                  <div>
                    <p className="text-lg font-black text-slate-800 leading-none">{f.delivered.toLocaleString()}</p>
                    <p className="text-[11px] font-bold text-emerald-500 mt-0.5">{f.conversionPct}%</p>
                  </div>

                  {/* Action */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <OutlineBtn onClick={() => window.open(`/order-form/${f.id}?tab=optin`, "_blank")}>
                      Prev. Optin Form
                    </OutlineBtn>
                    <OutlineBtn onClick={() => window.open(`/order-form/${f.id}?tab=order`, "_blank")}>
                      Prev Order Form
                    </OutlineBtn>
                    <SoftBtn onClick={() => copy(c.optinIframe, "Optin code")}>Optin Code</SoftBtn>
                    <SoftBtn onClick={() => copy(c.orderIframe, "iFrame code")}>iFrame Code</SoftBtn>
                    <SolidBtn onClick={() => copy(c.formCode, "Form code")}>Form Code</SolidBtn>
                    <SoftBtn onClick={() => copy(f.id, "Form ID")}>Form ID</SoftBtn>
                    <SoftBtn icon={false} onClick={() => window.open(`/order-form/${f.id}?tab=upsell&index=0`, "_blank")}>
                      Upsell
                    </SoftBtn>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* See all */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-xl px-5 py-2.5 transition-colors cursor-pointer"
        >
          See all <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
