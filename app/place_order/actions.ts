"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function createMockOrderAction(data: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  state: string;
  lga: string;
  items: { productId: string; quantity: number }[];
}) {
  try {
    // 1. Find or create customer (since phone is not unique in schema, we use findFirst)
    let customer = await prisma.customer.findFirst({
      where: { phone: data.customerPhone },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: data.customerName,
          email: data.customerEmail || null,
          deliveryAddress: data.deliveryAddress,
          state: data.state,
          lga: data.lga,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail || null,
          deliveryAddress: data.deliveryAddress,
          state: data.state,
          lga: data.lga,
        },
      });
    }

    // 2. Find a sales rep to assign to (fallback to first available)
    const salesRep = await prisma.user.findFirst({
      where: { role: "SALES_REP", isActive: true },
    });

    if (!salesRep) {
      throw new Error("No active sales representative found to assign the order.");
    }

    // 3. Generate Order Number
    const orderCount = await prisma.order.count();
    const orderNumber = `EXT-${String(orderCount + 1).padStart(5, "0")}`;

    // 4. Calculate amounts and items
    const products = await prisma.product.findMany({
      where: { id: { in: data.items.map((i) => i.productId) } },
    });

    const productMap = new Map<string, any>(products.map((p) => [p.id, p]));
    let totalAmount = 0;

    const orderItemsData = data.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const unitPrice = Number(product.sellingPrice);
      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

    // 5. Create Order and items in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          salesRepId: salesRep.id,
          totalAmount,
          netAmount: totalAmount,
          status: "PENDING",
          items: {
            create: orderItemsData,
          },
        },
      });
      return newOrder;
    });

    revalidatePath("/admin/orders");
    revalidatePath("/sales-rep/orders");

    return { success: true, orderNumber: order.orderNumber };
  } catch (error: any) {
    console.error("Error creating mock order:", error);
    return { error: error.message || "Failed to place order" };
  }
}
