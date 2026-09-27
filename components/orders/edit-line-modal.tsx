"use client";

import { useMemo, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useUpsellPreview } from "@/lib/orders/use-upsell-preview";

/**
 * Shared "edit a product line" popup used by the sales-rep, admin, sales-manager
 * and data-analyst order-detail screens. Three modes:
 *
 *   • "add"      — add a NEW product on top (recorded as an upsell).
 *   • "quantity" — change the quantity of the SAME product (a revision, re-priced).
 *   • "swap"     — replace the product with a different one (a revision, re-priced).
 *
 * The component is action-agnostic: the parent injects a `resolvePreview` action
 * (merge-aware for "add", absolute for "quantity"/"swap") and an `onSubmit` that
 * performs the role-scoped change. The live price is driven by the existing
 * `useUpsellPreview` hook fed a single row.
 */

type PreviewResult =
  | {
      lineTotal: number;
      unitPrice: number;
      source: "package" | "surplus";
      requiresUnitPrice: boolean;
      mergedQty: number;
    }
  | { error: string };

type ResolvePreview = (
  orderId: string,
  productId: string,
  qty: number,
  typedUnitPrice?: number,
) => Promise<PreviewResult>;

export interface EditLineModalProps {
  orderId: string;
  mode: "add" | "quantity" | "swap";
  isOpen: boolean;
  onClose: () => void;
  /** The line being edited. Omitted (undefined) in "add" mode. */
  line?: { id: string; productId: string; productName: string; quantity: number };
  /** All sellable products — used to populate the add / swap picker. */
  products: { id: string; name: string }[];
  resolvePreview: ResolvePreview;
  /** Perform the change. Parent wires this to the correct role action. */
  onSubmit: (args: {
    productId: string;
    qty: number;
    unitPrice?: number;
  }) => Promise<{ error?: string } | { success?: true } | void>;
  /** Called after a successful save (e.g. to refresh). */
  onDone?: () => void;
}

const fmtNaira = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

const TITLES: Record<EditLineModalProps["mode"], string> = {
  add: "Add Product",
  quantity: "Change Quantity",
  swap: "Change Product",
};

export function EditLineModal({
  orderId,
  mode,
  isOpen,
  onClose,
  line,
  products,
  resolvePreview,
  onSubmit,
  onDone,
}: EditLineModalProps) {
  const [isPending, startTransition] = useTransition();

  // In "swap" default to the first product that isn't the current one; in "add"
  // the first product; in "quantity" the line's own product (picker hidden).
  const defaultProductId =
    mode === "quantity"
      ? line?.productId ?? ""
      : mode === "swap"
        ? products.find((p) => p.id !== line?.productId)?.id ?? ""
        : products[0]?.id ?? "";
  // The parent remounts this modal with a fresh `key` per open (mode + line), so
  // these initial values are always correct — no reset effect needed.
  const [productId, setProductId] = useState(defaultProductId);
  const [qty, setQty] = useState(String(mode === "add" ? 1 : line?.quantity ?? 1));
  const [unitPrice, setUnitPrice] = useState("");

  // Memoise the single preview row so its reference only changes when the
  // product / quantity / unit price change — otherwise a fresh array on every
  // render makes the preview hook refetch endlessly ("stuck recalculating").
  const rows = useMemo(
    () => [{ id: 0, productId, qty, unitPrice }],
    [productId, qty, unitPrice],
  );
  const { previews } = useUpsellPreview(orderId, isOpen, rows, resolvePreview);
  const preview = previews[0];

  if (!isOpen) return null;

  const parsedQty = Math.max(1, parseInt(qty) || 1);
  const showPicker = mode === "add" || mode === "swap";
  const pickerProducts =
    mode === "swap" ? products.filter((p) => p.id !== line?.productId) : products;
  const selectedName = products.find((p) => p.id === productId)?.name ?? "—";

  function adjustQty(delta: number) {
    setQty((q) => String(Math.max(1, (parseInt(q) || 1) + delta)));
  }

  function handleSave() {
    if (showPicker && !productId) {
      toast.error("Select a product first.");
      return;
    }
    const typed = parseFloat(unitPrice);
    if (preview && "requiresUnitPrice" in preview && preview.requiresUnitPrice && !(typed > 0)) {
      toast.error("Enter a unit price greater than ₦0 for this quantity.");
      return;
    }
    const price = typed > 0 ? typed : undefined;

    startTransition(async () => {
      try {
        const res = await onSubmit({ productId, qty: parsedQty, unitPrice: price });
        if (res && typeof res === "object" && "error" in res && res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(
          mode === "add"
            ? "Product added"
            : mode === "quantity"
              ? "Quantity updated"
              : "Product changed",
        );
        onClose();
        onDone?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[560px] p-10 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-800">{TITLES[mode]}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {mode === "swap" && line && (
          <p className="text-sm text-gray-500 mb-4">
            Replacing <span className="font-bold text-gray-700">{line.productName}</span> — recorded
            as a change of order, not an upsell.
          </p>
        )}

        <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3 border border-slate-100">
          {showPicker ? (
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-[48px] bg-white border border-slate-200 rounded-xl px-4 text-sm font-semibold text-slate-800 outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="" disabled>
                Select product
              </option>
              {pickerProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm font-bold text-slate-800">{line?.productName ?? selectedName}</div>
          )}

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-500 truncate">{selectedName}</span>
            <div className="flex items-center justify-between bg-white rounded-xl h-[44px] px-2 shadow-sm border border-slate-100 shrink-0 w-[130px]">
              <button
                onClick={() => adjustQty(-1)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-colors font-bold"
              >
                -
              </button>
              <span className="text-[1.1rem] font-black text-slate-800">{parsedQty}</span>
              <button
                onClick={() => adjustQty(1)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-colors font-bold"
              >
                +
              </button>
            </div>
          </div>

          {preview && "requiresUnitPrice" in preview && preview.requiresUnitPrice && (
            <div className="flex flex-col gap-1">
              <input
                type="number"
                min="1"
                inputMode="decimal"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Enter price of 1 unit (₦)"
                className="w-full h-[44px] bg-white border border-amber-300 rounded-xl px-4 text-sm font-semibold text-slate-800 outline-none focus:border-amber-400"
              />
              <span className="text-[11px] text-amber-600 font-medium">
                This quantity has no set package — enter the current price of 1 unit.
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-2">
            <span className="text-slate-500 font-medium">
              {mode === "add" ? "Line total" : "New total"}
            </span>
            <span className="font-black text-slate-800">
              {!productId
                ? "—"
                : preview && "loading" in preview && preview.loading
                  ? "…"
                  : preview && "lineTotal" in preview
                    ? fmtNaira(preview.lineTotal)
                    : "—"}
            </span>
          </div>
        </div>

        <button
          disabled={isPending}
          onClick={handleSave}
          className="w-full mt-8 bg-purple-600 text-white py-4 rounded-2xl text-[1rem] font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? "Saving…" : mode === "add" ? "Add to Order" : "Save Change"}{" "}
          <span className="text-xl">→</span>
        </button>
      </div>
    </div>
  );
}
