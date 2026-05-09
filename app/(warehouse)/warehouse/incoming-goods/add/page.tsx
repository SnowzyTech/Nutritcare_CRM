import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import {
  getSuppliersForIncomingForm,
  getProductsForReturnForm,
} from "@/modules/warehouse/services/warehouse.service";
import { prisma } from "@/lib/db/prisma";
import AddIncomingGoodsClient from "./client";

export const metadata: Metadata = { title: "Add Incoming Goods" };

export default async function AddIncomingGoodsPage() {
  const session = await auth();
  const warehouseId = session?.user?.warehouseId ?? null;

  if (!warehouseId) redirect("/warehouse/incoming-goods");

  const [suppliers, products, warehouse] = await Promise.all([
    getSuppliersForIncomingForm(),
    getProductsForReturnForm(),
    prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <AddIncomingGoodsClient
      suppliers={suppliers}
      products={products}
      warehouseName={warehouse?.name ?? "Your Warehouse"}
    />
  );
}
