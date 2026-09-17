import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Called from the embedded order-form iframe when it loads on a landing page.
// Allow any origin so the beacon works from external sites.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** Record one landing-page view for a form as a daily tally (see FormViewDaily). */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 24/7 ad-traffic hot path (one call per landing-page load), so keep it minimal.
  // We no longer write a row per impression. Instead we keep ONE running tally per
  // form per UTC day and bump it with a single upsert (Postgres INSERT ... ON
  // CONFLICT) — no pre-read, no transaction — so the table grows by (forms × days),
  // not impressions. Total hits = SUM(count).
  //
  // The disabled/deleted gate is enforced fresh at order-submit time
  // (app/api/orders/form-submit), and a deleted form never renders the beacon at
  // all (its public page 404s), so we skip the pre-read here; a stray tick on a
  // just-disabled-but-still-embedded form is a harmless rounding error on a view
  // counter.
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);

  try {
    await prisma.formViewDaily.upsert({
      where: { formId_day: { formId: id, day } },
      create: { formId: id, day, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    // Fire-and-forget beacon: a bad/removed formId (FK violation) must not 500.
    return NextResponse.json({ ok: false }, { headers: CORS_HEADERS });
  }

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
