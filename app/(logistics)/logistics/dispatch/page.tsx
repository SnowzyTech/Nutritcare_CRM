"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DispatchPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    orderId: "",
    address: "",
    driver: "",
    priority: "",
    agent: "BELLO & CO.",
    state: "IMO STATE",
  });

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const address = searchParams.get("address");
    if (orderId || address) {
      setFormData(prev => ({
        ...prev,
        orderId: orderId || prev.orderId,
        address: address || prev.address,
      }));
    }
  }, [searchParams]);

  const drivers = [
    { name: "J.Eze", vehicle: "Truck A3", status: "On route", color: "purple", load: 70 },
    { name: "A.Musa", vehicle: "Van B1", status: "Available", color: "green", load: 95 },
    { name: "K.Obi", vehicle: "Truck A1", status: "Available", color: "yellow", load: 45 },
    { name: "P.Adaku", vehicle: "Van B2", status: "On route", color: "purple", load: 90 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pt-2 pb-20">
      {/* Create Dispatch Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800">Create dispatch</h1>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">NEW</span>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              className="bg-[#d1d5db] hover:bg-[#9ca3af] text-white px-8 font-bold h-10 rounded-md"
              onClick={() => setFormData({ orderId: "", address: "", driver: "", priority: "", agent: "", state: "" })}
            >
              Reset
            </Button>
            <Button className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-8 font-bold h-10 rounded-md">
              Dispatch
            </Button>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">ORDER ID</label>
            <Select 
              value={formData.orderId} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, orderId: val }))}
            >
              <SelectTrigger className="h-10 text-xs text-gray-500 border-gray-200">
                <SelectValue placeholder="Select an Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="#ORD-4820">#ORD-4820</SelectItem>
                <SelectItem value="#ORD-4821">#ORD-4821</SelectItem>
                <SelectItem value="#ORD-4817">#ORD-4817</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">DELIVERY ADDRESS</label>
            <Input 
              value={formData.address} 
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="3, Marina Road" 
              className="h-10 text-xs border-gray-200 placeholder:text-gray-300" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">ASSIGN DRIVER</label>
            <Select 
              value={formData.driver} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, driver: val }))}
            >
              <SelectTrigger className="h-10 text-xs text-gray-400 border-gray-200">
                <SelectValue placeholder="Select an Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="j-eze">J.Eze</SelectItem>
                <SelectItem value="a-musa">A.Musa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">PRIORITY</label>
            <Select 
              value={formData.priority} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
            >
              <SelectTrigger className="h-10 text-xs text-gray-400 border-gray-200">
                <SelectValue placeholder="Select an Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">AGENT OR WAREHOUSE</label>
            <Select 
              value={formData.agent} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, agent: val }))}
            >
              <SelectTrigger className="h-10 text-xs text-gray-500 border-gray-200">
                <SelectValue placeholder="BELLO & CO." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BELLO & CO.">BELLO & CO.</SelectItem>
                <SelectItem value="WAREHOUSE 1">WAREHOUSE 1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-800 uppercase">SELECT STATE</label>
            <Select 
              value={formData.state} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, state: val }))}
            >
              <SelectTrigger className="h-10 text-xs text-gray-500 border-gray-200">
                <SelectValue placeholder="IMO STATE" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IMO STATE">IMO STATE</SelectItem>
                <SelectItem value="LAGOS STATE">LAGOS STATE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Available Drivers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#d1d5db] px-6 py-2.5">
          <span className="text-xs font-bold text-gray-600">Available</span>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="text-gray-400 font-bold bg-[#faf5ff] uppercase">
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
                <td className="px-6 py-4 font-bold text-gray-700">{driver.name}</td>
                <td className="px-6 py-4 text-gray-500 font-medium">{driver.vehicle}</td>
                <td className="px-6 py-4">
                  <span className={`px-8 py-1 rounded-full text-[10px] font-bold ${
                    driver.status === 'On route' 
                      ? 'bg-[#faf5ff] text-[#ad1df4] border border-[#f3e8ff]' 
                      : 'bg-[#f0fdf4] text-[#22c55e] border border-[#dcfce7]'
                  }`}>
                    {driver.status}
                  </span>
                </td>
                <td className="px-6 py-4 w-72">
                  <div className="w-full bg-gray-100 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${
                        driver.load < 50 ? 'bg-[#eab308]' : 'bg-[#22c55e]'
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


