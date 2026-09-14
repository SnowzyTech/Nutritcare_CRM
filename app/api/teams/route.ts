import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { CACHE_TAGS, REFERENCE_TTL_SECONDS } from "@/lib/cache/tags";

// Team list changes rarely; cache it so the dropdown lookup doesn't wake the DB
// on every signup page load. Time-based TTL is fine here (no on-demand invalidation).
const getCachedTeams = unstable_cache(
  () =>
    prisma.team.findMany({
      select: { id: true, name: true, department: true },
      orderBy: { name: "asc" },
    }),
  ["teams-dropdown"],
  { tags: [CACHE_TAGS.teams], revalidate: REFERENCE_TTL_SECONDS }
);

export async function GET() {
  try {
    const teams = await getCachedTeams();
    return NextResponse.json({ teams });
  } catch (err) {
    console.error("[api/teams]", err);
    return NextResponse.json({ error: "Failed to load teams." }, { status: 500 });
  }
}
