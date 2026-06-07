"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateDeliveryFeeSchema = z.object({
  orderId: z.string().min(1),
  deliveryFee: z.coerce.number().min(0),
});

export async function updateOrderDeliveryFeeAction(input: z.infer<typeof updateDeliveryFeeSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = updateDeliveryFeeSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { id: true, orderNumber: true, agentId: true, deliveryFee: true },
  });
  if (!order) return { error: "Order not found" };

  const previousFee = Number(order.deliveryFee);
  const newFee = parsed.data.deliveryFee;

  await prisma.order.update({
    where: { id: parsed.data.orderId },
    data: { deliveryFee: newFee },
  });

  // Notify the delivery agent (a User linked to the order's Agent) whenever the
  // fee actually changes. User.agentId is unique, so there is at most one.
  if (order.agentId && previousFee !== newFee) {
    const agentUser = await prisma.user.findFirst({
      where: { agentId: order.agentId },
      select: { id: true },
    });
    if (agentUser) {
      await prisma.notification.create({
        data: {
          recipientId: agentUser.id,
          title: "Delivery Fee Updated",
          message: `The delivery fee for order ${order.orderNumber} was changed from ${formatCurrency(previousFee)} to ${formatCurrency(newFee)} by the accounting team.`,
          type: "delivery_fee_changed",
          link: `/delivery-agents/${order.id}`,
          entityType: "Order",
          entityId: order.id,
        },
      });
    }
  }

  revalidatePath("/accounting/sales-record");
  revalidatePath(`/accounting/sales-record/${parsed.data.orderId}`);
  return { ok: true };
}
