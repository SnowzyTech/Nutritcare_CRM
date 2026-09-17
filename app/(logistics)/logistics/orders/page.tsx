import { getLogisticsOrdersPage, type LogisticsOrderFilters } from "@/modules/delivery/services/logistics-orders.service";
import { LogisticsOrdersClient } from "./orders-client";
import type { OrderStatus } from "@prisma/client";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 15;
const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "FAILED"];

export default async function LogisticsOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string): string | undefined =>
    Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined);

  const statusRaw = get("status") ?? "";
  const filters: LogisticsOrderFilters = {
    status: STATUSES.includes(statusRaw as OrderStatus) ? (statusRaw as OrderStatus) : undefined,
    search: (get("q") ?? "").trim(),
  };
  const pageNum = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);

  const orderPage = await getLogisticsOrdersPage(filters, pageNum, PAGE_SIZE);

  return (
    <LogisticsOrdersClient
      orders={orderPage.rows}
      statusCounts={orderPage.statusCounts}
      total={orderPage.total}
      page={pageNum}
      initialFilters={{ status: filters.status ?? "", search: filters.search ?? "" }}
    />
  );
}
