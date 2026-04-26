import { getDeliveryAgentsList } from "@/modules/delivery/services/agents.service";
import AgentsListClient from "./agents-list-client";

export default async function AgentsPage() {
  const all = await getDeliveryAgentsList();

  // Agents have a linked User account; drivers do not
  const agents = all.filter((a) => a.user !== null);
  const drivers = all.filter((a) => a.user === null);

  return <AgentsListClient agents={agents} drivers={drivers} />;
}
