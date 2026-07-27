"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { changeUserTeam } from "../services/users.service";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { suppressCameraForRequest } from "@/lib/audit/context";
import { prisma } from "@/lib/db/prisma";

type ActionResult = { success: true } | { error: string };

/**
 * Company Sales Manager moves a sales rep from one team to another — the same
 * capability the admin has (see changeTeamAction), gated to SALES_REP_MANAGER.
 * Passing null unassigns the rep from any team.
 */
export async function moveRepToTeamAction(
  userId: string,
  teamId: string | null
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SALES_REP_MANAGER") {
    return { error: "Unauthorized" };
  }
  suppressCameraForRequest();

  try {
    const rep = await prisma.user.findFirst({
      where: { id: userId, role: "SALES_REP" },
      select: { name: true },
    });
    if (!rep) return { error: "Sales rep not found" };

    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } });
      if (!team) return { error: "Team not found" };
    }

    await changeUserTeam(userId, teamId);

    await logActivity({
      userId: session.user.id,
      actorName: session.user.name,
      actorRole: session.user.role,
      action: "Updated",
      entityType: "User",
      entityId: userId,
      description: `Changed team for ${rep.name}`,
    });

    revalidatePath(`/sales-manager/${userId}`);
    revalidatePath("/sales-manager/teams");
    revalidatePath("/sales-manager");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to change team" };
  }
}
