import type { Metadata } from "next";
import { getReturnedMovements } from "@/modules/inventory/services/inventory.service";
import ReturnsClient from "./client";

export const metadata: Metadata = { title: "Returns" };

export default async function ReturnsPage() {
  const items = await getReturnedMovements();

  return (
    <div className="h-full flex flex-col">
      <ReturnsClient items={items} />
    </div>
  );
}
