'use client';

import React from 'react';

function KPICard({
  label,
  value,
  delta,
  period = 'This Month',
}: {
  label: string;
  value: string;
  delta: string;
  period?: string;
}) {
  const positive = delta.startsWith('+');
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-500">
          {label}
        </span>
        <span className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-500 inline-flex items-center gap-1 whitespace-nowrap">
          {period} ▾
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 m-0">
        {value}
      </p>
      <p className="text-xs mt-1">
        <span className={`font-semibold ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {delta}
        </span>{' '}
        <span className="text-gray-400">vs last month</span>
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Total Products Sold" value="180" delta="+21%" />
        <KPICard label="Total Order/Customer" value="64" delta="+12%" />
        <KPICard label="Best Selling Product" value="Prosxact" delta="+18%" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="General Performance" value="80%" delta="+12%" />
        <KPICard label="Upselling Rate" value="30%" delta="+12%" />
        <KPICard label="Confirmation Rate" value="60%" delta="+12%" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Delivery Rate" value="78%" delta="+12%" />
        <KPICard label="Cancellation Rate" value="8%" delta="+12%" />
        <KPICard label="Recovery Rate" value="27%" delta="+12%" />
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white max-w-xs">
        <div className="text-xs font-semibold text-purple-100 uppercase tracking-wide mb-3">
          KPI
        </div>
        <p className="text-4xl font-bold mb-2">21%</p>
        <div className="text-sm mb-2">Target for the month: XXXXXXX</div>
        <p className="text-xs">
          <span className="font-semibold">+12%</span> vs last month
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="bg-purple-100 border border-purple-200 px-5 py-3 rounded-lg font-semibold text-purple-600 text-sm flex items-center justify-center gap-2 hover:bg-purple-50 transition">
          💜 Generate Weekly Report →
        </button>
        <button className="bg-purple-100 border border-purple-200 px-5 py-3 rounded-lg font-semibold text-purple-600 text-sm flex items-center justify-center gap-2 hover:bg-purple-50 transition">
          💜 Generate Monthly Report →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Best Selling Product</h3>
            <span className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-500">This Month ▾</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-semibold text-gray-500">Product</th>
                <th className="text-right py-3 font-semibold text-gray-500">Amount Sold</th>
              </tr>
            </thead>
            <tbody>
              {[{ name: 'Prosxact', amount: 41 }, { name: 'Neuro-Vive Balm', amount: 33 }, { name: 'Trim and Tone', amount: 29 }, { name: 'After-Natal', amount: 25 }, { name: 'Shred Belly', amount: 22 }, { name: 'Linix', amount: 18 }, { name: 'Fonio Mill', amount: 12 }].map((p) => (
                <tr key={p.name} className="border-b border-gray-100">
                  <td className="py-3 text-gray-900">{p.name}</td>
                  <td className="py-3 text-right text-gray-900 font-medium">{p.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Upselling Rate</h3>
            <span className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-500">This Month ▾</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-semibold text-gray-500">Product</th>
                <th className="text-right py-3 font-semibold text-gray-500">No of Upsell</th>
              </tr>
            </thead>
            <tbody>
              {[{ name: 'Neuro-Vive Balm', amount: 10 }, { name: 'Prosxact', amount: 5 }, { name: 'After-Natal', amount: 5 }, { name: 'Trim and Tone', amount: 4 }, { name: 'Fonio Mill', amount: 0 }, { name: 'Shred Belly', amount: 0 }, { name: 'Linix', amount: 0 }].map((p) => (
                <tr key={p.name} className="border-b border-gray-100">
                  <td className="py-3 text-gray-900">{p.name}</td>
                  <td className="py-3 text-right text-gray-900 font-medium">{p.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
