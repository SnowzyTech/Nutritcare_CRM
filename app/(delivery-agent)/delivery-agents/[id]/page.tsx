import { auth } from "@/lib/auth/auth";
import { redirect, notFound } from "next/navigation";
import {
  getAgentIdByUserId,
  getAgentOrderById,
} from "@/modules/delivery/services/delivery-agent-portal.service";
import { OrderDetailClient } from "./order-detail-client";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) redirect("/delivery-agents");

  const raw = await getAgentOrderById(id, agentId);
  if (!raw) notFound();

  // Serialize Prisma Decimal fields to plain numbers for the client component
  const order = {
    ...raw,
    deliveryFee: Number(raw.deliveryFee),
    netAmount: Number(raw.netAmount),
    failureReason: raw.deliveries[0]?.failureReason ?? null,
    items: raw.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };

  return <OrderDetailClient order={order} user={session.user} />;
}
