import { getTeamOrdersPage, type TeamOrderFilters } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { getAllTeams } from "@/modules/users/services/users.service";
import { TeamOrdersClient } from "./team-orders-client";
import { resolveManagerScope } from "../_lib/manager-scope";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;
const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "FAILED"];

export default async function TeamOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string): string | undefined =>
    Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined);

  const { reps, isCompanyManager } = await resolveManagerScope();
  const memberIds = reps.map((m) => m.id);

  const statusRaw = get("status") ?? "";
  const filters: TeamOrderFilters = {
    status: STATUSES.includes(statusRaw as OrderStatus) ? (statusRaw as OrderStatus) : undefined,
    search: (get("q") ?? "").trim(),
    productName: get("product") || undefined,
    agentState: get("state") || undefined,
    teamId: get("team") || undefined,
    date: get("date") || undefined,
  };
  const pageNum = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);

  // The team filter is only meaningful for the company manager (orders span teams);
  // a team-lead sees a single team, so no filter. Derived from scope, not the
  // paginated orders, so it's complete regardless of the current page.
  const [orderPage, allProducts, allTeams] = await Promise.all([
    getTeamOrdersPage(memberIds, filters, pageNum, PAGE_SIZE),
    getActiveProducts(),
    isCompanyManager ? getAllTeams() : Promise.resolve([]),
  ]);

  const products = allProducts.map((p) => p.name);
  const teams = allTeams
    .map((t) => ({ id: t.id, name: t.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <TeamOrdersClient
      orders={orderPage.rows}
      total={orderPage.total}
      statusCounts={orderPage.statusCounts}
      page={pageNum}
      products={products}
      teams={teams}
      initialFilters={{
        status: filters.status ?? "",
        search: filters.search ?? "",
        product: filters.productName ?? "",
        state: filters.agentState ?? "",
        team: filters.teamId ?? "",
        date: filters.date ?? "",
      }}
    />
  );
}
