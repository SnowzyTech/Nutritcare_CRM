import { prisma } from "@/lib/db/prisma";

export async function listSalaryRecords(filters: {
  company?: string;
  department?: string;
  designation?: string;
  level?: string;
  search?: string;
} = {}) {
  return prisma.salaryRecord.findMany({
    where: {
      ...(filters.company && filters.company !== "All" ? { company: filters.company } : {}),
      ...(filters.department && filters.department !== "All" ? { department: filters.department } : {}),
      ...(filters.designation && filters.designation !== "All" ? { designation: filters.designation } : {}),
      ...(filters.level && filters.level !== "All" ? { level: filters.level } : {}),
      ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}
