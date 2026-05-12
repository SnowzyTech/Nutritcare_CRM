'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronDown, Trash2, ArrowLeft } from 'lucide-react';
import { createInvoiceAction } from '@/modules/finance/actions/invoices.action';

interface CreateInvoiceClientProps {
  title?: string;
  invoiceType?: 'INVOICE' | 'SALES_RECEIPT' | 'REFUND_RECEIPT';
  customers?: { id: string; name: string; email: string | null; phone: string; deliveryAddress: string; state: string }[];
  products?: { id: string; name: string; sellingPrice: number }[];
  invoiceNumber?: string;
}

interface InvoiceRow {
  id: number;
  serviceDate?: string;
  productId?: string;
  description?: string;
  quantity?: string;
  rate?: string;
  vatRate?: string;
}

export function CreateInvoiceClient({ title = "Invoice", invoiceType = 'INVOICE', customers, products, invoiceNumber }: CreateInvoiceClientProps) {
  const router = useRouter();
  const [toggles, setToggles] = useState({
    logo: true,
    shipTo: true,
    invoiceNo: true,
    invoiceDate: true,
    dueDate: true,
    discount: true,
    terms: true,
  });

  const [customerId, setCustomerId] = useState('');
  const [shipToAddress, setShipToAddress] = useState('');
  const [terms, setTerms] = useState('Net 30');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [shipping, setShipping] = useState('0');
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState<InvoiceRow[]>([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const updateRow = (id: number, field: keyof InvoiceRow, value: string) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));

  const addRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows([...rows, { id: newId }]);
  };

  const deleteRow = (id: number) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const subtotal = rows.reduce((s, r) => s + (parseFloat(r.quantity ?? '0') || 0) * (parseFloat(r.rate ?? '0') || 0), 0);
  const discountAmount = (subtotal * (parseFloat(discountPercent) || 0)) / 100;
  const shippingNum = parseFloat(shipping) || 0;
  const invoiceTotal = subtotal - discountAmount + shippingNum;

  const handleSave = async (status: 'DRAFT' | 'SENT') => {
    if (!customerId) { alert('Select a customer'); return; }
    const items = rows
      .filter(r => parseFloat(r.quantity ?? '0') > 0 && parseFloat(r.rate ?? '0') > 0)
      .map(r => ({
        serviceDate: r.serviceDate ? new Date(r.serviceDate) : undefined,
        productId: r.productId || undefined,
        description: r.description || (products?.find(p => p.id === r.productId)?.name ?? 'Item'),
        quantity: parseFloat(r.quantity ?? '0'),
        rate: parseFloat(r.rate ?? '0'),
        vatRate: r.vatRate ? parseFloat(r.vatRate) : undefined,
      }));
    if (items.length === 0) { alert('Add at least one item with quantity and rate'); return; }
    setSaving(true);
    const res = await createInvoiceAction({
      customerId,
      invoiceDate: new Date(invoiceDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      terms,
      shipping: shippingNum,
      discountPercent: parseFloat(discountPercent) || 0,
      type: invoiceType,
      status,
      showLogo: toggles.logo,
      showShipTo: toggles.shipTo,
      showInvoiceNo: toggles.invoiceNo,
      showInvoiceDate: toggles.invoiceDate,
      showDueDate: toggles.dueDate,
      showDiscount: toggles.discount,
      showTerms: toggles.terms,
      items,
    });
    setSaving(false);
    if ('error' in res) { alert(res.error); return; }
    router.push('/accounting');
  };

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const ToggleSwitch = ({ label, stateKey }: { label: string, stateKey: keyof typeof toggles }) => (
    <div className="flex items-center justify-between mb-4">
      <span className="text-[13px] text-gray-500 font-medium">{label}</span>
      <button 
        onClick={() => handleToggle(stateKey)}
        className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${toggles[stateKey] ? 'bg-[#10B981]' : 'bg-gray-200'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${toggles[stateKey] ? 'translate-x-[20px]' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto flex flex-col gap-6">
      {/* Back Button */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors self-start text-[14px] font-medium"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="flex items-start gap-8 w-full">
        {/* Left Area - Invoice Form */}
        <div className="flex-1 bg-white rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-gray-100 p-12 min-h-[800px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-[32px] font-bold text-gray-700 tracking-tight mb-2">{title}</h1>
            <p className="text-[14px] text-gray-700 font-medium">Nucle</p>
          </div>
          <div className="flex gap-8 items-start">
            <div className="text-right flex flex-col gap-2 mt-2">
              <span className="text-[12px] text-gray-800 font-medium">nutrihealthconsult@gmail.com</span>
              <span className="text-[12px] text-gray-800 font-medium">+2349383472873</span>
            </div>
            {toggles.logo ? (
              <div className="relative w-24 h-8 mt-1">
                <Image src="/nuycle-logo.png" alt="Logo" fill className="object-contain object-right" />
              </div>
            ) : (
              <div className="w-24 h-8" />
            )}
          </div>
        </div>

        {/* Info Block */}
        <div className="bg-[#FCF7FF] rounded-xl p-8 mb-8 flex justify-between gap-8 border border-purple-50">
          <div className="flex-1 flex flex-col gap-4">
            <div className="w-72">
              <div className="relative">
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-purple-300 shadow-sm appearance-none"
                >
                  <option value="">Select Customer</option>
                  {(customers ?? []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ''}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {toggles.shipTo && (
              <div className="w-72">
                <textarea
                  value={shipToAddress}
                  onChange={e => setShipToAddress(e.target.value)}
                  placeholder="Ship To Address"
                  className="w-full h-24 p-4 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-purple-300 shadow-sm resize-none"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 w-72 shrink-0">
            {toggles.invoiceNo && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] text-gray-500 font-medium">Invoice No.</span>
                <input type="text" value={invoiceNumber ?? '1001'} readOnly className="w-36 h-9 px-3 bg-white border border-gray-200 rounded text-[13px] text-gray-700 focus:outline-none shadow-sm" />
              </div>
            )}
            {toggles.terms && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] text-gray-500 font-medium">Terms</span>
                <div className="relative w-36 h-9">
                  <input type="text" value={terms} onChange={e => setTerms(e.target.value)} className="w-full h-full px-3 bg-white border border-gray-200 rounded text-[13px] text-gray-700 focus:outline-none shadow-sm cursor-pointer" />
                  <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
            {toggles.invoiceDate && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] text-gray-500 font-medium">Invoice Date</span>
                <div className="relative w-36 h-9">
                  <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full h-full px-3 pr-8 bg-white border border-gray-200 rounded text-[13px] text-gray-700 focus:outline-none shadow-sm cursor-pointer" />
                  <Calendar size={12} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
            {toggles.dueDate && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] text-gray-500 font-medium">Due Date</span>
                <div className="relative w-36 h-9">
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full h-full px-3 pr-8 bg-white border border-gray-200 rounded text-[13px] text-gray-700 focus:outline-none shadow-sm cursor-pointer" />
                  <Calendar size={12} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="mb-6">
          <span className="text-[12px] text-gray-500 font-bold mb-3 block">Product or Service</span>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-[40px_1fr_2fr_2fr_80px_100px_100px_80px_40px] bg-[#4B0082] py-3 px-5 gap-3">
              <div className="text-[11px] font-medium text-white flex items-center">#</div>
              <div className="text-[11px] font-medium text-white flex items-center">Service Date</div>
              <div className="text-[11px] font-medium text-white flex items-center">Product/Service</div>
              <div className="text-[11px] font-medium text-white flex items-center">Description</div>
              <div className="text-[11px] font-medium text-white flex items-center">Qty</div>
              <div className="text-[11px] font-medium text-white flex items-center">Rate</div>
              <div className="text-[11px] font-medium text-white flex items-center">Amount</div>
              <div className="text-[11px] font-medium text-white flex items-center">Vat</div>
              <div></div>
            </div>
            
            {/* Rows */}
            {rows.map((row, index) => (
              <div key={row.id} className="grid grid-cols-[40px_1fr_2fr_2fr_80px_100px_100px_80px_40px] py-3 px-5 gap-3 border-t border-gray-100 bg-white items-center">
                <div className="text-[13px] font-bold text-gray-700 pl-1">{index + 1}</div>
                <div className="relative">
                  <input type="date" value={row.serviceDate ?? ''} onChange={e => updateRow(row.id, 'serviceDate', e.target.value)} className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                </div>
                <div className="relative">
                  <select
                    value={row.productId ?? ''}
                    onChange={e => {
                      const p = (products ?? []).find(x => x.id === e.target.value);
                      updateRow(row.id, 'productId', e.target.value);
                      if (p) {
                        updateRow(row.id, 'rate', String(p.sellingPrice));
                        updateRow(row.id, 'description', p.name);
                      }
                    }}
                    className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300 appearance-none"
                  >
                    <option value="">Product/service</option>
                    {(products ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                </div>
                <div>
                  <input type="text" placeholder="Description" value={row.description ?? ''} onChange={e => updateRow(row.id, 'description', e.target.value)} className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                </div>
                <div>
                  <input type="number" placeholder="Qty" value={row.quantity ?? ''} onChange={e => updateRow(row.id, 'quantity', e.target.value)} className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                </div>
                <div>
                  <input type="number" placeholder="Rate" value={row.rate ?? ''} onChange={e => updateRow(row.id, 'rate', e.target.value)} className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                </div>
                <div>
                  <input type="text" readOnly value={((parseFloat(row.quantity ?? '0') || 0) * (parseFloat(row.rate ?? '0') || 0)).toFixed(2)} className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none bg-gray-50/50" />
                </div>
                <div className="relative">
                  <input type="number" placeholder="Vat" value={row.vatRate ?? ''} onChange={e => updateRow(row.id, 'vatRate', e.target.value)} className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                </div>
                <div 
                  className="flex justify-center text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                  onClick={() => deleteRow(row.id)}
                >
                  <Trash2 size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Area */}
        <div className="flex justify-between items-start mt-6 flex-1">
          <div className="flex flex-col gap-10">
            <button 
              onClick={addRow}
              className="self-start px-8 py-3 rounded-lg border-2 border-[#A800FF] text-[#A800FF] text-[13px] font-bold hover:bg-purple-50 transition-colors shadow-sm"
            >
              Add Product or Service
            </button>
            <label className="w-64 h-24 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="file" className="hidden" />
              <span className="text-[12px] font-bold text-gray-800">Add Attachment</span>
              <span className="text-[10px] text-gray-400 mt-1.5">Max file size: 20 MB</span>
            </label>
          </div>

          <div className="w-72 pt-2">
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-[13px] font-medium text-gray-600">Subtotal</span>
              <span className="text-[14px] font-bold text-gray-900">₦{subtotal.toFixed(2)}</span>
            </div>
            {toggles.discount && (
              <div className="flex justify-between items-center mb-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-medium text-gray-600">Discount</span>
                  <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-12 text-[11px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-center outline-none" />
                </div>
                <span className="text-[14px] font-bold text-gray-900">₦{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-[13px] font-medium text-gray-600">Shipping</span>
              <input type="number" value={shipping} onChange={e => setShipping(e.target.value)} className="w-24 h-7 px-2 text-right text-[14px] font-bold text-gray-900 border border-gray-200 rounded outline-none" />
            </div>
            <div className="flex justify-between items-center mt-5 pt-5 border-t border-gray-100">
              <span className="text-[14px] font-bold text-gray-900">Invoice Total</span>
              <span className="text-[15px] font-black text-gray-900">₦{invoiceTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4 pt-8 border-t border-gray-50">
          <button
            disabled={saving}
            onClick={() => handleSave('DRAFT')}
            className="px-10 py-3 rounded-lg border border-[#A800FF] text-[#A800FF] text-[13px] font-bold hover:bg-purple-50 transition-colors bg-white shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            disabled={saving}
            onClick={() => handleSave('SENT')}
            className="px-10 py-3 rounded-lg bg-[#A800FF] text-white text-[13px] font-bold hover:bg-[#9100D6] transition-colors shadow-sm shadow-purple-200 disabled:opacity-50"
          >
            Review and Send
          </button>
        </div>
      </div>

      {/* Right Area - Customization Sidebar */}
      <div className="w-72 bg-white rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-gray-100 p-8 shrink-0">
        <h2 className="text-[15px] font-bold text-gray-700 mb-8">Customization</h2>
        
        {/* List 1 */}
        <div className="flex flex-col gap-1">
          <ToggleSwitch label="Logo" stateKey="logo" />
          <ToggleSwitch label="Ship to" stateKey="shipTo" />
          <ToggleSwitch label="Invoice No" stateKey="invoiceNo" />
          <ToggleSwitch label="Invoice Date" stateKey="invoiceDate" />
          <ToggleSwitch label="Due date" stateKey="dueDate" />
          <ToggleSwitch label="Discount" stateKey="discount" />
          <ToggleSwitch label="Terms" stateKey="terms" />
        </div>

        <div className="h-px bg-gray-100 my-7" />

        {/* List 2 (repeated per design) */}
        <div className="flex flex-col gap-1">
          <ToggleSwitch label="Logo" stateKey="logo" />
          <ToggleSwitch label="Ship to" stateKey="shipTo" />
          <ToggleSwitch label="Invoice No" stateKey="invoiceNo" />
          <ToggleSwitch label="Invoice Date" stateKey="invoiceDate" />
          <ToggleSwitch label="Due date" stateKey="dueDate" />
          <ToggleSwitch label="Terms" stateKey="terms" />
        </div>
      </div>
    </div>
    </div>
  );
}
