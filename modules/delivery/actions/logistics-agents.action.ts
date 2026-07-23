"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDeliveryAgentWithUser } from "../services/create-delivery-agent.service";
import { createDriver, softDeleteDriver } from "../services/create-driver.service";
import { softDeleteAgent } from "../services/agents.service";
import { isUserTeamLead } from "@/modules/users/services/users.service";

type AgentResult =
  | { success: true; data: { agentId: string; userId: string; name: string; email: string; tempPassword: string } }
  | { error: string };

type DriverResult = { success: true; driverId: string } | { error: string };

async function requireLogisticsAuth() {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "LOGISTICS_MANAGER" && session.user.role !== "ADMIN")
  ) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// Adding/removing drivers/agents is restricted to the Head Logistics Manager
// (Admin always retains override access, matching every other admin-gated
// action in this app).
async function requireHeadLogisticsAuth() {
  const user = await requireLogisticsAuth();
  if (user.role === "ADMIN") return user;
  const isHead = await isUserTeamLead(user.id);
  if (!isHead) {
    throw new Error("Only the Head Logistics Manager can manage drivers or delivery agents");
  }
  return user;
}

export async function createAgentAction(input: {
  name: string;
  email: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  address?: string;
  state?: string;
  country?: string;
  statesCovered?: string[];
  picksFromOfficeStock?: boolean;
  deliveryFee?: number;
}): Promise<AgentResult> {
  try {
    const user = await requireHeadLogisticsAuth();
    const result = await createDeliveryAgentWithUser({ ...input, addedById: user.id });
    revalidatePath("/logistics/agents");
    return { success: true, data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create agent" };
  }
}

export async function deleteAgentLogisticsAction(agentId: string): Promise<{ error: string } | never> {
  try {
    await requireHeadLogisticsAuth();
    await softDeleteAgent(agentId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete agent" };
  }
  revalidatePath("/logistics/agents");
  redirect("/logistics/agents");
}

export async function createDriverAction(input: {
  name: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  address?: string;
  state?: string;
  country?: string;
  vehicleNo?: string;
}): Promise<DriverResult> {
  try {
    const user = await requireHeadLogisticsAuth();
    const driver = await createDriver({ ...input, addedById: user.id });
    revalidatePath("/logistics/agents");
    return { success: true, driverId: driver.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create driver" };
  }
}

export async function deleteDriverAction(driverId: string): Promise<{ error: string } | never> {
  try {
    await requireHeadLogisticsAuth();
    await softDeleteDriver(driverId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete driver" };
  }
  revalidatePath("/logistics/agents");
  redirect("/logistics/agents");
}
