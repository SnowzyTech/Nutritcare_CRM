"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { updateAgentStatus, softDeleteAgent } from "../services/agents.service";

type ActionResult = { success: true } | { error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function suspendAgentAction(agentId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateAgentStatus(agentId, "INACTIVE");
    revalidatePath(`/admin/staff/delivery-agent/${agentId}`);
    revalidatePath("/admin/staff/delivery-agent");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to suspend agent" };
  }
}

export async function activateAgentAction(agentId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateAgentStatus(agentId, "ACTIVE");
    revalidatePath(`/admin/staff/delivery-agent/${agentId}`);
    revalidatePath("/admin/staff/delivery-agent");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to activate agent" };
  }
}

export async function deleteAgentAction(agentId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await softDeleteAgent(agentId);
    revalidatePath("/admin/staff/delivery-agent");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete agent" };
  }
}
