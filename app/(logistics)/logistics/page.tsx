

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function LogisticsDashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Stepper */}
      <div className="bg-[#faf5ff] rounded-full px-6 py-3 flex items-center gap-2 text-sm">
        <Step number="1" label="Order in" />
        <span className="text-gray-400">&gt;</span>
        <Step number="2" label="Confirm stock" />
        <span className="text-gray-400">&gt;</span>
        <Step number="3" label="Pick & Pack" />
        <span className="text-gray-400">&gt;</span>
        <Step number="4" label="Dispatch" active />
        <span className="text-gray-400">&gt;</span>
        <Step number="5" label="Delivered" disabled />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <span className="text-xs font-bold text-gray-500 uppercase">Pending Dispatch</span>
          <div className="flex items-end justify-between mt-auto">
            <span className="text-4xl font-bold text-gray-800">18</span>
            <span className="text-sm font-semibold text-green-500">Awaiting</span>
          </div>
        </div>
        <div className="bg-[#ffede6] rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative">
          <span className="text-xs font-bold text-gray-700 uppercase">In Transit</span>
          <div className="flex items-end justify-between mt-auto">
            <span className="text-4xl font-bold text-gray-800">47</span>
            <span className="text-sm font-semibold text-[#ad1df4]">LIVE</span>
          </div>
        </div>
        <div className="bg-[#e6f0fa] rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative">
          <span className="text-xs font-bold text-gray-700 uppercase">Delivered Today</span>
          <div className="flex items-end justify-between mt-auto">
            <span className="text-4xl font-bold text-gray-800">275</span>
            <span className="text-sm font-semibold text-green-600">On Track</span>
          </div>
        </div>
        <div className="bg-[#fb923c] rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 text-white relative">
          <span className="text-xs font-bold uppercase">Failed / Returns</span>
          <div className="flex items-end justify-between mt-auto">
            <span className="text-4xl font-bold">8</span>
            <span className="text-sm font-semibold">Action Needed</span>
          </div>
        </div>
      </div>

      {/* Main Tables Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Delivery Queue */}
        <div className="col-span-7 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#e5e7eb] px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-600 text-sm">Delivery Queue</h3>
            <Button className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white h-8 text-xs px-4 rounded-md">
              + Dispatch
            </Button>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b">
                  <th className="pb-3 w-8"><Checkbox /></th>
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Driver</th>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <TableRow
                  orderId="#ORD-4821" customer="Acme Ltd" driver="J.Eze" time="14:30"
                  status="In Transit" statusColor="bg-[#f0d9ff] text-[#ad1df4]"
                />
                <TableRow
                  orderId="#ORD-4820" customer="Bello & Co" driver="-" time="-"
                  status="Pending" statusColor="bg-[#ffebd6] text-orange-500"
                />
                <TableRow
                  orderId="#ORD-4819" customer="ClearPath" driver="A.Musa" time="12:00"
                  status="Delivered" statusColor="bg-green-600 text-white"
                />
                <TableRow
                  orderId="#ORD-4818" customer="Delta Stores" driver="K.Obi" time="-"
                  status="Failed" statusColor="bg-red-700 text-white"
                />
                <TableRow
                  orderId="#ORD-4817" customer="Eco Supply" driver="P.Adaku" time="16:00"
                  status="In Transit" statusColor="bg-[#f0d9ff] text-[#ad1df4]"
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Driver assignments */}
        <div className="col-span-5 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#e5e7eb] px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-600 text-sm">Driver assignments</h3>
            <Button className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white h-8 text-xs px-4 rounded-md">
              + Manage
            </Button>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b">
                  <th className="pb-3 w-8"><Checkbox /></th>
                  <th className="pb-3 font-medium">Driver</th>
                  <th className="pb-3 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium">Stops</th>
                  <th className="pb-3 font-medium">Load</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <DriverRow driver="J.Eze" vehicle="Truck A3" stops="6/8" percent={75} color="bg-green-500" />
                <DriverRow driver="A.Musa" vehicle="Van B1" stops="3/5" percent={60} color="bg-[#ad1df4]" />
                <DriverRow driver="K.Obi" vehicle="Truck A1" stops="2/8" percent={25} color="bg-orange-500" />
                <DriverRow driver="P.Adaku" vehicle="Van B2" stops="5/5" percent={100} color="bg-green-500" />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-12 gap-6 pb-8">
        {/* Route queue */}
        <div className="col-span-7 bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-[#e5e7eb] px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-600 text-sm">Route queue</h3>
            <Button className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white h-8 text-xs px-4 rounded-md">
              Optimise &gt;
            </Button>
          </div>
          <div className="p-8 flex flex-col items-center justify-center border-b">
            <p className="text-xs text-gray-400 mb-2">Route A3 - 6 stops - 42km - click to open</p>
          </div>
          <div className="grid grid-cols-3 gap-2 p-2 bg-white">
            <button className="bg-gray-300 text-gray-600 rounded-md py-1.5 text-xs font-semibold">Zone A</button>
            <button className="bg-gray-300 text-gray-600 rounded-md py-1.5 text-xs font-semibold">Zone A</button>
            <button className="bg-gray-300 text-gray-600 rounded-md py-1.5 text-xs font-semibold">Zone A</button>
          </div>
        </div>

        {/* Alerts */}
        <div className="col-span-5 border border-gray-100 bg-white rounded-xl overflow-hidden flex flex-col">
          <div className="bg-[#e5e7eb] px-4 py-3">
            <h3 className="font-semibold text-gray-600 text-sm">Alerts</h3>
          </div>
          <div className="p-4 space-y-4">
            <AlertItem
              color="bg-red-500"
              message="#ORD-4818 delivery failed — customer not home"
              time="13 min ago"
            />
            <AlertItem
              color="bg-orange-400"
              message="Truck A1 delayed — traffic on Eko Bridge"
              time="22 min ago"
            />
            <AlertItem
              color="bg-[#ad1df4]"
              message="3 orders queued — no driver assigned yet"
              time="1 hr ago"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ number, label, active, disabled }: { number: string; label: string; active?: boolean; disabled?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
        active ? 'bg-[#ad1df4] text-white' : 
        disabled ? 'bg-gray-200 text-gray-500' : 'bg-gray-800 text-white'
      }`}>
        {number}
      </div>
      <span className={`font-semibold ${active ? 'text-[#ad1df4]' : ''}`}>{label}</span>
    </div>
  );
}

function TableRow({ orderId, customer, driver, time, status, statusColor }: any) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="py-3"><Checkbox /></td>
      <td className="py-3 font-medium text-gray-700">{orderId}</td>
      <td className="py-3 text-gray-600">{customer}</td>
      <td className="py-3 text-gray-600">{driver}</td>
      <td className="py-3 text-gray-500">{time}</td>
      <td className="py-3">
        <span className={`px-3 py-1 rounded text-xs font-semibold ${statusColor}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function DriverRow({ driver, vehicle, stops, percent, color }: any) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="py-3"><Checkbox /></td>
      <td className="py-3 font-medium text-gray-700">{driver}</td>
      <td className="py-3 text-gray-600">{vehicle}</td>
      <td className="py-3 text-gray-500">{stops}</td>
      <td className="py-3 w-24">
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
        </div>
      </td>
    </tr>
  );
}

function AlertItem({ color, message, time }: { color: string; message: string; time: string }) {
  return (
    <div className="flex gap-3">
      <div className={`w-2 h-2 rounded-full mt-1.5 ${color} flex-shrink-0`} />
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-700">{message}</span>
        <span className="text-[10px] text-gray-400 mt-0.5">{time}</span>
      </div>
    </div>
  );
}
