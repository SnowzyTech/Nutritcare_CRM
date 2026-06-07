import { getDeliveryAgentsList } from "@/modules/delivery/services/agents.service";
import { getDriversList } from "@/modules/delivery/services/create-driver.service";
import AgentsListClient from "./agents-list-client";

export default async function AgentsPage() {
  const [agents, drivers] = await Promise.all([
    getDeliveryAgentsList(),
    getDriversList(),
  ]);

  return <AgentsListClient agents={agents} drivers={drivers} />;
}
