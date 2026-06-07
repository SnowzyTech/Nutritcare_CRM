'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createOrderAction } from '@/modules/orders/actions/orders.action';
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
  ChevronDown,
  Trash2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import type { OrderStatus } from '@prisma/client';

export type OrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  isReorder: boolean;
  createdAt: string; // ISO string (serialized from server)
  updatedAt: string; // ISO string - used for status date
  customer: { name: string; email: string | null };
  agent: { companyName: string; state: string | null } | null;
  items: Array<{ quantity: number; product: { name: string } }>;
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

// All 36 Nigerian states + FCT, each with " State" suffix to match delivery agent registration format
const NIGERIAN_STATES = [
  "Abia State", "Adamawa State", "Akwa Ibom State", "Anambra State", "Bauchi State",
  "Bayelsa State", "Benue State", "Borno State", "Cross River State", "Delta State",
  "Ebonyi State", "Edo State", "Ekiti State", "Enugu State", "Gombe State", "Imo State",
  "Jigawa State", "Kaduna State", "Kano State", "Katsina State", "Kebbi State", "Kogi State",
  "Kwara State", "Lagos State", "Nasarawa State", "Niger State", "Ogun State", "Ondo State",
  "Osun State", "Oyo State", "Plateau State", "Rivers State", "Sokoto State", "Taraba State",
  "Yobe State", "Zamfara State", "Federal Capital Territory (FCT)",
];

export function OrdersClient({ orders, counts, userName, products }: OrdersClientProps) {
  const router = useRouter();
  
  // Interactive Local Orders state
  const [localOrders, setLocalOrders] = useState<OrderListItem[]>(orders);
  
  const [activeTab, setActiveTab] = useState<OrderStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  // Add Order Form Modal States
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [selectedState, setSelectedState] = useState('Lagos State');
  const [landmark, setLandmark] = useState('');
  const [isReorder, setIsReorder] = useState(false);

  // Multi-product fields inside Add Order
  const [formProducts, setFormProducts] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: products[0]?.id ?? '', quantity: 6 }
  ]);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  // Product Row helpers
  const addProductRow = () => {
    setFormProducts([...formProducts, { productId: products[0]?.id ?? '', quantity: 1 }]);
  };

  const removeProductRow = (index: number) => {
    if (formProducts.length === 1) return;
    setFormProducts(formProducts.filter((_, i) => i !== index));
  };

  const updateProductRow = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...formProducts];
    updated[index] = { ...updated[index], [field]: value };
    setFormProducts(updated);
  };

  const resetForm = () => {
    setCustomerName('');
    setPhoneNumber('');
    setWhatsappNumber('');
    setEmail('');
    setAddress('');
    setSelectedState('Lagos State');
    setLandmark('');
    setIsReorder(false);
    setFormProducts([{ productId: products[0]?.id ?? '', quantity: 6 }]);
    setFormError(null);
  };

  const handleAddOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const result = await createOrderAction({
      customerName,
      phone: phoneNumber,
      whatsappNumber,
      email: email || undefined,
      deliveryAddress: address,
      state: selectedState,
      landmark: landmark || undefined,
      isReorder,
      products: formProducts,
    });

    setIsSubmitting(false);

    if ('error' in result) {
      setFormError(result.error);
      toast.error(result.error);
      return;
    }

    const newOrder: OrderListItem = {
      id: result.orderId,
      orderNumber: result.orderNumber,
      status: 'PENDING',
      isReorder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer: { name: customerName.trim(), email: email.trim() || null },
      agent: null,
      items: formProducts.map((fp) => ({
        quantity: fp.quantity,
        product: { name: products.find((p) => p.id === fp.productId)?.name ?? fp.productId },
      })),
    };

    setLocalOrders([newOrder, ...localOrders]);
    setIsAddOrderOpen(false);
    resetForm();

    toast.success(`Order ${result.orderNumber} added successfully!`);
  };

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
                      <span className={`${style.bg} ${style.text} text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0`}>
                        {style.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1.5 text-xs text-gray-500 mt-1">
                      <div className="truncate"><span className="text-gray-400">Email:</span> {order.customer.email ?? '—'}</div>
                      <div className="text-right"><span className="text-gray-400">Date:</span> {dateLabel}</div>
                      <div className="truncate"><span className="text-gray-400">Product:</span> <span className="text-gray-700 font-medium">{firstItem?.product.name ?? '—'}</span></div>
                      <div className="text-right"><span className="text-gray-400">Qty:</span> <span className="text-gray-700 font-medium">{totalQty}</span></div>
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
                          <span className="text-xs sm:text-sm font-medium text-gray-700">
                            {firstItem?.product.name ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-center">
                          <span className="text-xs sm:text-sm text-gray-500">{totalQty}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                          <span className="text-xs sm:text-sm text-gray-500">{dateLabel}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                          {order.status === 'PENDING' ? (
                            <span className="text-xs sm:text-sm text-gray-500">---</span>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
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

      {/* Add Order Popup Modal Dialog */}
      {isAddOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop blur & fade */}
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => { setIsAddOrderOpen(false); setFormError(null); }}
          ></div>

          {/* Modal Container Card (Responsive wide size) */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-4 sm:p-6 md:p-8 overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-8">
            
            {/* Header circular X button */}
            <button
              onClick={() => { setIsAddOrderOpen(false); setFormError(null); }}
              className="absolute top-3 sm:top-6 right-3 sm:right-6 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 active:scale-95 transition-all duration-150"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Modal Title */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight text-left mb-4 sm:mb-6 pr-10">
              Add Order
            </h2>

            {/* Form */}
            <form onSubmit={handleAddOrderSubmit} className="space-y-4 sm:space-y-6">
              
              {/* Form Grid Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-5">
                
                {/* Customer name */}
                <div className="space-y-1 sm:space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Customer name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Adebayo Oluwaseun"
                    className="w-full bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)] rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200"
                  />
                </div>

                {/* Phone number */}
                <div className="space-y-1 sm:space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="0706 281 5934"
                    className="w-full bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)] rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200"
                  />
                </div>

                {/* WhatsApp number */}
                <div className="space-y-1 sm:space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    WhatsApp number
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="0905 118 6427"
                    className="w-full bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)] rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200"
                  />
                </div>

                {/* Email (optional) */}
                <div className="space-y-1 sm:space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="adebayo.seun84@yahoo.com"
                    className="w-full bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)] rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200"
                  />
                </div>

                {/* State (Dropdown listing every Nigerian State + FCT) */}
                <div className="space-y-1 sm:space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    State
                  </label>
                  <div className="relative">
                    <select
                      value={selectedState}
                      onChange={e => setSelectedState(e.target.value)}
                      className="w-full bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)] rounded-xl h-10 sm:h-12 px-3 sm:px-4 pr-10 text-xs text-gray-700 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-200 cursor-pointer"
                    >
                      {NIGERIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Landmark */}
                <div className="space-y-1 sm:space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder="Close to UNILAG Second Gate"
                    className="w-full bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)] rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200"
                  />
                </div>

                {/* Full delivery address (Beautiful full-width column span across Row 3) */}
                <div className="space-y-1 sm:space-y-1.5 text-left sm:col-span-2 md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Full delivery address
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="22 Akinyemi Street, Akoka"
                    className="w-full bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)] rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-200"
                  />
                </div>

              </div>

              {/* Reorder toggle */}
              <div className="flex items-center justify-between bg-[#FAF8FF] border border-purple-100/40 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4">
                <div className="text-left pr-2">
                  <p className="text-xs sm:text-sm font-bold text-gray-800">Mark as Reorder</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 hidden sm:block">
                    Turn on if the customer sent this order in manually (e.g. via WhatsApp).
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isReorder}
                  onClick={() => setIsReorder((v) => !v)}
                  className={`relative inline-flex h-6 sm:h-7 w-10 sm:w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
                    isReorder ? 'bg-[#A020F0]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 sm:h-5 w-4 sm:w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      isReorder ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Products Sub-Form Section */}
              <div className="bg-[#FAF8FF] p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-[24px] border border-purple-100/30 space-y-3 sm:space-y-5">
                {formProducts.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center animate-fadeIn">
                    
                    {/* Select Product */}
                    <div className="flex-1 space-y-1 sm:space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Product
                      </label>
                      <div className="relative">
                        <select
                          value={item.productId}
                          onChange={e => updateProductRow(index, 'productId', e.target.value)}
                          className="w-full bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)] rounded-xl h-10 sm:h-12 px-3 sm:px-4 pr-10 text-xs text-gray-700 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-200 cursor-pointer"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Select Quantity */}
                    <div className="w-full sm:w-1/3 space-y-1 sm:space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Quantity
                      </label>
                      <div className="relative">
                        <select
                          value={item.quantity}
                          onChange={e => updateProductRow(index, 'quantity', parseInt(e.target.value))}
                          className="w-full bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.01)] rounded-xl h-10 sm:h-12 px-3 sm:px-4 pr-10 text-xs text-gray-700 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-200 cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(q => (
                            <option key={q} value={q}>{q}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Trash delete button */}
                    {formProducts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProductRow(index)}
                        className="self-end sm:self-auto mb-1 sm:mb-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition active:scale-95 duration-150 shadow-sm shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Product Button */}
                <button
                  type="button"
                  onClick={addProductRow}
                  className="w-full border-2 border-dashed border-[#A020F0]/20 hover:border-[#A020F0] text-[#A020F0] font-bold py-3 sm:py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-purple-50/50 active:scale-[0.99] bg-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  Add Product
                </button>
              </div>

              {/* Error message */}
              {formError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {formError}
                </p>
              )}

              {/* Submit Main Button */}
              <div className="pt-1 sm:pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#A020F0] hover:bg-[#8B1ED2] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-3 sm:py-4 rounded-xl text-xs tracking-wider uppercase transition-all duration-200 shadow-lg shadow-purple-100 cursor-pointer"
                >
                  {isSubmitting ? 'Adding Order…' : 'Add Order'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
