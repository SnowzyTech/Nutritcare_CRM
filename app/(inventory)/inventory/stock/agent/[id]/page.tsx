import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import AgentDetailClient from "./agent-detail-client";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await prisma.agent.findFirst({
    where: { id, deletedAt: null },
    include: { addedBy: true },
  });
  if (!agent) notFound();
  return <AgentDetailClient agent={agent} />;
}
