import { Suspense } from 'react';
import { ReportShell } from '../../_components/ReportShell';
import {
  getExpenseLedgerReport,
  monthRange,
} from '@/modules/finance/services/reports-accounting.service';

// Parse a month selection into a timezone-neutral first-of-month date. Accepts a
// `YYYY-MM` token (preferred) and also tolerates a legacy full ISO string by
// reading only its leading year-month, so the period never drifts across the UTC
// boundary.
function parseMonth(v: string | string[] | undefined, fallback: Date): Date {
  if (typeof v !== 'string') return fallback;
  const m = v.match(/^(\d{4})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return fallback;
}

export default async function ExpenseLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { current } = await searchParams;
  const now = new Date();
  const cur = parseMonth(current, now);
  const data = await getExpenseLedgerReport(monthRange(cur));
  return (
    <Suspense>
      <ReportShell tab="expense-ledger" data={data} />
    </Suspense>
  );
}
