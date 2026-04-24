'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrderStatus } from '@prisma/client';
import {
  confirmOrderAction,
  cancelOrderAction,
  failOrderAction,
  deliverOrderAction,
  addOrderItemsAction,
} from '@/modules/orders/actions/orders.action';

// Serialized types (Decimals as strings, Dates as ISO strings)
export type SerializedOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: string;
  netAmount: string;
  deliveryFee: string;
  notes: string | null;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    whatsappNumber: string | null;
    email: string | null;
    deliveryAddress: string;
    state: string;
    lga: string;
    landmark: string | null;
    source: string | null;
  };
  agent: { id: string; companyName: string; state: string | null } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    product: { id: string; name: string };
  }>;
  salesRep: { id: string; name: string };
  deliveries: Array<{
    scheduledTime: string | null;
    deliveredTime: string | null;
    status: string;
  }>;
};

export type ProductOption = {
  id: string;
  name: string;
  sellingPrice: string;
  sku: string;
};

interface OrderDetailClientProps {
  order: SerializedOrder;
  products: ProductOption[];
}

function StepIndicator({
  number,
  label,
  isActive,
  isCompleted,
}: {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}) {
  const bg = isActive ? 'bg-yellow-400' : isCompleted ? 'bg-green-500' : 'bg-gray-200';
  const text = isActive || isCompleted ? 'text-white' : 'text-gray-400';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-full ${bg} ${text} flex items-center justify-center font-bold text-lg`}>
        {isCompleted ? '✓' : number}
      </div>
      <span className="text-xs text-gray-500 font-medium text-center max-w-24">{label}</span>
    </div>
  );
}

function getSteps(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return [
        { number: 1, label: 'Order is Pending', isActive: true, isCompleted: false },
        { number: 2, label: 'Order is yet to be Confirmed', isActive: false, isCompleted: false },
        { number: 3, label: 'Order is yet to be Delivered', isActive: false, isCompleted: false },
      ];
    case 'CONFIRMED':
      return [
        { number: 1, label: 'Order Processed', isActive: false, isCompleted: true },
        { number: 2, label: 'Order has been Confirmed', isActive: true, isCompleted: false },
        { number: 3, label: 'Order is yet to be Delivered', isActive: false, isCompleted: false },
      ];
    case 'DELIVERED':
      return [
        { number: 1, label: 'Order Processed', isActive: false, isCompleted: true },
        { number: 2, label: 'Order Confirmed', isActive: false, isCompleted: true },
        { number: 3, label: 'Order Delivered', isActive: false, isCompleted: true },
      ];
    case 'CANCELLED':
      return [
        { number: 1, label: 'Order Processed', isActive: false, isCompleted: true },
        { number: 2, label: 'Order Cancelled', isActive: true, isCompleted: false },
        { number: 3, label: 'N/A', isActive: false, isCompleted: false },
      ];
    case 'FAILED':
      return [
        { number: 1, label: 'Order Processed', isActive: false, isCompleted: true },
        { number: 2, label: 'Order Failed', isActive: true, isCompleted: false },
        { number: 3, label: 'N/A', isActive: false, isCompleted: false },
      ];
  }
}

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'PENDING':   return { bg: 'bg-yellow-400', label: 'Pending Order' };
    case 'CONFIRMED': return { bg: 'bg-green-500',  label: 'Confirmed Order' };
    case 'DELIVERED': return { bg: 'bg-green-500',  label: 'Delivered Order' };
    case 'CANCELLED': return { bg: 'bg-red-500',    label: 'Cancelled Order' };
    case 'FAILED':    return { bg: 'bg-red-600',    label: 'Failed Order' };
  }
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-semibold">{label}</label>
      <p className="text-sm text-gray-900 font-medium mt-1 mb-3">{value}</p>
      <div className="border-b border-dashed border-gray-200 mb-2" />
    </div>
  );
}

export function OrderDetailClient({ order, products }: OrderDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productRows, setProductRows] = useState([
    { id: Date.now(), productId: products[0]?.id ?? '', qty: '1' },
  ]);

  const steps = getSteps(order.status);
  const badge = getStatusBadge(order.status);

  const delivery = order.deliveries[0] ?? null;
  const formattedDeliveryFee = Number(order.deliveryFee) > 0
    ? `₦${Number(order.deliveryFee).toLocaleString('en-NG')}`
    : null;
  const formattedTotal = `₦${Number(order.totalAmount).toLocaleString('en-NG')}`;
  const deliveredDate = delivery?.deliveredTime
    ? new Date(delivery.deliveredTime).toLocaleDateString('en-NG', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  function addRow() {
    setProductRows([...productRows, { id: Date.now(), productId: products[0]?.id ?? '', qty: '1' }]);
  }

  function removeRow(id: number) {
    if (productRows.length > 1) setProductRows(productRows.filter((r) => r.id !== id));
  }

  function updateRow(id: number, field: 'productId' | 'qty', value: string) {
    setProductRows(productRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function adjustQty(id: number, delta: number) {
    setProductRows(
      productRows.map((r) => {
        if (r.id !== id) return r;
        return { ...r, qty: String(Math.max(1, parseInt(r.qty || '1') + delta)) };
      })
    );
  }

  function handleAction(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Action failed');
      }
    });
  }

  function handleAddProducts() {
    handleAction(async () => {
      const items = productRows
        .filter((r) => r.productId)
        .map((r) => ({ productId: r.productId, quantity: parseInt(r.qty) || 1 }));
      await addOrderItemsAction(order.id, items);
      setIsAddProductOpen(false);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-sm font-medium w-fit transition"
      >
        ← Back to Orders
      </button>

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl">
        <h2 className="text-lg font-bold text-gray-900">Order ID: {order.orderNumber}</h2>
        <span className={`${badge.bg} text-white px-5 py-2 rounded-full text-sm font-semibold`}>
          {badge.label}
        </span>
      </div>

      {/* Steps */}
      <div className="bg-white p-8 rounded-xl flex items-start gap-4">
        {steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            <StepIndicator {...step} />
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mt-6 ${step.isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-5 gap-6">
        {/* Left: Order Details */}
        <div className="col-span-3 bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-2 rounded-lg mb-5">
            Order Details
          </h3>
          <div className="grid grid-cols-2 gap-x-4">
            <FieldRow label="Full Name" value={order.customer.name} />
            <FieldRow label="Phone Number" value={order.customer.phone} />
            <FieldRow label="WhatsApp number" value={order.customer.whatsappNumber ?? order.customer.phone} />
            <FieldRow label="Email" value={order.customer.email ?? '—'} />
            <div className="col-span-2">
              <FieldRow label="Full delivery address" value={order.customer.deliveryAddress} />
            </div>
            <FieldRow label="State" value={order.customer.state} />
            <FieldRow label="LGA" value={order.customer.lga} />
            <div className="col-span-2">
              <FieldRow label="Landmark" value={order.customer.landmark ?? '—'} />
            </div>
            <FieldRow
              label="Product(s)"
              value={order.items.map((i) => i.product.name).join(', ') || '—'}
            />
            <FieldRow
              label="Quantity"
              value={String(order.items.reduce((sum, i) => sum + i.quantity, 0))}
            />
          </div>

          {order.status === 'PENDING' && (
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="w-full mt-4 bg-purple-100 border border-purple-200 px-4 py-3 rounded-lg text-purple-600 font-semibold text-sm hover:bg-purple-50 transition flex items-center justify-center gap-2"
            >
              <span className="text-lg">💜</span> Add Product
            </button>
          )}

          {/* Order History */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 mb-4 uppercase">Order History</h4>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Order Created</span>
                <div className="text-right">{new Date(order.createdAt).toLocaleString('en-NG')}</div>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Sales Rep Assigned</span>
                <div className="text-right">
                  <div>{new Date(order.createdAt).toLocaleString('en-NG')}</div>
                  <div className="text-gray-900 font-medium">{order.salesRep.name}</div>
                </div>
              </div>
              {order.status !== 'PENDING' && (
                <div className="flex justify-between text-gray-500">
                  <span>Order Confirmed</span>
                  <div className="text-right">{new Date(order.createdAt).toLocaleString('en-NG')}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Product & Actions */}
        <div className="col-span-2 flex flex-col gap-6">
          {/* Product placeholder */}
          <div className="bg-gray-100 rounded-xl min-h-45 flex items-center justify-center text-gray-400 text-sm border border-gray-200">
            📦 {order.items.map((i) => i.product.name).join(', ') || 'No products'} — {order.items.reduce((s, i) => s + i.quantity, 0)} units
          </div>

          {/* Price / Actions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">
                Source: <strong className="text-gray-900">{order.customer.source ?? 'WhatsApp'}</strong>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Price</span>
              <span className="text-base font-bold text-gray-900">{formattedTotal}</span>
            </div>

            {order.status === 'PENDING' && (
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  disabled={isPending}
                  onClick={() => handleAction(() => cancelOrderAction(order.id))}
                  className="bg-purple-100 border border-purple-200 px-4 py-2 rounded-lg text-purple-600 font-semibold text-sm hover:bg-purple-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isPending}
                  onClick={() => handleAction(() => confirmOrderAction(order.id))}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-50"
                >
                  Confirm →
                </button>
              </div>
            )}

            {(order.status === 'CONFIRMED' || order.status === 'DELIVERED') && formattedDeliveryFee && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Estimated Delivery</span>
                  <span className="font-semibold text-gray-900">
                    {delivery?.scheduledTime
                      ? new Date(delivery.scheduledTime).toLocaleDateString('en-NG')
                      : '24 hours'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Delivery Fee</span>
                  <span className="font-semibold text-gray-900">{formattedDeliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Agent Assigned</span>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{order.agent?.companyName ?? '—'}</div>
                    <div className="text-xs text-gray-400">{order.agent?.state ?? ''}</div>
                  </div>
                </div>
                <button className="w-full bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-500 font-semibold text-sm hover:bg-gray-50 transition">
                  View Agent Info
                </button>
                <button className="w-full bg-purple-100 border border-purple-200 px-4 py-2 rounded-lg text-purple-600 font-semibold text-sm hover:bg-purple-50 transition">
                  Reassign Agent
                </button>
              </>
            )}

            {order.status === 'DELIVERED' && deliveredDate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">✓ Order delivered on {deliveredDate}</p>
              </div>
            )}
          </div>

          {/* Contact method */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-xs text-gray-500 mb-4">Customer has been reached out to on</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`contact-${order.id}`} value="phone" className="accent-purple-600" />
                <span className="text-sm text-gray-900">Phone Call</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`contact-${order.id}`} value="whatsapp" defaultChecked className="accent-purple-600" />
                <span className="text-sm text-gray-900">WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Prescription */}
          {order.status !== 'PENDING' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Set Prescription</h4>
              <textarea
                placeholder="Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days."
                className="w-full min-h-24 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 resize-none outline-none focus:border-purple-600"
              />
            </div>
          )}

          {/* Confirm/Fail buttons for confirmed orders */}
          {order.status === 'CONFIRMED' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={isPending}
                onClick={() => handleAction(() => failOrderAction(order.id))}
                className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg text-red-500 font-semibold text-sm hover:bg-red-100 transition disabled:opacity-50"
              >
                ✕ Fail
              </button>
              <button
                disabled={isPending}
                onClick={() => handleAction(() => deliverOrderAction(order.id))}
                className="bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-50"
              >
                ✓ Delivered
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsAddProductOpen(false)}
          />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[650px] p-12 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-slate-400">Add Product</h2>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-8 max-h-[350px] overflow-y-auto pr-2">
              {productRows.map((row) => (
                <div key={row.id} className="flex gap-3 items-center group">
                  <div className="flex-1 bg-slate-50 rounded-2xl p-6 flex gap-4 items-center border border-slate-100">
                    <div className="flex-1">
                      <Select
                        value={row.productId}
                        onValueChange={(val) => val && updateRow(row.id, 'productId', val)}
                      >
                        <SelectTrigger className="w-full h-[48px] border-none bg-white/50 rounded-xl text-[1.1rem] font-black shadow-sm px-4">
                          <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-[140px] flex items-center justify-between bg-white/50 rounded-xl h-[48px] px-2 shadow-sm border border-slate-100">
                      <button
                        onClick={() => adjustQty(row.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-colors font-bold"
                      >
                        -
                      </button>
                      <span className="text-[1.1rem] font-black text-slate-800">{row.qty}</span>
                      <button
                        onClick={() => adjustQty(row.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {productRows.length > 1 && (
                    <button
                      onClick={() => removeRow(row.id)}
                      className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors flex items-center justify-center shrink-0 border border-rose-100"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={addRow}
                className="w-full border-2 border-purple-600 text-purple-600 py-4 rounded-2xl text-[1rem] font-black hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
              >
                Add Another Product <span className="text-xl">→</span>
              </button>
              <button
                disabled={isPending}
                onClick={handleAddProducts}
                className="w-full bg-purple-600 text-white py-4 rounded-2xl text-[1rem] font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue <span className="text-xl">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
