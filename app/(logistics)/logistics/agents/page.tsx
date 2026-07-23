import { auth } from "@/lib/auth/auth";
import { getDeliveryAgentsList } from "@/modules/delivery/services/agents.service";
import { getDriversList } from "@/modules/delivery/services/create-driver.service";
import { isUserTeamLead } from "@/modules/users/services/users.service";
import AgentsListClient from "./agents-list-client";

export default async function AgentsPage() {
  const session = await auth();
  const [agents, drivers, isHead] = await Promise.all([
    getDeliveryAgentsList(),
    getDriversList(),
    session?.user?.id
      ? session.user.role === "ADMIN"
        ? Promise.resolve(true)
        : isUserTeamLead(session.user.id)
      : Promise.resolve(false),
  ]);

  return <AgentsListClient agents={agents} drivers={drivers} canAddStaff={isHead} />;
}
