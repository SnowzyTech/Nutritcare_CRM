import { notFound } from "next/navigation";
import { getDeliveryAgentById } from "@/modules/delivery/services/agents.service";
import AgentDetailClient from "./agent-detail-client";

export default async function AgentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getDeliveryAgentById(id);

  if (!agent) notFound();

  return <AgentDetailClient agent={agent} />;
}
