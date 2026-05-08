import type { Metadata } from "next";
import { incomingGoods } from "@/lib/mock-data/warehouse";
import IncomingGoodsClient from "./client";

export const metadata: Metadata = { title: "Incoming Goods" };

export default async function IncomingGoodsPage() {
  // In a real app this would be an awaited DB/API call
  const goods = incomingGoods;

  return (
    <div className="h-full flex flex-col">
      <IncomingGoodsClient goods={goods} />
    </div>
  );
}
