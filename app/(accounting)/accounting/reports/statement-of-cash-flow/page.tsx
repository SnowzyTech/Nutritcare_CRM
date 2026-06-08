import { Suspense } from 'react';
import { ReportShell } from '../../_components/ReportShell';
import {
  getCashFlow,
  monthRange,
  previousMonthRange,
} from '@/modules/finance/services/reports-accounting.service';

// Timezone-neutral first-of-month from a `YYYY-MM` token (tolerates legacy ISO).
function parseMonth(v: string | string[] | undefined, fallback: Date): Date {
  if (typeof v !== 'string') return fallback;
  const m = v.match(/^(\d{4})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return fallback;
}

export default async function CashFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { current, prior } = await searchParams;
  const now = new Date();
  const cur = parseMonth(current, now);
  const pri = parseMonth(prior, previousMonthRange(cur).from);
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
