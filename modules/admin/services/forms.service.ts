import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS, formTag, REFERENCE_TTL_SECONDS } from "@/lib/cache/tags";

/** Cache-safe shape for public form rendering (dates as ISO strings, no Decimals). */
export type PublicForm = {
  id: string;
  name: string;
  hits: number;
  orders: number;
  data: Record<string, unknown>;
  createdAt: string;
  disabledAt: string | null;
};

/**
 * Public order-form fetch, cached in the Data Cache. This is hit by ad traffic
 * around the clock, so caching it is the biggest single reduction in Neon
 * compute usage. Used ONLY by the public order-form page + public GET API —
 * NOT the admin/media-buyer editors, which must read fresh via getFormById.
 *
 * The disabled/deleted gate for NEW orders is enforced fresh at submit time
 * (app/api/orders/form-submit), so a form disabled within the TTL window still
 * stops accepting orders immediately; only the public display can be up to
 * REFERENCE_TTL_SECONDS stale. Edits call revalidateTag(formTag(id)) to bust it.
 */
export function getPublicFormById(id: string): Promise<PublicForm | null> {
  return unstable_cache(
    async (): Promise<PublicForm | null> => {
      const form = await prisma.form.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          hits: true,
          orders: true,
          data: true,
          createdAt: true,
          disabledAt: true,
        },
      });
      if (!form) return null;
      return {
        id: form.id,
        name: form.name,
        hits: form.hits,
        orders: form.orders,
        data: (form.data ?? {}) as Record<string, unknown>,
        createdAt: form.createdAt.toISOString(),
        disabledAt: form.disabledAt ? form.disabledAt.toISOString() : null,
      };
    },
    ["public-form", id],
    { tags: [formTag(id), CACHE_TAGS.forms], revalidate: REFERENCE_TTL_SECONDS }
  )();
}

export async function getAllForms() {
  const forms = await prisma.form.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      hits: true,
      data: true,
      createdAt: true,
      createdBy: { select: { name: true, role: true } },
    },
  });

  // Order count is derived LIVE from the orders table rather than read from the
  // denormalised Form.orders counter (which only counts up on submit and drifts
  // when orders are deleted). formId is indexed, so this group-count is cheap.
  const counts = await prisma.order.groupBy({
    by: ["formId"],
    where: { deletedAt: null, formId: { in: forms.map((f) => f.id) } },
    _count: { _all: true },
  });
  const liveOrders = new Map(counts.map((c) => [c.formId as string, c._count._all]));

  return forms.map((f) => ({ ...f, orders: liveOrders.get(f.id) ?? 0 }));
}

export async function getFormById(id: string) {
  return prisma.form.findFirst({
    where: { id, deletedAt: null },
  });
}

export async function createForm(createdById: string, name: string, data: Record<string, unknown>) {
  return prisma.form.create({ data: { name, data: data as Prisma.InputJsonValue, createdById } });
}

export async function updateForm(id: string, name: string, data: Record<string, unknown>) {
  return prisma.form.update({ where: { id }, data: { name, data: data as Prisma.InputJsonValue } });
}

export async function softDeleteForm(id: string) {
  return prisma.form.update({ where: { id }, data: { deletedAt: new Date() } });
}

/**
 * Counts a form's live linked orders: `total` and `blocking`, where blocking =
 * orders carrying a financial/operational footprint (CONFIRMED or DELIVERED, or
 * already invoiced) that must never be deleted. `total > 0 && blocking === 0` is
 * the only case where an admin may delete the form together with its orders.
 */
export async function getFormOrderCounts(formId: string) {
  const [total, blocking] = await Promise.all([
    prisma.order.count({ where: { formId, deletedAt: null } }),
    prisma.order.count({
      where: {
        formId,
        deletedAt: null,
        OR: [
          { status: { in: ["CONFIRMED", "DELIVERED"] } },
          { invoices: { some: {} } },
        ],
      },
    }),
  ]);
  return { total, blocking };
}

/**
 * Soft-deletes a form and its linked orders in one transaction. Caller must have
 * verified via getFormOrderCounts that none of those orders are
 * confirmed/delivered/invoiced, so no financial records are affected.
 */
export async function softDeleteFormWithOrders(id: string) {
  const now = new Date();
  return prisma.$transaction([
    prisma.order.updateMany({
      where: { formId: id, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.form.update({ where: { id }, data: { deletedAt: now } }),
  ]);
}

/** Reversibly disable / re-enable a form (blocks new orders while disabled). */
export async function setFormDisabled(id: string, disabled: boolean) {
  return prisma.form.update({
    where: { id },
    data: { disabledAt: disabled ? new Date() : null },
  });
}

export async function duplicateForm(id: string, createdById: string) {
  const original = await prisma.form.findFirst({ where: { id, deletedAt: null } });
  if (!original) return null;
  return prisma.form.create({
    data: {
      name: `${original.name} (Copy)`,
      data: original.data as Prisma.InputJsonValue,
      hits: 0,
      orders: 0,
      createdById,
    },
  });
}
