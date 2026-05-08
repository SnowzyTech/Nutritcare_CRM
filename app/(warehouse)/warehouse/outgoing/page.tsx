import type { Metadata } from "next";
import { outgoingOrders } from "@/lib/mock-data/warehouse";
import OutgoingClient from "./client";

export const metadata: Metadata = { title: "Outgoing" };

export default async function OutgoingPage() {
  const items = outgoingOrders;

  return (
    <div className="h-full flex flex-col">
      <OutgoingClient items={items} />
    </div>
  );
}
