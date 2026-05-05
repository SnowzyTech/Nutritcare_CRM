'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';

const mainTableData = [
  { name: 'Prosxact', cost: 'Ibrahim Lawal', selling: 'Ibrahim Lawal', total: 'Kano', warehouse: '₦1,240,000', agents: '₦42,000', value: '₦1,250,000' },
  { name: 'Neuro-Vive Balm', cost: 'Emeka Nwosu', selling: 'Emeka Nwosu', total: 'Rivers', warehouse: '₦860,000', agents: '₦28,500', value: '₦887,900' },
  { name: 'After-Natal', cost: 'Ibrahim Lawal', selling: 'Ibrahim Lawal', total: 'Kano', warehouse: '₦1,240,000', agents: '₦42,000', value: '₦1,250,000' },
  { name: 'Shred Belly', cost: 'Emeka Nwosu', selling: 'Emeka Nwosu', total: 'Rivers', warehouse: '₦860,000', agents: '₦28,500', value: '₦887,900' },
  { name: 'Fonio-Mill', cost: 'Ibrahim Lawal', selling: 'Ibrahim Lawal', total: 'Kano', warehouse: '₦1,240,000', agents: '₦42,000', value: '₦1,250,000' },
  { name: 'Trim & Tone', cost: 'Emeka Nwosu', selling: 'Emeka Nwosu', total: 'Rivers', warehouse: '₦860,000', agents: '₦28,500', value: '₦887,900' },
  { name: 'Linix', cost: 'Ibrahim Lawal', selling: 'Ibrahim Lawal', total: 'Kano', warehouse: '₦1,240,000', agents: '₦42,000', value: '₦1,250,000' },
  { name: 'Vitorep', cost: 'Emeka Nwosu', selling: 'Emeka Nwosu', total: 'Rivers', warehouse: '₦860,000', agents: '₦28,500', value: '₦887,900' },
];

const productCards = [
  { name: 'Prosxact', stock: '1200' },
  { name: 'Neuro-Vive Balm', stock: '1200' },
  { name: 'Shred Belly', stock: '1200' },
  { name: 'Trim & Tone', stock: '1200' },
  { name: 'After-Natal', stock: '1200' },
  { name: 'Fonio Mill', stock: '1200' },
  { name: 'Vitorep', stock: '1200' },
  { name: 'Linix', stock: '1200' },
];

const variants = [
  { id: 1, name: 'Single Product', qty: 2, price: '₦38,500' },
  { id: 2, name: 'Regular', qty: 2, price: '₦38,500' },
  { id: 3, name: 'Standard', qty: 4, price: '₦75,000' },
  { id: 4, name: 'Premium', qty: 6, price: '₦110,000' },
  { id: 5, name: 'Platinum', qty: 8, price: '₦145,000' },
  { id: 6, name: 'Premium', qty: 6, price: '₦110,000' },
];

export function InventoryClient() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#FAFAFA] font-sans">
      {/* Navigation Controls */}
      <div className="flex items-center gap-3 mb-6">
        <button className="w-10 h-10 flex items-center justify-center text-[#AE00FF] bg-[#F3E8FF] rounded-full hover:bg-purple-200 transition-colors">
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-[#AE00FF] bg-[#F3E8FF] rounded-full hover:bg-purple-200 transition-colors">
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-[#AE00FF] bg-[#F3E8FF] rounded-full hover:bg-purple-200 transition-colors ml-1">
          <RotateCcw size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 relative">
        <h1 className="text-[32px] font-bold text-gray-700 tracking-tight">Product List</h1>

        {/* Segmented Controls */}
        <div className="flex bg-white rounded-lg p-1 border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)] absolute left-1/2 -translate-x-1/2 z-10">
          <button className="px-8 py-2.5 bg-[#AE00FF] text-white rounded-md text-[13px] font-bold shadow-sm transition-all tracking-wide">
            Product List
          </button>
          <button className="px-8 py-2.5 text-gray-500 hover:text-gray-800 rounded-md text-[13px] font-medium transition-colors tracking-wide">
            Inventory Location View
          </button>
        </div>

        {/* Chat Button */}
        <div className="w-16 h-16 bg-[#F3E8FF] rounded-full flex items-center justify-center ml-auto z-10 cursor-pointer">
          <div className="w-[42px] h-[42px] bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-105 transition-transform">
            <MessageCircle fill="currentColor" size={22} />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl overflow-hidden mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#4A0A77] text-white text-[13px] font-bold">
              <th className="px-8 py-5 tracking-wide">Product Name</th>
              <th className="px-8 py-5 tracking-wide">Cost Price</th>
              <th className="px-8 py-5 tracking-wide">Selling Price</th>
              <th className="px-8 py-5 tracking-wide">Total Stock</th>
              <th className="px-8 py-5 tracking-wide">Warehouse Stock</th>
              <th className="px-8 py-5 tracking-wide">Stock With Agents</th>
              <th className="px-8 py-5 tracking-wide">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {mainTableData.map((row, idx) => (
              <tr key={idx} className={`${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'}`}>
                <td className="px-8 py-[22px] text-[14px] text-gray-500">{row.name}</td>
                <td className="px-8 py-[22px] text-[14px] text-gray-500">{row.cost}</td>
                <td className="px-8 py-[22px] text-[14px] text-gray-500">{row.selling}</td>
                <td className="px-8 py-[22px] text-[14px] text-gray-500">{row.total}</td>
                <td className="px-8 py-[22px] text-[14px] text-gray-500">{row.warehouse}</td>
                <td className="px-8 py-[22px] text-[14px] text-gray-500">{row.agents}</td>
                <td className="px-8 py-[22px] text-[14px] text-gray-500">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
        {productCards.map((product, idx) => (
          <div key={idx} className="flex flex-col">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4 px-1">
              <div className="flex flex-col">
                <h3 className="text-[16px] font-bold text-gray-700 leading-tight mb-0.5">{product.name}</h3>
                <span className="text-[10px] font-bold text-gray-400">{product.stock} in stock</span>
              </div>
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                 {/* Placeholder for the product image shown in the design */}
                 <img src="https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?w=100&h=100&fit=crop" alt="product" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Mini Table */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#4A0A77] text-white text-[10px] font-bold">
                    <th className="px-4 py-3" colSpan={2}>Name</th>
                    <th className="px-4 py-3 text-center border-x border-[#5A1A87]/30">Qty</th>
                    <th className="px-4 py-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant.id} className="bg-white border-b border-gray-100 last:border-b-0">
                      <td className="pl-4 pr-2 py-3 text-[10px] text-gray-400 w-8">{variant.id}</td>
                      <td className="pr-4 py-3 text-[11px] text-gray-500">{variant.name}</td>
                      <td className="px-4 py-3 text-[11px] text-gray-500 text-center border-x border-gray-100">{variant.qty}</td>
                      <td className="px-4 py-3 text-[11px] text-gray-500 text-right">{variant.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
