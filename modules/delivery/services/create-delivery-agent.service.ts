import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
  let password = "DA@";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export interface CreateDeliveryAgentInput {
  name: string;
  email: string;
  phone: string;
  phone2?: string;
  phone3?: string;
  address?: string;
  state?: string;
  country?: string;
  statesCovered?: string[];
  picksFromOfficeStock?: boolean;
  addedById: string;
}

export async function createDeliveryAgentWithUser(input: CreateDeliveryAgentInput) {
  const [existingEmail, existingPhone] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email }, select: { id: true } }),
    prisma.agent.findUnique({ where: { phone1: input.phone }, select: { id: true } }),
  ]);

  if (existingEmail) throw new Error("A user with this email already exists.");
  if (existingPhone) throw new Error("An agent with this phone number already exists.");

  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const { user, agent } = await prisma.$transaction(async (tx) => {
    const agent = await tx.agent.create({
      data: {
        companyName: input.name,
        phone1: input.phone,
        phone2: input.phone2,
        phone3: input.phone3,
        address: input.address,
        state: input.state,
        country: input.country,
        statesCovered: input.statesCovered ?? [],
        picksFromOfficeStock: input.picksFromOfficeStock ?? false,
        status: "ACTIVE",
        addedById: input.addedById,
      },
    });

    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: "DELIVERY_AGENT",
        phone: input.phone,
        isActive: true,
        accountActivationStatus: "APPROVED",
        agentId: agent.id,
      },
    });

    return { user, agent };
  });

  return {
    agentId: agent.id,
    userId: user.id,
    name: agent.companyName,
    email: user.email,
    tempPassword,
  };
}
