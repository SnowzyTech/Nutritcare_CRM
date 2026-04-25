"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddDriverPage() {
  const [locations, setLocations] = useState([""]);

  const addLocation = () => setLocations([...locations, ""]);
  
  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-4 pb-20">
      {/* Back Button & Header Section */}
      <div className="space-y-4">
        <Link 
          href="/logistics/agents" 
          className="flex items-center gap-2 text-gray-500 hover:text-[#ad1df4] transition-colors text-sm font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800">Add Agent</h1>
            <span className="text-xs font-bold text-gray-400">NEW</span>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              className="bg-[#d1d5db] hover:bg-[#9ca3af] text-white px-10 font-bold h-10 rounded-md"
            >
              Reset
            </Button>
            <Button className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-10 font-bold h-10 rounded-md">
              Save agent
            </Button>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Company/Agents Name
            </label>
            <Input
              placeholder="Type in here"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Address
            </label>
            <Input
              placeholder="Type in here"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Status
            </label>
            <Select>
              <SelectTrigger className="h-11 text-xs text-gray-400 border-gray-200">
                <SelectValue placeholder="Select an Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Phone 1 ( No Country Code)
            </label>
            <Input
              placeholder="Phone Number MUST be unique for each agent"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Phone 2
            </label>
            <Input
              placeholder="Type in here"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Phone 3
            </label>
            <Input
              placeholder="Type in here"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase leading-tight block">
              DOES THIS AGENT PICK PRODUCT FROM THE OFFICE STOCK?
            </label>
            <Select>
              <SelectTrigger className="h-11 text-xs text-gray-400 border-gray-200">
                <SelectValue placeholder="Select an Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Select Country
            </label>
            <Input
              placeholder="Type in here"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Select States Covered by Agent
            </label>
            <Input
              placeholder="Type in here"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
        </div>

        {/* Row 4 (Locations & Credentials) */}
        <div className="grid grid-cols-3 gap-8 pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-700 uppercase">
                LOCATIONS COVERED IN STATES
              </label>
              <button 
                onClick={addLocation}
                className="text-[#ad1df4] hover:text-[#8e14cc] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {locations.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Location ${index + 1}`}
                    className="bg-white border-gray-200 h-10 text-xs focus:ring-[#ad1df4] flex-1"
                  />
                  {locations.length > 1 && (
                    <button 
                      onClick={() => removeLocation(index)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Email
            </label>
            <Input
              type="email"
              placeholder="Email address"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-700 uppercase">
              Password
            </label>
            <Input
              type="password"
              placeholder="Password"
              className="bg-white border-gray-200 h-11 text-xs focus:ring-[#ad1df4]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
