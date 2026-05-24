import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      select: { id: true, name: true, referenceCode: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ warehouses });
  } catch (err) {
    console.error("[api/warehouses]", err);
    return NextResponse.json({ error: "Failed to load warehouses." }, { status: 500 });
  }
}
