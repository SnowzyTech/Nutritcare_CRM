"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import {
  CUSTOMER_FEEDBACK_CATEGORY_VALUES,
  CUSTOMER_FEEDBACK_MESSAGE_MAX,
} from "@/lib/orders/customer-feedback";
import { FOLLOW_UP_STAGE_VALUES } from "@/lib/orders/follow-up";
import { createCustomerFeedback } from "@/modules/reports/sales/services/feedback.service";
import { markFollowUpDone } from "@/modules/reports/sales/services/follow-up.service";

/**
 * What a sales rep records for reporting: customer / product feedback on an
 * order, and completed post-delivery follow-ups. A rep may only write to their
 * own orders (same ownership rule as orders.action.ts `getOwnedOrder`).
 */

type Result = { ok: true } | { ok: false; error: string };

async function ownedOrder(orderId: string): Promise<{ userId: string; order: { id: string; status: string; items: { productId: string }[] } } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const order = await prisma.order.findFirst({
    where: { id: orderId, salesRepId: session.user.id, deletedAt: null },
    select: { id: true, status: true, items: { select: { productId: true } } },
  });
  return order ? { userId: session.user.id, order } : null;
}

const feedbackSchema = z.object({
  orderId: z.string().min(1).max(64),
  category: z.enum(CUSTOMER_FEEDBACK_CATEGORY_VALUES),
  message: z.string().trim().min(2, "Write what the customer said.").max(CUSTOMER_FEEDBACK_MESSAGE_MAX),
  productId: z.string().min(1).max(64).nullable().optional(),
});

export async function logCustomerFeedbackAction(input: unknown): Promise<Result> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid feedback." };
  const owned = await ownedOrder(parsed.data.orderId);
  if (!owned) return { ok: false, error: "Order not found." };

  // A product, if given, must be one on this order.
  const productId = parsed.data.productId ?? null;
  if (productId && !owned.order.items.some((i) => i.productId === productId)) {
    return { ok: false, error: "That product is not on this order." };
  }

  await createCustomerFeedback({
    orderId: owned.order.id,
    authorId: owned.userId,
    category: parsed.data.category,
    message: parsed.data.message,
    productId,
  });
  revalidatePath(`/sales-rep/orders/${owned.order.id}`);
  return { ok: true };
}

const followUpSchema = z.object({
  orderId: z.string().min(1).max(64),
  stage: z.enum(FOLLOW_UP_STAGE_VALUES),
  note: z.string().trim().max(500).optional(),
});

export async function markFollowUpDoneAction(input: unknown): Promise<Result> {
  const parsed = followUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid follow-up." };
  const owned = await ownedOrder(parsed.data.orderId);
  if (!owned) return { ok: false, error: "Order not found." };
  if (owned.order.status !== "DELIVERED") return { ok: false, error: "Follow-ups apply to delivered orders." };

  await markFollowUpDone(owned.order.id, parsed.data.stage, owned.userId, parsed.data.note || null);
  revalidatePath("/sales-rep/follow-ups");
  revalidatePath(`/sales-rep/orders/${owned.order.id}`);
  return { ok: true };
}
