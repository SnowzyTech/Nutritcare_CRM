'use client';

import React, { useState } from 'react';

interface Order {
  id: string;
  email: string;
  name: string;
  number: string;
  product: string;
  quantity: number;
  date: string;
}

const pendingOrders: Order[] = [
  {
    id: '1',
    email: 'adewale.johnson.ng@gmail.com',
    name: 'Adewale Johnson',
    number: '+234 803 456 1290',
    product: 'Prosxact',
    quantity: 3,
    date: '03-02-2026',
  },
  {
    id: '2',
    email: 'funke.adebayo.ng@gmail.com',
    name: 'Funke Adebayo',
    number: '+234 812 774 6632',
    product: 'Shred Belly',
    quantity: 2,
    date: '03-02-2026',
  },
  {
    id: '3',
    email: 'ibrahim.musa.ng@gmail.com',
    name: 'Ibrahim Musa',
    number: '+234 809 118 5044',
    product: 'Fonio-Mill',
    quantity: 5,
    date: '03-02-2026',
  },
  {
    id: '4',
    email: 'chinedu.okafor.ng@gmail.com',
    name: 'Chinedu Okafor',
    number: '+234 803 456 1290',
    product: 'Trim and Tone',
    quantity: 4,
    date: '03-02-2026',
  },
  {
    id: '5',
    email: 'blessing.eze.ng@gmail.com',
    name: 'Blessing Eze',
    number: '+234 803 456 1290',
    product: 'Neuro-Vive Balm',
    quantity: 1,
    date: '03-02-2026',
  },
  {
    id: '6',
    email: 'sola.ogunleye.ng@gmail.com',
    name: 'Sola Ogunleye',
    number: '+234 803 456 1290',
    product: 'Prosxact',
    quantity: 3,
    date: '03-02-2026',
  },
];

function StatusIndicator({ status = 'pending' }: { status?: string }) {
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

export default function PendingOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = pendingOrders.filter(
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

        {/* Status Tab - Pending */}
        <div className="mb-6">
          <div className="flex gap-4">
            <span className="bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-semibold inline-block">
              Pending{' '}
              <span className="ml-2 bg-white/30 px-2 py-0.5 rounded-full text-xs">
                {pendingOrders.length}
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
        <span className="bg-yellow-400 text-white px-3 py-1 rounded text-xs font-semibold inline-block">
          Pending
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
                Number
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
                  <StatusIndicator status="pending" />
                  <span className="text-gray-500 text-sm">
                    {order.email}
                  </span>
                </td>
                <td className="p-4 text-gray-900 font-medium">
                  {order.name}
                </td>
                <td className="p-4 text-gray-900">
                  {order.number}
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
          <p>No pending orders found</p>
        </div>
      )}
    </div>
  );
}
