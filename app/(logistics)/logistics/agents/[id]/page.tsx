import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getDeliveryAgentById } from "@/modules/delivery/services/agents.service";
import { isUserTeamLead } from "@/modules/users/services/users.service";
import AgentDetailClient from "./agent-detail-client";

export default async function AgentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [agent, session] = await Promise.all([getDeliveryAgentById(id), auth()]);

  if (!agent) notFound();

  const isAdmin = session?.user?.role === "ADMIN";
  const isHead = isAdmin || (session?.user?.id ? await isUserTeamLead(session.user.id) : false);

  return <AgentDetailClient agent={agent} canManageStaff={isHead} />;
}
