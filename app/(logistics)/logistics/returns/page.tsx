import { getReturnedMovements } from "@/modules/inventory/services/inventory.service";
import { LogisticsReturnsClient } from "./returns-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Returns" };

export default async function LogisticsReturnsPage() {
  const returns = await getReturnedMovements();
  return <LogisticsReturnsClient returns={returns} />;
}
