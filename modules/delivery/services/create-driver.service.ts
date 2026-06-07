import { prisma } from "@/lib/db/prisma";

export interface CreateDriverInput {
  name: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  address?: string;
  state?: string;
  country?: string;
  vehicleNo?: string;
  addedById: string;
}

export async function createDriver(input: CreateDriverInput) {
  const existingPhone = await prisma.driver.findUnique({
    where: { phone1: input.phone },
    select: { id: true },
  });

  if (existingPhone) throw new Error("A driver with this phone number already exists.");

  return prisma.driver.create({
    data: {
      name: input.name,
      phone1: input.phone,
      phone2: input.phone2,
      phone3: input.phone3,
      address: input.address,
      state: input.state,
      country: input.country,
      vehicleNo: input.vehicleNo,
      status: "ACTIVE",
      addedById: input.addedById,
    },
  });
}

export async function getDriverById(id: string) {
  return prisma.driver.findFirst({
    where: { id, deletedAt: null },
    include: { addedBy: { select: { name: true } } },
  });
}

export async function getDriversList() {
  return prisma.driver.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone1: true,
      phone2: true,
      phone3: true,
      state: true,
      address: true,
      country: true,
      vehicleNo: true,
      status: true,
      createdAt: true,
      addedBy: { select: { name: true } },
    },
  });
}

export async function softDeleteDriver(id: string) {
  return prisma.driver.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
