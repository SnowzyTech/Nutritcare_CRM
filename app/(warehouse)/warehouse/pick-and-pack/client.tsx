"use client";

import React, { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { PickPackOrder } from "@/lib/mock-data/warehouse";

const statusBg: Record<string, string> = {
  Packed: "bg-[#059669] text-white", // match green from image
  Queued: "bg-[#F59E0B] text-white", // match orange from image
};

const shelves = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"];

export default function PickAndPackClient({ initialOrders }: { initialOrders: PickPackOrder[] }) {
  const [activeTab, setActiveTab] = useState<"All" | "Queued" | "Packed">("All");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  // Pickers state
  const [pickers, setPickers] = useState([
    { name: "J.Eze", info: "Task: 2 Active | Available" },
    { name: "S.Okafor", info: "Tasks; 4 Active | Status: Busy" },
    { name: "A. Balogun", info: "Tasks: 1 Active | Status: Availble" },
  ]);

  // Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<string>("A1");
  const [isShelfDropdownOpen, setIsShelfDropdownOpen] = useState(false);
  const [selectedPicker, setSelectedPicker] = useState<string | null>(null);
  const [isPickerDropdownOpen, setIsPickerDropdownOpen] = useState(false);
  const [isHighPriority, setIsHighPriority] = useState(false);
  
  // Add Picker state
  const [isAddingPicker, setIsAddingPicker] = useState(false);
  const [newPickerName, setNewPickerName] = useState("");

  // Close dropdowns on outside click
  const pickerDropdownRef = useRef<HTMLDivElement>(null);
  const shelfDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerDropdownRef.current && !pickerDropdownRef.current.contains(event.target as Node)) {
        setIsPickerDropdownOpen(false);
      }
      if (shelfDropdownRef.current && !shelfDropdownRef.current.contains(event.target as Node)) {
        setIsShelfDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOrders = initialOrders.filter((order) => {
    if (activeTab === "All") return true;
    return order.status === activeTab;
  });

  const getTabClass = (tab: string) => {
    return activeTab === tab
      ? "bg-[#ad1df4] text-white text-[13px] font-bold px-4 py-1.5 rounded-md shadow-sm"
      : "bg-[#f3f4f6] text-gray-500 text-[13px] font-medium px-4 py-1.5 rounded-md hover:bg-gray-200 transition-colors";
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleAddNewPicker = () => {
    if (!newPickerName.trim()) return;
    setPickers([...pickers, { name: newPickerName.trim(), info: "Task: 0 Active | Available" }]);
    setSelectedPicker(newPickerName.trim());
    setNewPickerName("");
    setIsAddingPicker(false);
  };

  return (
    <>
      <div className="space-y-6 mt-4 max-w-6xl">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab("All")} className={getTabClass("All")}>
              All
            </button>
            <button onClick={() => setActiveTab("Queued")} className={getTabClass("Queued")}>
              Queued
            </button>
            <button onClick={() => setActiveTab("Packed")} className={getTabClass("Packed")}>
              Packed
            </button>
          </div>
          <button className="bg-[#f3f4f6] text-gray-500 text-[13px] font-medium px-5 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
            Export
          </button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white overflow-hidden shadow-sm">
          {/* Gray Bar */}
          <div className="bg-[#e5e7eb] px-5 py-3 flex items-center justify-between rounded-t-lg">
            <h2 className="text-[13px] font-medium text-gray-600">Pick &amp; pack Queue</h2>
            <button
              onClick={() => {
                if (selectedOrderIds.length > 0) setIsAssignModalOpen(true);
              }}
              className={`${
                selectedOrderIds.length > 0
                  ? "bg-[#ad1df4] hover:bg-[#9b19dc]"
                  : "bg-[#d1a3e6] cursor-not-allowed opacity-80"
              } text-white text-[13px] font-bold px-6 py-2 rounded-lg transition-colors shadow-sm`}
              disabled={selectedOrderIds.length === 0}
            >
              Assign Picker {selectedOrderIds.length > 0 ? `(${selectedOrderIds.length})` : ""}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead className="bg-[#faf5ff]">
                <tr className="text-gray-500 text-left font-medium">
                  <th className="px-5 py-4 w-12 font-medium">
                    <Checkbox
                      className="border-gray-300"
                      checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 font-medium">Order ID</th>
                  <th className="px-4 py-4 font-medium">dispatch</th>
                  <th className="px-4 py-4 font-medium">Items</th>
                  <th className="px-4 py-4 font-medium">Picker</th>
                  <th className="px-4 py-4 font-medium">BIN Location</th>
                  <th className="px-4 py-4 font-medium">Started</th>
                  <th className="px-4 py-4 font-medium w-32 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-t border-white">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-5 py-4">
                        <Checkbox
                          className="border-gray-300"
                          checked={selectedOrderIds.includes(order.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOrderIds([...selectedOrderIds, order.id]);
                            } else {
                              setSelectedOrderIds(selectedOrderIds.filter((id) => id !== order.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-4 text-gray-500">{order.id}</td>
                      <td className="px-4 py-4 text-gray-500">P. John</td>
                      <td className="px-4 py-4 text-gray-500">{order.items}</td>
                      <td className="px-4 py-4 text-gray-500">
                        {order.status === "Queued" ? "-" : order.picker}
                      </td>
                      <td className="px-4 py-4 text-gray-500">{order.location}</td>
                      <td className="px-4 py-4 text-gray-500">14:00</td>
                      <td className={`px-4 py-4 text-center font-medium ${statusBg[order.status]}`}>
                        {order.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign Picker Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-[480px] p-8 shadow-2xl relative">
            <h2 className="text-3xl font-bold text-black mb-1">Assign Orders</h2>
            <p className="text-gray-600 mb-8">You have Selected {selectedOrderIds.length} Orders for assignment</p>
            
            <h3 className="text-[17px] font-bold text-black mb-4">Selected Orders</h3>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500 text-sm">Select the pick up shelves<br/><span className="text-black">A1, B2, C2</span></span>
              <div className="relative" ref={shelfDropdownRef}>
                <button 
                  onClick={() => setIsShelfDropdownOpen(!isShelfDropdownOpen)}
                  className="bg-[#e5e7eb] border border-gray-400 px-4 py-2 rounded text-gray-800 font-medium min-w-[60px] flex items-center justify-between gap-2"
                >
                  {selectedShelf}
                  <span className="text-[10px]">â–¼</span>
                </button>
                {isShelfDropdownOpen && (
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 w-24 max-h-40 overflow-y-auto">
                    {shelves.map(shelf => (
                      <button
                        key={shelf}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedShelf(shelf);
                          setIsShelfDropdownOpen(false);
                        }}
                      >
                        {shelf}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="border border-gray-300 rounded overflow-y-auto h-32 p-2 mb-8 text-gray-700 font-mono text-sm leading-relaxed">
              {selectedOrderIds.map(id => (
                <div key={id}>{id}</div>
              ))}
            </div>

            <h3 className="text-[17px] font-bold text-black mb-3">Assign to picker</h3>
            <div className="mb-4 relative" ref={pickerDropdownRef}>
              <button 
                onClick={() => setIsPickerDropdownOpen(!isPickerDropdownOpen)}
                className="w-full bg-white border border-[#f3e8ff] p-2.5 text-[#a855f7] text-sm mb-3 rounded-md flex justify-between items-center shadow-sm"
              >
                <span className="flex-1 text-center font-medium">
                  {selectedPicker ? selectedPicker : "Select an Option"}
                </span>
                <span className="bg-[#fdfaff] px-2 py-0.5 rounded shadow-sm text-gray-400">â–¼</span>
              </button>
              
              {isPickerDropdownOpen && (
                <div className="absolute top-12 left-0 w-full bg-white border border-gray-200 rounded shadow-xl z-20">
                  {pickers.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setSelectedPicker(p.name);
                        setIsPickerDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center"
                    >
                      <strong className="text-gray-800">{p.name}</strong>
                      <span className="text-xs text-gray-500">{p.info}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Display selected picker info below the dropdown like the design */}
              <div className="text-sm text-gray-600 space-y-1.5 px-1 bg-gray-50/50 p-2 rounded border border-gray-100">
                {pickers.map((p) => (
                   <div key={p.name} className={`flex gap-2 transition-opacity duration-200 ${selectedPicker === p.name ? 'opacity-100' : 'opacity-50'}`}>
                     <strong className="text-gray-800 w-20">{p.name}</strong> 
                     <span className="text-gray-500 text-[13px]">{p.info}</span>
                   </div>
                ))}
              </div>
            </div>

            {isAddingPicker ? (
              <div className="flex items-center gap-2 mb-8">
                <input
                  type="text"
                  value={newPickerName}
                  onChange={(e) => setNewPickerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNewPicker()}
                  placeholder="Enter Picker Name"
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm flex-1 focus:outline-none focus:border-purple-400"
                  autoFocus
                />
                <button
                  onClick={handleAddNewPicker}
                  className="bg-[#ad1df4] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#9b19dc] transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsAddingPicker(false)}
                  className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingPicker(true)}
                className="bg-[#b5b5b5] text-white text-xs font-bold px-4 py-2 rounded-md mb-8 hover:bg-gray-400 transition-colors"
              >
                Add a Picker
              </button>
            )}

            <div 
              className="flex items-center gap-3 mb-8 cursor-pointer select-none"
              onClick={() => setIsHighPriority(!isHighPriority)}
            >
              <div className={`w-5 h-5 rounded-full border-[1.5px] border-[#ad1df4] flex items-center justify-center transition-all ${isHighPriority ? 'bg-purple-50' : 'bg-white'}`}>
                {isHighPriority && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ad1df4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
              <span className="text-black text-[15px]">Mark as High Priority</span>
            </div>

            <div className="flex gap-4">
              <button onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedPicker(null);
                setIsHighPriority(false);
                setIsAddingPicker(false);
              }} className="bg-[#a3a3a3] text-white font-bold py-2.5 px-8 rounded-md hover:bg-gray-500 transition-colors">
                Close
              </button>
              <button onClick={() => {
                if (!selectedPicker) {
                  alert("Please select a picker first.");
                  return;
                }
                alert(`Successfully assigned ${selectedOrderIds.length} orders to ${selectedPicker}!${isHighPriority ? ' (High Priority)' : ''}`);
                setIsAssignModalOpen(false);
                setSelectedOrderIds([]);
                setSelectedPicker(null);
                setIsHighPriority(false);
                setIsAddingPicker(false);
              }} className="bg-[#ad1df4] text-white font-bold py-2.5 px-8 rounded-md hover:bg-[#9b19dc] transition-colors">
                Assign Picker
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
