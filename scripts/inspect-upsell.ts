import { prisma } from "../lib/db/prisma";

async function main() {
  const items = await prisma.orderItem.findMany({
    where: { upsellQuantity: { gt: 0 } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      quantity: true,
      unitPrice: true,
      lineTotal: true,
      isUpsell: true,
      upsellAmount: true,
      upsellQuantity: true,
      product: { select: { name: true } },
      order: { select: { orderNumber: true, totalAmount: true } },
    },
  });
  if (items.length === 0) {
    console.log("No order items with upsellQuantity > 0 yet.");
  }
  for (const it of items) {
    console.log(
      `Order #${it.order.orderNumber} | ${it.product.name}\n` +
        `  line quantity=${it.quantity}  (of which upsold: upsellQuantity=${it.upsellQuantity})\n` +
        `  lineTotal=₦${it.lineTotal}  upsellAmount=₦${it.upsellAmount}  unitPrice=₦${it.unitPrice}\n` +
        `  isUpsell(flag)=${it.isUpsell}  orderTotal=₦${it.order.totalAmount}\n`
    );
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERR", e);
  process.exitCode = 1;
});
