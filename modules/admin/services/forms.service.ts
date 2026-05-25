import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export async function getAllForms() {
  return prisma.form.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, hits: true, orders: true, data: true, createdAt: true },
  });
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
