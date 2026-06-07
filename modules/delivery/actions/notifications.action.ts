"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function markNotificationReadAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Scope the update to the current user so one user can't mark another's.
  await prisma.notification.updateMany({
    where: { id, recipientId: session.user.id },
    data: { isRead: true },
  });

  revalidatePath("/delivery-agents/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { recipientId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/delivery-agents/notifications");
  return { ok: true };
}
