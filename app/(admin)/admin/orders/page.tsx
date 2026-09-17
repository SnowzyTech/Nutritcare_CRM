import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import {
  getAdminOrdersPage,
  type AdminOrderFilters,
} from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { getAllTeams } from "@/modules/users/services/users.service";
import { AdminOrdersClient } from "./orders-client";
import type { Metadata } from "next";
import type { OrderStatus } from "@prisma/client";

export const metadata: Metadata = { title: "All Orders" };

const PAGE_SIZE = 10;
const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "FAILED"];

export default async function AllOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const get = (k: string): string | undefined =>
    Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined);

  const statusRaw = get("status") ?? "";
  const filters: AdminOrderFilters = {
    status: STATUSES.includes(statusRaw as OrderStatus) ? (statusRaw as OrderStatus) : undefined,
    search: (get("q") ?? "").trim(),
    productName: get("product") || undefined,
    state: get("state") || undefined,
    teamId: get("team") || undefined,
    date: get("date") || undefined,
  };
  const pageNum = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);

  const [orderPage, rawProducts, rawTeams] = await Promise.all([
    getAdminOrdersPage(filters, pageNum, PAGE_SIZE),
    getActiveProducts(),
    getAllTeams(),
  ]);

  const products = rawProducts.map((p) => ({ id: p.id, name: p.name }));
  const teams = rawTeams.map((t) => ({ id: t.id, name: t.name }));

  return (
    <AdminOrdersClient
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
        state: filters.state ?? "",
        team: filters.teamId ?? "",
        date: filters.date ?? "",
      }}
    />
  );
}
