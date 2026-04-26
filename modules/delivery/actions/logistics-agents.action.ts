"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { createDeliveryAgentWithUser } from "../services/create-delivery-agent.service";
import { createDriver } from "../services/create-driver.service";

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
}): Promise<AgentResult> {
  try {
    const user = await requireLogisticsAuth();
    const result = await createDeliveryAgentWithUser({ ...input, addedById: user.id });
    revalidatePath("/logistics/agents");
    return { success: true, data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create agent" };
  }
}

export async function createDriverAction(input: {
  name: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  address?: string;
  state?: string;
  country?: string;
  statesCovered?: string[];
}): Promise<DriverResult> {
  try {
    const user = await requireLogisticsAuth();
    const driver = await createDriver({ ...input, addedById: user.id });
    revalidatePath("/logistics/agents");
    return { success: true, driverId: driver.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create driver" };
  }
}
