import { Suspense } from 'react';
import { ReportShell } from '../../_components/ReportShell';
import {
  getTrialBalance,
  monthRange,
} from '@/modules/finance/services/reports-accounting.service';

function parseDate(v: string | string[] | undefined, fallback: Date): Date {
  if (typeof v !== 'string') return fallback;
  const d = new Date(v);
  return isNaN(d.getTime()) ? fallback : d;
}

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const now = new Date();
  const cur = parseDate(searchParams.current, now);
  const data = await getTrialBalance(monthRange(cur));
  return (
    <Suspense>
      <ReportShell tab="trial-balance" data={data} />
    </Suspense>
  );
}
