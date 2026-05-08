import type { Metadata } from "next";
import { locationBins } from "@/lib/mock-data/warehouse";
import LocationManagementClient from "./client";

export const metadata: Metadata = { title: "Location Management" };

const summaryData = [
  { bin: "A1", product: "Balm", qty: "80" },
  { bin: "A2", product: "Proxact", qty: "60" },
  { bin: "A3", product: "Trim & Tone", qty: "120 (Partial)" },
  { bin: "B3", product: "Balm", qty: "-(Damaged)" },
  { bin: "C1", product: "Vitorep", qty: "100" },
];

export default async function LocationManagementPage() {
  return (
    <LocationManagementClient initialBins={locationBins} summaryData={summaryData} />
  );
}
