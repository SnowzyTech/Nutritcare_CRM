import { NextRequest, NextResponse } from "next/server";
import { getFormById } from "@/modules/admin/services/forms.service";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await getFormById(id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(form);
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
  return NextResponse.json({ ok: true });
}
