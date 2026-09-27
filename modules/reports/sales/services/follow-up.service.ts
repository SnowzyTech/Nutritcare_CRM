import { prisma } from "@/lib/db/prisma";
import { lagosDaysBetween, periodContaining } from "@/lib/lagos-time";
import {
  FOLLOW_UP_OVERDUE_WINDOW_DAYS,
  FOLLOW_UP_STAGES,
  type FollowUpStage,
} from "@/lib/orders/follow-up";

/**
 * Customer journey follow-ups for a rep: Day 1 / 2 / 4 / 7 after delivery.
 * Scoped to one rep's recently delivered orders — a small, bounded set.
 */

export type RepFollowUp = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  products: string;
  deliveredAt: string;
  stage: FollowUpStage;
  stageLabel: string;
  action: string;
  /** 0 = due today; > 0 = days overdue. */
  daysLate: number;
};

const MAX_STAGE_DAY = Math.max(...FOLLOW_UP_STAGES.map((s) => s.day));

export async function getRepFollowUps(repId: string, now: Date = new Date()): Promise<RepFollowUp[]> {
  const today = periodContaining("DAY", now);
  const lookbackDays = MAX_STAGE_DAY + FOLLOW_UP_OVERDUE_WINDOW_DAYS + 1;
  const since = new Date(today.start.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      salesRepId: repId,
      status: "DELIVERED",
      deletedAt: null,
      deliveries: { some: { deliveredTime: { gte: since } } },
    },
    select: {
      id: true,
      orderNumber: true,
      customer: { select: { name: true, phone: true } },
      items: { select: { quantity: true, product: { select: { name: true } } } },
      deliveries: { select: { deliveredTime: true }, orderBy: { deliveredTime: "desc" }, take: 1 },
      followUps: { select: { stage: true } },
    },
    take: 500,
  });

  const out: RepFollowUp[] = [];
  for (const o of orders) {
    const deliveredAt = o.deliveries[0]?.deliveredTime;
    if (!deliveredAt) continue;
    const done = new Set(o.followUps.map((fu) => fu.stage));
    const age = lagosDaysBetween(deliveredAt, today.start);
    for (const stage of FOLLOW_UP_STAGES) {
      const daysLate = age - stage.day;
      if (daysLate < 0 || daysLate > FOLLOW_UP_OVERDUE_WINDOW_DAYS || done.has(stage.value)) continue;
      out.push({
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer.name,
        customerPhone: o.customer.phone,
        products: o.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", "),
        deliveredAt: deliveredAt.toISOString(),
        stage: stage.value,
        stageLabel: stage.label,
        action: stage.action,
        daysLate,
      });
    }
  }
  return out.sort((a, b) => a.daysLate - b.daysLate || a.stage.localeCompare(b.stage));
}

export async function markFollowUpDone(
  orderId: string,
  stage: FollowUpStage,
  userId: string,
  note: string | null,
): Promise<void> {
  await prisma.customerFollowUp.upsert({
    where: { orderId_stage: { orderId, stage } },
    create: { orderId, stage, completedById: userId, note },
    update: {},
  });
}

export async function getOrderFollowUps(orderId: string) {
  return prisma.customerFollowUp.findMany({
    where: { orderId },
    select: { stage: true, completedAt: true, note: true, completedBy: { select: { name: true } } },
  });
}
