import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  whatsapp?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role ?? "SALES_REP",
      phone: data.phone ?? null,
      whatsappNumber: data.whatsapp ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      whatsappNumber: true,
      createdAt: true,
    },
  });
}

export async function verifyPassword(
  plaintext: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hashed);
}
