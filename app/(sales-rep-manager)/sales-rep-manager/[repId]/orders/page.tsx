import { notFound } from "next/navigation";
import { getSalesRepById } from "@/modules/users/services/users.service";
import { getTeamOrdersPage, type TeamOrderFilters } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { OrdersClient } from "./orders-client";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;
const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "FAILED"];

export default async function RepOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ repId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { repId } = await params;
  const sp = await searchParams;
  const get = (k: string): string | undefined =>
    Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined);

  const statusRaw = get("status") ?? "";
  const filters: TeamOrderFilters = {
    status: STATUSES.includes(statusRaw as OrderStatus) ? (statusRaw as OrderStatus) : undefined,
    search: (get("q") ?? "").trim(),
    productName: get("product") || undefined,
    agentState: get("state") || undefined,
    date: get("date") || undefined,
  };
  const pageNum = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);

  // Reuses the team-orders paged query scoped to this single rep.
  const [rep, orderPage, allProducts] = await Promise.all([
    getSalesRepById(repId),
    getTeamOrdersPage([repId], filters, pageNum, PAGE_SIZE),
    getActiveProducts(),
  ]);

  if (!rep) notFound();

  const products = allProducts.map((p) => p.name);

  return (
    <OrdersClient
      repId={repId}
      repName={rep.name}
      orders={orderPage.rows}
      total={orderPage.total}
      statusCounts={orderPage.statusCounts}
      page={pageNum}
      products={products}
      initialFilters={{
        status: filters.status ?? "",
        search: filters.search ?? "",
        product: filters.productName ?? "",
        state: filters.agentState ?? "",
        date: filters.date ?? "",
      }}
    />
  );
}
