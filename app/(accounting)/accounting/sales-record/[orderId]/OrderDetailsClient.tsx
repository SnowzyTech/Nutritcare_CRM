'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle,
  Mail,
  FileText,
  Save,
  CheckCircle2,
} from 'lucide-react';
import type { OrderInvoiceDetail } from '@/modules/finance/services/sales-record.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { downloadInvoicePdf } from '@/lib/pdf/invoice-pdf';

interface OrderDetailsClientProps {
  order: OrderInvoiceDetail;
}

export default function OrderDetailsClient({ order }: OrderDetailsClientProps) {
  const router = useRouter();
  const [showInvoice, setShowInvoice] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const inv = order.invoice;

  const qtyLabel = `${order.totalQty} pack${order.totalQty === 1 ? '' : 's'}`;

  const detailRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between py-4">
      <span className="text-[14px] text-gray-500 font-medium">{label}</span>
      <div className="flex-1 mx-4 border-b border-dotted border-gray-300 translate-y-2"></div>
      <span className="text-[14px] text-gray-800 font-bold text-right">{value}</span>
    </div>
  );

  const productList =
    order.items.length > 0 ? (
      <div className="flex flex-col items-end gap-1">
        {order.items.map((it, i) => (
          <span key={i}>
            {it.description}
            <span className="text-gray-400 font-medium"> × {it.quantity}</span>
          </span>
        ))}
      </div>
    ) : (
      '—'
    );

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      await downloadInvoicePdf(order);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-white">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronRight size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <RotateCcw size={18} />
          </button>
        </div>
        <button className="w-12 h-12 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200">
          <MessageCircle size={24} fill="currentColor" />
        </button>
      </div>

      <h1 className="text-[32px] font-bold text-gray-800 mb-8 tracking-tight">Sales Details</h1>

      <div className={`flex gap-8 transition-all duration-500 ${showInvoice ? 'items-start' : 'justify-center'}`}>
        {/* Left Side: Order Details Card */}
        <div className={`bg-white rounded-[24px] border border-gray-100 shadow-sm p-10 transition-all duration-500 ${showInvoice ? 'w-[45%]' : 'w-full max-w-[900px]'}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-[28px] font-bold text-gray-800">{order.orderNumber}</h2>
              <span className={`text-[12px] font-bold px-4 py-1.5 rounded-lg uppercase ${
                order.orderStatus === 'Delivered' ? 'bg-[#10B981] text-white' :
                order.orderStatus === 'Confirmed' ? 'bg-[#6EE7B7] text-[#065F46]' :
                order.orderStatus === 'Pending' ? 'bg-[#F59E0B] text-white' :
                'bg-[#EF4444] text-white'
              }`}>
                {order.orderStatus}
              </span>
            </div>
            <span className="text-gray-400 text-[14px] font-medium">{formatDate(order.orderDate)}</span>
          </div>

          <div className="space-y-1">
            {detailRow('Customer', order.customer.name)}
            {detailRow('State', order.customer.state)}
            {detailRow('Product(s)', productList)}
            {detailRow('Qty', qtyLabel)}
            {detailRow('Total', formatCurrency(order.totalAmount))}
            {detailRow('Agent', order.agent ?? '—')}
            {detailRow('Delivery Fee', formatCurrency(order.deliveryFee))}
            {detailRow(
              'Discount',
              order.discountAmount > 0
                ? `${formatCurrency(order.discountAmount)}${order.discountPercent > 0 ? ` (${order.discountPercent}%)` : ''}`
                : '—',
            )}
            {detailRow('Net Amount', formatCurrency(order.netAmount))}
          </div>

          <div className="mt-12 flex items-center justify-between text-[13px] text-gray-400 font-bold uppercase tracking-wider border-t border-gray-50 pt-8">
            <div className="flex flex-col gap-1">
              <span>Agent Remittance</span>
              <span className="text-gray-300 normal-case">{order.remStatus}</span>
            </div>
            <div className="flex flex-col gap-1 items-center">
              <span>Order Delivered</span>
              <span className="text-gray-300">{order.deliveredAt ? formatDate(order.deliveredAt) : '—'}</span>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span>Order Created</span>
              <span className="text-gray-300">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-4">
            <button className="flex-1 h-[60px] border-2 border-gray-200 rounded-[14px] text-[15px] font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              View Remittance Info
            </button>
            <button
              onClick={() => setShowInvoice(!showInvoice)}
              className={`flex-1 h-[60px] rounded-[14px] text-[15px] font-bold transition-all duration-300 ${
                showInvoice ? 'bg-gray-100 text-gray-400' : 'bg-[#F3E8FF] text-[#AE00FF] hover:bg-[#EBD5FF]'
              }`}
            >
              {showInvoice ? 'Hide Invoice' : 'View Invoice'}
            </button>
          </div>
        </div>

        {/* Right Side: Invoice Preview Card */}
        {showInvoice && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <CheckCircle2 size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-gray-800">
                    {inv.exists ? 'Invoice generated' : 'Invoice preview (not yet generated)'}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {inv.exists ? `Created on ${formatDate(inv.invoiceDate)}` : `Based on order ${order.orderNumber}`}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{inv.status}</span>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
              <div className="flex justify-between mb-12">
                <div>
                  <h3 className="text-[24px] font-bold text-gray-800 mb-1">Invoice</h3>
                  <span className="text-[13px] text-gray-400 font-medium tracking-wider uppercase">{inv.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold">N</div>
                  <span className="font-bold text-gray-800">NutritCare</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-8 mb-16">
                <div>
                  <label className="text-[12px] text-gray-400 font-bold uppercase mb-2 block">From</label>
                  <p className="text-[14px] font-bold text-gray-800">NutritCare</p>
                </div>
                <div>
                  <label className="text-[12px] text-gray-400 font-bold uppercase mb-2 block">Issue Date</label>
                  <p className="text-[14px] font-bold text-gray-800">{formatDate(inv.invoiceDate)}</p>
                </div>
                <div>
                  <label className="text-[12px] text-gray-400 font-bold uppercase mb-2 block">Due Date</label>
                  <p className="text-[14px] font-bold text-gray-800">{inv.dueDate ? formatDate(inv.dueDate) : 'On Delivery'}</p>
                </div>
                <div>
                  <label className="text-[12px] text-gray-400 font-bold uppercase mb-2 block">Terms</label>
                  <p className="text-[14px] font-bold text-gray-800">{inv.terms ?? '—'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-[12px] text-gray-400 font-bold uppercase mb-2 block">Bill To</label>
                  <p className="text-[14px] font-bold text-gray-800">{order.customer.name}</p>
                  {order.customer.email && <p className="text-[12px] text-gray-500 mt-1">{order.customer.email}</p>}
                  <p className="text-[12px] text-gray-500">{order.customer.address}</p>
                  <p className="text-[12px] text-gray-500">{[order.customer.lga, order.customer.state].filter(Boolean).join(', ')}</p>
                  <p className="text-[12px] text-gray-500">{order.customer.phone}</p>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-8">
                <div className="grid grid-cols-[2fr_0.6fr_1fr_1fr] text-[11px] font-bold text-gray-400 uppercase mb-4 px-2">
                  <span>Product(s)</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Unit Price</span>
                  <span className="text-right">Amount</span>
                </div>
                <div className="space-y-2 mb-8">
                  {inv.items.map((it, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[2fr_0.6fr_1fr_1fr] text-[14px] font-bold text-gray-800 items-center bg-gray-50/50 rounded-xl px-4 py-4"
                    >
                      <span>{it.description}</span>
                      <span className="text-center">{it.quantity}</span>
                      <span className="text-right text-gray-500">{formatCurrency(it.unitPrice)}</span>
                      <span className="text-right">{formatCurrency(it.amount)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-end gap-2 border-t border-gray-50 pt-8">
                  <div className="flex items-center gap-8 w-full justify-end">
                    <span className="text-[14px] text-gray-500 font-medium">Subtotal</span>
                    <span className="text-[14px] text-gray-800 font-bold w-[140px] text-right">{formatCurrency(inv.subtotal)}</span>
                  </div>
                  {inv.discountAmount > 0 && (
                    <div className="flex items-center gap-8 w-full justify-end">
                      <span className="text-[14px] text-gray-500 font-medium">
                        Discount{inv.discountPercent > 0 ? ` (${inv.discountPercent}%)` : ''}
                      </span>
                      <span className="text-[14px] text-gray-800 font-bold w-[140px] text-right">- {formatCurrency(inv.discountAmount)}</span>
                    </div>
                  )}
                  {inv.shipping > 0 && (
                    <div className="flex items-center gap-8 w-full justify-end">
                      <span className="text-[14px] text-gray-500 font-medium">Delivery Fee</span>
                      <span className="text-[14px] text-gray-800 font-bold w-[140px] text-right">{formatCurrency(inv.shipping)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-8 w-full justify-end mt-4 border-t border-gray-50 pt-4">
                    <span className="text-[18px] text-gray-400 font-bold uppercase">Total</span>
                    <span className="text-[22px] text-gray-800 font-black w-[180px] text-right">{formatCurrency(inv.invoiceTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <button className="h-[50px] bg-gray-400 text-white rounded-lg text-[13px] font-bold hover:bg-gray-500 transition-colors flex items-center justify-center gap-2">
                <Mail size={16} /> Email view
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="h-[50px] bg-[#AE00FF] text-white rounded-lg text-[13px] font-bold hover:bg-[#9500dd] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FileText size={16} /> {downloading ? 'Generating…' : 'PDF view'}
              </button>
              <button className="h-[50px] bg-gray-400 text-white rounded-lg text-[13px] font-bold hover:bg-gray-500 transition-colors flex items-center justify-center gap-2">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
