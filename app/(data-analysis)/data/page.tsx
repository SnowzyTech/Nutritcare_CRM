import { SalesRepListClient } from "./_components/SalesRepListClient";
import { getSalesRepsList } from "@/modules/data-analysis/services/data-analysis.service";

export default async function DataDashboard() {
  const reps = await getSalesRepsList();
  return <SalesRepListClient initialReps={reps} />;
}
