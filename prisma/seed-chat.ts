/**
 * Chat backfill — idempotent.
 *
 * For every existing (non-deleted) agent, ensure an AGENT_GROUP conversation
 * exists and is seated with all active internal (non delivery-agent) users plus
 * the agent's own delivery-agent user. Safe to re-run; createMany uses
 * skipDuplicates so it only fills gaps.
 *
 * Run:  npm run db:seed:chat
 */

import { PrismaClient } from "@prisma/client";

function createClient() {
  const url = process.env.DATABASE_URL ?? "";
  if (url.includes("neon.tech")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool, neonConfig } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    neonConfig.webSocketConstructor = require("ws");
    const pool = new Pool({ connectionString: url });
    return new PrismaClient({ adapter: new PrismaNeon(pool) } as never);
  }
  return new PrismaClient();
}

const prisma = createClient() as PrismaClient;

async function main() {
  const [agents, internalUsers] = await Promise.all([
    prisma.agent.findMany({
      where: { deletedAt: null },
      select: { id: true, companyName: true, user: { select: { id: true } } },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { not: "DELIVERY_AGENT" } },
      select: { id: true },
    }),
  ]);

  const internalIds = internalUsers.map((u) => u.id);
  let created = 0;
  let seated = 0;

  for (const agent of agents) {
    let conversation = await prisma.conversation.findUnique({
      where: { agentId: agent.id },
      select: { id: true },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { type: "AGENT_GROUP", agentId: agent.id, title: agent.companyName },
        select: { id: true },
      });
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          type: "SYSTEM",
          body: `Group created for ${agent.companyName}.`,
        },
      });
      created++;
    }

    const memberIds = new Set<string>(internalIds);
    if (agent.user?.id) memberIds.add(agent.user.id);

    const res = await prisma.conversationMember.createMany({
      data: [...memberIds].map((userId) => ({
        conversationId: conversation!.id,
        userId,
      })),
      skipDuplicates: true,
    });
    seated += res.count;
  }

  console.log(
    `Chat backfill complete: ${agents.length} agent(s), ${created} new group(s), ${seated} membership(s) added.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
