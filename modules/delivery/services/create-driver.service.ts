import { prisma } from "@/lib/db/prisma";

export interface CreateDriverInput {
  name: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  address?: string;
  state?: string;
  country?: string;
  statesCovered?: string[];
  addedById: string;
}

export async function createDriver(input: CreateDriverInput) {
  const existingPhone = await prisma.agent.findUnique({
    where: { phone1: input.phone },
    select: { id: true },
  });

  if (existingPhone) throw new Error("An agent or driver with this phone number already exists.");

  const driver = await prisma.agent.create({
    data: {
      companyName: input.name,
      phone1: input.phone,
      phone2: input.phone2,
      phone3: input.phone3,
      address: input.address,
      state: input.state,
      country: input.country,
      statesCovered: input.statesCovered ?? [],
      status: "ACTIVE",
      addedById: input.addedById,
    },
  });

  return driver;
}
