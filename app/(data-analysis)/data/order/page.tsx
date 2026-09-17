import { OrdersClient } from "../_components/OrdersClient";
import {
  getOrdersPage,
  getDeliveryAgents,
  getSalesRepsForFilter,
  getSalesTeams,
  getProductsForFilter,
  type OrderListFilters,
} from "@/modules/data-analysis/services/data-analysis.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { getManualOrderProductForms } from "@/modules/orders/services/form-packages.service";
import { auth } from "@/lib/auth/auth";
import type { OrderStatus } from "@prisma/client";

const PAGE_SIZE = 15;

// The UI uses display labels ("Pending"); the DB uses the OrderStatus enum.
const STATUS_LABEL_TO_ENUM: Record<string, OrderStatus> = {
  Pending: "PENDING",
  Confirmed: "CONFIRMED",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
  Failed: "FAILED",
};

/** Split a comma-separated URL param into a clean string[]. */
function csv(v: string | undefined): string[] {
  return (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

/** "YYYY-MM-DD" → Date at start/end of that local day. */
function parseDay(s: string | null, endOfDay: boolean): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
}

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string): string | undefined =>
    Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined);

  // Parse the URL into the filter set + page (the client mirrors these into its
  // controls; the server does the actual filtering + pagination in the DB).
  const statusLabels = csv(get("status"));
  const products = csv(get("product"));
  const states = csv(get("state"));
  const teams = csv(get("team"));
  const agents = csv(get("agent"));
  const csAgents = csv(get("rep"));
  const search = (get("q") ?? "").trim();
  const fromStr = get("from") ?? null;
  const toStr = get("to") ?? null;
  const pageNum = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);

  const filters: OrderListFilters = {
    status: statusLabels
      .map((l) => STATUS_LABEL_TO_ENUM[l])
      .filter((s): s is OrderStatus => Boolean(s)),
    search,
    productNames: products,
    states,
    teamIds: teams,
    agentIds: agents,
    salesRepIds: csAgents,
    from: parseDay(fromStr, false),
    to: parseDay(toStr, true),
  };

  const [session, orderPage, deliveryAgents, salesReps, salesTeams, productNames, catalog, productForms] =
    await Promise.all([
      auth(),
      getOrdersPage(filters, pageNum, PAGE_SIZE),
      getDeliveryAgents(),
      getSalesRepsForFilter(),
      getSalesTeams(),
      getProductsForFilter(),
      // Catalog + per-form package tiers for the manual "Add Order" modal.
      getActiveProducts(),
      getManualOrderProductForms(),
    ]);

  const catalogProducts = catalog.map((p) => ({ id: p.id, name: p.name }));

  return (
    <OrdersClient
      initialOrders={orderPage.rows}
      total={orderPage.total}
      statusCounts={orderPage.statusCounts}
      page={pageNum}
      initialFilters={{
        statuses: statusLabels,
        search,
        products,
        states,
        teams,
        agents,
        csAgents,
        from: fromStr,
        to: toStr,
      }}
      deliveryAgents={deliveryAgents}
      salesReps={salesReps}
      teams={salesTeams}
      products={productNames}
      catalogProducts={catalogProducts}
      productForms={productForms}
      userName={session?.user?.name ?? null}
    />
  );
}
