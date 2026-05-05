'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronDown, Trash2, ArrowLeft } from 'lucide-react';

export function CreateInvoiceClient({ title = "Invoice" }: { title?: string }) {
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

  const [rows, setRows] = useState([{ id: 1 }, { id: 2 }, { id: 3 }]);

  const addRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows([...rows, { id: newId }]);
  };

  const deleteRow = (id: number) => {
    setRows(rows.filter(r => r.id !== id));
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
                <input 
                  type="email" 
                  placeholder="Add Customer Email" 
                  className="w-full h-11 px-4 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-purple-300 shadow-sm" 
                />
                <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-400" />
              </div>
            </div>
            {toggles.shipTo && (
              <div className="w-72">
                <textarea 
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
                <input type="text" defaultValue="1001" className="w-36 h-9 px-3 bg-white border border-gray-200 rounded text-[13px] text-gray-700 focus:outline-none shadow-sm" />
              </div>
            )}
            {toggles.terms && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] text-gray-500 font-medium">Terms</span>
                <div className="relative w-36 h-9">
                  <input type="text" defaultValue="1001" className="w-full h-full px-3 bg-white border border-gray-200 rounded text-[13px] text-gray-700 focus:outline-none shadow-sm cursor-pointer" />
                  <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
            {toggles.invoiceDate && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] text-gray-500 font-medium">Invoice Date</span>
                <div className="relative w-36 h-9">
                  <input type="text" defaultValue="1001" className="w-full h-full px-3 pr-8 bg-white border border-gray-200 rounded text-[13px] text-gray-700 focus:outline-none shadow-sm cursor-pointer" />
                  <Calendar size={12} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
            {toggles.dueDate && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] text-gray-500 font-medium">Due Date</span>
                <div className="relative w-36 h-9">
                  <input type="text" defaultValue="1001" className="w-full h-full px-3 pr-8 bg-white border border-gray-200 rounded text-[13px] text-gray-700 focus:outline-none shadow-sm cursor-pointer" />
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
                  <input type="text" placeholder="Date" className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                  <Calendar size={12} className="absolute right-2.5 top-3 text-gray-400" />
                </div>
                <div className="relative">
                  <input type="text" placeholder="Product/service" className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                  <ChevronDown size={12} className="absolute right-2.5 top-3 text-gray-400" />
                </div>
                <div>
                  <input type="text" placeholder="Description" className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                </div>
                <div>
                  <input type="text" placeholder="Qty" className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                </div>
                <div>
                  <input type="text" placeholder="Rate" className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                </div>
                <div>
                  <input type="text" placeholder="Amount" className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none bg-gray-50/50" />
                </div>
                <div className="relative">
                  <input type="text" placeholder="Vat" className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-md outline-none focus:border-purple-300" />
                  <ChevronDown size={12} className="absolute right-2.5 top-3 text-gray-400" />
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
              <span className="text-[14px] font-bold text-gray-900">₦0.00</span>
            </div>
            {toggles.discount && (
              <div className="flex justify-between items-center mb-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-medium text-gray-600">Discount</span>
                  <span className="text-[11px] font-bold bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full">12%</span>
                </div>
                <span className="text-[14px] font-bold text-gray-900">₦0.00</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-[13px] font-medium text-gray-600">Shipping</span>
              <span className="text-[14px] font-bold text-gray-900">₦0.00</span>
            </div>
            <div className="flex justify-between items-center mt-5 pt-5 border-t border-gray-100">
              <span className="text-[14px] font-bold text-gray-900">Invoice Total</span>
              <span className="text-[15px] font-black text-gray-900">₦0.00</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4 pt-8 border-t border-gray-50">
          <button className="px-10 py-3 rounded-lg border border-[#A800FF] text-[#A800FF] text-[13px] font-bold hover:bg-purple-50 transition-colors bg-white shadow-sm">
            Save
          </button>
          <button className="px-10 py-3 rounded-lg bg-[#A800FF] text-white text-[13px] font-bold hover:bg-[#9100D6] transition-colors shadow-sm shadow-purple-200">
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
