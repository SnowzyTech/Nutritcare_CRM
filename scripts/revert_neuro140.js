const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const orderNumber = 'NEURO-140';

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { deliveries: true },
  });

  if (!order) {
    console.log("Order not found");
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update order status to PENDING
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'PENDING' },
    });
    console.log(`Updated order ${orderNumber} status to PENDING.`);

    // 2. Delete any deliveries
    for (const delivery of order.deliveries) {
      await tx.delivery.delete({
        where: { id: delivery.id },
      });
      console.log(`Deleted delivery ${delivery.id}.`);
    }
  });

  console.log(`Successfully reverted ${orderNumber} to PENDING.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
