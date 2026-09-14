import { prisma } from "@/lib/db/prisma";

/**
 * Failed public order-form submissions (timeout / network / server error). These
 * are captured fire-and-forget so a rep can call the customer back — see
 * `app/api/orders/form-submit-failure`. Storage is the dedicated
 * `failed_order_attempts` table (no User FK; anonymous public attempts).
 */

export type FailureReason = "timeout" | "network" | "server_error";

export type RecordFailedAttemptInput = {
  formId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerWhatsapp?: string | null;
  productId?: string | null;
  productName?: string | null;
  packageName?: string | null;
  state?: string | null;
  deliveryAddress?: string | null;
  reason: FailureReason | string;
  httpStatus?: number | null;
  errorMessage?: string | null;
  userAgent?: string | null;
};

/** The payload is untrusted (public endpoint), so clamp everything before storing. */
function clamp(value: unknown, max: number): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

export async function recordFailedOrderAttempt(input: RecordFailedAttemptInput) {
  return prisma.failedOrderAttempt.create({
    data: {
      formId: clamp(input.formId, 60),
      customerName: clamp(input.customerName, 200),
      customerPhone: clamp(input.customerPhone, 40),
      customerWhatsapp: clamp(input.customerWhatsapp, 40),
      productId: clamp(input.productId, 60),
      productName: clamp(input.productName, 200),
      packageName: clamp(input.packageName, 200),
      state: clamp(input.state, 120),
      deliveryAddress: clamp(input.deliveryAddress, 500),
      reason: clamp(input.reason, 40) ?? "network",
      httpStatus:
        typeof input.httpStatus === "number" && Number.isFinite(input.httpStatus)
          ? Math.trunc(input.httpStatus)
          : null,
      errorMessage: clamp(input.errorMessage, 500),
      userAgent: clamp(input.userAgent, 400),
    },
    select: { id: true },
  });
}

export type FailedAttemptRow = Awaited<ReturnType<typeof listFailedAttempts>>[number];

/** Newest-first list for the admin recovery page. Unrecovered first by default. */
export async function listFailedAttempts(opts?: { includeRecovered?: boolean; take?: number }) {
  return prisma.failedOrderAttempt.findMany({
    where: opts?.includeRecovered ? {} : { recoveredAt: null },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 200,
    select: {
      id: true,
      formId: true,
      customerName: true,
      customerPhone: true,
      customerWhatsapp: true,
      productName: true,
      packageName: true,
      state: true,
      deliveryAddress: true,
      reason: true,
      httpStatus: true,
      recoveredAt: true,
      createdAt: true,
    },
  });
}

/** Count of still-unrecovered failed attempts (for a badge / banner). */
export function countUnrecoveredAttempts() {
  return prisma.failedOrderAttempt.count({ where: { recoveredAt: null } });
}

export async function markFailedAttemptRecovered(id: string) {
  return prisma.failedOrderAttempt.update({
    where: { id },
    data: { recoveredAt: new Date() },
    select: { id: true },
  });
}
