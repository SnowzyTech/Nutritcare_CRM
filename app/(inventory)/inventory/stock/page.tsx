"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, PlusCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "Agents" | "Suppliers" | "Product" | "Product Categories" | "Warehouse";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const agentRows = Array.from({ length: 17 }, (_, i) => ({
  id: i + 1,
  companyAgentName: "John",
  states: "Imo State",
  address: "Owerri",
  phoneNumbers: ["08085035258", "08052568563"],
  status: "Active",
  addedBy: "Yusuf Adeyemi",
  action: "Created",
}));

const supplierRows = Array.from({ length: 21 }, (_, i) => ({
  id: i + 1,
  suppliersName: "John",
  address: "Owerri",
  phoneNumbers: ["08085655258", "08052908563"],
  status: "Active",
  addedBy: "Yusuf Adeyemi",
  action: "Created",
}));

const warehouseRows = [
  {
    id: 1,
    warehouseName: "Primotech",
    telephone: "08056625868",
    dateAdded: "3/5/2026",
    manager: "Yusuf",
    status: "Active",
    action: "Created",
  },
];

const productRows = [
  {
    id: 1,
    productNameCategoryCountry: "John",
    variation1: "Imo State",
    variation2: "Owerri",
    costPrice: 35200,
    sellingPrice: 38500,
    stockLeft: 1250,
    addedBy: "Yusuf Adeyemi",
    action: "Created",
  },
];

const productCategoryRows = Array.from({ length: 19 }, (_, i) => {
  const names = [
    "December Batch 1", "December Batch 3", "December Batch 3", "December Batch 4",
    "December Batch 5", "December Batch 6", "December Batch 7", "December Batch 8",
    "December Batch 9", "December Batch 10", "December Batch 11", "December Batch 21",
    "December Batch 12", "December Batch 16", "December Batch 20", "December Batch 28",
    "December Batch 19", "December Batch 111", "December Batch 39",
  ];
  return {
    id: i + 1,
    categoryName: names[i],
    brandName: "Nutriticare",
    brandPhoneEmail: ["08085035258", "Yusuf@gmail.com"],
    brandWhatsappNumber: "08063253836",
    senderId: "01234456789",
    action: "Created",
  };
});

// ─── Shared Sub-Components ────────────────────────────────────────────────────
interface TableToolbarProps {
  addLabel?: string;
  onAdd?: () => void;
}
function TableToolbar({ addLabel = "Add New", onAdd }: TableToolbarProps) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {/* Search */}
      <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white w-56">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder=""
          className="outline-none text-sm text-gray-600 w-full bg-transparent"
        />
      </div>

      {/* Add New */}
      <button
        onClick={onAdd}
        className="flex items-center gap-2 border border-gray-200 rounded-md px-4 py-2 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {addLabel}
        <PlusCircle className="w-4 h-4 text-gray-400" />
      </button>

      {/* Excel */}
      <button className="border border-gray-200 rounded-md px-4 py-2 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors">
        Excel
      </button>

      {/* Edit */}
      <button className="border border-gray-200 rounded-md px-4 py-2 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors">
        Edit
      </button>
    </div>
  );
}

interface PaginationProps {
  current?: number;
  total?: number;
}
function Pagination({ current = 1 }: PaginationProps) {
  return (
    <div className="flex justify-end items-center gap-2 mt-4">
      <button className="px-4 py-1.5 rounded text-sm bg-gray-200 text-gray-500 cursor-default">
        Previous
      </button>
      <button className="px-3 py-1.5 rounded text-sm bg-[#9D00FF] text-white font-semibold min-w-[32px]">
        {current}
      </button>
      <button className="px-4 py-1.5 rounded text-sm bg-gray-200 text-gray-500 cursor-default">
        Next
      </button>
    </div>
  );
}

function PhoneNumbers({ numbers }: { numbers: string[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {numbers.map((n) => (
        <span key={n} className="text-[#9D00FF] text-xs leading-tight hover:underline cursor-pointer">
          {n}
        </span>
      ))}
    </div>
  );
}

const thClass = "text-left text-[11px] font-semibold text-gray-500 pb-2 pr-4 whitespace-nowrap";
const tdClass = "text-[12px] text-gray-600 py-2.5 pr-4 whitespace-nowrap";

// ─── Tab Panels ───────────────────────────────────────────────────────────────
function AgentsTab({ onAddNew }: { onAddNew: () => void }) {
  return (
    <>
      <TableToolbar addLabel="Add New" onAdd={onAddNew} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-6 pb-2 pr-4">
                <input type="checkbox" className="accent-[#9D00FF]" />
              </th>
              <th className={thClass}>ID</th>
              <th className={thClass}>Company/Agent Name</th>
              <th className={thClass}>States</th>
              <th className={thClass}>Address</th>
              <th className={thClass}>Phone Numbers</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Review</th>
              <th className={thClass}>Added By</th>
              <th className={thClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {agentRows.map((row, idx) => (
              <tr
                key={row.id}
                className={idx % 2 === 0 ? "bg-[#F9F6FF]" : "bg-white"}
              >
                <td className="py-2.5 pr-4">
                  <input type="checkbox" className="accent-[#9D00FF]" />
                </td>
                <td className={tdClass}>{row.id}</td>
                <td className={tdClass}>{row.companyAgentName}</td>
                <td className={tdClass}>{row.states}</td>
                <td className={tdClass}>{row.address}</td>
                <td className={tdClass}>
                  <PhoneNumbers numbers={row.phoneNumbers} />
                </td>
                <td className={tdClass}>{row.status}</td>
                <td className={tdClass}>
                  <span className="text-[#9D00FF] text-xs cursor-pointer hover:underline">
                    Add Review+
                  </span>
                </td>
                <td className={tdClass}>{row.addedBy}</td>
                <td className={tdClass}>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
}

function SuppliersTab({ onAddNew }: { onAddNew: () => void }) {
  return (
    <>
      <TableToolbar addLabel="Add New Suppliers" onAdd={onAddNew} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-6 pb-2 pr-4">
                <input type="checkbox" className="accent-[#9D00FF]" />
              </th>
              <th className={thClass}>ID</th>
              <th className={thClass}>Suppliers Name</th>
              <th className={thClass}>Address</th>
              <th className={thClass}>Phone Numbers</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Added By</th>
              <th className={thClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {supplierRows.map((row, idx) => (
              <tr
                key={row.id}
                className={idx % 2 === 0 ? "bg-[#F9F6FF]" : "bg-white"}
              >
                <td className="py-2.5 pr-4">
                  <input type="checkbox" className="accent-[#9D00FF]" />
                </td>
                <td className={tdClass}>{row.id}</td>
                <td className={tdClass}>{row.suppliersName}</td>
                <td className={tdClass}>{row.address}</td>
                <td className={tdClass}>
                  <PhoneNumbers numbers={row.phoneNumbers} />
                </td>
                <td className={tdClass}>{row.status}</td>
                <td className={tdClass}>{row.addedBy}</td>
                <td className={tdClass}>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
}

function WarehouseTab({ onAddNew }: { onAddNew: () => void }) {
  return (
    <>
      <TableToolbar addLabel="Add Warehouse" onAdd={onAddNew} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-6 pb-2 pr-4">
                <input type="checkbox" className="accent-[#9D00FF]" />
              </th>
              <th className={thClass}>ID</th>
              <th className={thClass}>Warehouse Name</th>
              <th className={thClass}>Telephone</th>
              <th className={thClass}>Date Added</th>
              <th className={thClass}>Manager</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {warehouseRows.map((row, idx) => (
              <tr
                key={row.id}
                className={idx % 2 === 0 ? "bg-[#F9F6FF]" : "bg-white"}
              >
                <td className="py-2.5 pr-4">
                  <input type="checkbox" className="accent-[#9D00FF]" />
                </td>
                <td className={tdClass}>{row.id}</td>
                <td className={tdClass}>{row.warehouseName}</td>
                <td className={tdClass}>{row.telephone}</td>
                <td className={tdClass}>{row.dateAdded}</td>
                <td className={tdClass}>{row.manager}</td>
                <td className={tdClass}>{row.status}</td>
                <td className={tdClass}>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
}

function ProductTab({ onAddNew }: { onAddNew: () => void }) {
  return (
    <>
      <TableToolbar addLabel="Add Product" onAdd={onAddNew} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-6 pb-2 pr-4">
                <input type="checkbox" className="accent-[#9D00FF]" />
              </th>
              <th className={thClass}>Product Name/Category/Country</th>
              <th className={thClass}>Variations 1</th>
              <th className={thClass}>Variation 2</th>
              <th className={thClass}>Cost Price</th>
              <th className={thClass}>Selling Price</th>
              <th className={thClass}>Stock Left</th>
              <th className={thClass}>Added By</th>
              <th className={thClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {productRows.map((row, idx) => (
              <tr
                key={row.id}
                className={idx % 2 === 0 ? "bg-[#F9F6FF]" : "bg-white"}
              >
                <td className="py-2.5 pr-4">
                  <input type="checkbox" className="accent-[#9D00FF]" />
                </td>
                <td className={tdClass}>{row.productNameCategoryCountry}</td>
                <td className={tdClass}>{row.variation1}</td>
                <td className={tdClass}>{row.variation2}</td>
                <td className={tdClass}>{row.costPrice.toLocaleString()}</td>
                <td className={tdClass}>{row.sellingPrice.toLocaleString()}</td>
                <td className={tdClass}>{row.stockLeft.toLocaleString()}</td>
                <td className={tdClass}>{row.addedBy}</td>
                <td className={tdClass}>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
}

function ProductCategoriesTab({ onAddNew }: { onAddNew: () => void }) {
  return (
    <>
      <TableToolbar addLabel="Add Product Categories" onAdd={onAddNew} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-6 pb-2 pr-4">
                <input type="checkbox" className="accent-[#9D00FF]" />
              </th>
              <th className={thClass}>ID</th>
              <th className={thClass}>Category Name</th>
              <th className={thClass}>Brand Name</th>
              <th className={thClass}>Brand Phone/Email</th>
              <th className={thClass}>Brand Whatsapp Number</th>
              <th className={thClass}>Sender ID</th>
              <th className={thClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {productCategoryRows.map((row, idx) => (
              <tr
                key={row.id}
                className={idx % 2 === 0 ? "bg-[#F9F6FF]" : "bg-white"}
              >
                <td className="py-2.5 pr-4">
                  <input type="checkbox" className="accent-[#9D00FF]" />
                </td>
                <td className={tdClass}>{row.id}</td>
                <td className={tdClass}>{row.categoryName}</td>
                <td className={tdClass}>{row.brandName}</td>
                <td className={tdClass}>
                  <PhoneNumbers numbers={row.brandPhoneEmail} />
                </td>
                <td className={tdClass}>{row.brandWhatsappNumber}</td>
                <td className={tdClass}>{row.senderId}</td>
                <td className={tdClass}>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS: Tab[] = ["Agents", "Suppliers", "Product", "Product Categories", "Warehouse"];

export default function StockPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Agents");
  const router = useRouter();

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Tab Bar */}
      <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-6 bg-white">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "flex-1 py-3.5 text-sm font-semibold transition-all duration-150 text-center",
                isActive
                  ? "text-[#9D00FF] bg-[#FAF5FF]"
                  : "text-gray-400 bg-white hover:text-gray-600 hover:bg-gray-50",
                "border-r border-gray-200 last:border-r-0",
              ].join(" ")}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {activeTab === "Agents" && (
          <AgentsTab onAddNew={() => router.push("/inventory/stock/add-agent")} />
        )}
        {activeTab === "Suppliers" && (
          <SuppliersTab onAddNew={() => router.push("/inventory/stock/add-supplier")} />
        )}
        {activeTab === "Product" && (
          <ProductTab onAddNew={() => router.push("/inventory/stock/add-product")} />
        )}
        {activeTab === "Product Categories" && (
          <ProductCategoriesTab onAddNew={() => router.push("/inventory/stock/add-product-categories")} />
        )}
        {activeTab === "Warehouse" && (
          <WarehouseTab onAddNew={() => router.push("/inventory/stock/add-warehouse")} />
        )}
      </div>
    </div>
  );
}
