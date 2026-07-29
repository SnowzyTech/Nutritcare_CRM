import type { getAgentsForReassignment } from "@/modules/delivery/services/agents.service";

type RawAgents = Awaited<ReturnType<typeof getAgentsForReassignment>>;

/**
 * Shapes the raw active-agent rows into the option list the reassign modal
 * expects (flattening `_count` and normalising the phone field).
 */
export function mapAgentsForReassignment(rawAgents: RawAgents) {
  return rawAgents.map((a) => ({
    id: a.id,
    companyName: a.companyName,
    state: a.state ?? null,
    phone: a.phone1,
    activeOrders: a._count.orders,
    totalDeliveries: a._count.deliveries,
  }));
}
