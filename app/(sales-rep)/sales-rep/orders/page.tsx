import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSalesRepOrdersPage, type AdminOrderFilters } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { getManualOrderProductForms } from "@/modules/orders/services/form-packages.service";
import { OrdersClient } from "./orders-client";
import type { Metadata } from "next";
import type { OrderStatus } from "@prisma/client";
import { NO_FEEDBACK_FILTER, isOrderFeedbackOutcome } from "@/lib/orders/order-feedback";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 15;
const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED", "FAILED"];

export default async function OrdersPage({
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
  const feedbackRaw = get("feedback") ?? "";
  const feedback =
    feedbackRaw === NO_FEEDBACK_FILTER || isOrderFeedbackOutcome(feedbackRaw) ? feedbackRaw : undefined;
  const filters: AdminOrderFilters = {
    status: STATUSES.includes(statusRaw as OrderStatus) ? (statusRaw as OrderStatus) : undefined,
    search: (get("q") ?? "").trim(),
    date: get("date") || undefined,
    feedback,
  };
  const pageNum = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);

  const [orderPage, rawProducts, productForms] = await Promise.all([
    getSalesRepOrdersPage(session.user.id, filters, pageNum, PAGE_SIZE),
    getActiveProducts(),
    getManualOrderProductForms(),
  ]);

  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    sellingPrice: Number(p.sellingPrice),
  }));

  return (
    <OrdersClient
      orders={orderPage.rows}
      total={orderPage.total}
      statusCounts={orderPage.statusCounts}
      page={pageNum}
      userName={session.user.name ?? ""}
      products={products}
      productForms={productForms}
      initialFilters={{
        status: filters.status ?? "",
        search: filters.search ?? "",
        date: filters.date ?? "",
        feedback: filters.feedback ?? "",
      }}
    />
  );
}
