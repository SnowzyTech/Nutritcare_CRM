import type { Metadata } from "next";
import FormsListClient from "@/components/dashboard/forms/FormsListClient";

export const metadata: Metadata = { title: "Forms" };

export default function FormsPage() {
  return <FormsListClient />;
}
