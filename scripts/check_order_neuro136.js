const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const orderNumber = 'NEURO-136';

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  console.log(JSON.stringify(order, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
