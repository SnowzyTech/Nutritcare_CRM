"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/lib/auth/role-routes";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { suppressCameraForRequest } from "@/lib/audit/context";
import { formatCurrency } from "@/lib/utils";

const costPriceSchema = z.object({
  productId: z.string().min(1),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative"),
});

/**
 * Update a product's cost price from the accounting inventory page.
 *
 * IMPORTANT — this is intentionally forward-looking only. Cost of goods sold on
 * past orders is snapshotted per line into OrderItem.costPriceAtSale at the time
 * the order is placed, so changing this value here does NOT rewrite historical
 * profit/COGS. It affects (a) future orders' snapshots and (b) the current
 * on-hand inventory valuation, which are both the intended behaviours.
 */
export async function updateProductCostPriceAction(input: z.infer<typeof costPriceSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  suppressCameraForRequest();
  if (session.user.role !== "ACCOUNTANT" && !isAdmin(session.user.role)) {
    return { error: "You don't have permission to change cost prices" };
  }

  const parsed = costPriceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, deletedAt: null },
    select: { id: true, name: true, costPrice: true },
  });
  if (!product) return { error: "Product not found" };

  const previous = Number(product.costPrice);
  const next = parsed.data.costPrice;
  if (previous === next) return { ok: true, costPrice: next };

  await prisma.product.update({
    where: { id: product.id },
    data: { costPrice: next },
  });

  // Financially sensitive change — keep an audit trail of who changed what.
  await logActivity({
    userId: session.user.id,
    action: "Updated",
    entityType: "Product",
    entityId: product.id,
    description: `Cost price of ${product.name} changed from ${formatCurrency(previous)} to ${formatCurrency(next)}`,
    details: {
      before: formatCurrency(previous),
      after: formatCurrency(next),
      field: "costPrice",
      amount: Math.abs(next - previous),
    },
  });

  revalidatePath("/accounting/inventory");
  revalidatePath("/accounting");
  return { ok: true, costPrice: next };
}
