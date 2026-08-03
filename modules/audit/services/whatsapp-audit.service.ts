import { logActivity } from "@/modules/audit/services/audit-log.service";

/** Which WhatsApp template send an outcome belongs to (used in the log message). */
export type WhatsAppChannel = "confirmation" | "delivery code" | "delivered";

type WhatsAppSendResult = { success: boolean; error?: string };

/**
 * Meta returns a billing/payment block under error code 131042. Pulling the code
 * out of the raw error payload — and naming the billing case explicitly — means
 * an admin reading the History page or dashboard banner immediately knows an
 * outage is a billing problem (settle the WhatsApp balance) rather than a code bug.
 */
function describeMetaError(error: string | undefined): { code: number | null; hint: string } {
  if (!error) return { code: null, hint: "" };
  let code: number | null = null;
  try {
    const parsed = JSON.parse(error) as { error?: { code?: unknown } };
    if (typeof parsed?.error?.code === "number") code = parsed.error.code;
  } catch {
    const m = error.match(/"code"\s*:\s*(\d+)/);
    if (m) code = Number(m[1]);
  }
  const hint = code === 131042 ? " — account billing/payment issue" : "";
  return { code, hint };
}

/**
 * Records the outcome of a fire-and-forget WhatsApp template send. Successful
 * sends are logged to the console exactly as before; failures are ADDITIONALLY
 * written to the audit log (entityType "WhatsApp", action "Failed") so they
 * surface on the admin History page and the dashboard warning banner instead of
 * vanishing into stdout. Never throws — a logging hiccup must not break the send
 * chain that called it.
 */
export function recordWhatsAppResult(params: {
  userId: string;
  orderId: string;
  orderNumber: string;
  channel: WhatsAppChannel;
  result: WhatsAppSendResult;
}): void {
  const { userId, orderId, orderNumber, channel, result } = params;
  console.log(`[WhatsApp] ${channel} result:`, JSON.stringify(result));
  if (result.success) return;

  const { code, hint } = describeMetaError(result.error);
  void logActivity({
    userId,
    action: "Failed",
    entityType: "WhatsApp",
    entityId: orderId,
    description: `WhatsApp ${channel} message failed for order #${orderNumber}${hint}`,
    details: { channel, metaErrorCode: code, error: result.error ?? null },
  });
}
