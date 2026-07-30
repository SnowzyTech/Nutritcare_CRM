import type { Metadata } from "next";
import { getDeliveryAgentOverview } from "@/modules/delivery/services/agents.service";
import { parseDateRangeParams, datePeriodLabel } from "@/lib/date-period";
import DeliveryAgentOverviewClient from "./delivery-agent-overview-client";

export const metadata: Metadata = { title: "Delivery Agents — Overview" };

type Props = {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
};

export default async function DeliveryAgentOverviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const period = parseDateRangeParams(sp);
  const rows = await getDeliveryAgentOverview(period);

  return (
    <DeliveryAgentOverviewClient rows={rows} periodLabel={datePeriodLabel(period)} />
  );
}
