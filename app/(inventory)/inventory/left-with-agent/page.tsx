import React from "react";
import { getAgentsWithStock } from "@/modules/inventory/services/inventory.service";
import { LeftWithAgentClient } from "./left-with-agent-client";

export default async function StockLeftWithAgentPage() {
  const agents = await getAgentsWithStock();
  return <LeftWithAgentClient agents={agents} />;
}
