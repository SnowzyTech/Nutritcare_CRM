
import { prisma } from "@/lib/db/prisma";
import { dateRanges, type DatePeriod } from "@/lib/date-period";

/**
 * Media Buyer service — owner-scoped reads over the shared `Form` table.
 *
 * A media buyer only ever sees the forms they themselves created
 * (`createdById = <their user id>`). Admin continues to use the
 * unscoped `getAllForms()` in modules/admin/services/forms.service.ts.
 *
 * Metrics are now real and time-filterable:
 * ed to the form (`Order.formId`)
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
  upsellCount: number;
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
  period?: string | { gte: Date; lte: Date } | null
): Promise<MediaBuyerFormRow[]> {
  const forms = await prisma.form.findMany({
    where: { createdById: creatorId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, data: true, createdAt: true, disabledAt: true },
  });
  if (forms.length === 0) return [];

  const formIds = forms.map((f) => f.id);
  // An explicit range is used directly; a string token maps through periodRange.
  const range = period && typeof period === "object" ? period : periodRange(period ?? null);

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
    const d = (f.data ?? {}) as Record<string, unknown>;
    const upsellCount =
      d.addUpsell === "Yes" && Array.isArray(d.upsellItems) ? d.upsellItems.length : 0;
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
      upsellCount,
    };
  });
}

/**
 * A single form owned by this creator, with derived stats (all-time unless
 * `period` narrows them) and its full saved config (`data`). Returns null if
 * not found or not theirs.
 */
export async function getMyFormDetail(
  creatorId: string,
  formId: string,
  period?: string | { gte: Date; lte: Date } | null
): Promise<MediaBuyerFormDetail | null> {
  const form = await prisma.form.findFirst({
    where: { id: formId, createdById: creatorId, deletedAt: null },
    select: { id: true, name: true, data: true, createdAt: true, disabledAt: true },
  });
  if (!form) return null;

  // An explicit range is used directly; a string token maps through periodRange.
  const range = period && typeof period === "object" ? period : periodRange(period ?? null);
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

// ── Admin department overview ────────────────────────────────────────────────

/** Period-over-period delta as a signed percent label, or "—" when there's no base. */
export function mbTrendLabel(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "—";
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

export type MediaBuyerOverviewRow = {
  id: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  team: string | null;
  totalForms: number; // all their active forms (not window-scoped)
  newForms: number; // forms created within the window
  views: number;
  leads: number;
  delivered: number;
  conversion: number; // delivered ÷ leads, percent
  bestProduct: string | null;
  trends: {
    newForms: string;
    views: string;
    leads: string;
    delivered: string;
    conversion: string;
  };
};

/**
 * Department-wide media-buyer overview for a day/date range. One batched pass
 * over every active media buyer's forms + their linked orders/views in the
 * current and previous windows, so the admin board can rank buyers and see a
 * department aggregate without opening each profile.
 */
export async function getMediaBuyerOverview(
  period: DatePeriod
): Promise<MediaBuyerOverviewRow[]> {
  const { currentStart, currentEnd, prevStart, prevEnd } = dateRanges(period);

  const buyers = await prisma.user.findMany({
    where: { role: "MEDIA_BUYER", isActive: true },
    select: { id: true, name: true, phone: true, avatarUrl: true, team: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  if (buyers.length === 0) return [];
  const buyerIds = buyers.map((b) => b.id);

  const forms = await prisma.form.findMany({
    where: { createdById: { in: buyerIds }, deletedAt: null },
    select: { id: true, createdById: true, createdAt: true, data: true },
  });
  const formOwner = new Map(forms.map((f) => [f.id, f.createdById]));
  const formIds = forms.map((f) => f.id);

  const [orders, views] = formIds.length
    ? await Promise.all([
        prisma.order.findMany({
          where: {
            formId: { in: formIds },
            deletedAt: null,
            createdAt: { gte: prevStart, lte: currentEnd },
          },
          select: { formId: true, status: true, createdAt: true },
        }),
        prisma.formView.findMany({
          where: { formId: { in: formIds }, createdAt: { gte: prevStart, lte: currentEnd } },
          select: { formId: true, createdAt: true },
        }),
      ])
    : [[], []];

  const inCurrent = (d: Date) => d >= currentStart && d <= currentEnd;
  const inPrev = (d: Date) => d >= prevStart && d <= prevEnd;

  // Per-buyer window accumulators.
  type Acc = { views: number; leads: number; delivered: number; newForms: number };
  const cur = new Map<string, Acc>();
  const prev = new Map<string, Acc>();
  const totalForms = new Map<string, number>();
  // Per-form current-window delivered, to pick each buyer's best form/product.
  const formDeliveredCur = new Map<string, number>();
  for (const id of buyerIds) {
    cur.set(id, { views: 0, leads: 0, delivered: 0, newForms: 0 });
    prev.set(id, { views: 0, leads: 0, delivered: 0, newForms: 0 });
    totalForms.set(id, 0);
  }

  for (const f of forms) {
    totalForms.set(f.createdById, (totalForms.get(f.createdById) ?? 0) + 1);
    if (inCurrent(f.createdAt)) cur.get(f.createdById)!.newForms += 1;
    else if (inPrev(f.createdAt)) prev.get(f.createdById)!.newForms += 1;
  }

  for (const o of orders) {
    if (!o.formId) continue;
    const owner = formOwner.get(o.formId);
    if (!owner) continue;
    const bucket = inCurrent(o.createdAt) ? cur.get(owner) : inPrev(o.createdAt) ? prev.get(owner) : null;
    if (!bucket) continue;
    bucket.leads += 1;
    if (o.status === "DELIVERED") {
      bucket.delivered += 1;
      if (inCurrent(o.createdAt)) formDeliveredCur.set(o.formId, (formDeliveredCur.get(o.formId) ?? 0) + 1);
    }
  }

  for (const v of views) {
    const owner = formOwner.get(v.formId);
    if (!owner) continue;
    const bucket = inCurrent(v.createdAt) ? cur.get(owner) : inPrev(v.createdAt) ? prev.get(owner) : null;
    if (bucket) bucket.views += 1;
  }

  // Pick each buyer's best-performing form (most delivered this window) and
  // resolve its product name in a single batched lookup.
  const bestFormPerBuyer = new Map<string, string>(); // buyerId -> formId
  const bestCount = new Map<string, number>();
  for (const [formId, count] of formDeliveredCur) {
    const owner = formOwner.get(formId);
    if (!owner) continue;
    if (count > (bestCount.get(owner) ?? 0)) {
      bestCount.set(owner, count);
      bestFormPerBuyer.set(owner, formId);
    }
  }
  const bestProductIds = new Map<string, string>(); // buyerId -> productId
  const allProductIds = new Set<string>();
  for (const [buyerId, formId] of bestFormPerBuyer) {
    const form = forms.find((f) => f.id === formId);
    const pid = productIdsFromFormData(form?.data)[0];
    if (pid) {
      bestProductIds.set(buyerId, pid);
      allProductIds.add(pid);
    }
  }
  const products = allProductIds.size
    ? await prisma.product.findMany({ where: { id: { in: [...allProductIds] } }, select: { id: true, name: true } })
    : [];
  const productName = new Map(products.map((p) => [p.id, p.name]));

  return buyers.map((b) => {
    const c = cur.get(b.id)!;
    const p = prev.get(b.id)!;
    const conversion = c.leads > 0 ? Math.round((c.delivered / c.leads) * 100) : 0;
    const prevConversion = p.leads > 0 ? Math.round((p.delivered / p.leads) * 100) : 0;
    const pid = bestProductIds.get(b.id);
    return {
      id: b.id,
      name: b.name,
      phone: b.phone,
      avatarUrl: b.avatarUrl,
      team: b.team?.name ?? null,
      totalForms: totalForms.get(b.id) ?? 0,
      newForms: c.newForms,
      views: c.views,
      leads: c.leads,
      delivered: c.delivered,
      conversion,
      bestProduct: pid ? productName.get(pid) ?? null : null,
      trends: {
        newForms: mbTrendLabel(c.newForms, p.newForms),
        views: mbTrendLabel(c.views, p.views),
        leads: mbTrendLabel(c.leads, p.leads),
        delivered: mbTrendLabel(c.delivered, p.delivered),
        conversion: mbTrendLabel(conversion, prevConversion),
      },
    };
  });
}

/**
 * Everything the media-buyer dashboard needs, scoped to one creator and period.
 * Returns an all-zero shape (empty state) when the buyer has no forms.
 */
export async function getMediaBuyerDashboard(
  creatorId: string,
  period?: string | { gte: Date; lte: Date } | null
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

// ── WhatsApp Ads report ─────────────────────────────────────────────────────

export type WhatsappAdsRow = {
  product: string;
  totalLeads: number;
  handled: number;
  confirmed: number;
  delivered: number;
  revenue: number;
  conversionPct: number; // delivered ÷ leads
};

/**
 * The "WHATSAPP ADS REPORT" block in the sales daily and weekly reports:
 * per product, leads → handled → confirmed → delivered, with revenue and a
 * conversion rate.
 *
 * Caveat carried into the UI: the system only knows about a lead once it has
 * become an `Order` (there is no pre-order Lead entity), so `totalLeads` and
 * `handled` are the same figure here. The source documents distinguish them
 * because they count raw inbound WhatsApp contacts upstream of the CRM.
 *
 * Scope is orders that originated from a media-buyer form (`Order.formId`), so
 * organic and phone orders don't inflate the ad numbers.
 */
export async function getWhatsappAdsReport(range: {
  from: Date;
  to: Date;
}): Promise<WhatsappAdsRow[]> {
  const orders = await prisma.order.findMany({
    where: {
      deletedAt: null,
      formId: { not: null },
      date: { gte: range.from, lte: range.to },
    },
    select: {
      status: true,
      netAmount: true,
      items: {
        select: { quantity: true, product: { select: { id: true, name: true } } },
      },
    },
  });

  type Bucket = Omit<WhatsappAdsRow, "conversionPct">;
  const buckets = new Map<string, Bucket>();

  for (const order of orders) {
    const confirmed =
      order.status === "CONFIRMED" || order.status === "DELIVERED" || order.status === "FAILED";
    const delivered = order.status === "DELIVERED";
    const revenue = delivered ? Number(order.netAmount.toString()) : 0;

    // Distinct products on the order, so a multi-line order counts once per product.
    const products = new Map(order.items.map((i) => [i.product.id, i.product.name]));

    for (const name of products.values()) {
      const b =
        buckets.get(name) ??
        { product: name, totalLeads: 0, handled: 0, confirmed: 0, delivered: 0, revenue: 0 };
      b.totalLeads += 1;
      b.handled += 1;
      if (confirmed) b.confirmed += 1;
      if (delivered) {
        b.delivered += 1;
        // Split revenue across the products on the order so the column totals.
        b.revenue += revenue / products.size;
      }
      buckets.set(name, b);
    }
  }

  return [...buckets.values()]
    .map((b) => ({
      ...b,
      conversionPct: b.totalLeads > 0 ? (b.delivered / b.totalLeads) * 100 : 0,
    }))
    .sort((a, b) => b.totalLeads - a.totalLeads);
}
