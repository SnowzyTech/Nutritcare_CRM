import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSalesRepOrdersPage, type AdminOrderFilters } from "@/modules/orders/services/orders.service";
import { getActiveProducts } from "@/modules/orders/services/products.service";
import { getManualOrderProductForms } from "@/modules/orders/services/form-packages.service";
import { OrdersClient } from "./orders-client";
import { PushPermissionCard } from "@/components/notifications/push-permission-card";
import Link from "next/link";
import { getRepFollowUps } from "@/modules/reports/sales/services/follow-up.service";
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

  const [orderPage, rawProducts, productForms, followUps] = await Promise.all([
    getSalesRepOrdersPage(session.user.id, filters, pageNum, PAGE_SIZE),
    getActiveProducts(),
    getManualOrderProductForms(),
    getRepFollowUps(session.user.id),
  ]);
  const followUpsDue = followUps.filter((f) => f.daysLate === 0).length;
  const followUpsLate = followUps.length - followUpsDue;

  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    sellingPrice: Number(p.sellingPrice),
  }));

  return (
    <>
      <PushPermissionCard variant="nudge" className="mb-4" />
      {followUps.length > 0 && (
        <Link
          href="/sales-rep/follow-ups"
          className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-sm hover:border-purple-300"
        >
          <span className="font-semibold text-[#A020F0]">
            {followUpsDue} follow-up call{followUpsDue === 1 ? "" : "s"} due today
            {followUpsLate > 0 && <span className="text-amber-700"> · {followUpsLate} missed</span>}
          </span>
          <span className="text-xs font-semibold text-gray-500">Open follow-ups →</span>
        </Link>
      )}
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
    </>
  );
}
