import { Suspense } from 'react';
import { ReportShell } from '../../_components/ReportShell';
import {
  getRevenueByProduct,
  monthRange,
} from '@/modules/finance/services/reports-accounting.service';

// Parse the `current` param into a local first-of-month Date. Accepts the
// timezone-neutral `YYYY-MM` token (preferred) and falls back to a raw ISO
// string for backward compatibility. Building a local date from explicit
// year/month keeps monthRange() correct regardless of the server timezone.
function parseMonth(v: string | string[] | undefined, fallback: Date): Date {
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, 1);
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return fallback;
}

export default async function RevenueByProductPage({
  searchParams,
}: {
  // Next 16: searchParams is a Promise and must be awaited before reading it.
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const cur = parseMonth(params.current, now);
  const data = await getRevenueByProduct(monthRange(cur));
  return (
    <Suspense>
      <ReportShell tab="revenue-by-product" data={data} />
    </Suspense>
  );
}
