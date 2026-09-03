import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findUnique({
    where: { orderNumber: 'NEURO-131' },
    include: { items: true, agent: true, deliveries: true },
  });
  console.log(JSON.stringify(order, null, 2));

  if (!order) {
    console.log("Order not found");
    return;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
