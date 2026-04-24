import type { Metadata } from "next";
import { getDeliveryAgentsList } from "@/modules/delivery/services/agents.service";
import DeliveryAgentListClient from "./delivery-agent-list-client";

export const metadata: Metadata = { title: "Delivery Agents" };

export default async function DeliveryAgentPage() {
  const agents = await getDeliveryAgentsList();
  return <DeliveryAgentListClient agents={agents} />;
}
