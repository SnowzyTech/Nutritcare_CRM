const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const orderId = "cmtjwg8f70003awi9k3i8wz7y";
  const agentId = "cmsndpvrt005ahxmcy3rbj858";
  const productId = "cmsely6b90004fdoolfekbbwi";

  // Check stock level
  const stockLevel = await prisma.stockLevel.findFirst({
    where: {
      locationId: agentId,
      productId: productId,
      locationKind: "AGENT"
    }
  });
  console.log("Current stockLevel:", stockLevel);

  // Look for recent stock movements for this agent
  const movements = await prisma.stockMovement.findMany({
    where: {
      agentId: agentId,
      createdAt: { gte: new Date('2026-09-02T09:30:00.000Z') }
    },
    include: { items: true }
  });
  console.log("Recent stock movements for agent:", JSON.stringify(movements, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
