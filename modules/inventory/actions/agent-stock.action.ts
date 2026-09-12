"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/lib/auth/role-routes";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { suppressCameraForRequest } from "@/lib/audit/context";
import { getAgentProductStocks } from "@/modules/warehouse/services/warehouse.service";
import {
  getAgentCommittedQuantities,
  applyAgentStockCorrection,
} from "@/modules/inventory/services/agent-stock-adjustment.service";

/**
 * Agent stock correction actions (maker–checker).
 *
 * Inventory Manager or Admin may correct an agent's on-hand count to reality
 * (e.g. CRM-transition reconciliation). The operator enters the CORRECT ABSOLUTE
 * quantity. An inventory manager's correction is saved PENDING_APPROVAL (admins
 * notified) and only changes stock once an admin approves; an admin's own applies
 * immediately. Every path is audited; corrections can never drop stock below what
 * is already committed to the agent's confirmed orders.
 */

function generateRefNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ASA-${ts}-${rand}`;
}

async function requireOperator() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = session.user.role;
  if (role !== "INVENTORY_MANAGER" && !isAdmin(role)) return null;
  return session.user;
}

function revalidate() {
  revalidatePath("/inventory/agent-stock");
  revalidatePath("/admin/inventory/agent-stock");
}

// ── Read: an agent's per-product stock + committed, for the correction form ────

export type AgentStockCorrectionRow = {
  productId: string;
  productName: string;
  productSku: string;
  currentQty: number;
  committed: number;
};

export async function getAgentStocksForCorrectionAction(
  agentId: string,
): Promise<AgentStockCorrectionRow[]> {
  const operator = await requireOperator();
  if (!operator || !agentId) return [];

  const stocks = await getAgentProductStocks(agentId);
  const committed = await getAgentCommittedQuantities(
    agentId,
    stocks.map((s) => s.productId),
  );
  return stocks.map((s) => ({
    productId: s.productId,
    productName: s.productName,
    productSku: s.productSku,
    currentQty: s.availableQty,
    committed: committed[s.productId] ?? 0,
  }));
}

// ── Create a correction (IM → pending; Admin → applied immediately) ────────────

const CreateSchema = z.object({
  agentId: z.string().min(1, "Select an agent."),
  reason: z.string().trim().min(1, "A reason is required."),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantityAfter: z.number().int().min(0, "Quantity must be 0 or more."),
      }),
    )
    .min(1, "Add at least one product."),
});

export async function createAgentStockCorrectionAction(
  input: z.input<typeof CreateSchema>,
): Promise<{ error?: string; ok?: true; pending?: boolean; warning?: string }> {
  const operator = await requireOperator();
  if (!operator) return { error: "You are not allowed to perform this action." };
  suppressCameraForRequest();

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { agentId, reason, items } = parsed.data;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, deletedAt: null },
    select: { id: true, companyName: true },
  });
  if (!agent) return { error: "Agent not found." };

  const productIds = [...new Set(items.map((i) => i.productId))];

  // Current on-hand (before) per product, and units committed to confirmed orders.
  const [stockRows, committed, products] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { locationKind: "AGENT", locationId: agentId, productId: { in: productIds } },
      select: { productId: true, quantity: true },
    }),
    getAgentCommittedQuantities(agentId, productIds),
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
  ]);
  const beforeMap = new Map(stockRows.map((r) => [r.productId, r.quantity]));
  const nameMap = new Map(products.map((p) => [p.id, p.name]));

  if (products.length !== productIds.length) {
    return { error: "One or more products are unavailable." };
  }

  // Keep only real changes. Setting a quantity BELOW what is committed is allowed:
  // an agent can legitimately be over-booked now that assignment no longer blocks
  // on free stock, and refusing here would make this tool unusable for exactly the
  // agents that need correcting. The zero floor is enforced where it matters - at
  // delivery, by `deliverOrder`. So warn, do not block.
  const changed: { productId: string; quantityBefore: number; quantityAfter: number }[] = [];
  const overbooked: string[] = [];
  for (const it of items) {
    const before = beforeMap.get(it.productId) ?? 0;
    if (it.quantityAfter === before) continue;
    const committedQty = committed[it.productId] ?? 0;
    if (it.quantityAfter < committedQty) {
      overbooked.push(
        `${nameMap.get(it.productId)} (setting ${it.quantityAfter}, ${committedQty} committed)`,
      );
    }
    changed.push({ productId: it.productId, quantityBefore: before, quantityAfter: it.quantityAfter });
  }
  if (changed.length === 0) return { error: "No changes to apply." };

  const warning =
    overbooked.length > 0
      ? `This leaves ${agent.companyName} short of their confirmed orders: ${overbooked.join("; ")}. Those deliveries will be refused until the agent is restocked.`
      : undefined;

  const applyNow = isAdmin(operator.role);
  const referenceNumber = generateRefNumber();

  const summary = changed
    .map((c) => `${nameMap.get(c.productId)} ${c.quantityBefore}→${c.quantityAfter}`)
    .join(", ");

  if (applyNow) {
    const created = await prisma.$transaction(async (tx) => {
      const adj = await tx.agentStockAdjustment.create({
        data: {
          referenceNumber,
          agentId,
          reason,
          status: "RECORDED",
          date: new Date(),
          createdById: operator.id,
          approvedById: operator.id,
          items: { create: changed },
        },
      });
      await applyAgentStockCorrection(tx, agentId, changed);
      return adj;
    });

    await logActivity({
      userId: operator.id,
      actorName: operator.name,
      actorRole: operator.role,
      action: "Adjustment",
      entityType: "AgentStockAdjustment",
      entityId: created.id,
      description: `Agent stock corrected for ${agent.companyName} (${referenceNumber}): ${summary}`,
      details: { before: reason, field: "agentStock" },
    });
    revalidate();
    return { ok: true, pending: false, ...(warning ? { warning } : {}) };
  }

  // Inventory manager → needs admin approval; stock unchanged for now.
  const created = await prisma.agentStockAdjustment.create({
    data: {
      referenceNumber,
      agentId,
      reason,
      status: "PENDING_APPROVAL",
      date: new Date(),
      createdById: operator.id,
      items: { create: changed },
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        recipientId: a.id,
        title: "Agent Stock Correction Pending Approval",
        message: `${operator.name} submitted a stock correction for ${agent.companyName} (${referenceNumber}): ${summary}. Awaiting your approval.`,
        type: "agent_stock_correction_approval",
        link: `/admin/inventory/agent-stock`,
        entityType: "AgentStockAdjustment",
        entityId: created.id,
      })),
    });
  }

  await logActivity({
    userId: operator.id,
    actorName: operator.name,
    actorRole: operator.role,
    action: "Adjustment",
    entityType: "AgentStockAdjustment",
    entityId: created.id,
    description: `Agent stock correction ${referenceNumber} submitted for approval — ${agent.companyName}: ${summary}`,
  });
  revalidate();
  return { ok: true, pending: true, ...(warning ? { warning } : {}) };
}

// ── Approve (Admin only) ───────────────────────────────────────────────────────

export async function approveAgentStockCorrectionAction(
  id: string,
): Promise<{ error?: string; ok?: true; warning?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!isAdmin(session.user.role)) return { error: "Only admins can approve corrections." };
  suppressCameraForRequest();

  const adj = await prisma.agentStockAdjustment.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!adj) return { error: "Correction not found." };
  if (adj.status !== "PENDING_APPROVAL") return { error: "This correction is not pending approval." };

  // Re-read commitments against CURRENT confirmed orders (time has passed). This is
  // a warning, not a block: over-booking an agent is legal, and the delivery gate
  // is what actually keeps the balance off negative.
  const committed = await getAgentCommittedQuantities(
    adj.agentId,
    adj.items.map((i) => i.productId),
  );
  const products = await prisma.product.findMany({
    where: { id: { in: adj.items.map((i) => i.productId) } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(products.map((p) => [p.id, p.name]));
  const overbooked = adj.items
    .filter((it) => it.quantityAfter < (committed[it.productId] ?? 0))
    .map(
      (it) =>
        `${nameMap.get(it.productId)} (setting ${it.quantityAfter}, ${committed[it.productId] ?? 0} committed)`,
    );
  const warning =
    overbooked.length > 0
      ? `Approved, but this leaves the agent short of their confirmed orders: ${overbooked.join("; ")}. Those deliveries will be refused until the agent is restocked.`
      : undefined;

  await prisma.$transaction(async (tx) => {
    await tx.agentStockAdjustment.update({
      where: { id },
      data: { status: "RECORDED", approvedById: session.user.id },
    });
    await applyAgentStockCorrection(
      tx,
      adj.agentId,
      adj.items.map((i) => ({ productId: i.productId, quantityAfter: i.quantityAfter })),
    );
  });

  await prisma.notification.create({
    data: {
      recipientId: adj.createdById,
      title: "Agent Stock Correction Approved",
      message: `Your agent stock correction ${adj.referenceNumber} was approved and the stock has been updated.`,
      type: "agent_stock_correction_approved",
      link: `/inventory/agent-stock`,
      entityType: "AgentStockAdjustment",
      entityId: adj.id,
    },
  });
  await logActivity({
    userId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: "Approved",
    entityType: "AgentStockAdjustment",
    entityId: adj.id,
    description: `Approved agent stock correction ${adj.referenceNumber}`,
  });
  revalidate();
  return { ok: true, ...(warning ? { warning } : {}) };
}

// ── Reject (Admin only) ────────────────────────────────────────────────────────

export async function rejectAgentStockCorrectionAction(
  id: string,
  reason: string,
): Promise<{ error?: string; ok?: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!isAdmin(session.user.role)) return { error: "Only admins can reject corrections." };
  suppressCameraForRequest();

  const adj = await prisma.agentStockAdjustment.findUnique({
    where: { id },
    select: { id: true, status: true, referenceNumber: true, createdById: true },
  });
  if (!adj) return { error: "Correction not found." };
  if (adj.status !== "PENDING_APPROVAL") return { error: "This correction is not pending approval." };

  await prisma.agentStockAdjustment.update({
    where: { id },
    data: { status: "REJECTED", notes: reason.trim() || null },
  });

  await prisma.notification.create({
    data: {
      recipientId: adj.createdById,
      title: "Agent Stock Correction Rejected",
      message: `Your agent stock correction ${adj.referenceNumber} was rejected${reason.trim() ? `: ${reason.trim()}` : "."}`,
      type: "agent_stock_correction_rejected",
      link: `/inventory/agent-stock`,
      entityType: "AgentStockAdjustment",
      entityId: adj.id,
    },
  });
  await logActivity({
    userId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: "Rejected",
    entityType: "AgentStockAdjustment",
    entityId: adj.id,
    description: `Rejected agent stock correction ${adj.referenceNumber}${reason.trim() ? `: ${reason.trim()}` : ""}`,
  });
  revalidate();
  return { ok: true };
}

// ── Reverse an applied correction (Admin only) ─────────────────────────────────

export async function reverseAgentStockCorrectionAction(
  id: string,
): Promise<{ error?: string; ok?: true; warning?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!isAdmin(session.user.role)) return { error: "Only admins can reverse corrections." };
  suppressCameraForRequest();

  const adj = await prisma.agentStockAdjustment.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!adj) return { error: "Correction not found." };
  if (adj.status !== "RECORDED") return { error: "Only an applied correction can be reversed." };

  // Reverting to `quantityBefore` may leave the agent short of what they have
  // promised. Flagged, not blocked - same reasoning as create/approve.
  const committed = await getAgentCommittedQuantities(
    adj.agentId,
    adj.items.map((i) => i.productId),
  );
  const products = await prisma.product.findMany({
    where: { id: { in: adj.items.map((i) => i.productId) } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(products.map((p) => [p.id, p.name]));
  const overbooked = adj.items
    .filter((it) => it.quantityBefore < (committed[it.productId] ?? 0))
    .map(
      (it) =>
        `${nameMap.get(it.productId)} (back to ${it.quantityBefore}, ${committed[it.productId] ?? 0} committed)`,
    );
  const warning =
    overbooked.length > 0
      ? `Reversed, but this leaves the agent short of their confirmed orders: ${overbooked.join("; ")}. Those deliveries will be refused until the agent is restocked.`
      : undefined;

  await prisma.$transaction(async (tx) => {
    await tx.agentStockAdjustment.update({ where: { id }, data: { status: "REVERSED" } });
    await applyAgentStockCorrection(
      tx,
      adj.agentId,
      adj.items.map((i) => ({ productId: i.productId, quantityAfter: i.quantityBefore })),
    );
  });

  await logActivity({
    userId: session.user.id,
    actorName: session.user.name,
    actorRole: session.user.role,
    action: "Updated",
    entityType: "AgentStockAdjustment",
    entityId: adj.id,
    description: `Reversed agent stock correction ${adj.referenceNumber} (restored previous quantities)`,
  });
  revalidate();
  return { ok: true, ...(warning ? { warning } : {}) };
}
