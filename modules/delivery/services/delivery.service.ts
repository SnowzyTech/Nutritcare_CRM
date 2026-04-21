import { prisma } from "@/lib/db/prisma";

/**
 * Delivery service — business logic for delivery agent management.
 */

export async function getAvailableAgents() {
  return prisma.deliveryAgent.findMany({
    where: { isAvailable: true },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function getAllAgents() {
  return prisma.deliveryAgent.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function setAgentAvailability(agentId: string, available: boolean) {
  return prisma.deliveryAgent.update({
    where: { id: agentId },
    data: { isAvailable: available },
  });
}
