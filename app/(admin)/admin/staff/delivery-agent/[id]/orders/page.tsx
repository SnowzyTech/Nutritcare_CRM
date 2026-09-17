import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDeliveryAgentById } from "@/modules/delivery/services/agents.service";
import { getAdminOrdersPage, type AdminOrderFilters } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { AdminOrdersClient } from "../../../../orders/orders-client";
import type { OrderStatus } from "@prisma/client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;
const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "FAILED"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const agent = await getDeliveryAgentById(id);
  return { title: agent ? `${agent.companyName} — Orders` : "Orders" };
}

export default async function DeliveryAgentOrdersPage({ params, searchParams }: Props) {
  const { id } = await params;
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

  const [agent, orderPage, rawProducts] = await Promise.all([
    getDeliveryAgentById(id),
    getAdminOrdersPage(filters, pageNum, PAGE_SIZE, { agentId: id }),
    getActiveProducts(),
  ]);

  if (!agent) notFound();

  const products = rawProducts.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="max-w-[1400px] mx-auto">
      <Link
        href={`/admin/staff/delivery-agent/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 mb-6 transition-colors group no-underline"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Profile</span>
      </Link>

      <div className="flex justify-between items-baseline mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{agent.companyName}&apos;s Orders</h1>
        <span className="text-base text-gray-400">Delivery Agent</span>
      </div>

      <AdminOrdersClient
        orders={orderPage.rows}
        total={orderPage.total}
        statusCounts={orderPage.statusCounts}
        page={pageNum}
        products={products}
        initialFilters={{
          status: filters.status ?? "",
          search: filters.search ?? "",
          product: filters.productName ?? "",
          state: filters.state ?? "",
          team: filters.teamId ?? "",
          date: filters.date ?? "",
        }}
      />
    </div>
  );
}
