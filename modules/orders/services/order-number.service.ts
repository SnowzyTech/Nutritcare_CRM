import type { Prisma } from "@prisma/client";

/**
 * Product-name abbreviation used as an order-code prefix: letters only,
 * uppercased, first 5 (e.g. "Afternatal" → "AFTER", "neurovive" → "NEURO").
 * Falls back to "ORD" when the name has no letters.
 */
export function abbreviateProduct(name: string | null | undefined): string {
  const letters = (name ?? "").replace(/[^A-Za-z]/g, "").toUpperCase();
  return letters.slice(0, 5) || "ORD";
}

/**
 * Generates a meaningful order code `PREFIX-NNN` (e.g. NEURO-001), where PREFIX
 * is the main product's abbreviation and NNN is a per-prefix running number.
 *
 * MUST be called inside the order-creation transaction (pass the `tx` client):
 * the counter is incremented atomically via an INSERT … ON CONFLICT so two
 * concurrent orders never collide on the same number. Products that share a
 * 5-letter prefix share the sequence. `orderNumber` stays @unique as a backstop.
 */
export async function nextOrderNumber(
  tx: Prisma.TransactionClient,
  mainProductName: string | null | undefined,
): Promise<string> {
  const prefix = abbreviateProduct(mainProductName);
  const rows = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "order_counters" ("prefix", "value", "updatedAt")
    VALUES (${prefix}, 1, now())
    ON CONFLICT ("prefix")
    DO UPDATE SET "value" = "order_counters"."value" + 1, "updatedAt" = now()
    RETURNING "value"
  `;
  const value = Number(rows[0]?.value ?? 1);
  return `${prefix}-${String(value).padStart(3, "0")}`;
}
