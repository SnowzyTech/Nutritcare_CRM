import { SalesRepSummaryClient } from "../../_components/SalesRepSummaryClient";

export default async function SalesRepSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SalesRepSummaryClient id={id} />;
}
