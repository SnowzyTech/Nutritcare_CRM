import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, department: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ teams });
  } catch (err) {
    console.error("[api/teams]", err);
    return NextResponse.json({ error: "Failed to load teams." }, { status: 500 });
  }
}
