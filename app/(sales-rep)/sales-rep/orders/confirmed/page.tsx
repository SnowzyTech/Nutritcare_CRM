'use client';

import React, { useState } from 'react';

interface Order {
  id: string;
  email: string;
  name: string;
  agent?: string;
  agentLocation?: string;
  product: string;
  quantity: number;
  date: string;
}

const confirmedOrders: Order[] = [
  {
    id: '1',
    email: 'chinedu.okafor.ng@gmail.com',
    name: 'Chinedu Okafor',
    agent: 'Mr. Qudus',
    agentLocation: 'Lagos State',
    product: 'Trim and Tone',
    quantity: 4,
    date: '03-02-2026',
  },
  {
    id: '2',
    email: 'blessing.eze.ng@gmail.com',
    name: 'Blessing Eze',
    agent: 'Mr. Oyelowo',
    agentLocation: 'Ogun State',
    product: 'Neuro-Vive Balm',
    quantity: 1,
    date: '03-02-2026',
  },
  {
    id: '3',
    email: 'sola.ogunleye.ng@gmail.com',
    name: 'Sola Ogunleye',
    product: 'Prosxact',
    quantity: 3,
    date: '03-02-2026',
  },
  {
    id: '4',
    email: 'halima.abdullahi.ng@gmail.com',
    name: 'Halima Abdullahi',
    agent: 'Mr. Praise',
    agentLocation: 'Ebonyi State',
    product: 'Shred Belly',
    quantity: 6,
    date: '03-02-2026',
  },
];

function StatusIndicator({ status = 'confirmed' }: { status?: string }) {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-400',
    confirmed: 'bg-green-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-400',
    failed: 'bg-red-600',
  };
  const bgColor = colorMap[status] || 'bg-gray-400';
  return (
    <div className={`w-3 h-3 rounded-full ${bgColor} flex-shrink-0`} />
  );
}

export default function ConfirmedOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = confirmedOrders.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome Back, Tolani
        </h2>

        {/* Status Tab - Confirmed */}
        <div className="mb-6">
          <div className="flex gap-4">
            <span className="bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-semibold inline-block">
              Confirmed{' '}
              <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-xs">
                {confirmedOrders.length}
              </span>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-gray-500 font-medium hover:bg-gray-50 transition">
            🔍 Filter
          </button>
          <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-gray-500 font-medium hover:bg-gray-50 transition">
            📅 Date
          </button>

          {/* Search Input */}
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ml-auto border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-500 min-w-52 outline-none focus:border-purple-600"
          />
        </div>

        {/* Status Badge */}
        <span className="bg-green-500 text-white px-3 py-1 rounded text-xs font-semibold inline-block">
          Confirmed
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-left font-semibold text-gray-500 text-xs uppercase">
                G-Mail
              </th>
              <th className="p-4 text-left font-semibold text-gray-500 text-xs uppercase">
                Name
              </th>
              <th className="p-4 text-left font-semibold text-gray-500 text-xs uppercase">
                Agent
              </th>
              <th className="p-4 text-left font-semibold text-gray-500 text-xs uppercase">
                Product
              </th>
              <th className="p-4 text-left font-semibold text-gray-500 text-xs uppercase">
                Quantity
              </th>
              <th className="p-4 text-left font-semibold text-gray-500 text-xs uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer">
                <td className="p-4 flex items-center gap-3">
                  <StatusIndicator status="confirmed" />
                  <span className="text-gray-500 text-sm">
                    {order.email}
                  </span>
                </td>
                <td className="p-4 text-gray-900 font-medium">
                  {order.name}
                </td>
                <td className="p-4">
                  {order.agent ? (
                    <div>
                      <div className="text-gray-900 font-medium text-sm">
                        {order.agent}
                      </div>
                      {order.agentLocation && (
                        <div className="text-gray-400 text-xs">
                          {order.agentLocation}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-4 text-gray-900 font-medium">
                  {order.product}
                </td>
                <td className="p-4 text-gray-900">
                  {order.quantity}
                </td>
                <td className="p-4 text-gray-500">
                  {order.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="p-12 text-center text-gray-400">
          <p>No confirmed orders found</p>
        </div>
      )}
    </div>
  );
}
