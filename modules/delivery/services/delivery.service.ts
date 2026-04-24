import { prisma } from "@/lib/db/prisma";
import type { AgentStatus } from "@prisma/client";

export async function getAvailableAgents() {
  return prisma.agent.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: { id: true, companyName: true, state: true, phone1: true },
  });
}

export async function getAllAgents() {
  return prisma.agent.findMany({
    where: { deletedAt: null },
    select: { id: true, companyName: true, state: true, status: true, phone1: true },
  });
}

export async function setAgentStatus(agentId: string, status: AgentStatus) {
  return prisma.agent.update({ where: { id: agentId }, data: { status } });
}
