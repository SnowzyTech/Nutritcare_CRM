const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const orderNumber = 'NEURO-136';

  const order = await prisma.order.findUnique({
    where: { orderNumber },
  });

  if (!order) {
    console.log("Order not found");
    return;
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      netAmount: 30500,
      discountAmount: 19500,
      discountPercent: 39
    }
  });

  console.log(`Updated order ${orderNumber} price to 30,500. New netAmount: ${updatedOrder.netAmount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
