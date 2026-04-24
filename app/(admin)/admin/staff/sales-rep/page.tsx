import type { Metadata } from "next";
import { getSalesRepsList } from "@/modules/users/services/users.service";
import SalesRepListClient from "./sales-rep-list-client";

export const metadata: Metadata = { title: "Sales Representatives" };

export default async function SalesRepPage() {
  const reps = await getSalesRepsList();
  return <SalesRepListClient reps={reps} />;
}
