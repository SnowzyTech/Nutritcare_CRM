import { SalesRepSummaryClient } from "../../_components/SalesRepSummaryClient";
import { getSalesRepProfile } from "@/modules/data-analysis/services/data-analysis.service";
import { notFound } from "next/navigation";

export default async function SalesRepSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repData = await getSalesRepProfile(id);

  if (!repData) {
    notFound();
  }

  return <SalesRepSummaryClient repData={repData} />;
}
