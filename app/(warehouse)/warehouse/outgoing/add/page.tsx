import type { Metadata } from "next";
import AddOutgoingClient from "./client";

export const metadata: Metadata = { title: "Add Outgoing Stock" };

export default async function AddOutgoingPage() {
  return <AddOutgoingClient />;
}
