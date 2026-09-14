import { NextRequest, NextResponse } from "next/server";
import { recordFailedOrderAttempt } from "@/modules/orders/services/failed-attempt.service";

// ── CORS — allow any origin so the embedded (iframe) form can report from any
// landing page, same as the order-submit route. ─────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Records an order-form submission that FAILED on the client (timeout, network
 * drop, or a server rejection). Called fire-and-forget via `navigator.sendBeacon`
 * from the form's failure branches, so it must be cheap and must NEVER error:
 * a broken logging endpoint must not add noise to an already-failing submit.
 * Always answers 204.
 */
export async function POST(req: NextRequest) {
  try {
    // sendBeacon posts a Blob (application/json here) but some browsers send it
    // as text/plain — parse the raw text either way rather than trusting the type.
    const raw = await req.text();
    const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

    await recordFailedOrderAttempt({
      formId: body.formId as string | undefined,
      customerName: body.customerName as string | undefined,
      customerPhone: body.customerPhone as string | undefined,
      customerWhatsapp: body.customerWhatsapp as string | undefined,
      productId: body.productId as string | undefined,
      productName: body.productName as string | undefined,
      packageName: body.packageName as string | undefined,
      state: body.state as string | undefined,
      deliveryAddress: body.deliveryAddress as string | undefined,
      reason: (body.reason as string | undefined) ?? "network",
      httpStatus: typeof body.httpStatus === "number" ? body.httpStatus : null,
      errorMessage: body.errorMessage as string | undefined,
      userAgent: req.headers.get("user-agent"),
    });
  } catch (err) {
    // Swallow everything — this is a best-effort log, never a hard dependency.
    console.error("[form-submit-failure] failed to record attempt:", err);
  }
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
