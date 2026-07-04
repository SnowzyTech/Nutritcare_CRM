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

/** Record one landing-page view for a form (skips disabled / deleted forms). */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const form = await prisma.form.findUnique({
    where: { id },
    select: { id: true, disabledAt: true, deletedAt: true },
  });
  if (!form || form.disabledAt || form.deletedAt) {
    return NextResponse.json({ ok: false }, { headers: CORS_HEADERS });
  }

  // Log a timestamped view (for time-filtered analytics) and bump the fast
  // denormalised counter the admin list still reads.
  await prisma.$transaction([
    prisma.formView.create({ data: { formId: id } }),
    prisma.form.update({ where: { id }, data: { hits: { increment: 1 } } }),
  ]);

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
