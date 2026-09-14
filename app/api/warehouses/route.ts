import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { CACHE_TAGS, REFERENCE_TTL_SECONDS } from "@/lib/cache/tags";

// Warehouse list changes rarely; cache it so the dropdown lookup doesn't wake the
// DB on every signup page load. Time-based TTL is fine here.
const getCachedWarehouses = unstable_cache(
  () =>
    prisma.warehouse.findMany({
      select: { id: true, name: true, referenceCode: true },
      orderBy: { name: "asc" },
    }),
  ["warehouses-dropdown"],
  { tags: [CACHE_TAGS.warehouses], revalidate: REFERENCE_TTL_SECONDS }
);

export async function GET() {
  try {
    const warehouses = await getCachedWarehouses();
    return NextResponse.json({ warehouses });
  } catch (err) {
    console.error("[api/warehouses]", err);
    return NextResponse.json({ error: "Failed to load warehouses." }, { status: 500 });
  }
}
