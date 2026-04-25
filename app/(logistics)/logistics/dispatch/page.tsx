"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DispatchPage() {
  const drivers = [
    { name: "J.Eze", vehicle: "Truck A3", status: "On route", color: "purple", load: 70 },
    { name: "A.Musa", vehicle: "Van B1", status: "Available", color: "green", load: 90 },
    { name: "K.Obi", vehicle: "Truck A1", status: "Available", color: "green", load: 40 },
    { name: "P.Adaku", vehicle: "Van B2", status: "On route", color: "purple", load: 85 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pt-8 pb-20">
      {/* Create Dispatch Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 space-y-10">
        <div className="flex items-center justify-between border-b pb-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800">Create dispatch</h1>
            <span className="text-xs font-bold text-gray-400 uppercase">NEW</span>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              className="bg-[#d1d5db] hover:bg-[#9ca3af] text-white px-10 font-bold h-10 rounded-md"
            >
              Reset
            </Button>
            <Button className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-10 font-bold h-10 rounded-md uppercase">
              Dispatch
            </Button>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">Order ID</label>
            <Input placeholder="Type in here" className="h-11 text-xs border-gray-200" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">Delivery Address</label>
            <Input placeholder="Phone Number MUST be unique for each agent" className="h-11 text-xs border-gray-200" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">Assign Driver</label>
            <Input placeholder="Type in here" className="h-11 text-xs border-gray-200" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">Priority</label>
            <Select>
              <SelectTrigger className="h-11 text-xs text-gray-400 border-gray-200">
                <SelectValue placeholder="Select an Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">Agent or Warehouse</label>
            <Select>
              <SelectTrigger className="h-11 text-xs text-gray-400 border-gray-200">
                <SelectValue placeholder="Select an Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warehouse1">Warehouse 1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">Select State</label>
            <Select>
              <SelectTrigger className="h-11 text-xs text-gray-400 border-gray-200">
                <SelectValue placeholder="Select an Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lagos">Lagos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Available Drivers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#d1d5db] px-6 py-3">
          <span className="text-sm font-bold text-gray-600">Available</span>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-gray-500 font-medium bg-gray-50/30">
            <tr>
              <th className="px-6 py-4 w-10"><Checkbox className="border-gray-300" /></th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">Vehicle</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Current Load</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {drivers.map((driver, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4"><Checkbox className="border-gray-300" /></td>
                <td className="px-6 py-4 font-medium text-gray-700">{driver.name}</td>
                <td className="px-6 py-4 text-gray-500">{driver.vehicle}</td>
                <td className="px-6 py-4">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                    driver.color === 'purple' 
                      ? 'bg-[#faf5ff] text-[#ad1df4] border border-[#ad1df4]' 
                      : 'bg-[#f0fdf4] text-[#22c55e] border border-[#22c55e]'
                  }`}>
                    {driver.status}
                  </span>
                </td>
                <td className="px-6 py-4 w-64">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        driver.load > 80 ? 'bg-[#22c55e]' : driver.load > 50 ? 'bg-[#22c55e]/70' : 'bg-[#eab308]'
                      }`}
                      style={{ width: `${driver.load}%` }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
