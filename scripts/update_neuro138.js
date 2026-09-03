const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const orderNumber = 'NEURO-138';
  const newNetAmount = 35500;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
  });

  if (!order) {
    console.log("Order not found");
    return;
  }

  const totalAmount = Number(order.totalAmount);
  const discountAmount = totalAmount - newNetAmount;
  const discountPercent = (discountAmount / totalAmount) * 100;

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      netAmount: newNetAmount,
      discountAmount: discountAmount,
      discountPercent: discountPercent
    }
  });

  console.log(`Updated order ${orderNumber}.`);
  console.log(`Total: ${updatedOrder.totalAmount}, Net: ${updatedOrder.netAmount}, Discount: ${updatedOrder.discountAmount} (${updatedOrder.discountPercent}%)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
