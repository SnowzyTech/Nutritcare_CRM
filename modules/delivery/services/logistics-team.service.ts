import { prisma } from "@/lib/db/prisma";
import { getStaffByRole } from "@/modules/users/services/users.service";

export type LogisticsManagerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  isTeamLead: boolean;
  createdAt: Date;
  avatarUrl: string | null;
};

export async function getLogisticsManagerStaff(): Promise<LogisticsManagerRow[]> {
  return getStaffByRole("LOGISTICS_MANAGER");
}

export async function getLogisticsManagerById(id: string): Promise<LogisticsManagerRow | null> {
  const staff = await getLogisticsManagerStaff();
  return staff.find((s) => s.id === id) ?? null;
}

export type LogisticsMovementRow = {
  id: string;
  date: Date;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  link: string | null;
};

const LOGISTICS_ENTITY_TYPES = ["Order", "StockMovement", "StockTransfer"];

export async function getLogisticsManagerMovements(userId: string): Promise<LogisticsMovementRow[]> {
  const logs = await prisma.auditLog.findMany({
    where: { userId, entityType: { in: LOGISTICS_ENTITY_TYPES } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return logs.map((log) => {
    const details = log.details as { description?: string } | null;
    return {
      id: log.id,
      date: log.createdAt,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      description: details?.description ?? log.action,
      link: log.entityType === "Order" ? `/logistics/orders/${log.entityId}` : null,
    };
  });
}
