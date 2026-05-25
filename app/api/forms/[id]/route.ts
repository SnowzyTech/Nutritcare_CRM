import { NextRequest, NextResponse } from "next/server";
import { getFormById } from "@/modules/admin/services/forms.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const form = await getFormById(id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(form);
}
