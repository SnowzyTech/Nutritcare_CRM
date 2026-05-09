import type { Metadata } from "next";
import { getOutgoingMovements } from "@/modules/inventory/services/inventory.service";
import OutgoingClient from "./client";

export const metadata: Metadata = { title: "Outgoing" };

export default async function OutgoingPage() {
  const items = await getOutgoingMovements();

  return (
    <div className="h-full flex flex-col">
      <OutgoingClient items={items} />
    </div>
  );
}
