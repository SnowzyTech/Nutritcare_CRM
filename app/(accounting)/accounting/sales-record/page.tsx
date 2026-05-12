import { SalesRecordClient } from "../_components/SalesRecordClient";
import { getSalesRecords, getSalesRecordFilterOptions } from "@/modules/finance/services/sales-record.service";

export default async function SalesRecordPage() {
  const [records, options] = await Promise.all([
    getSalesRecords(),
    getSalesRecordFilterOptions(),
  ]);
  return <SalesRecordClient initialRecords={records} products={options.products} agents={options.agents} />;
}
