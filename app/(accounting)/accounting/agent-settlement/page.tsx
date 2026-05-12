import { AgentSettlementClient } from "../_components/AgentSettlementClient";
import {
  listDeliveryAgentsWithStats,
  listAgentLedger,
  listAgentsForSelect,
} from "@/modules/finance/services/agent-settlement.service";

export default async function AgentSettlementPage() {
  const [deliveryAgents, ledger, agents] = await Promise.all([
    listDeliveryAgentsWithStats(),
    listAgentLedger(),
    listAgentsForSelect(),
  ]);
  return (
    <AgentSettlementClient
      initialAgents={deliveryAgents}
      initialLedger={ledger}
      agentOptions={agents}
    />
  );
}
