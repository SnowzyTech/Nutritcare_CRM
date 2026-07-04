
import { prisma } from "@/lib/db/prisma";

/**
 * Media Buyer service — owner-scoped reads over the shared `Form` table.
 *
 * A media buyer only ever sees the forms they themselves created
 * (`createdById = <their user id>`). Admin continues to use the
 * unscoped `getAllForms()` in modules/admin/services/forms.service.ts.
 *
 * Metrics are now real and time-filterable:
 *  - views     → count of `FormView` rows (logged when the embedded iframe loads)
 *  - leads     → count of `Order` rows linked to the form (`Order.formId`)
 *  - delivered → those orders with status DELIVERED
 *  - conv %    → delivered ÷ leads
 * Orders placed before the `Order.formId` link existed are not attributed.
 */

export type ProductLine = { id: string; name: string };
export type MediaBuyerPeriod = "all" | "this-month" | "last-month";

export type MediaBuyerFormRow = {
  id: string;
  name: string;
  createdAt: string;
  productName: string;
  views: number;
  leads: number;
  delivered: number;
  conversionPct: number; // delivered ÷ leads
  disabled: boolean;
};

export type MediaBuyerDashboard = {
  metrics: {
    totalDeliveredOrders: number;
    totalLeads: number;
    conversionRate: number; // delivered ÷ leads, percent
    totalForms: number;
    productLines: ProductLine[];
    bestPerformingProduct: string | null;
  };
  funnel: { views: number; leads: number; conversion: number };
  forms: MediaBuyerFormRow[];
};

export type MediaBuyerFormDetail = {
  id: string;
  name: string;
  createdAt: string;
  data: Record<string, unknown>;
  productName: string;
  views: number;
  leads: number;
  delivered: number;
  conversionPct: number;
  disabled: boolean;
};

/** Resolve a period token to a createdAt range, or null for all-time. */
export function periodRange(
  period?: string | null
): { gte: Date; lte: Date } | null {
  const now = new Date();
  if (period === "this-month") {
    return {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
      lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === "last-month") {
    return {
      gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    };
  }
  return null; // all time
}

/** Collect the distinct product ids a form references (main product + price variations). */
function productIdsFromFormData(data: unknown): string[] {
  const d = (data ?? {}) as Record<string, unknown>;
  const ids = new Set<string>();
  if (typeof d.selectedProduct === "string" && d.selectedProduct) {
    ids.add(d.selectedProduct);
  }
  const variations = Array.isArray(d.priceVariations) ? d.priceVariations : [];
  for (const v of variations as Array<Record<string, unknown>>) {
    if (typeof v?.productId === "string" && v.productId) ids.add(v.productId);
  }
  return [...ids];
}

/**
 * Per-form rows (with product name + stats) for one creator, newest first.
 * Shared by the dashboard and the My Forms table. `period` filters the
 * order/view counts (not which forms are listed).
 */
export async function getMyFormRows(
  creatorId: string,
  period?: string | null
): Promise<MediaBuyerFormRow[]> {
  const forms = await prisma.form.findMany({
    where: { createdById: creatorId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, data: true, createdAt: true, disabledAt: true },
  });
  if (forms.length === 0) return [];

  const formIds = forms.map((f) => f.id);
  const range = periodRange(period);

  const [orderStats, viewStats] = await Promise.all([
    prisma.order.groupBy({
      by: ["formId", "status"],
      where: {
        formId: { in: formIds },
        deletedAt: null,
        ...(range ? { createdAt: range } : {}),
      },
      _count: { id: true },
    }),
    prisma.formView.groupBy({
      by: ["formId"],
      where: { formId: { in: formIds }, ...(range ? { createdAt: range } : {}) },
      _count: { id: true },
    }),
  ]);

  const leadsMap = new Map<string, number>();
  const deliveredMap = new Map<string, number>();
  for (const s of orderStats) {
    if (!s.formId) continue;
    leadsMap.set(s.formId, (leadsMap.get(s.formId) ?? 0) + s._count.id);
    if (s.status === "DELIVERED") {
      deliveredMap.set(s.formId, (deliveredMap.get(s.formId) ?? 0) + s._count.id);
    }
  }
  const viewsMap = new Map(viewStats.map((v) => [v.formId, v._count.id]));

  // Resolve product names across all referenced products.
  const allProductIds = new Set<string>();
  const perFormProductId = new Map<string, string | null>();
  for (const f of forms) {
    const ids = productIdsFromFormData(f.data);
    ids.forEach((id) => allProductIds.add(id));
    perFormProductId.set(f.id, ids[0] ?? null);
  }
  const products = allProductIds.size
    ? await prisma.product.findMany({
        where: { id: { in: [...allProductIds] } },
        select: { id: true, name: true },
      })
    : [];
  const productName = new Map(products.map((p) => [p.id, p.name]));

  return forms.map((f) => {
    const leads = leadsMap.get(f.id) ?? 0;
    const delivered = deliveredMap.get(f.id) ?? 0;
    const views = viewsMap.get(f.id) ?? 0;
    return {
      id: f.id,
      name: f.name,
      createdAt: f.createdAt.toISOString(),
      productName: productName.get(perFormProductId.get(f.id) ?? "") ?? "—",
      views,
      leads,
      delivered,
      conversionPct: leads > 0 ? Math.round((delivered / leads) * 100) : 0,
      disabled: !!f.disabledAt,
    };
  });
}

/**
 * A single form owned by this creator, with derived (all-time) stats and its
 * full saved config (`data`). Returns null if not found or not theirs.
 */
export async function getMyFormDetail(
  creatorId: string,
  formId: string,
  period?: string | null
): Promise<MediaBuyerFormDetail | null> {
  const form = await prisma.form.findFirst({
    where: { id: formId, createdById: creatorId, deletedAt: null },
    select: { id: true, name: true, data: true, createdAt: true, disabledAt: true },
  });
  if (!form) return null;

  const range = periodRange(period);
  const [orderStats, viewCount] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where: { formId, deletedAt: null, ...(range ? { createdAt: range } : {}) },
      _count: { id: true },
    }),
    prisma.formView.count({
      where: { formId, ...(range ? { createdAt: range } : {}) },
    }),
  ]);

  const leads = orderStats.reduce((sum, s) => sum + s._count.id, 0);
  const delivered =
    orderStats.find((s) => s.status === "DELIVERED")?._count.id ?? 0;

  const ids = productIdsFromFormData(form.data);
  const products = ids.length
    ? await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    : [];
  const productName = products.find((p) => p.id === ids[0])?.name ?? "—";

  return {
    id: form.id,
    name: form.name,
    createdAt: form.createdAt.toISOString(),
    data: (form.data ?? {}) as Record<string, unknown>,
    productName,
    views: viewCount,
    leads,
    delivered,
    conversionPct: leads > 0 ? Math.round((delivered / leads) * 100) : 0,
    disabled: !!form.disabledAt,
  };
}

/**
 * Everything the media-buyer dashboard needs, scoped to one creator and period.
 * Returns an all-zero shape (empty state) when the buyer has no forms.
 */
export async function getMediaBuyerDashboard(
  creatorId: string,
  period?: string | null
): Promise<MediaBuyerDashboard> {
  const rows = await getMyFormRows(creatorId, period);

  const totalForms = rows.length;
  const totalLeads = rows.reduce((sum, r) => sum + r.leads, 0);
  const totalViews = rows.reduce((sum, r) => sum + r.views, 0);
  const totalDeliveredOrders = rows.reduce((sum, r) => sum + r.delivered, 0);
  const conversionRate =
    totalLeads > 0 ? Math.round((totalDeliveredOrders / totalLeads) * 100) : 0;

  const seen = new Map<string, ProductLine>();
  for (const r of rows) {
    if (r.productName && r.productName !== "—" && !seen.has(r.productName)) {
      seen.set(r.productName, { id: r.productName, name: r.productName });
    }
  }
  const productLines = [...seen.values()];

  const topForm = [...rows].sort((a, b) => b.delivered - a.delivered)[0];
  const bestPerformingProduct =
    topForm && topForm.productName !== "—" ? topForm.productName : null;

  return {
    metrics: {
      totalDeliveredOrders,
      totalLeads,
      conversionRate,
      totalForms,
      productLines,
      bestPerformingProduct,
    },
    funnel: {
      views: totalViews,
      leads: totalLeads,
      conversion: totalDeliveredOrders,
    },
    forms: rows,
  };
}
