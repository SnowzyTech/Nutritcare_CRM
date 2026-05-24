import { Suspense } from 'react';
import { ReportShell } from '../../_components/ReportShell';
import {
  getRevenueByProduct,
  monthRange,
} from '@/modules/finance/services/reports-accounting.service';

function parseDate(v: string | string[] | undefined, fallback: Date): Date {
  if (typeof v !== 'string') return fallback;
  const d = new Date(v);
  return isNaN(d.getTime()) ? fallback : d;
}

export default async function RevenueByProductPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const now = new Date();
  const cur = parseDate(searchParams.current, now);
  const data = await getRevenueByProduct(monthRange(cur));
  return (
    <Suspense>
      <ReportShell tab="revenue-by-product" data={data} />
    </Suspense>
  );
}
