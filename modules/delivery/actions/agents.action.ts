"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { updateAgentStatus, softDeleteAgent } from "../services/agents.service";
import { isAdmin } from "@/lib/auth/role-routes";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { suppressCameraForRequest } from "@/lib/audit/context";
import { prisma } from "@/lib/db/prisma";

type ActionResult = { success: true } | { error: string };

async function requireAdmin(): Promise<{ id: string; name?: string | null; role?: string }> {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return { id: session.user.id, name: session.user.name, role: session.user.role };
}

async function agentName(agentId: string): Promise<string> {
  const a = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { companyName: true },
  });
  return a?.companyName ?? agentId;
}

export async function suspendAgentAction(agentId: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await agentName(agentId);
    await updateAgentStatus(agentId, "INACTIVE");
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Suspended", entityType: "Agent", entityId: agentId,
      description: `Suspended delivery agent ${name}`,
    });
    revalidatePath(`/admin/staff/delivery-agent/${agentId}`);
    revalidatePath("/admin/staff/delivery-agent");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to suspend agent" };
  }
}

export async function activateAgentAction(agentId: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await agentName(agentId);
    await updateAgentStatus(agentId, "ACTIVE");
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Activated", entityType: "Agent", entityId: agentId,
      description: `Activated delivery agent ${name}`,
    });
    revalidatePath(`/admin/staff/delivery-agent/${agentId}`);
    revalidatePath("/admin/staff/delivery-agent");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to activate agent" };
  }
}

export async function deleteAgentAction(agentId: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await agentName(agentId);
    await softDeleteAgent(agentId);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Deleted", entityType: "Agent", entityId: agentId,
      description: `Deleted delivery agent ${name}`,
    });
    revalidatePath("/admin/staff/delivery-agent");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete agent" };
  }
}
