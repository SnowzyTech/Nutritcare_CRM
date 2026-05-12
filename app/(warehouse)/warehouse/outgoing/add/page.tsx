import type { Metadata } from "next";
import {
  getAgentsForOutgoingForm,
  getProductsForOutgoingForm,
} from "@/modules/warehouse/services/warehouse.service";
import AddOutgoingClient from "./client";

export const metadata: Metadata = { title: "Add Outgoing Stock" };

export default async function AddOutgoingPage() {
  const [agents, products] = await Promise.all([
    getAgentsForOutgoingForm(),
    getProductsForOutgoingForm(),
  ]);

  return <AddOutgoingClient agents={agents} products={products} />;
}
