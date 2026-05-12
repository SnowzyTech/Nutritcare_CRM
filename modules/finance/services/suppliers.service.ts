import { prisma } from "@/lib/db/prisma";

export async function listSuppliers(filters: { search?: string } = {}) {
  return prisma.supplier.findMany({
    where: {
      deletedAt: null,
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { phone1: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });
}
