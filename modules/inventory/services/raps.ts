// RAPS (Received-As-Pending-Sample) units are recorded inside
// StockMovementItem.quantity but are deliberately NOT credited to stock at
// receipt time. Any read that reports "units actually received", and any later
// debit (delete/reverse), must therefore work off the net figure — not the raw
// item quantity.
//
// Plain (non-"use server") module so both services and server actions can
// import these helpers.

export type RapsEntry = { productId: string; quantity: number };

/** Parse the `StockMovement.rapsAssignments` JSON column defensively. */
export function parseRapsAssignments(rapsAssignments: unknown): RapsEntry[] {
  if (!rapsAssignments || !Array.isArray(rapsAssignments)) return [];
  return (rapsAssignments as RapsEntry[]).filter(
    (e) => e && typeof e.productId === "string" && typeof e.quantity === "number",
  );
}

/** Total RAPS units on a movement. */
export function rapsTotal(rapsAssignments: unknown): number {
  return parseRapsAssignments(rapsAssignments).reduce((s, e) => s + e.quantity, 0);
}

/**
 * Item quantities minus their RAPS portion — the amount that was actually
 * credited to stock.
 */
export function creditedQuantities(
  items: { productId: string; quantity: number }[],
  rapsAssignments: unknown,
): { productId: string; quantity: number }[] {
  const rapsMap = new Map(parseRapsAssignments(rapsAssignments).map((e) => [e.productId, e.quantity]));
  return items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity - (rapsMap.get(i.productId) ?? 0),
  }));
}
