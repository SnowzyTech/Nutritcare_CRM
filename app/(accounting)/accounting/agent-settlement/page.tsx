import { AgentSettlementClient } from "../_components/AgentSettlementClient";
import {
  listAgentSettlements,
  listAgentLedger,
  listAgentsForSelect,
} from "@/modules/finance/services/agent-settlement.service";

export default async function AgentSettlementPage() {
  const [settlements, ledger, agents] = await Promise.all([
    listAgentSettlements(),
    listAgentLedger(),
    listAgentsForSelect(),
  ]);
  return (
    <AgentSettlementClient
      initialSettlements={settlements}
      initialLedger={ledger}
      agentOptions={agents}
    />
  );
}
