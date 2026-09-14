/**
 * Central registry of Data-Cache tags + TTLs used with `unstable_cache`.
 *
 * WHY: several read paths are hit constantly (public order forms by ad traffic
 * around the clock; dropdown lookups on every page). Caching their results in
 * Next's Data Cache lets the Neon compute stay suspended between reads instead
 * of re-running the same query for every visitor — the single biggest lever on
 * our Neon CU-hour usage. See docs/scale-considerations.md.
 *
 * RULES for anything cached with these tags:
 *  - Cache only org-wide reference data — never per-user or auth/cookie-derived
 *    data (unstable_cache cannot read cookies/headers inside its callback).
 *  - Never cache Prisma `Decimal` values directly: they do not survive the Data
 *    Cache serialization cleanly. Convert to number/string first.
 *  - Invalidate with `revalidateTag(...)` in the write action, so edits show up
 *    immediately instead of waiting for the TTL.
 */

/** Reference data that changes rarely (products, rosters, forms). */
export const REFERENCE_TTL_SECONDS = 300; // 5 minutes

export const CACHE_TAGS = {
  teams: "teams",
  warehouses: "warehouses",
  /** Broad tag covering all forms — bump to invalidate every form at once. */
  forms: "forms",
} as const;

/** Per-form tag so a single form edit only busts that form's cache entry. */
export const formTag = (id: string) => `form:${id}`;
