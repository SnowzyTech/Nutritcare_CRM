"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter as FilterIcon, 
  ArrowUpDown, 
  ArrowLeft,
  ChevronDown 
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function ReturnsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const mockReturns = [
    { id: 1, date: "24 Feb 2026", product: "Balm", state: "Abia State", agent: "John", qty: "120", damaged: "Yes", remarks: "Note", warehouse: "Main Warehouse", addedBy: "Yusuf Adeyemi" },
    { id: 2, date: "25 Feb 2026", product: "Shred Belly", state: "Lagos State", agent: "Femi", qty: "120", damaged: "Yes", remarks: "Note", warehouse: "Lagos Hub", addedBy: "Yusuf Adeyemi" },
    { id: 3, date: "27 Feb 2026", product: "Trim & Tone", state: "Lagos State", agent: "Pamtec", qty: "120", damaged: "Yes", remarks: "Note", warehouse: "Main Warehouse", addedBy: "Yusuf Adeyemi" },
    { id: 4, date: "01 Mar 2026", product: "Shred Belly", state: "Enugu State", agent: "John", qty: "120", damaged: "Yes", remarks: "Note", warehouse: "Enugu Depot", addedBy: "Yusuf Adeyemi" },
    { id: 5, date: "04 Mar 2026", product: "Balm", state: "Abia State", agent: "Kenneth", qty: "120", damaged: "Yes", remarks: "Note", warehouse: "Main Warehouse", addedBy: "Yusuf Adeyemi" },
  ];

  const filteredReturns = useMemo(() => {
    return mockReturns.filter((item) => {
      const matchesSearch = 
        item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toString().includes(searchQuery);
      
      const matchesWarehouse = filterWarehouse ? item.warehouse === filterWarehouse : true;

      return matchesSearch && matchesWarehouse;
    });
  }, [searchQuery, filterWarehouse]);

  const uniqueWarehouses = Array.from(new Set(mockReturns.map(r => r.warehouse)));

  return (
    <div className="space-y-12 pb-20 pt-2">
      {/* Toolbar Section */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-8">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-3 text-gray-700 font-bold hover:text-[#ad1df4] transition-all outline-none"
            >
              <FilterIcon className="w-6 h-6 text-gray-400" />
              <span className="text-lg">Filter</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-50 p-2 z-20">
                  <button 
                    className="w-full text-left rounded-lg text-sm font-medium py-2 px-3 hover:bg-[#faf5ff] hover:text-[#ad1df4] transition-colors"
                    onClick={() => {
                      setFilterWarehouse(null);
                      setIsFilterOpen(false);
                    }}
                  >
                    All Warehouses
                  </button>
                  {uniqueWarehouses.map(wh => (
                    <button 
                      key={wh}
                      className="w-full text-left rounded-lg text-sm font-medium py-2 px-3 hover:bg-[#faf5ff] hover:text-[#ad1df4] transition-colors"
                      onClick={() => {
                        setFilterWarehouse(wh);
                        setIsFilterOpen(false);
                      }}
                    >
                      {wh}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="text-gray-400 hover:text-gray-600 transition-all">
            <ArrowUpDown className="w-6 h-6" />
          </button>
          
          {filterWarehouse && (
            <span className="bg-[#f3e8ff] text-[#ad1df4] text-[10px] font-bold px-3 py-1 rounded-full border border-purple-100 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              Warehouse: {filterWarehouse}
              <button onClick={() => setFilterWarehouse(null)} className="hover:text-red-500 text-lg leading-none">&times;</button>
            </span>
          )}
        </div>

        <div className="relative w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-lg border-none rounded-lg focus:outline-none bg-white/50 text-gray-400 placeholder:text-gray-300 shadow-sm border border-gray-50"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-sm border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-[#faf5ff] text-gray-400 uppercase font-bold border-b border-gray-50">
              <tr>
                <th className="px-4 py-3 w-10"><Checkbox className="border-gray-200" /></th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">DATE</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3 font-bold">Qty Returned</th>
                <th className="px-4 py-3">Damaged</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3 font-bold">Remarks</th>
                <th className="px-4 py-3 text-right">
                  <Search className="w-5 h-5 ml-auto text-gray-800 cursor-pointer" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredReturns.length > 0 ? (
                filteredReturns.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/logistics/returns/${item.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><Checkbox className="border-gray-200" /></td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{item.id}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium group-hover:text-[#ad1df4]">{item.date}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{item.product}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{item.state}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{item.agent}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{item.qty}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{item.damaged}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{item.warehouse}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{item.remarks}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-20 text-center text-gray-400 font-medium">
                    No returns found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex justify-end pt-12">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-3 text-gray-800 font-bold hover:text-[#ad1df4] transition-all group"
        >
          <div className="w-10 h-10 rounded-full border-2 border-gray-800 flex items-center justify-center group-hover:border-[#ad1df4] group-hover:bg-[#ad1df4]/5 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </div>
          <span className="text-lg">Back</span>
        </button>
      </div>
    </div>
  );
}

