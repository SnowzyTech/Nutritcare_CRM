'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  MessageCircle,
  Mail,
  MessageSquare,
  Smartphone,
  Edit2,
  Eye,
  FileText,
  Save,
  CheckCircle2
} from 'lucide-react';
import { SalesRecord } from '@/lib/mock-data/sales-records';
import Image from 'next/image';

interface OrderDetailsClientProps {
  order: SalesRecord;
}

export default function OrderDetailsClient({ order }: OrderDetailsClientProps) {
  const router = useRouter();
  const [showInvoice, setShowInvoice] = useState(false);

  const detailRow = (label: string, value: string) => (
    <div className="flex items-center justify-between py-4">
      <span className="text-[14px] text-gray-500 font-medium">{label}</span>
      <div className="flex-1 mx-4 border-b border-dotted border-gray-300 translate-y-2"></div>
      <span className="text-[14px] text-gray-800 font-bold text-right">{value}</span>
    </div>
  );

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
              <h2 className="text-[28px] font-bold text-gray-800">{order.orderId}</h2>
              <span className={`text-[12px] font-bold px-4 py-1.5 rounded-lg text-white uppercase ${
                order.remStatus === 'Paid' ? 'bg-[#10B981]' : 'bg-[#E5E7EB] text-gray-600'
              }`}>
                {order.remStatus}
              </span>
            </div>
            <span className="text-gray-400 text-[14px] font-medium">{order.date}</span>
          </div>

          <div className="space-y-1">
            {detailRow("Customer", order.customer.replace('\n', ' '))}
            {detailRow("State", order.state)}
            {detailRow("Product(s)", order.products.replace('\n', ' '))}
            {detailRow("Qty", order.qty)}
            {detailRow("Total", order.total)}
            {detailRow("Agent", order.agent.replace('\n', ' '))}
            {detailRow("Delivery Fee", order.deliveryFee)}
            {detailRow("Discount", order.discount)}
            {detailRow("Tax", "₦4,500")}
            {detailRow("Net AMount", order.netAmount)}
          </div>

          <div className="mt-12 flex items-center justify-between text-[13px] text-gray-400 font-bold uppercase tracking-wider border-t border-gray-50 pt-8">
            <div className="flex items-center gap-4">
              <span>Agent Remittance</span>
              <span className="text-gray-300">{order.date}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Order Delivered</span>
              <span className="text-gray-300">{order.date}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Order Created</span>
              <span className="text-gray-300">{order.date}</span>
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
              View Inovice
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
                  <span className="text-[14px] font-bold text-gray-800">Invoice has been sent to the cutomer</span>
                  <span className="text-[11px] text-gray-400 font-medium">on {order.date}(March 2, 2026)</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Gmail
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  WhatsApp
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  SMS
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
              <div className="flex justify-between mb-12">
                <div>
                  <h3 className="text-[24px] font-bold text-gray-800 mb-1">Invoice</h3>
                  <span className="text-[13px] text-gray-400 font-medium tracking-wider uppercase">INV - 000000001</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold">N</div>
                   <span className="font-bold text-gray-800">Nuycle</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-8 mb-16">
                <div>
                  <label className="text-[12px] text-gray-400 font-bold uppercase mb-2 block">From</label>
                  <p className="text-[14px] font-bold text-gray-800">Nuycle</p>
                </div>
                <div>
                  <label className="text-[12px] text-gray-400 font-bold uppercase mb-2 block">Issue Date</label>
                  <p className="text-[14px] font-bold text-gray-800">{order.date}</p>
                </div>
                <div>
                  <label className="text-[12px] text-gray-400 font-bold uppercase mb-2 block">Due Date</label>
                  <p className="text-[14px] font-bold text-gray-800">On Delivery</p>
                </div>
                <div>
                  <label className="text-[12px] text-gray-400 font-bold uppercase mb-2 block">Billing Method</label>
                  <p className="text-[14px] font-bold text-gray-800">Transfer</p>
                </div>
                <div className="col-span-2">
                  <label className="text-[12px] text-gray-400 font-bold uppercase mb-2 block">Bill To</label>
                  <p className="text-[14px] font-bold text-gray-800">{order.customer.replace('\n', ' ')}</p>
                  <p className="text-[12px] text-gray-500 mt-1">Marryudo234@gmail.com</p>
                  <p className="text-[12px] text-gray-500">12 Udo Uduma Avenue, Uyo,</p>
                  <p className="text-[12px] text-gray-500">Akwa Ibom State</p>
                  <p className="text-[12px] text-gray-500">+234801283940</p>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-8">
                <div className="grid grid-cols-4 text-[11px] font-bold text-gray-400 uppercase mb-4 px-2">
                  <span>Product(s)</span>
                  <span className="text-center">Qty</span>
                  <span className="text-center">Description</span>
                  <span className="text-right">Amount</span>
                </div>
                <div className="grid grid-cols-4 text-[14px] font-bold text-gray-800 items-center bg-gray-50/50 rounded-xl px-4 py-4 mb-8">
                  <span>{order.products.replace('\n', ' ')}</span>
                  <span className="text-center">{order.qty}</span>
                  <span className="text-center text-gray-400">----</span>
                  <span className="text-right">₦95,000</span>
                </div>

                <div className="flex flex-col items-end gap-2 border-t border-gray-50 pt-8">
                  <div className="flex items-center gap-8 w-full justify-end">
                    <span className="text-[14px] text-gray-500 font-medium">Discount</span>
                    <span className="text-[14px] text-gray-800 font-bold">₦7,000 (7%)</span>
                  </div>
                  <div className="flex items-center gap-8 w-full justify-end mt-4 border-t border-gray-50 pt-4">
                    <span className="text-[18px] text-gray-400 font-bold uppercase">Total</span>
                    <span className="text-[22px] text-gray-800 font-black">{order.netAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-4">
              <button className="h-[50px] bg-gray-400 text-white rounded-lg text-[13px] font-bold hover:bg-gray-500 transition-colors flex items-center justify-center gap-2">
                <Edit2 size={16} /> Edit Inovice
              </button>
              <button className="h-[50px] bg-gray-400 text-white rounded-lg text-[13px] font-bold hover:bg-gray-500 transition-colors flex items-center justify-center gap-2">
                <Mail size={16} /> Email view
              </button>
              <button className="h-[50px] bg-gray-400 text-white rounded-lg text-[13px] font-bold hover:bg-gray-500 transition-colors flex items-center justify-center gap-2">
                <FileText size={16} /> PDF view
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
