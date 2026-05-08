import type { Metadata } from "next";
import { pickPackOrders } from "@/lib/mock-data/warehouse";
import PickAndPackClient from "./client";

export const metadata: Metadata = { title: "Pick & Pack" };

export default async function PickAndPackPage() {
  return <PickAndPackClient initialOrders={pickPackOrders} />;
}
