'use client';

import React, { useState } from 'react';
import { MessageCircle, Check } from 'lucide-react';
import Image from 'next/image';
import { OrderDetailFull } from '@/modules/data-analysis/services/data-analysis.service';
import { ProgressSteps } from './ProgressSteps';
import { AgentInfoModal } from './AgentInfoModal';
import { PrescriptionEditor } from './PrescriptionEditor';

interface OrderDetailClientProps {
  order: OrderDetailFull;
}

const BADGE_STYLES: Record<string, string> = {
  Pending: 'bg-[#FFF3CD] text-[#856404]',
  Confirmed: 'bg-[#D1E7DD] text-[#0F5132]',
  Delivered: 'bg-[#198754] text-white',
  Cancelled: 'bg-[#F8D7DA] text-[#842029]',
  Failed: 'bg-[#DC3545] text-white',
};

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
            <Image src={order.repAvatarUrl} alt={order.repName} fill className="object-cover" sizes="48px" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{order.repName}'s</h1>
            <p className="text-sm text-gray-400 font-medium">Dashboard</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 cursor-pointer shadow-sm hover:bg-purple-200 transition-colors">
          <MessageCircle size={20} fill="currentColor" />
        </div>
      </div>

      {/* Sub Header */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-black text-gray-700">Order ID: {order.orderId}</h2>
        <span className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm ${BADGE_STYLES[order.status]}`}>
          {order.status} Order
        </span>
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
              className="w-full aspect-[16/10] flex items-center justify-center"
              style={{ backgroundColor: order.product.imageColor }}
            >
              <Image
                src={`https://placehold.co/400x250/${order.product.imageColor.replace('#', '')}/ffffff?text=${encodeURIComponent(order.product.name)}`}
                alt={order.product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
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

              {(order.status === 'Confirmed' || order.status === 'Failed') && order.agent && (
                <button
                  onClick={() => setIsAgentModalOpen(true)}
                  className="w-full py-4 bg-[#F4EBFF] text-[#A020F0] rounded-2xl text-xs font-black transition-all hover:bg-[#E9D5FF] shadow-sm shadow-purple-50 uppercase tracking-widest"
                >
                  View Agent Info
                </button>
              )}

              {order.status === 'Delivered' && order.agent && (
                <button
                  disabled
                  className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-widest cursor-not-allowed"
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
                <PrescriptionEditor initialValue={order.prescription} />
              </div>
            )}
          </div>
        </div>
      </div>

      {order.agent && (
        <AgentInfoModal
          agentName={order.agent.name}
          isOpen={isAgentModalOpen}
          onClose={() => setIsAgentModalOpen(false)}
        />
      )}
    </div>
  );
}
