import { Suspense } from 'react';
import { ReportShell } from '../../_components/ReportShell';
import {
  getCashFlow,
  monthRange,
  previousMonthRange,
} from '@/modules/finance/services/reports-accounting.service';

function parseDate(v: string | string[] | undefined, fallback: Date): Date {
  if (typeof v !== 'string') return fallback;
  const d = new Date(v);
  return isNaN(d.getTime()) ? fallback : d;
}

export default async function CashFlowPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const now = new Date();
  const cur = parseDate(searchParams.current, now);
  const pri = parseDate(searchParams.prior, previousMonthRange(cur).from);
  const data = await getCashFlow({
    current: monthRange(cur),
    prior: monthRange(pri),
  });
  return (
    <Suspense>
      <ReportShell tab="statement-of-cash-flow" data={data} />
    </Suspense>
  );
}
