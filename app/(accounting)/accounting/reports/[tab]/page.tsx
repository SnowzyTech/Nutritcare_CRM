import { redirect } from 'next/navigation';

export default function CatchAll() {
  redirect('/accounting/reports/profit-loss');
}
