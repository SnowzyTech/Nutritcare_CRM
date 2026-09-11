'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Wallet,
  Building2,
  Phone,
  MapPin,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { OrderRemittanceInfo } from '@/modules/finance/services/sales-record.service';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RemittanceInfoModalProps {
  /** `null` when the order lookup found nothing — the modal renders an error state. */
  remittance: OrderRemittanceInfo | null;
  orderNumber: string;
  onClose: () => void;
  /** Deep-links into the Remittance Entry tab with this order preselected. */
  onRecordRemittance: () => void;
  /** True when the order is eligible to be remitted right now. */
  canRemit: boolean;
}

const PENDING_COPY: Record<
  NonNullable<OrderRemittanceInfo['pendingReason']>,
  { title: string; body: string }
> = {
  NO_AGENT: {
    title: 'No delivery agent on this order',
    body: 'Remittance is tracked per agent. Assign an agent and mark the order delivered before a remittance can be recorded.',
  },
  NOT_DELIVERED: {
    title: 'Not delivered yet',
    body: 'An agent only owes the company once the order is delivered and the cash is collected. Nothing has been raised on the ledger for this order.',
  },
  AWAITING_REMITTANCE: {
    title: 'Awaiting remittance',
    body: 'The agent has collected on this order but has not remitted it yet. It still sits on their outstanding balance.',
  },
  MISSING_SETTLEMENT: {
    title: 'Marked paid, batch not found',
    body: 'This order is flagged as remitted but no remittance batch references it. It was most likely remitted before batches recorded their orders, or the batch was removed.',
  },
};

export default function RemittanceInfoModal({
  remittance,
  orderNumber,
  onClose,
  onRecordRemittance,
  canRemit,
}: RemittanceInfoModalProps) {
  const router = useRouter();

  // Esc to close — this modal is read-only, so there is nothing to lose.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const paid = remittance?.status === 'Paid';
  const settlement = remittance?.settlement ?? null;
  const pending = remittance?.pendingReason ?? null;

  const stat = (label: string, value: React.ReactNode, tone?: 'positive' | 'negative') => (
    <div>
      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-1">{label}</p>
      <p
        className={`text-[18px] font-black ${
          tone === 'negative' ? 'text-red-500' : tone === 'positive' ? 'text-emerald-600' : 'text-gray-800'
        }`}
      >
        {value}
      </p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[820px] max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300 p-10 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close remittance info"
          className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all hover:rotate-90"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-[#AE00FF]">
            <Wallet size={20} />
          </div>
          <h3 className="text-[22px] font-black text-gray-800">Remittance Info</h3>
        </div>
        <p className="text-[13px] text-gray-400 font-medium mb-8 ml-[52px]">Order {orderNumber}</p>

        {!remittance ? (
          <div className="flex items-start gap-3 rounded-[20px] border border-red-100 bg-red-50/60 p-6">
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[14px] text-gray-600 font-medium">
              This order could not be loaded. Refresh the page and try again.
            </p>
          </div>
        ) : (
          <>
            {/* Status + agent */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <span
                className={`inline-flex items-center gap-2 text-[12px] font-bold px-4 py-2 rounded-full uppercase tracking-wide ${
                  paid ? 'bg-[#10B981] text-white' : 'bg-[#FEF3C7] text-[#92400E]'
                }`}
              >
                {paid ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                {paid ? 'Remitted' : 'Not Remitted'}
              </span>
              {remittance.agent && (
                <div className="flex items-center gap-4 text-[13px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1.5 text-gray-800 font-bold">
                    <Building2 size={14} className="text-purple-300" />
                    {remittance.agent.name}
                  </span>
                  {remittance.agent.state && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-purple-300" />
                      {remittance.agent.state}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} className="text-purple-300" />
                    {remittance.agent.phone}
                  </span>
                </div>
              )}
            </div>

            {/* This order's numbers — always shown, remitted or not. */}
            <div className="grid grid-cols-3 gap-6 rounded-[20px] bg-gray-50/70 p-6 mb-8">
              {stat('Expected From Agent', formatCurrency(remittance.expected))}
              {stat('Delivery Fee', formatCurrency(remittance.deliveryFee))}
              {stat(
                "Agent's Current Balance",
                remittance.agentBalance === null ? '—' : formatCurrency(remittance.agentBalance),
                remittance.agentBalance && remittance.agentBalance > 0 ? 'negative' : undefined,
              )}
            </div>

            {/* Empty state when no batch covers this order */}
            {pending && (
              <div className="rounded-[20px] border border-[#E9D5FF] bg-purple-50/40 p-6 mb-8">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-[#AE00FF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[15px] font-bold text-gray-800 mb-1">{PENDING_COPY[pending].title}</p>
                    <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                      {PENDING_COPY[pending].body}
                    </p>
                  </div>
                </div>
                {canRemit && (
                  <button
                    onClick={onRecordRemittance}
                    className="mt-5 h-[46px] px-6 rounded-xl bg-[#AE00FF] text-white text-[14px] font-bold shadow-md shadow-purple-200 hover:bg-[#9500dd] transition-colors inline-flex items-center gap-2"
                  >
                    <Wallet size={16} /> Record Remittance
                  </button>
                )}
              </div>
            )}

            {/* The batch that cleared this order */}
            {settlement && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] text-gray-400 font-bold uppercase tracking-wide">Remittance Batch</p>
                  <span className="text-[13px] font-bold text-[#AE00FF]">
                    {settlement.referenceId ?? 'No reference'}
                  </span>
                </div>

                <div className="rounded-[20px] border border-gray-100 shadow-sm p-6">
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    {stat('Date Remitted', formatDate(settlement.date))}
                    {stat('Paid Into', settlement.bank ?? 'Not recorded')}
                    {stat('Amount Remitted', formatCurrency(settlement.totalRemitted), 'positive')}
                  </div>

                  <div className="border-t border-gray-50 pt-6 grid grid-cols-3 gap-6">
                    {stat('Batch Sales Value', formatCurrency(settlement.totalSalesValue))}
                    {stat('Delivery Fees Earned', formatCurrency(settlement.deliveryFeesEarned))}
                    {stat(
                      'Batch Balance',
                      formatCurrency(settlement.balance),
                      settlement.balance > 0 ? 'negative' : settlement.balance < 0 ? 'positive' : undefined,
                    )}
                  </div>

                  {(settlement.underpayment > 0 || settlement.overpayment > 0) && (
                    <div className="border-t border-gray-50 pt-6 mt-6 grid grid-cols-3 gap-6">
                      {settlement.underpayment > 0 &&
                        stat('Underpayment', formatCurrency(settlement.underpayment), 'negative')}
                      {settlement.overpayment > 0 &&
                        stat('Overpayment', formatCurrency(settlement.overpayment), 'positive')}
                      {settlement.runningBalanceAfter !== null &&
                        stat('Balance After', formatCurrency(settlement.runningBalanceAfter))}
                    </div>
                  )}
                </div>

                {settlement.orders.length > 0 && (
                  <div className="mt-5">
                    <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wide mb-3">
                      {settlement.orders.length} order{settlement.orders.length === 1 ? '' : 's'} in this batch
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {settlement.orders.map(o => (
                        <button
                          key={o.id}
                          onClick={() =>
                            o.isCurrent ? undefined : router.push(`/accounting/sales-record/${o.id}`)
                          }
                          title={`${o.customer} · ${formatCurrency(o.netAmount)}`}
                          className={`px-4 py-2 text-[11px] font-bold rounded-full transition-colors ${
                            o.isCurrent
                              ? 'bg-[#AE00FF] text-white cursor-default'
                              : 'bg-[#F4E6FF] text-[#AE00FF] hover:bg-[#EBD5FF]'
                          }`}
                        >
                          {o.orderNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Agent Funding: the debit raised when the order was delivered */}
            {remittance.funding && (
              <div className="mb-8">
                <p className="text-[13px] text-gray-400 font-bold uppercase tracking-wide mb-4">
                  Agent Funding Entry
                </p>
                <div className="rounded-[20px] border border-gray-100 shadow-sm p-6 grid grid-cols-4 gap-6">
                  {stat('Reference', remittance.funding.referenceId)}
                  {stat('Date', formatDate(remittance.funding.date))}
                  {stat('Amount Owed', formatCurrency(remittance.funding.amount), 'negative')}
                  {stat('Balance After', formatCurrency(remittance.funding.runningBalance))}
                </div>
              </div>
            )}

            {/* Adjustments explicitly tagged with this order */}
            {remittance.adjustments.length > 0 && (
              <div className="mb-8">
                <p className="text-[13px] text-gray-400 font-bold uppercase tracking-wide mb-4">
                  Adjustments On This Order
                </p>
                <div className="space-y-3">
                  {remittance.adjustments.map(a => (
                    <div
                      key={a.id}
                      className="rounded-[18px] border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-6"
                    >
                      <div>
                        <p className="text-[14px] font-bold text-gray-800">
                          {a.type}
                          <span className="text-gray-400 font-medium"> · {a.paymentType}</span>
                        </p>
                        <p className="text-[12px] text-gray-400 font-medium mt-0.5">
                          {a.referenceId} · {formatDate(a.date)}
                          {a.recordedBy ? ` · by ${a.recordedBy}` : ''}
                        </p>
                        {a.note && <p className="text-[13px] text-gray-500 font-medium mt-2">{a.note}</p>}
                      </div>
                      <span className="text-[16px] font-black text-gray-800 whitespace-nowrap">
                        {formatCurrency(a.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {remittance.agent && (
              <button
                onClick={() => router.push(`/accounting/agent-settlement/${remittance.agent!.id}`)}
                className="w-full h-[52px] rounded-[14px] border-2 border-gray-200 text-[14px] font-bold text-gray-600 hover:bg-gray-50 hover:border-purple-200 transition-colors inline-flex items-center justify-center gap-2"
              >
                Open {remittance.agent.name}&apos;s full ledger <ArrowUpRight size={16} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
