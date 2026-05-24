import { Suspense } from 'react';
import { ReportShell } from '../../_components/ReportShell';
import {
  getInventoryValuation,
  monthRange,
} from '@/modules/finance/services/reports-accounting.service';

function parseDate(v: string | string[] | undefined, fallback: Date): Date {
  if (typeof v !== 'string') return fallback;
  const d = new Date(v);
  return isNaN(d.getTime()) ? fallback : d;
}

export default async function InventoryValuationPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const now = new Date();
  const cur = parseDate(searchParams.current, now);
  const data = await getInventoryValuation(monthRange(cur));
  return (
    <Suspense>
      <ReportShell tab="inventory-valuation" data={data} />
    </Suspense>
  );
}
