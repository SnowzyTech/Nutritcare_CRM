import { prisma } from "@/lib/db/prisma";

/**
 * Upsell package pricing resolver.
 *
 * Products are priced by per-form quantity **packages** (e.g. qty 2 = ₦5,000,
 * qty 4 = ₦8,000), stored in `Form.data.priceVariations`. When a sales rep
 * upsells, we price the (already-merged) quantity `q` like this:
 *
 *   1. Exact package for `q`            → the package price (no manual input).
 *   2. No exact package, lower exists   → nearestLowerPackagePrice
 *                                          + (q − qLower) × repTypedUnitPrice.
 *   3. Below smallest / no packages     → q × repTypedUnitPrice.
 *
 * `Product.sellingPrice` is intentionally NOT used — per-unit price changes too
 * often, so the rep types the current unit price for the surplus units.
 *
 * Full spec: docs/upsell-package-pricing.md
 */

// Shape of the entries the FormBuilder stores in Form.data.priceVariations.
// JSON is untyped at rest, so every field is read defensively.
type PriceVariation = {
  productId?: unknown;
  quantity?: unknown;
  price?: unknown;
};

type FormData = {
  selectedProduct?: unknown;
  priceVariations?: unknown;
};

export type UpsellPriceSource = "package" | "surplus";

export type ResolvedUpsellPrice = {
  lineTotal: number;
  unitPrice: number;
  source: UpsellPriceSource;
  /** True when the price depends on the rep's typed unit price (steps 2 & 3). */
  requiresUnitPrice: boolean;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Extract the package set ({ quantity, price }) for `productId` from a form's
 * data. Only variations belonging to `productId` are kept, and only when the
 * form's MAIN product is `productId` — this is the required filter that keeps
 * combo/free-gift variations (which carry other productIds and ₦0 prices) from
 * contaminating the package set. See docs contamination caveat.
 */
export function packagesFromForm(
  data: unknown,
  productId: string,
): { quantity: number; price: number }[] {
  const d = (data ?? {}) as FormData;
  if (d.selectedProduct !== productId) return [];
  if (!Array.isArray(d.priceVariations)) return [];

  const byQuantity = new Map<number, number>();
  for (const raw of d.priceVariations as PriceVariation[]) {
    if (!raw || raw.productId !== productId) continue;
    const quantity = Number(raw.quantity);
    const price = Number(raw.price);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(price) || price <= 0) continue;
    // First package wins for a given quantity (deterministic).
    if (!byQuantity.has(quantity)) byQuantity.set(quantity, price);
  }

  return [...byQuantity.entries()]
    .map(([quantity, price]) => ({ quantity, price }))
    .sort((a, b) => a.quantity - b.quantity);
}

/**
 * Resolve the exact package a PUBLIC order-form customer selected, from the
 * saved form config — the authoritative quantity & price.
 *
 * The public order-form POST body is fully attacker-controllable (no auth), so
 * the server must NEVER take the customer's posted price/quantity for the money
 * math. We identify the chosen package among the product's saved variations —
 * first by its name, then by the posted quantity, then (single-package forms)
 * the sole variation — and read the STORED figures. Returns null when it can't
 * be resolved from the form, so the caller can fall back to the product's own
 * `sellingPrice`. See docs/upsell-package-pricing.md.
 */
export function resolvePublicFormPackage(
  data: unknown,
  productId: string,
  selection: { packageName?: string; quantity?: number },
): { quantity: number; price: number } | null {
  const d = (data ?? {}) as FormData;
  if (!Array.isArray(d.priceVariations)) return null;

  const forProduct = (d.priceVariations as (PriceVariation & { name?: unknown })[])
    .filter((v) => {
      if (!v) return false;
      // New forms tag each variation with its productId; older forms carry no
      // per-variation productId and rely on the form's single selectedProduct.
      return v.productId != null
        ? v.productId === productId
        : d.selectedProduct === productId;
    })
    .map((v) => ({
      name: typeof v.name === "string" ? v.name : "",
      quantity: Number(v.quantity),
      price: Number(v.price),
    }))
    .filter(
      (v) =>
        Number.isFinite(v.quantity) &&
        v.quantity > 0 &&
        Number.isFinite(v.price) &&
        v.price > 0,
    );

  if (forProduct.length === 0) return null;

  const name = selection.packageName?.trim();
  const qty =
    selection.quantity != null && Number.isFinite(selection.quantity)
      ? Math.floor(Number(selection.quantity))
      : undefined;

  const chosen =
    (name ? forProduct.find((v) => v.name === name) : undefined) ??
    (qty ? forProduct.find((v) => v.quantity === qty) : undefined) ??
    (forProduct.length === 1 ? forProduct[0] : undefined);

  if (!chosen) return null;
  return { quantity: chosen.quantity, price: round2(chosen.price) };
}

/**
 * Resolve the package set for a product: the order's own active form first,
 * else the product's active forms (newest `updatedAt` wins). "Active" =
 * disabledAt null AND deletedAt null.
 */
async function resolvePackages(
  productId: string,
  orderFormId?: string,
): Promise<{ quantity: number; price: number }[]> {
  // 1. The order's own form (no ambiguity), if it's this product's form.
  if (orderFormId) {
    const ownForm = await prisma.form.findFirst({
      where: { id: orderFormId, disabledAt: null, deletedAt: null },
      select: { data: true },
    });
    if (ownForm) {
      const pkgs = packagesFromForm(ownForm.data, productId);
      if (pkgs.length > 0) return pkgs;
    }
  }

  // 2. The product's active forms — newest form wins.
  const forms = await prisma.form.findMany({
    where: { disabledAt: null, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { data: true },
  });
  for (const form of forms) {
    const pkgs = packagesFromForm(form.data, productId);
    if (pkgs.length > 0) return pkgs;
  }

  return [];
}

/**
 * Price an upsell line for `quantity` units of `productId`.
 *
 * @param quantity        The MERGED quantity (existing line + this add).
 * @param typedUnitPrice  The unit price the rep typed; only used (and required)
 *                        when the quantity has no exact package. Pass 0 for a
 *                        live preview before the rep has typed anything.
 */
export async function resolveUpsellPrice(
  productId: string,
  quantity: number,
  typedUnitPrice: number,
  orderFormId?: string,
): Promise<ResolvedUpsellPrice> {
  const q = Math.max(1, Math.floor(quantity));
  const u = Number.isFinite(typedUnitPrice) ? typedUnitPrice : 0;
  const packages = await resolvePackages(productId, orderFormId);

  // Step 1 — exact package match.
  const exact = packages.find((p) => p.quantity === q);
  if (exact) {
    return {
      lineTotal: round2(exact.price),
      unitPrice: round2(exact.price / q),
      source: "package",
      requiresUnitPrice: false,
    };
  }

  // Step 2 — nearest lower package + surplus × typed unit price.
  const lower = packages.filter((p) => p.quantity < q).at(-1);
  if (lower) {
    const surplus = q - lower.quantity;
    return {
      lineTotal: round2(lower.price + surplus * u),
      unitPrice: round2(u),
      source: "surplus",
      requiresUnitPrice: true,
    };
  }

  // Step 3 — below the smallest package (or no packages): q × typed unit price.
  return {
    lineTotal: round2(q * u),
    unitPrice: round2(u),
    source: "surplus",
    requiresUnitPrice: true,
  };
}
