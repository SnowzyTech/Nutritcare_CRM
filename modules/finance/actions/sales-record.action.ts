"use server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
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

  await prisma.order.update({
    where: { id: parsed.data.orderId },
    data: { deliveryFee: parsed.data.deliveryFee },
  });

  revalidatePath("/accounting/sales-record");
  revalidatePath(`/accounting/sales-record/${parsed.data.orderId}`);
  return { ok: true };
}
