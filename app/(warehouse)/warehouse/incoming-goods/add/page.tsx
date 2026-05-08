import type { Metadata } from "next";
import AddIncomingGoodsClient from "./client";

export const metadata: Metadata = { title: "Add Incoming Goods" };

export default function AddIncomingGoodsPage() {
  return <AddIncomingGoodsClient />;
}
