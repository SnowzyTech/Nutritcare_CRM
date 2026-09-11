import { Suspense } from "react";
import { SalesRecordClient } from "../_components/SalesRecordClient";
import { getSalesRecords, getSalesRecordFilterOptions } from "@/modules/finance/services/sales-record.service";

export default async function SalesRecordPage() {
  const [records, options] = await Promise.all([
    getSalesRecords(),
    getSalesRecordFilterOptions(),
  ]);
  // The client reads its filter state out of the query string (useSearchParams),
  // which has to sit under a Suspense boundary.
  return (
    <Suspense>
      <SalesRecordClient initialRecords={records} products={options.products} agents={options.agents} states={options.states} />
    </Suspense>
  );
}
