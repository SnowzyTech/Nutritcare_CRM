'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProfitAndLossView } from './ProfitAndLossView';
import { BalanceSheetView } from './BalanceSheetView';
import { CashFlowView } from './CashFlowView';
import { RevenueByProductView } from './RevenueByProductView';
import { InventoryValuationView } from './InventoryValuationView';
import { ExpenseLedgerView } from './ExpenseLedgerView';
import { DeliveryTrackerView } from './DeliveryTrackerView';
import { TrialBalanceView } from './TrialBalanceView';

const TAB_LABELS: Record<string, string> = {
  'profit-loss': 'Profit & Loss',
  'statement-of-financial-position': 'Balance Sheet',
  'statement-of-cash-flow': 'Statement of Cash Flow',
  'revenue-by-product': 'Revenue By Product',
  'inventory-valuation': 'Inventory Valuation',
  'expense-ledger': 'Expense Ledger',
  'delivery-tracker': 'Delivery Tracker',
  'trial-balance': 'Trial Balance',
};

interface Props {
  tab: string;
  data: any;
}

export function ReportShell({ tab, data }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const now = new Date();

  const parseDate = (key: string, fallback: Date): Date => {
    const v = searchParams.get(key);
    if (!v) return fallback;
    const d = new Date(v);
    return isNaN(d.getTime()) ? fallback : d;
  };

  const currentDate = parseDate('current', now);
  const priorDate = parseDate(
    'prior',
    new Date(now.getFullYear(), now.getMonth() - 1, 1)
  );

  const onDateChange = (key: 'current' | 'prior', iso: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, iso);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const label = TAB_LABELS[tab] ?? 'Report';

  return (
    <>
      <div className="mb-8">
        <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">{label}</h2>
        <p className="text-gray-400 text-[14px]">Financial reporting for the selected period</p>
      </div>

      {tab === 'profit-loss' && (
        <ProfitAndLossView
          data={data}
          currentDate={currentDate}
          priorDate={priorDate}
          onDateChange={onDateChange}
        />
      )}
      {tab === 'statement-of-financial-position' && (
        <BalanceSheetView
          data={data}
          currentDate={currentDate}
          priorDate={priorDate}
          onDateChange={onDateChange}
        />
      )}
      {tab === 'statement-of-cash-flow' && (
        <CashFlowView
          data={data}
          currentDate={currentDate}
          priorDate={priorDate}
          onDateChange={onDateChange}
        />
      )}
      {tab === 'revenue-by-product' && (
        <RevenueByProductView
          data={data}
          currentDate={currentDate}
          onDateChange={onDateChange}
        />
      )}
      {tab === 'inventory-valuation' && (
        <InventoryValuationView
          data={data}
          currentDate={currentDate}
          onDateChange={onDateChange}
        />
      )}
      {tab === 'expense-ledger' && (
        <ExpenseLedgerView
          data={data}
          currentDate={currentDate}
          onDateChange={onDateChange}
        />
      )}
      {tab === 'delivery-tracker' && (
        <DeliveryTrackerView
          data={data}
          currentDate={currentDate}
          onDateChange={onDateChange}
        />
      )}
      {tab === 'trial-balance' && (
        <TrialBalanceView
          data={data}
          currentDate={currentDate}
          onDateChange={onDateChange}
        />
      )}
    </>
  );
}
