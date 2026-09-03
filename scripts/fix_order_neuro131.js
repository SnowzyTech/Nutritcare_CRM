const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const orderNumber = 'NEURO-131';

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, deliveries: true },
  });

  if (!order) {
    console.log("Order not found");
    return;
  }

  if (order.status !== 'DELIVERED') {
    console.log(`Order status is ${order.status}, expected DELIVERED.`);
  }

  const agentId = order.agentId;
  
  if (!agentId) {
    console.log("No agent assigned to this order.");
    return;
  }

  // Use a transaction to ensure all operations succeed or fail together
  await prisma.$transaction(async (tx) => {
    // 1. Update order status to CONFIRMED
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED' },
    });
    console.log(`Updated order ${orderNumber} status to CONFIRMED.`);

    // 2. Revert deliveries to DISPATCHED or PENDING_DISPATCH
    for (const delivery of order.deliveries) {
      if (delivery.status === 'DELIVERED') {
        await tx.delivery.update({
          where: { id: delivery.id },
          data: { status: 'PENDING_DISPATCH', deliveredTime: null },
        });
        console.log(`Reverted delivery ${delivery.id} status to PENDING_DISPATCH.`);
      }
    }

    // 3. Return stock to the agent
    for (const item of order.items) {
      const stockLevel = await tx.stockLevel.findFirst({
        where: {
          locationId: agentId,
          productId: item.productId,
          locationKind: 'AGENT'
        }
      });

      if (stockLevel) {
        await tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: { quantity: { increment: item.quantity } }
        });
        console.log(`Restored ${item.quantity} units of product ${item.productId} to agent ${agentId} stock level.`);
      } else {
        // If it doesn't exist, create it (though unlikely if it was deducted)
        await tx.stockLevel.create({
          data: {
            locationId: agentId,
            productId: item.productId,
            locationKind: 'AGENT',
            quantity: item.quantity
          }
        });
        console.log(`Created new stock level and added ${item.quantity} units for product ${item.productId} to agent ${agentId}.`);
      }
    }
  });

  console.log("Successfully reverted order and restored stock.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
