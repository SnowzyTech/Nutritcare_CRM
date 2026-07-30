import { prisma } from "@/lib/db/prisma";
import type { OrderStatus } from "@prisma/client";
import { dateRanges, type DatePeriod } from "@/lib/date-period";
import {
  getMyFormDetail,
  getMyFormRows,
  mbTrendLabel,
  type MediaBuyerFormDetail,
  type MediaBuyerFormRow,
} from "@/modules/media-buyer/services/media-buyer.service";
import { getOrderRows, type OrderRow } from "./data-analysis.service";

/**
 * Media-buyer analytics read layer for the DATA ANALYST module.
 *
 * The analyst looks at *other people's* numbers, so everything here takes an
 * explicit `userId` and a {@link DatePeriod} window. Attribution is the same
 * two-hop chain the media-buyer module uses — `User.id → Form.createdById →
 * Order.formId / FormView.formId` — so this composes
 * `modules/media-buyer/services/media-buyer.service.ts` rather than
 * reimplementing those counts.
 *
 * There is no ad-spend/campaign data in the schema, so there is deliberately no
 * CPL or ROAS here: the real metrics are views, leads (attributed orders),
 * delivered, conversion (delivered ÷ leads), forms and product lines.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaBuyerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  avatarUrl: string | null;
  teamName: string | null;
  isActive: boolean;
  joinedAt: Date;
};

/** A metric with its previous-window value and a signed percent label. */
export type MediaBuyerMetric = {
  value: number;
  previous: number;
  delta: string;
};

export type MediaBuyerTrendPoint = {
  label: string;
  views: number;
  leads: number;
  delivered: number;
};

export type MediaBuyerProductLine = {
  name: string;
  views: number;
  leads: number;
  delivered: number;
};

export type MediaBuyerLeadStatus = {
  status: OrderStatus;
  label: string;
  count: number;
};

export type MediaBuyerAnalytics = {
  metrics: {
    views: MediaBuyerMetric;
    leads: MediaBuyerMetric;
    delivered: MediaBuyerMetric;
    /** Percent: delivered ÷ leads. */
    conversion: MediaBuyerMetric;
    /** Forms created inside the window. */
    newForms: MediaBuyerMetric;
    /** Every non-deleted form they own, not window-scoped. */
    totalForms: number;
  };
  funnel: { views: number; leads: number; delivered: number };
  trend: { bucket: TrendBucket; points: MediaBuyerTrendPoint[] };
  productLines: MediaBuyerProductLine[];
  bestPerformingProduct: string | null;
  leadStatuses: MediaBuyerLeadStatus[];
  forms: MediaBuyerFormRow[];
};

// ─── Trend bucketing ──────────────────────────────────────────────────────────

export type TrendBucket = "hour" | "day" | "week" | "month";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Keep the trend readable: a single day goes hourly, a year goes monthly. */
function pickBucket(spanDays: number): TrendBucket {
  if (spanDays <= 2) return "hour";
  if (spanDays <= 45) return "day";
  if (spanDays <= 180) return "week";
  return "month";
}

function startOfBucket(date: Date, bucket: TrendBucket): Date {
  const d = new Date(date);
  if (bucket === "hour") {
    d.setMinutes(0, 0, 0);
    return d;
  }
  d.setHours(0, 0, 0, 0);
  if (bucket === "day") return d;
  if (bucket === "week") {
    // Monday-based weeks, matching the rest of the app's weekly views.
    const shift = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - shift);
    return d;
  }
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function nextBucket(date: Date, bucket: TrendBucket): Date {
  const d = new Date(date);
  switch (bucket) {
    case "hour":
      d.setHours(d.getHours() + 1);
      return d;
    case "day":
      d.setDate(d.getDate() + 1);
      return d;
    case "week":
      d.setDate(d.getDate() + 7);
      return d;
    case "month":
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
}

function bucketLabel(date: Date, bucket: TrendBucket): string {
  switch (bucket) {
    case "hour":
      return `${String(date.getHours()).padStart(2, "0")}:00`;
    case "month":
      return date.toLocaleDateString("en-NG", { month: "short" });
    default:
      return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  }
}

const LEAD_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

const LEAD_STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
];

function metric(current: number, previous: number): MediaBuyerMetric {
  return { value: current, previous, delta: mbTrendLabel(current, previous) };
}

function sum(rows: MediaBuyerFormRow[], key: "views" | "leads" | "delivered"): number {
  return rows.reduce((total, row) => total + row[key], 0);
}

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * The buyer being inspected. Returns null unless the user exists **and** is a
 * MEDIA_BUYER, so `/data/media-buyers/<any-other-user-id>` 404s rather than
 * exposing an unrelated staff record through this surface.
 */
export async function getMediaBuyerProfile(
  userId: string
): Promise<MediaBuyerProfile | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEDIA_BUYER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsappNumber: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      team: { select: { name: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    whatsapp: user.whatsappNumber,
    avatarUrl: user.avatarUrl,
    teamName: user.team?.name ?? null,
    isActive: user.isActive,
    joinedAt: user.createdAt,
  };
}

/** Every non-deleted form id this buyer owns. */
async function ownedFormIds(userId: string): Promise<string[]> {
  const forms = await prisma.form.findMany({
    where: { createdById: userId, deletedAt: null },
    select: { id: true },
  });
  return forms.map((f) => f.id);
}

/**
 * The full analytics board for one media buyer over `period`: window totals with
 * period-over-period deltas, the conversion funnel, a real leads/delivered
 * trend, per-product totals, the lead status mix, and the per-form table.
 */
export async function getMediaBuyerAnalytics(
  userId: string,
  period: DatePeriod
): Promise<MediaBuyerAnalytics> {
  const { currentStart, currentEnd, prevStart, prevEnd } = dateRanges(period);

  // getMyFormRows always lists every form the buyer owns; the range only scopes
  // the counts. So the two calls give matching rows with current vs previous
  // numbers, and `current.length` is the all-time form count.
  const [current, previous] = await Promise.all([
    getMyFormRows(userId, { gte: currentStart, lte: currentEnd }),
    getMyFormRows(userId, { gte: prevStart, lte: prevEnd }),
  ]);

  const formIds = current.map((f) => f.id);
  const [orders, views] = formIds.length
    ? await Promise.all([
        prisma.order.findMany({
          where: {
            formId: { in: formIds },
            deletedAt: null,
            createdAt: { gte: currentStart, lte: currentEnd },
          },
          select: { status: true, createdAt: true },
        }),
        prisma.formView.findMany({
          where: {
            formId: { in: formIds },
            createdAt: { gte: currentStart, lte: currentEnd },
          },
          select: { createdAt: true },
        }),
      ])
    : [[], []];

  // ── Window totals + deltas ──
  const curViews = sum(current, "views");
  const curLeads = sum(current, "leads");
  const curDelivered = sum(current, "delivered");
  const prevViews = sum(previous, "views");
  const prevLeads = sum(previous, "leads");
  const prevDelivered = sum(previous, "delivered");

  const inWindow = (iso: string, start: Date, end: Date) => {
    const d = new Date(iso);
    return d >= start && d <= end;
  };
  const newFormsCurrent = current.filter((f) =>
    inWindow(f.createdAt, currentStart, currentEnd)
  ).length;
  const newFormsPrevious = current.filter((f) =>
    inWindow(f.createdAt, prevStart, prevEnd)
  ).length;

  // ── Trend ──
  const spanDays = Math.max(
    1,
    Math.round((currentEnd.getTime() - currentStart.getTime()) / DAY_MS)
  );
  const bucket = pickBucket(spanDays);
  const points: MediaBuyerTrendPoint[] = [];
  const indexByKey = new Map<number, number>();
  for (
    let cursor = startOfBucket(currentStart, bucket);
    cursor <= currentEnd;
    cursor = nextBucket(cursor, bucket)
  ) {
    indexByKey.set(cursor.getTime(), points.length);
    points.push({ label: bucketLabel(cursor, bucket), views: 0, leads: 0, delivered: 0 });
  }
  const pointAt = (date: Date) => {
    const index = indexByKey.get(startOfBucket(date, bucket).getTime());
    return index === undefined ? null : points[index];
  };
  for (const order of orders) {
    const point = pointAt(order.createdAt);
    if (!point) continue;
    point.leads += 1;
    if (order.status === "DELIVERED") point.delivered += 1;
  }
  for (const view of views) {
    const point = pointAt(view.createdAt);
    if (point) point.views += 1;
  }

  // ── Per-product totals ──
  const byProduct = new Map<string, MediaBuyerProductLine>();
  for (const form of current) {
    const name = form.productName && form.productName !== "—" ? form.productName : "Unassigned";
    const line = byProduct.get(name) ?? { name, views: 0, leads: 0, delivered: 0 };
    line.views += form.views;
    line.leads += form.leads;
    line.delivered += form.delivered;
    byProduct.set(name, line);
  }
  const productLines = [...byProduct.values()].sort((a, b) => b.delivered - a.delivered);
  const bestPerformingProduct =
    productLines[0] && productLines[0].delivered > 0 && productLines[0].name !== "Unassigned"
      ? productLines[0].name
      : null;

  // ── Lead status mix ──
  const statusCounts = new Map<OrderStatus, number>();
  for (const order of orders) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
  }
  const leadStatuses = LEAD_STATUS_ORDER.map((status) => ({
    status,
    label: LEAD_STATUS_LABELS[status],
    count: statusCounts.get(status) ?? 0,
  }));

  return {
    metrics: {
      views: metric(curViews, prevViews),
      leads: metric(curLeads, prevLeads),
      delivered: metric(curDelivered, prevDelivered),
      conversion: metric(pct(curDelivered, curLeads), pct(prevDelivered, prevLeads)),
      newForms: metric(newFormsCurrent, newFormsPrevious),
      totalForms: current.length,
    },
    funnel: { views: curViews, leads: curLeads, delivered: curDelivered },
    trend: { bucket, points },
    productLines,
    bestPerformingProduct,
    leadStatuses,
    forms: [...current].sort((a, b) => b.delivered - a.delivered || b.leads - a.leads),
  };
}

/** Every form this buyer owns, with counts scoped to `period`. */
export async function getMediaBuyerForms(
  userId: string,
  period: DatePeriod
): Promise<MediaBuyerFormRow[]> {
  return getMyFormRows(userId, { gte: period.from, lte: period.to });
}

/** One of this buyer's forms — saved config plus counts scoped to `period`. */
export async function getMediaBuyerFormDetail(
  userId: string,
  formId: string,
  period: DatePeriod
): Promise<MediaBuyerFormDetail | null> {
  return getMyFormDetail(userId, formId, { gte: period.from, lte: period.to });
}

/**
 * The actual orders attributed to this buyer's forms in `period`, in the same
 * row shape the analyst's other order tables use — so rows can link straight to
 * the existing `/data/order/[orderId]` detail page.
 */
export async function getMediaBuyerLeads(
  userId: string,
  period: DatePeriod
): Promise<OrderRow[]> {
  const formIds = await ownedFormIds(userId);
  if (formIds.length === 0) return [];

  return getOrderRows({
    formId: { in: formIds },
    createdAt: { gte: period.from, lte: period.to },
  });
}
