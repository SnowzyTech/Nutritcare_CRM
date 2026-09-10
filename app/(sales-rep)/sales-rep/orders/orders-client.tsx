'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createOrderAction } from '@/modules/orders/actions/orders.action';
import type { ProductForms } from '@/modules/orders/services/form-packages.service';
import { AddOrderModal } from '@/components/orders/add-order-modal';
import { upsellExtraCount } from '@/lib/orders/upsell';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  MessageSquare,
  X,
  Calendar as CalendarIcon,
  CalendarClock,
} from 'lucide-react';
import type { OrderStatus } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';

/** Green "Rescheduled" pill — shown for active orders whose delivery was pushed. */
function RescheduledPill() {
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
      <CalendarClock size={10} /> Rescheduled
    </span>
  );
}

/** True when an order should surface the Rescheduled tag (still awaiting delivery). */
function showRescheduled(o: { isRescheduled: boolean; status: OrderStatus }) {
  return o.isRescheduled && (o.status === 'PENDING' || o.status === 'CONFIRMED');
}

export type OrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  isReorder: boolean;
  isRescheduled: boolean;
  createdAt: string; // ISO string (serialized from server)
  updatedAt: string; // ISO string - used for status date
  customer: { name: string; email: string | null };
  agent: { companyName: string; state: string | null } | null;
  items: Array<{ quantity: number; upsellQuantity: number; isUpsell: boolean; product: { name: string } }>;
     deliveryFee: number;
};

export type OrderCounts = {
  all: number;
  pending: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  failed: number;
};

export type ProductItem = {
  id: string;
  name: string;
  sellingPrice: number;
};

interface OrdersClientProps {
  orders: OrderListItem[];
  counts: OrderCounts;
  userName: string;
  products: ProductItem[];
  productForms: ProductForms[];
}

const STATUS_STYLES: Record<OrderStatus, { dot: string; bg: string; text: string; label: string }> = {
  PENDING:   { dot: 'bg-orange-400', bg: 'bg-[#FFF3CD]',  text: 'text-[#856404]',  label: 'Pending' },
  CONFIRMED: { dot: 'bg-green-400',  bg: 'bg-[#D1E7DD]',  text: 'text-[#0F5132]',  label: 'Confirmed' },
  DELIVERED: { dot: 'bg-green-600',  bg: 'bg-[#198754]',  text: 'text-white',       label: 'Delivered' },
  CANCELLED: { dot: 'bg-red-300',    bg: 'bg-[#F8D7DA]',  text: 'text-[#842029]',  label: 'Cancelled' },
  FAILED:    { dot: 'bg-red-600',    bg: 'bg-[#DC3545]',  text: 'text-white',       label: 'Failed' },
};

const TABS: Array<{ label: string; key: OrderStatus | null; countKey: keyof OrderCounts }> = [
  { label: 'All',       key: null,        countKey: 'all' },
  { label: 'Pending',   key: 'PENDING',   countKey: 'pending' },
  { label: 'Confirmed', key: 'CONFIRMED', countKey: 'confirmed' },
  { label: 'Delivered', key: 'DELIVERED', countKey: 'delivered' },
  { label: 'Cancelled', key: 'CANCELLED', countKey: 'cancelled' },
  { label: 'Failed',    key: 'FAILED',    countKey: 'failed' },
];

export function OrdersClient({ orders, counts, userName, products, productForms }: OrdersClientProps) {
  const router = useRouter();

  // Interactive Local Orders state
  const [localOrders, setLocalOrders] = useState<OrderListItem[]>(orders);
  
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  // Manual "Add Order" modal — the form itself lives in <AddOrderModal/>.
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);

  // Dynamic counts derived from state
  const dynamicCounts = useMemo(() => {
    return {
      all: localOrders.length,
      pending:   localOrders.filter((o) => o.status === "PENDING").length,
      confirmed: localOrders.filter((o) => o.status === "CONFIRMED").length,
      delivered: localOrders.filter((o) => o.status === "DELIVERED").length,
      cancelled: localOrders.filter((o) => o.status === "CANCELLED").length,
      failed:    localOrders.filter((o) => o.status === "FAILED").length,
    };
  }, [localOrders]);

  const filteredOrders = useMemo(() => {
    let result = activeTab ? localOrders.filter((o) => o.status === activeTab) : localOrders;
    
    if (filterDate) {
      const formattedFilterDate = format(filterDate, 'yyyy-MM-dd');
      result = result.filter((o) => {
        const orderDate = new Date(o.createdAt);
        const formattedDate = orderDate.toISOString().split('T')[0];
        return formattedDate === formattedFilterDate;
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.customer.name.toLowerCase().includes(q) ||
          (o.customer.email ?? '').toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q)
      );
    }
    return result;
  }, [localOrders, activeTab, searchQuery, filterDate]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-4 sm:space-y-6">

      {/* Top Navigation Icons */}
      <div className="hidden sm:flex items-center gap-4 mb-2">
        <button className="p-1 hover:bg-gray-100 rounded text-purple-400">
          <ChevronLeft size={16} />
        </button>
        <button className="p-1 hover:bg-gray-100 rounded text-purple-400">
          <ChevronRight size={16} />
        </button>
        <button
          className="p-1 hover:bg-gray-100 rounded text-purple-400 ml-2"
          onClick={() => router.refresh()}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Welcome Title & Header Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight leading-tight">
          Welcome Back, {userName}
        </h1>
        <div className="flex items-center justify-end w-full sm:w-auto gap-3 shrink-0">
          {/* Circular Plus Button (Triggers Add Order Modal) */}
          <button 
            onClick={() => setIsAddOrderOpen(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#A020F0] text-white flex items-center justify-center shadow-lg shadow-purple-100 hover:bg-[#8B1ED2] active:scale-95 transition-all duration-200"
            title="Add Order"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
          {/* Circular Chat Button */}
          <button
            onClick={() => router.push("/chat")}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#A020F0] text-white flex items-center justify-center shadow-lg shadow-purple-100 hover:bg-[#8B1ED2] active:scale-95 transition-all duration-200"
            title="Messages"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 fill-white stroke-none" />
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-100 pb-3 sm:pb-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = dynamicCounts[tab.countKey];
          return (
            <button
              key={tab.key ?? 'all'}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center justify-center whitespace-nowrap px-5 sm:px-8 py-2.5 transition-all group rounded-xl shrink-0 ${
                isActive ? 'bg-[#FAF8FF]' : 'hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <div className="relative inline-flex items-center">
                <span className={`text-sm ${isActive ? 'text-[#532194] font-bold' : 'text-gray-500 font-medium'}`}>
                  {tab.label}{!isActive && count > 0 ? `(${count})` : ''}
                </span>
                {isActive && (
                  <span className="absolute -top-2.5 -right-6 text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-[#C282FA] text-white">
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors shrink-0 border border-gray-100 shadow-sm">
            <SlidersHorizontal size={18} />
            <span className="text-sm font-medium hidden sm:inline">Filter</span>
          </button>
          <Popover>
            <PopoverTrigger
              className={`flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-sm font-medium border shadow-sm ${
                filterDate ? 'text-purple-700 border-purple-200 bg-purple-50' : 'text-gray-600 border-gray-100 hover:text-gray-900 hover:bg-gray-50'
              } transition-colors outline-none cursor-pointer`}
            >
              <CalendarIcon size={16} />
              {filterDate ? format(filterDate, 'PP') : <span>Pick a date</span>}
              {filterDate && (
                <span
                  role="button"
                  tabIndex={-1}
                  className="p-0.5 hover:bg-purple-200 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setFilterDate(undefined);
                  }}
                >
                  <X size={14} className="text-purple-600" />
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-gray-100 shadow-xl rounded-xl" align="start">
              <Calendar
                mode="single"
                selected={filterDate}
                onSelect={setFilterDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <button className="p-2 bg-white rounded-lg text-gray-400 shrink-0 border border-gray-100 shadow-sm">
            <ArrowUpDown size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
          <span className="px-2.5 sm:px-4 py-1.5 bg-[#FFD54F] text-gray-800 text-xs font-semibold rounded-md shadow-sm">
            Pending
          </span>
          <span className="px-2.5 sm:px-4 py-1.5 bg-[#81C784] text-white text-xs font-semibold rounded-md shadow-sm">
            Confirmed
          </span>
          <span className="px-2.5 sm:px-4 py-1.5 bg-[#00C853] text-white text-xs font-semibold rounded-md shadow-sm">
            Delivered
          </span>
          <span className="px-2.5 sm:px-4 py-1.5 bg-[#E57373] text-white text-xs font-semibold rounded-md shadow-sm">
            Cancelled
          </span>
          <span className="px-2.5 sm:px-4 py-1.5 bg-[#D32F2F] text-white text-xs font-semibold rounded-md shadow-sm">
            Failed
          </span>
        </div>
        <div className="relative w-full sm:w-auto sm:ml-auto">
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-10 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200 w-full sm:w-32 md:w-48 shadow-sm"
          />
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-gray-50/50 rounded-2xl overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm bg-white">
            No orders found.
          </div>
        ) : (
          <>
            {/* ── Mobile Card List (visible on small screens) ── */}
            <div className="flex flex-col gap-3 md:hidden">
              {filteredOrders.map((order) => {
                const style = STATUS_STYLES[order.status];
                const firstItem = order.items[0];
                const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
                const dateLabel = new Date(order.createdAt).toLocaleDateString('en-NG', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/sales-rep/orders/${order.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                        <span className="text-sm font-semibold text-gray-800 truncate">{order.customer.name}</span>
                        {order.isReorder && (
                          <span className="inline-flex items-center gap-0.5 bg-purple-100 text-[#532194] text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            <RotateCcw size={8} /> Re
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {showRescheduled(order) && <RescheduledPill />}
                        <span className={`${style.bg} ${style.text} text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0`}>
                          {style.label}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1.5 text-xs text-gray-500 mt-1">
                      <div className="truncate"><span className="text-gray-400">Email:</span> {order.customer.email ?? '—'}</div>
                      <div className="text-right"><span className="text-gray-400">Date:</span> {dateLabel}</div>
                      <div className="truncate flex items-center gap-1"><span className="text-gray-400">Product:</span> <span className="text-gray-700 font-medium truncate">{firstItem?.product.name ?? '—'}</span>{upsellExtraCount(order.items) > 0 && (<span className="shrink-0 inline-flex items-center bg-purple-100 text-[#532194] text-[9px] font-bold px-1 py-0.5 rounded-full">+{upsellExtraCount(order.items)}</span>)}</div>
                      <div className="text-right"><span className="text-gray-400">Qty:</span> <span className="text-gray-700 font-medium">{totalQty}</span></div>
                      <div className="truncate"><span className="text-gray-400">Delivery Fee:</span> {formatCurrency(order.deliveryFee)}</div>
                      {order.agent && (
                        <div className="col-span-2 truncate"><span className="text-gray-400">Agent:</span> {order.agent.companyName}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop Table (hidden on small screens) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pl-6 sm:pl-12 pr-4 sm:pr-6 py-4 sm:py-5 text-left text-xs font-bold text-gray-500  tracking-wider">G-Mail</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-left text-xs font-bold text-gray-500 tracking-wider">Name</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-left text-xs font-bold text-gray-500 tracking-wider">Agent</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-left text-xs font-bold text-gray-500 tracking-wider">Product</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-center text-xs font-bold text-gray-500 tracking-wider">Quantity</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-right text-xs font-bold text-gray-500 tracking-wider whitespace-nowrap">Delivery Fee</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-right text-xs font-bold text-gray-500 tracking-wider">Date</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-5 text-left text-xs font-bold text-gray-500 tracking-wider whitespace-nowrap">Status Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredOrders.map((order, index) => {
                    const style = STATUS_STYLES[order.status];
                    const firstItem = order.items[0];
                    const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
                    const dateLabel = new Date(order.createdAt).toLocaleDateString('en-NG', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    });
                    const isEvenRow = index % 2 === 0;
                    return (
                      <tr
                        key={order.id}
                        className={`group hover:bg-gray-50/80 transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${
                          isEvenRow ? 'bg-white' : 'bg-gray-50'
                        }`}
                        onClick={() => router.push(`/sales-rep/orders/${order.id}`)}
                      >
                        <td className="pl-4 sm:pl-6 pr-4 sm:pr-6 py-4 sm:py-5">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                            <span className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-900 transition-colors truncate max-w-[120px] sm:max-w-none">
                              {order.customer.email ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">{order.customer.name}</span>
                            {order.isReorder && (
                              <span className="inline-flex items-center gap-1 bg-purple-100 text-[#532194] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <RotateCcw size={10} /> Reorder
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          {order.agent ? (
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-gray-700">{order.agent.companyName}</p>
                              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">{order.agent.state}</p>
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[140px]">
                              {firstItem?.product.name ?? '—'}
                            </span>
                            {upsellExtraCount(order.items) > 0 && (
                              <span
                                title={order.items.map((i) => i.product.name).join(', ')}
                                className="shrink-0 inline-flex items-center bg-purple-100 text-[#532194] text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              >
                                +{upsellExtraCount(order.items)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-center">
                          <span className="text-xs sm:text-sm text-gray-500">{totalQty}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right whitespace-nowrap">
                          <span className="text-xs sm:text-sm text-gray-500">{formatCurrency(order.deliveryFee)}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                          <span className="text-xs sm:text-sm text-gray-500">{dateLabel}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                          {order.status === 'PENDING' ? (
                            <span className="text-xs sm:text-sm text-gray-500">---</span>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
                              {showRescheduled(order) && <RescheduledPill />}
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${style.bg} ${style.text}`}>
                                {style.label}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-700">
                                {new Date(order.updatedAt).toLocaleDateString('en-NG', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Manual "Add Order" modal — shared with the data-analyst flow so the
          pricing rules and fields can never drift apart. */}
      <AddOrderModal
        open={isAddOrderOpen}
        onClose={() => setIsAddOrderOpen(false)}
        products={products}
        productForms={productForms}
        onSubmit={createOrderAction}
        onCreated={(created, payload) => {
          // Optimistic row so the new order appears without a refetch.
          setLocalOrders((prev) => [
            {
              id: created.orderId,
              orderNumber: created.orderNumber,
              status: 'PENDING',
              isReorder: payload.isReorder,
              isRescheduled: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              customer: {
                name: payload.customerName.trim(),
                email: payload.email?.trim() || null,
              },
              agent: null,
              items: payload.products.map((line) => ({
                quantity: line.quantity,
                upsellQuantity: 0,
                isUpsell: false,
                product: {
                  name: products.find((p) => p.id === line.productId)?.name ?? line.productId,
                },
              })),
              deliveryFee: 0,
            },
            ...prev,
          ]);
        }}
      />

    </div>
  );
}
