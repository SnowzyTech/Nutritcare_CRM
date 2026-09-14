import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { listFailedAttempts } from "@/modules/orders/services/failed-attempt.service";
import { FailedAttemptsClient } from "./failed-attempts-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Failed Orders" };

// Always fresh: this is an operational recovery queue, not a cacheable report.
export const dynamic = "force-dynamic";

export default async function FailedAttemptsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rows = await listFailedAttempts({ includeRecovered: true });

  const attempts = rows.map((r) => ({
    id: r.id,
    formId: r.formId,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    customerWhatsapp: r.customerWhatsapp,
    productName: r.productName,
    packageName: r.packageName,
    state: r.state,
    deliveryAddress: r.deliveryAddress,
    reason: r.reason,
    httpStatus: r.httpStatus,
    recoveredAt: r.recoveredAt ? r.recoveredAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return <FailedAttemptsClient attempts={attempts} />;
}
