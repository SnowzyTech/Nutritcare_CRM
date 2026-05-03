import React from "react";
import { getStockLeftWithAgents } from "@/modules/inventory/services/inventory.service";
import { LeftWithAgentClient } from "./left-with-agent-client";

export default async function StockLeftWithAgentPage() {
  const rows = await getStockLeftWithAgents();
  return <LeftWithAgentClient initialRows={rows} />;
}
