import { notFound } from "next/navigation";
import { getAgentPageData } from "@/modules/finance/services/agent-settlement.service";
import { AgentDetailClient } from "./AgentDetailClient";

export default async function AgentDetailsPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const data = await getAgentPageData(agentId);
  if (!data) return notFound();
  return <AgentDetailClient {...data} agentId={agentId} />;
}
