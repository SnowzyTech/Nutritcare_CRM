/**
 * scripts/add-form-view-daily.ts
 *
 * Phase 1 of the form-view optimization (docs/form-view-write-optimization-plan.md):
 *   1. Creates the `form_view_daily` table + indexes (idempotent, via raw SQL —
 *      NOT `db push`, to avoid the known supplierInvoiceUrls drift blocker).
 *   2. Backfills it from the historical `form_views` rows: one tally row per
 *      (form, UTC day). Idempotent — ON CONFLICT DO NOTHING, safe to re-run.
 *
 * SAFE BY DEFAULT: with no flag it prints the target DB + a preview and exits.
 * Pass --apply to actually create the table and backfill.
 *
 *   node --import tsx scripts/add-form-view-daily.ts            # preview only
 *   node --import tsx scripts/add-form-view-daily.ts --apply    # create + backfill
 *
 * Run the code deploy that reads/writes form_view_daily AFTER this has --applied
 * against the same database, or the beacon + media-buyer screens will 500.
 */
import { readFileSync } from "node:fs";
import dns from "node:dns";

// Neon's zone SERVFAILs on some default resolvers -> force public DNS.
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  /* ignore */
}

function loadEnv() {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[m[1]] = val;
  }
}

// Each statement runs separately: Prisma's raw exec disallows multiple commands
// in one call.
const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS form_view_daily (
     id text PRIMARY KEY,
     "formId" text NOT NULL,
     day date NOT NULL,
     count integer NOT NULL DEFAULT 0
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "form_view_daily_formId_day_key" ON form_view_daily ("formId", day)`,
  `CREATE INDEX IF NOT EXISTS form_view_daily_day_idx ON form_view_daily (day)`,
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE constraint_name = 'form_view_daily_formId_fkey'
     ) THEN
       ALTER TABLE form_view_daily
         ADD CONSTRAINT "form_view_daily_formId_fkey"
         FOREIGN KEY ("formId") REFERENCES forms(id) ON DELETE CASCADE ON UPDATE CASCADE;
     END IF;
   END $$`,
];

// Truncate to the UTC calendar day, matching the beacon (setUTCHours(0,0,0,0)).
const BACKFILL = `
  INSERT INTO form_view_daily (id, "formId", day, count)
  SELECT gen_random_uuid()::text, "formId", "createdAt"::date AS day, count(*)
  FROM form_views
  GROUP BY "formId", "createdAt"::date
  ON CONFLICT ("formId", day) DO NOTHING
`;

async function main() {
  loadEnv();
  const apply = process.argv.includes("--apply");
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/]+)/)?.[1] ?? "unknown";
  console.log(`Target DB host: ${host}`);
  console.log(apply ? "Mode: APPLY (create table + backfill)\n" : "Mode: PREVIEW (no changes)\n");

  const { prisma } = await import("@/lib/db/prisma");

  try {
    const src = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
      `SELECT count(*)::bigint AS n FROM form_views`
    );
    console.log(`Legacy form_views rows: ${src[0].n}`);

    const preview = await prisma.$queryRawUnsafe<{ days: bigint; total: bigint }[]>(
      `SELECT count(*)::bigint AS days, coalesce(sum(c),0)::bigint AS total
       FROM (SELECT count(*) AS c FROM form_views GROUP BY "formId", "createdAt"::date) t`
    );
    console.log(
      `Backfill would produce ${preview[0].days} daily rows totalling ${preview[0].total} views.`
    );

    if (!apply) {
      console.log("\nPreview only. Re-run with --apply to perform the migration.");
      return;
    }

    console.log("\nCreating table + indexes...");
    for (const stmt of DDL_STATEMENTS) await prisma.$executeRawUnsafe(stmt);

    console.log("Backfilling from form_views...");
    await prisma.$executeRawUnsafe(BACKFILL);

    const dst = await prisma.$queryRawUnsafe<{ days: bigint; total: bigint }[]>(
      `SELECT count(*)::bigint AS days, coalesce(sum(count),0)::bigint AS total FROM form_view_daily`
    );
    console.log(
      `\nform_view_daily now holds ${dst[0].days} rows, ${dst[0].total} total views.`
    );
    console.log(
      preview[0].total === dst[0].total
        ? "Totals match the source. Done."
        : "NOTE: totals differ from source (expected if the beacon already wrote new-day rows). Done."
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
