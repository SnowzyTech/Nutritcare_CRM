"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, PlusCircle } from "lucide-react";
import type {
  StockAgentRow,
  StockSupplierRow,
  StockWarehouseRow,
  StockProductRow,
  StockCategoryRow,
} from "@/modules/inventory/services/inventory.service";
import { formatCurrency } from "@/lib/utils";

type Tab = "Agents" | "Suppliers" | "Product" | "Product Categories" | "Warehouse";
const TABS: Tab[] = ["Agents", "Suppliers", "Product", "Product Categories", "Warehouse"];

const thClass = "text-left text-[11px] font-semibold text-gray-500 pb-2 pr-4 whitespace-nowrap";
const tdClass = "text-[12px] text-gray-600 py-2.5 pr-4 whitespace-nowrap";

function TableToolbar({ addLabel = "Add New", onAdd }: { addLabel?: string; onAdd?: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white w-56">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input type="text" placeholder="" className="outline-none text-sm text-gray-600 w-full bg-transparent" />
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 border border-gray-200 rounded-md px-4 py-2 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {addLabel} <PlusCircle className="w-4 h-4 text-gray-400" />
      </button>
      <button className="border border-gray-200 rounded-md px-4 py-2 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors">
        Excel
      </button>
      <button className="border border-gray-200 rounded-md px-4 py-2 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors">
        Edit
      </button>
    </div>
  );
}

function Pagination() {
  return (
    <div className="flex justify-end items-center gap-2 mt-4">
      <button className="px-4 py-1.5 rounded text-sm bg-gray-200 text-gray-500 cursor-default">Previous</button>
      <button className="px-3 py-1.5 rounded text-sm bg-[#9D00FF] text-white font-semibold min-w-[32px]">1</button>
      <button className="px-4 py-1.5 rounded text-sm bg-gray-200 text-gray-500 cursor-default">Next</button>
    </div>
  );
}

function PhoneNumbers({ numbers }: { numbers: string[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {numbers.map((n) => (
        <span key={n} className="text-[#9D00FF] text-xs leading-tight hover:underline cursor-pointer">{n}</span>
      ))}
    </div>
  );
}

function AgentsTab({ rows, onAddNew }: { rows: StockAgentRow[]; onAddNew: () => void }) {
  return (
    <>
      <TableToolbar addLabel="Add New" onAdd={onAddNew} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-6 pb-2 pr-4"><input type="checkbox" className="accent-[#9D00FF]" /></th>
              <th className={thClass}>ID</th>
              <th className={thClass}>Company/Agent Name</th>
              <th className={thClass}>States</th>
              <th className={thClass}>Address</th>
              <th className={thClass}>Phone Numbers</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Review</th>
              <th className={thClass}>Added By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? "bg-[#F9F6FF]" : "bg-white"}>
                <td className="py-2.5 pr-4"><input type="checkbox" className="accent-[#9D00FF]" /></td>
                <td className={tdClass}>{idx + 1}</td>
                <td className={tdClass}>{row.companyName}</td>
                <td className={tdClass}>{row.state}</td>
                <td className={tdClass}>{row.address}</td>
                <td className={tdClass}><PhoneNumbers numbers={row.phones} /></td>
                <td className={tdClass}>{row.status}</td>
                <td className={tdClass}>
                  <span className="text-[#9D00FF] text-xs cursor-pointer hover:underline">Add Review+</span>
                </td>
                <td className={tdClass}>{row.addedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
}

function SuppliersTab({ rows, onAddNew }: { rows: StockSupplierRow[]; onAddNew: () => void }) {
  return (
    <>
      <TableToolbar addLabel="Add New Suppliers" onAdd={onAddNew} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-6 pb-2 pr-4"><input type="checkbox" className="accent-[#9D00FF]" /></th>
              <th className={thClass}>ID</th>
              <th className={thClass}>Suppliers Name</th>
              <th className={thClass}>Address</th>
              <th className={thClass}>Phone Numbers</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? "bg-[#F9F6FF]" : "bg-white"}>
                <td className="py-2.5 pr-4"><input type="checkbox" className="accent-[#9D00FF]" /></td>
                <td className={tdClass}>{idx + 1}</td>
                <td className={tdClass}>{row.name}</td>
                <td className={tdClass}>{row.address}</td>
                <td className={tdClass}><PhoneNumbers numbers={row.phones} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
}

function WarehouseTab({ rows, onAddNew }: { rows: StockWarehouseRow[]; onAddNew: () => void }) {
  return (
    <>
      <TableToolbar addLabel="Add Warehouse" onAdd={onAddNew} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-6 pb-2 pr-4"><input type="checkbox" className="accent-[#9D00FF]" /></th>
              <th className={thClass}>ID</th>
              <th className={thClass}>Warehouse Name</th>
              <th className={thClass}>Telephone</th>
              <th className={thClass}>Date Added</th>
              <th className={thClass}>Manager</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? "bg-[#F9F6FF]" : "bg-white"}>
                <td className="py-2.5 pr-4"><input type="checkbox" className="accent-[#9D00FF]" /></td>
                <td className={tdClass}>{idx + 1}</td>
                <td className={tdClass}>{row.name}</td>
                <td className={tdClass}>{row.phone}</td>
                <td className={tdClass}>{row.createdAt}</td>
                <td className={tdClass}>{row.managerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
}

function ProductTab({ rows, onAddNew }: { rows: StockProductRow[]; onAddNew: () => void }) {
  return (
    <>
      <TableToolbar addLabel="Add Product" onAdd={onAddNew} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-6 pb-2 pr-4"><input type="checkbox" className="accent-[#9D00FF]" /></th>
              <th className={thClass}>Product Name</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Country</th>
              <th className={thClass}>SKU</th>
              <th className={thClass}>Cost Price</th>
              <th className={thClass}>Selling Price</th>
              <th className={thClass}>Stock Left</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? "bg-[#F9F6FF]" : "bg-white"}>
                <td className="py-2.5 pr-4"><input type="checkbox" className="accent-[#9D00FF]" /></td>
                <td className={tdClass}>{row.name}</td>
                <td className={tdClass}>{row.categoryName}</td>
                <td className={tdClass}>{row.country}</td>
                <td className={tdClass}>{row.sku}</td>
                <td className={tdClass}>{formatCurrency(row.costPrice)}</td>
                <td className={tdClass}>{formatCurrency(row.sellingPrice)}</td>
                <td className={tdClass}>{row.stockLeft.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
}

function ProductCategoriesTab({ rows, onAddNew }: { rows: StockCategoryRow[]; onAddNew: () => void }) {
  return (
    <>
      <TableToolbar addLabel="Add Product Categories" onAdd={onAddNew} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-6 pb-2 pr-4"><input type="checkbox" className="accent-[#9D00FF]" /></th>
              <th className={thClass}>ID</th>
              <th className={thClass}>Category Name</th>
              <th className={thClass}>Brand Name</th>
              <th className={thClass}>Brand Phone/Email</th>
              <th className={thClass}>Brand Whatsapp Number</th>
              <th className={thClass}>Sender ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? "bg-[#F9F6FF]" : "bg-white"}>
                <td className="py-2.5 pr-4"><input type="checkbox" className="accent-[#9D00FF]" /></td>
                <td className={tdClass}>{idx + 1}</td>
                <td className={tdClass}>{row.categoryName}</td>
                <td className={tdClass}>{row.brandName}</td>
                <td className={tdClass}><PhoneNumbers numbers={row.brandPhoneEmail} /></td>
                <td className={tdClass}>{row.brandWhatsapp}</td>
                <td className={tdClass}>{row.senderId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
}

type Props = {
  agents: StockAgentRow[];
  suppliers: StockSupplierRow[];
  warehouses: StockWarehouseRow[];
  products: StockProductRow[];
  categories: StockCategoryRow[];
};

export function StockClient({ agents, suppliers, warehouses, products, categories }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Agents");
  const router = useRouter();

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-6 bg-white">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "flex-1 py-3.5 text-sm font-semibold transition-all duration-150 text-center",
                isActive ? "text-[#9D00FF] bg-[#FAF5FF]" : "text-gray-400 bg-white hover:text-gray-600 hover:bg-gray-50",
                "border-r border-gray-200 last:border-r-0",
              ].join(" ")}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {activeTab === "Agents" && (
          <AgentsTab rows={agents} onAddNew={() => router.push("/inventory/stock/add-agent")} />
        )}
        {activeTab === "Suppliers" && (
          <SuppliersTab rows={suppliers} onAddNew={() => router.push("/inventory/stock/add-supplier")} />
        )}
        {activeTab === "Product" && (
          <ProductTab rows={products} onAddNew={() => router.push("/inventory/stock/add-product")} />
        )}
        {activeTab === "Product Categories" && (
          <ProductCategoriesTab rows={categories} onAddNew={() => router.push("/inventory/stock/add-product-categories")} />
        )}
        {activeTab === "Warehouse" && (
          <WarehouseTab rows={warehouses} onAddNew={() => router.push("/inventory/stock/add-warehouse")} />
        )}
      </div>
    </div>
  );
}
