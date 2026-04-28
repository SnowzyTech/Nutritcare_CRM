"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import bcryptjs from "bcryptjs";
import { getAgentIdByUserId } from "@/modules/delivery/services/delivery-agent-portal.service";

export async function updateAgentProfileAction(data: {
  name: string;
  phone: string;
  whatsappNumber: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const name = data.name.trim();
  if (!name || name.length < 2) return { error: "Name must be at least 2 characters" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone: data.phone.trim() || null,
      whatsappNumber: data.whatsappNumber.trim() || null,
    },
  });

  revalidatePath("/delivery-agents/profile");
  return { success: true };
}

export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!data.newPassword || data.newPassword.length < 8)
    return { error: "New password must be at least 8 characters" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) return { error: "User not found" };

  const valid = await bcryptjs.compare(data.currentPassword, user.password);
  if (!valid) return { error: "Current password is incorrect" };

  const hashed = await bcryptjs.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  return { success: true };
}

export async function markOrderFailedAction(orderId: string, failureReason: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) return { error: "Agent not found" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, agentId, deletedAt: null },
  });
  if (!order) return { error: "Order not found" };

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } }),
    prisma.delivery.updateMany({
      where: { orderId, agentId },
      data: { status: "FAILED", failureReason },
    }),
  ]);

  revalidatePath("/delivery-agents");
  revalidatePath(`/delivery-agents/${orderId}`);
  return { success: true };
}

export async function updateDeliveryFeeAction(orderId: string, fee: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) return { error: "Agent not found" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, agentId, deletedAt: null },
  });
  if (!order) return { error: "Order not found" };

  await prisma.order.update({
    where: { id: orderId },
    data: { deliveryFee: fee },
  });

  revalidatePath(`/delivery-agents/${orderId}`);
  return { success: true };
}

export async function rescheduleOrderAction(orderId: string, scheduledDate: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) return { error: "Agent not found" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, agentId, deletedAt: null },
  });
  if (!order) return { error: "Order not found" };

  await prisma.delivery.updateMany({
    where: { orderId, agentId },
    data: { scheduledTime: new Date(scheduledDate) },
  });

  revalidatePath("/delivery-agents");
  revalidatePath(`/delivery-agents/${orderId}`);
  return { success: true };
}
