import type { Metadata } from "next";
import { returnItems } from "@/lib/mock-data/warehouse";
import ReturnsClient from "./client";

export const metadata: Metadata = { title: "Returns" };

export default async function ReturnsPage() {
  const items = returnItems;

  return (
    <div className="h-full flex flex-col">
      <ReturnsClient items={items} />
    </div>
  );
}
