import { useState, useEffect, useCallback } from "react";

/**
 * Shared logic for the Add-Product popup's live, merge-aware price preview —
 * used by both the sales-rep and admin popups (each keeps its own markup). Only
 * the resolver action differs (rep vs admin), so it's passed in.
 * See docs/upsell-display-rollout.md.
 */

export type UpsellPreview = {
  loading: boolean;
  lineTotal: number;
  source: "package" | "surplus";
  requiresUnitPrice: boolean;
  mergedQty: number;
};

export type UpsellRow = {
  id: number;
  productId: string;
  qty: string;
  unitPrice: string;
};

type PreviewResult =
  | {
      lineTotal: number;
      unitPrice: number;
      source: "package" | "surplus";
      requiresUnitPrice: boolean;
      mergedQty: number;
    }
  | { error: string };

type ResolveAction = (
  orderId: string,
  productId: string,
  addedQty: number,
  typedUnitPrice?: number,
) => Promise<PreviewResult>;

export function useUpsellPreview(
  orderId: string,
  isOpen: boolean,
  rows: UpsellRow[],
  resolveAction: ResolveAction,
) {
  const [previews, setPreviews] = useState<Record<number, UpsellPreview | null>>(
    {},
  );

  const fetchRowPreview = useCallback(
    async (row: UpsellRow) => {
      if (!row.productId) {
        setPreviews((p) => ({ ...p, [row.id]: null }));
        return;
      }
      const addedQty = parseInt(row.qty) || 1;
      const typed = parseFloat(row.unitPrice) || 0;
      setPreviews((p) => ({
        ...p,
        [row.id]: {
          loading: true,
          lineTotal: p[row.id]?.lineTotal ?? 0,
          source: p[row.id]?.source ?? "package",
          requiresUnitPrice: p[row.id]?.requiresUnitPrice ?? false,
          mergedQty: p[row.id]?.mergedQty ?? addedQty,
        },
      }));
      const res = await resolveAction(orderId, row.productId, addedQty, typed);
      if ("error" in res) {
        setPreviews((p) => ({ ...p, [row.id]: null }));
        return;
      }
      setPreviews((p) => ({
        ...p,
        [row.id]: {
          loading: false,
          lineTotal: res.lineTotal,
          source: res.source,
          requiresUnitPrice: res.requiresUnitPrice,
          mergedQty: res.mergedQty,
        },
      }));
    },
    [orderId, resolveAction],
  );

  // Debounced refresh of every row's preview whenever the rows change.
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      rows.forEach((r) => void fetchRowPreview(r));
    }, 300);
    return () => clearTimeout(t);
  }, [isOpen, rows, fetchRowPreview]);

  return { previews };
}
