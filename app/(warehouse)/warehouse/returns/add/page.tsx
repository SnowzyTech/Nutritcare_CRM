import type { Metadata } from "next";
import {
  getAgentsForReturnForm,
  getProductsForReturnForm,
} from "@/modules/warehouse/services/warehouse.service";
import AddReturnClient from "./client";

export const metadata: Metadata = { title: "Add Return" };

export default async function AddReturnPage() {
  const [agents, products] = await Promise.all([
    getAgentsForReturnForm(),
    getProductsForReturnForm(),
  ]);

  return <AddReturnClient agents={agents} products={products} />;
}
