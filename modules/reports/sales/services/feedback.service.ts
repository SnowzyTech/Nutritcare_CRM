import { prisma } from "@/lib/db/prisma";
import type { Period } from "@/lib/lagos-time";
import {
  CUSTOMER_FEEDBACK_CATEGORIES,
  customerFeedbackCategoryLabel,
  type CustomerFeedbackCategory,
  type CustomerFeedbackStatus,
} from "@/lib/orders/customer-feedback";
import type { SalesReportFilters } from "@/modules/reports/sales/filters";
import type { FeedbackItem } from "@/modules/reports/sales/types";

/** Customer / product feedback recorded by reps on orders. */

function orderScope(f: SalesReportFilters) {
  return {
    deletedAt: null,
    ...(f.rep ? { salesRepId: f.rep } : {}),
    ...(f.team === "none" ? { salesRep: { teamId: null } } : f.team ? { salesRep: { teamId: f.team } } : {}),
    ...(f.agent ? { agentId: f.agent } : {}),
    ...(f.state ? { customer: { state: f.state } } : {}),
  };
}

/** Feedback recorded during the period, newest first (bounded — one period). */
export async function getFeedbackForPeriod(
  p: Period,
  f: SalesReportFilters,
): Promise<{ items: FeedbackItem[]; counts: Record<string, number> }> {
  const rows = await prisma.customerFeedback.findMany({
    where: {
      createdAt: { gte: p.start, lt: p.end },
      ...(f.product ? { productId: f.product } : {}),
      order: orderScope(f),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      category: true,
      message: true,
      status: true,
      action: true,
      createdAt: true,
      product: { select: { name: true } },
      order: { select: { id: true, orderNumber: true, salesRep: { select: { name: true } } } },
    },
  });

  const grouped = await prisma.customerFeedback.groupBy({
    by: ["category"],
    where: {
      createdAt: { gte: p.start, lt: p.end },
      ...(f.product ? { productId: f.product } : {}),
      order: orderScope(f),
    },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const c of CUSTOMER_FEEDBACK_CATEGORIES) counts[c.value] = 0;
  for (const g of grouped) counts[g.category] = g._count._all;

  const order = new Map<string, number>(CUSTOMER_FEEDBACK_CATEGORIES.map((c, i) => [c.value, i]));
  const items: FeedbackItem[] = rows
    .map((r) => ({
      id: r.id,
      category: r.category,
      categoryLabel: customerFeedbackCategoryLabel(r.category),
      message: r.message,
      product: r.product?.name ?? null,
      orderId: r.order.id,
      orderNumber: r.order.orderNumber,
      rep: r.order.salesRep.name,
      status: r.status,
      action: r.action,
      createdAt: r.createdAt.toISOString(),
    }))
    .sort((a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99));

  return { items, counts };
}

export async function createCustomerFeedback(input: {
  orderId: string;
  authorId: string;
  category: CustomerFeedbackCategory;
  message: string;
  productId: string | null;
}): Promise<void> {
  await prisma.customerFeedback.create({ data: input });
}

export async function updateFeedbackStatus(
  id: string,
  status: CustomerFeedbackStatus,
  action: string | null,
): Promise<boolean> {
  const res = await prisma.customerFeedback.updateMany({ where: { id }, data: { status, action } });
  return res.count > 0;
}

export async function getOrderFeedback(orderId: string) {
  return prisma.customerFeedback.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      category: true,
      message: true,
      status: true,
      action: true,
      createdAt: true,
      product: { select: { name: true } },
      author: { select: { name: true } },
    },
  });
}
