import type { Metadata } from "next";
import AddReturnClient from "./client";

export const metadata: Metadata = { title: "Add Return" };

export default async function AddReturnPage() {
  return <AddReturnClient />;
}
