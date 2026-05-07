'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageCircle,
  ChevronDown,
  Search,
  MapPin,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const mainTableData = [
  { name: 'Prosxact', cost: '₦3,500', selling: '₦5,200', total: '1,200', warehouse: '800', agents: '400', value: '₦1,250,000' },
  { name: 'Neuro-Vive Balm', cost: '₦2,800', selling: '₦4,500', total: '980', warehouse: '620', agents: '360', value: '₦887,900' },
  { name: 'After-Natal', cost: '₦4,200', selling: '₦6,800', total: '1,450', warehouse: '1,050', agents: '400', value: '₦1,250,000' },
  { name: 'Shred Belly', cost: '₦3,100', selling: '₦4,900', total: '870', warehouse: '530', agents: '340', value: '₦887,900' },
  { name: 'Fonio-Mill', cost: '₦2,500', selling: '₦3,800', total: '1,100', warehouse: '750', agents: '350', value: '₦1,250,000' },
  { name: 'Trim & Tone', cost: '₦3,900', selling: '₦5,600', total: '760', warehouse: '480', agents: '280', value: '₦887,900' },
  { name: 'Linix', cost: '₦2,200', selling: '₦3,500', total: '1,350', warehouse: '900', agents: '450', value: '₦1,250,000' },
  { name: 'Vitorep', cost: '₦3,600', selling: '₦5,100', total: '920', warehouse: '570', agents: '350', value: '₦887,900' },
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

const productHeaders = ['Prosxact', 'Neuro-Vive', 'Trim & Tone', 'Shred Belly', 'After-Natal', 'Vitorep', 'Fonio-Mill', 'Linix', 'Total'];

const warehouseData = [
  { warehouse: 'Lagos', values: [800, 720, 392, 299, 996, 381, 122, 223, 872] },
  { warehouse: 'Owerri', values: [872, 998, 1120, 3004, 207, 1998, 1762, 1762, 1876] },
  { warehouse: 'Abuja', values: [1892, 1298, 3020, 500, 2134, 762, 2371, 3294, 2887] },
  { warehouse: 'Total', values: [1892, 1298, 3020, 500, 2134, 762, 2371, 3294, 10000] },
];

const agentData = [
  { name: 'Ibrahim Lawal', avatar: 'I', color: 'bg-[#A7F3D0]', textColor: 'text-[#065F46]', values: [800, 720, 392, 299, 996, 381, 122, 223, 872] },
  { name: 'Flymack | Lagos', avatar: '🟦', color: 'bg-blue-100', textColor: 'text-blue-700', values: [299, 229, 134, 234, 209, '093', 873, '028', 736] },
  { name: 'Qudus Aina', avatar: '', color: 'bg-gray-200', textColor: 'text-gray-600', values: [917, 763, 736, 653, 653, 862, 358, 726, 826] },
  { name: 'Flymack | Lagos', avatar: '🟦', color: 'bg-blue-100', textColor: 'text-blue-700', values: [299, 229, 134, 234, 209, '093', 873, '028', 736] },
  { name: 'Qudus Aina', avatar: '', color: 'bg-gray-200', textColor: 'text-gray-600', values: [917, 763, 736, 653, 653, 862, 358, 726, 826] },
  { name: 'Flymack | Lagos', avatar: '🟦', color: 'bg-blue-100', textColor: 'text-blue-700', values: [299, 229, 134, 234, 209, '093', 873, '028', 736] },
  { name: 'Qudus Aina', avatar: '', color: 'bg-gray-200', textColor: 'text-gray-600', values: [917, 763, 736, 653, 653, 862, 358, 726, 826] },
  { name: 'Flymack | Lagos', avatar: '🟦', color: 'bg-blue-100', textColor: 'text-blue-700', values: [299, 229, 134, 234, 209, '093', 873, '028', 736] },
  { name: 'Qudus Aina', avatar: '', color: 'bg-gray-200', textColor: 'text-gray-600', values: [917, 763, 736, 653, 653, 862, 358, 726, 826] },
  { name: 'Flymack | Lagos', avatar: '🟦', color: 'bg-blue-100', textColor: 'text-blue-700', values: [299, 229, 134, 234, 209, '093', 873, '028', 736] },
  { name: 'Qudus Aina', avatar: '', color: 'bg-gray-200', textColor: 'text-gray-600', values: [917, 763, 736, 653, 653, 862, 358, 726, 826] },
  { name: 'Flymack | Lagos', avatar: '🟦', color: 'bg-blue-100', textColor: 'text-blue-700', values: [299, 229, 134, 234, 209, '093', 873, '028', 736] },
];

export function InventoryClient() {
  const [activeTab, setActiveTab] = useState<'product' | 'location'>('product');

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
        <h1 className="text-[32px] font-bold text-gray-700 tracking-tight">
          {activeTab === 'product' ? 'Product List' : 'Inventory Location View'}
        </h1>

        {/* Segmented Controls */}
        <div className="flex bg-white rounded-lg p-1 border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)] absolute left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => setActiveTab('product')}
            className={`px-8 py-2.5 rounded-md text-[13px] font-bold transition-all tracking-wide ${activeTab === 'product' ? 'bg-[#AE00FF] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Product List
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`px-8 py-2.5 rounded-md text-[13px] font-bold transition-all tracking-wide ${activeTab === 'location' ? 'bg-[#AE00FF] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Inventory Location Vie..
          </button>
        </div>

        {/* Chat Button */}
        <div className="w-16 h-16 bg-[#F3E8FF] rounded-full flex items-center justify-center ml-auto z-10 cursor-pointer">
          <div className="w-[42px] h-[42px] bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-105 transition-transform">
            <MessageCircle fill="currentColor" size={22} />
          </div>
        </div>
      </div>

      {activeTab === 'product' ? (
        <>
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
        </>
      ) : (
        <InventoryLocationView />
      )}
    </div>
  );
}

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

function InventoryLocationView() {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('All');

  const filteredWarehouse = warehouseData.filter(row => {
    if (stateFilter === 'All') return true;
    return row.warehouse === stateFilter || row.warehouse === 'Total';
  });

  const filteredAgents = agentData.filter(agent =>
    agent.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-400">
      {/* Filters Row */}
      <div className="flex items-center gap-4 mb-8">
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[180px] rounded-full border-gray-200 bg-white shadow-sm text-[13px] font-bold text-gray-600 h-[42px] px-4 focus:ring-purple-200">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-[#AE00FF]" />
              <SelectValue placeholder="State" />
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px] rounded-xl">
            <SelectItem value="All" className="text-[13px] font-medium">All States</SelectItem>
            {nigerianStates.map(state => (
              <SelectItem key={state} value={state} className="text-[13px] font-medium">
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-6 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-200 w-[280px] shadow-sm"
          />
        </div>
      </div>

      {/* Warehouse Table */}
      <div className="bg-white rounded-2xl overflow-hidden mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#4A0A77] text-white text-[13px] font-bold">
              <th className="px-6 py-4 tracking-wide">Warehouse</th>
              {productHeaders.map((h, i) => (
                <th key={i} className={`px-4 py-4 tracking-wide text-center ${i === productHeaders.length - 1 ? 'font-black' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredWarehouse.map((row, idx) => (
              <tr key={idx} className={`${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'} ${row.warehouse === 'Total' ? 'border-t border-gray-200' : ''}`}>
                <td className={`px-6 py-5 text-[14px] ${row.warehouse === 'Total' ? 'font-bold text-gray-700' : 'text-gray-500'}`}>{row.warehouse}</td>
                {row.values.map((val, i) => (
                  <td key={i} className={`px-4 py-5 text-[14px] text-center ${i === row.values.length - 1 ? 'font-black text-gray-800' : 'text-gray-500'} ${row.warehouse === 'Total' ? 'font-bold' : ''}`}>
                    {val.toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Agent Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#4A0A77] text-white text-[13px] font-bold">
              <th className="px-6 py-4 tracking-wide">Agent</th>
              {productHeaders.map((h, i) => (
                <th key={i} className={`px-4 py-4 tracking-wide text-center ${i === productHeaders.length - 1 ? 'font-black' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAgents.map((agent, idx) => (
              <tr key={idx} className={`${idx % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'} hover:bg-gray-50 transition-colors`}>
                <td className="px-6 py-4 text-[14px] text-gray-600">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${agent.color} ${agent.textColor} flex items-center justify-center text-[12px] font-bold flex-shrink-0`}>
                      {agent.avatar === '🟦' ? (
                        <div className="w-full h-full rounded-full bg-blue-400" />
                      ) : agent.avatar ? (
                        agent.avatar
                      ) : (
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" alt="" className="w-full h-full rounded-full object-cover" />
                      )}
                    </div>
                    <span className="font-medium text-[13px]">{agent.name}</span>
                  </div>
                </td>
                {agent.values.map((val, i) => (
                  <td key={i} className={`px-4 py-4 text-[14px] text-center ${i === agent.values.length - 1 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
