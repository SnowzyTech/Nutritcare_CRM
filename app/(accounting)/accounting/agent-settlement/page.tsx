import { Suspense } from "react";
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
    // AgentSettlementClient reads ?tab= / prefill params via useSearchParams,
    // which must sit under a Suspense boundary.
    <Suspense>
      <AgentSettlementClient
        initialAgents={deliveryAgents}
        initialLedger={ledger}
        agentOptions={agents}
      />
    </Suspense>
  );
}
