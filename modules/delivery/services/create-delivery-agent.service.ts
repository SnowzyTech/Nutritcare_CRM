import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { createAgentGroup } from "@/modules/chat/services/conversations.service";
import { agentHasRecords, purgeAgentCompletely } from "./agents.service";

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
  deliveryFee?: number;
  addedById: string;
}

export async function createDeliveryAgentWithUser(input: CreateDeliveryAgentInput) {
  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const { user, agent } = await prisma.$transaction(async (tx) => {
    // Resolve collisions on the globally-unique email / phone1 inside the
    // transaction so release-then-create is atomic. A leftover of a previously
    // removed agent (soft-deleted with no records) is purged to free its slot;
    // any active conflict is refused.
    const emailUser = await tx.user.findUnique({
      where: { email: input.email },
      select: { role: true, agent: { select: { id: true, deletedAt: true } } },
    });
    if (emailUser) {
      const conflictAgent = emailUser.agent;
      const isPurgeableLeftover =
        emailUser.role === "DELIVERY_AGENT" &&
        conflictAgent !== null &&
        conflictAgent.deletedAt !== null &&
        !(await agentHasRecords(tx, conflictAgent.id));
      if (isPurgeableLeftover && conflictAgent) {
        await purgeAgentCompletely(tx, conflictAgent.id);
      } else {
        throw new Error("A user with this email already exists.");
      }
    }

    const phoneAgent = await tx.agent.findUnique({
      where: { phone1: input.phone },
      select: { id: true, deletedAt: true },
    });
    if (phoneAgent) {
      const isPurgeableLeftover =
        phoneAgent.deletedAt !== null && !(await agentHasRecords(tx, phoneAgent.id));
      if (isPurgeableLeftover) {
        await purgeAgentCompletely(tx, phoneAgent.id);
      } else {
        throw new Error("An agent with this phone number already exists.");
      }
    }

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
        deliveryFee: input.deliveryFee ?? null,
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

    // Spin up the agent's group chat and seat all internal users + this DA.
    await createAgentGroup(tx, {
      agentId: agent.id,
      agentName: agent.companyName,
      daUserId: user.id,
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
