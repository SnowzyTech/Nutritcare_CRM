import { prisma } from "@/lib/db/prisma";
import { packagesFromForm } from "./tier-pricing.service";

/**
 * Data for the sales-rep manual "Add Order" Product → Form picker.
 *
 * A product can appear as the MAIN product of several forms, each with its own
 * package tiers (`Form.data.priceVariations`). When a rep manually creates an
 * order they choose which form's pricing applies, then a quantity — priced by the
 * shared upsell engine (`resolveUpsellPrice`). This service only supplies the
 * picker options (active forms + their packages); the authoritative price is
 * always re-resolved server-side at create time. See docs/upsell-package-pricing.md.
 */

export type ManualPackage = { quantity: number; price: number };
export type ManualForm = {
  formId: string;
  formName: string;
  createdByName: string;
  createdByRole: string;
  packages: ManualPackage[];
};
export type ProductForms = { productId: string; forms: ManualForm[] };

type FormData = { selectedProduct?: unknown };

/**
 * All ACTIVE forms (disabledAt null, deletedAt null) grouped by their main
 * product, each carrying its package tiers. Only forms that resolve to at least
 * one valid package for their own main product are included — a form whose
 * `priceVariations` hold only gifts/combos contributes nothing. Newest form
 * first, mirroring the pricing fallback order in `resolveUpsellPrice`.
 */
export async function getManualOrderProductForms(): Promise<ProductForms[]> {
  const forms = await prisma.form.findMany({
    where: { disabledAt: null, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      data: true,
      createdBy: { select: { name: true, role: true } },
    },
  });

  const byProduct = new Map<string, ManualForm[]>();
  for (const form of forms) {
    const selectedProduct = (form.data as FormData | null)?.selectedProduct;
    if (typeof selectedProduct !== "string" || !selectedProduct) continue;

    // Reuse the contamination filter: keeps only this product's real packages.
    const packages = packagesFromForm(form.data, selectedProduct);
    if (packages.length === 0) continue;

    const list = byProduct.get(selectedProduct) ?? [];
    list.push({
      formId: form.id,
      formName: form.name,
      createdByName: form.createdBy.name,
      createdByRole: form.createdBy.role,
      packages,
    });
    byProduct.set(selectedProduct, list);
  }

  return [...byProduct.entries()].map(([productId, forms]) => ({
    productId,
    forms,
  }));
}
