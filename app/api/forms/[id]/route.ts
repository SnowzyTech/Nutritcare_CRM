import { NextRequest, NextResponse } from "next/server";
import { getPublicFormById } from "@/modules/admin/services/forms.service";
import { prisma } from "@/lib/db/prisma";

// CORS — the inline embed (public/embed.js) fetches the form config and bumps the
// view counter from a WordPress landing page (a different origin), so these must
// allow cross-origin requests, same as the order-submit route.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await getPublicFormById(id);
  if (!form) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS_HEADERS });
  }
  return NextResponse.json(form, { headers: CORS_HEADERS });
}

/** Increment the orders counter on a form (called after a successful order submission) */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.form.updateMany({
    where: { id, deletedAt: null },
    data: { orders: { increment: 1 } },
  });
  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
