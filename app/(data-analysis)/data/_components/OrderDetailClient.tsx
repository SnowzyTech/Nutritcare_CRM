'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Check, Trash2, AlertTriangle, X, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { OrderDetailFull } from '@/modules/data-analysis/services/data-analysis.service';
import { ProgressSteps } from './ProgressSteps';
import { AgentInfoModal } from './AgentInfoModal';
import { PrescriptionEditor } from './PrescriptionEditor';
import {
  deleteOrderPermanently,
  markOrderDeliveredByAnalyst,
  markOrderFailedByAnalyst,
} from '@/modules/data-analysis/actions/data-analysis.action';
import { toast } from 'sonner';

interface OrderDetailClientProps {
  order: OrderDetailFull;
}

const FAIL_REASONS = [
  'Customer unavailable at delivery',
  'Customer refused the order',
  'Incorrect / incomplete address',
  'Could not reach customer',
];

const BADGE_STYLES: Record<string, string> = {
  Pending: 'bg-[#FFF3CD] text-[#856404]',
  Confirmed: 'bg-[#D1E7DD] text-[#0F5132]',
  Delivered: 'bg-[#198754] text-white',
  Cancelled: 'bg-[#F8D7DA] text-[#842029]',
  Failed: 'bg-[#DC3545] text-white',
};

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);
  const [isFailOpen, setIsFailOpen] = useState(false);
  const [failReason, setFailReason] = useState(''); // a preset reason, or ''
  const [customFailReason, setCustomFailReason] = useState('');
  const [isFailing, setIsFailing] = useState(false);

  const handleMarkDelivered = async () => {
    setIsDelivering(true);
    const result = await markOrderDeliveredByAnalyst(order.id);

    if (result.success) {
      toast.success('Order marked as delivered');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to mark order as delivered');
    }
    setIsDelivering(false);
  };

  const handleMarkFailed = async () => {
    const effectiveReason = customFailReason.trim() || failReason;
    if (!effectiveReason) return;

    setIsFailing(true);
    const result = await markOrderFailedByAnalyst(order.id, effectiveReason);

    if (result.success) {
      toast.success('Order marked as failed');
      setIsFailOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to mark order as failed');
    }
    setIsFailing(false);
  };

  const handleDeleteOrder = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteOrderPermanently(order.orderId);

    if (result.success) {
      toast.success('Order deleted successfully');
      router.push('/data/order');
    } else {
      setDeleteError(result.error || 'Failed to delete order');
      toast.error(result.error || 'Failed to delete order');
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 pb-20">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        type="button"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
            <Image src={order.repAvatarUrl} alt={order.repName} fill className="object-cover" sizes="48px" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{order.repName}&apos;s</h1>
            <p className="text-sm text-gray-400 font-medium">Dashboard</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 cursor-pointer shadow-sm hover:bg-purple-200 transition-colors">
          <MessageCircle size={20} fill="currentColor" />
        </div>
      </div>

      {/* Sub Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-gray-700">Order ID: {order.orderId}</h2>
          <span className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm ${BADGE_STYLES[order.status]}`}>
            {order.status} Order
          </span>
        </div>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors border border-red-100"
        >
          <Trash2 size={16} />
          Delete Order
        </button>
      </div>

      {/* Steps */}
      <ProgressSteps status={order.status} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Col */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50/80 px-10 py-6 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-700">Order Details</h3>
            </div>
            <div className="p-10 space-y-12">
              {/* Customer Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-16">
                <div className="space-y-1 relative">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</p>
                  <p className="text-sm font-black text-gray-700">{order.customer.fullName}</p>
                  <div className="absolute -bottom-4 left-0 right-0 h-[1px] bg-gray-50 border-b border-dashed border-gray-200" />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                  <p className="text-sm font-black text-gray-700">{order.customer.phoneNumber}</p>
                  <div className="absolute -bottom-4 left-0 right-0 h-[1px] bg-gray-50 border-b border-dashed border-gray-200" />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp number</p>
                  <p className="text-sm font-black text-gray-700">{order.customer.whatsappNumber}</p>
                  <div className="absolute -bottom-4 left-0 right-0 h-[1px] bg-gray-50 border-b border-dashed border-gray-200" />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-black text-gray-700">{order.customer.email}</p>
                  <div className="absolute -bottom-4 left-0 right-0 h-[1px] bg-gray-50 border-b border-dashed border-gray-200" />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full delivery address</p>
                  <p className="text-sm font-black text-gray-700 max-w-[280px] leading-relaxed">{order.customer.deliveryAddress}</p>
                  <div className="absolute -bottom-4 left-0 right-0 h-[1px] bg-gray-50 border-b border-dashed border-gray-200" />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">State</p>
                  <p className="text-sm font-black text-gray-700">{order.customer.state}</p>
                  <div className="absolute -bottom-4 left-0 right-0 h-[1px] bg-gray-50 border-b border-dashed border-gray-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LGA</p>
                  <p className="text-sm font-black text-gray-700 max-w-[280px]">{order.customer.lga}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Landmark</p>
                  <p className="text-sm font-black text-gray-700">{order.customer.landmark}</p>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-8 pt-6">
                <div className="bg-gray-50/50 p-6 rounded-2xl flex items-center justify-between border border-gray-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product(s)</p>
                    <p className="text-lg font-black text-gray-700">{order.product.name}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity</p>
                    <p className="text-lg font-black text-gray-700">{order.product.quantity}</p>
                  </div>
                </div>

                {order.upsoldProduct && (
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-gray-400">Added Product(Upsold)</p>
                    <div className="bg-gray-50/50 p-6 rounded-2xl flex items-center justify-between border border-gray-100">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product(s)</p>
                        <p className="text-lg font-black text-gray-700">{order.upsoldProduct.name}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity</p>
                        <p className="text-lg font-black text-gray-700">{order.upsoldProduct.quantity}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order History Timeline */}
          <div className="space-y-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Order History</h3>
            <div className="space-y-4 relative">
              {order.history.map((item, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-[10px] font-bold text-gray-900 min-w-[120px]">{item.event}</span>
                    <div className="flex-1 h-[1px] border-b border-dashed border-gray-200" />
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    {item.repName && <span className="text-[10px] font-bold text-gray-400 italic">Sales Rep: {item.repName}</span>}
                    {item.agentName && <span className="text-[10px] font-bold text-gray-400 italic">Agent: {item.agentName}</span>}
                    <span className="text-[10px] font-medium text-gray-400 min-w-[120px] text-right">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-10">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl group border border-gray-100">
            <div
              className="relative w-full aspect-[16/10] flex items-center justify-center"
              style={{ backgroundColor: order.product.imageColor }}
            >
              <Image
                src={
                  order.product.imageUrl ??
                  `https://placehold.co/400x250/${order.product.imageColor.replace('#', '')}/ffffff?text=${encodeURIComponent(order.product.name)}`
                }
                alt={order.product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 right-6 flex items-center gap-2">
                <span className="text-white text-3xl font-black">{order.product.quantity}</span>
                <span className="text-white text-lg font-bold uppercase">{order.product.name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium">{order.orderDate}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">Source:</span>
                <span className="text-xs font-bold text-gray-900">{order.source}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-gray-800">Total Price</span>
                <span className="text-lg font-black text-gray-900">{order.product.totalPrice}</span>
              </div>

              {order.estimatedDeliveryDate && (
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <span className="text-sm font-black text-gray-800">Estimated Delivery Date</span>
                  <span className="text-sm font-bold text-gray-400">{order.estimatedDeliveryDate}</span>
                </div>
              )}

              {order.deliveryFee && (
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <span className="text-sm font-black text-gray-800">Delivery Fee</span>
                  <span className="text-sm font-black text-gray-900">{order.deliveryFee}</span>
                </div>
              )}

              {order.agent && (
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <span className="text-sm font-black text-gray-800">Agent Assigned</span>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-700">{order.agent.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{order.agent.location}</p>
                  </div>
                </div>
              )}

              {order.agent && (
                <button
                  onClick={() => setIsAgentModalOpen(true)}
                  className="w-full py-4 bg-[#F4EBFF] text-[#A020F0] rounded-2xl text-xs font-black transition-all hover:bg-[#E9D5FF] shadow-sm shadow-purple-50 uppercase tracking-widest"
                >
                  View Agent Info
                </button>
              )}
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer has been reached out to on</p>
              <div className="flex items-center gap-8">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${order.contactMethod === 'Phone Call' || order.contactMethod === 'Both' ? 'bg-[#A020F0] border-[#A020F0]' : 'border-gray-200 group-hover:border-purple-300'}`}>
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-600">Phone Call</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${order.contactMethod === 'WhatsApp' || order.contactMethod === 'Both' ? 'bg-[#A020F0] border-[#A020F0]' : 'border-gray-200 group-hover:border-purple-300'}`}>
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-600">WhatsApp</span>
                </label>
              </div>
            </div>

            {order.status === 'Cancelled' && order.cancellationReason && (
              <div className="space-y-2 pt-6 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason for cancellation</p>
                <p className="text-sm font-black text-gray-700 leading-relaxed">{order.cancellationReason}</p>
              </div>
            )}

            {order.status === 'Failed' && order.failureReason && (
              <div className="space-y-2 pt-6 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason for failed Order</p>
                <p className="text-sm font-black text-gray-700 leading-relaxed">{order.failureReason}</p>
              </div>
            )}

            {(order.status === 'Confirmed' || order.status === 'Failed' || order.status === 'Delivered') && (
              <div className="pt-6 border-t border-gray-100">
                <PrescriptionEditor initialValue={order.prescription} readOnly />
              </div>
            )}

            {/* Mark Delivered / Fail — analyst override for confirmed orders */}
            {order.status === 'Confirmed' && (
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setFailReason('');
                    setCustomFailReason('');
                    setIsFailOpen(true);
                  }}
                  disabled={isDelivering || isFailing}
                  type="button"
                  className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-red-500 font-bold text-sm hover:bg-red-100 transition disabled:opacity-50"
                >
                  ✕ Fail
                </button>
                <button
                  onClick={handleMarkDelivered}
                  disabled={isDelivering || isFailing}
                  type="button"
                  className="bg-[#198754] text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-[#157347] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDelivering ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Marking...
                    </>
                  ) : (
                    '✓ Delivered'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {order.agent && (
        <AgentInfoModal
          agent={order.agent}
          isOpen={isAgentModalOpen}
          onClose={() => setIsAgentModalOpen(false)}
        />
      )}

      {/* Mark as Failed Modal */}
      {isFailOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isFailing && setIsFailOpen(false)}
          />
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[500px] p-10 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800">Mark as Failed</h2>
              <button
                onClick={() => !isFailing && setIsFailOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Select a reason this delivery failed, or enter your own.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {FAIL_REASONS.map((reason) => {
                const selected = failReason === reason && !customFailReason.trim();
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setFailReason(reason);
                      setCustomFailReason('');
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left text-sm font-bold transition-all ${
                      selected
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                        selected ? 'border-rose-500 bg-rose-500' : 'border-slate-300'
                      }`}
                    />
                    {reason}
                  </button>
                );
              })}
            </div>

            <div className="mb-8">
              <label className="text-xs text-gray-400 font-bold mb-2 block">
                Other reason (optional)
              </label>
              <textarea
                value={customFailReason}
                onChange={(e) => {
                  setCustomFailReason(e.target.value);
                  if (e.target.value.trim()) setFailReason('');
                }}
                placeholder="Enter a custom reason…"
                className="w-full min-h-[80px] border-2 border-rose-200 focus:border-rose-500 rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 resize-none outline-none transition"
              />
            </div>

            <button
              disabled={isFailing || !(customFailReason.trim() || failReason)}
              onClick={handleMarkFailed}
              type="button"
              className="w-full bg-rose-600 text-white py-4 rounded-2xl text-[1rem] font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isFailing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Marking...
                </>
              ) : (
                'Confirm Failure'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-8">
              <button
                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isDeleting}
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">Delete Order Permanently</h3>
                <p className="text-sm text-gray-500 mb-2">
                  You are about to permanently delete order <span className="font-bold text-gray-700">{order.orderId}</span>.
                </p>
                <p className="text-sm text-red-500 font-medium mb-6">
                  This action cannot be undone. The order and all related records will be permanently removed.
                </p>

                {deleteError && (
                  <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-red-600 font-medium">{deleteError}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 w-full">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteOrder}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-6 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
