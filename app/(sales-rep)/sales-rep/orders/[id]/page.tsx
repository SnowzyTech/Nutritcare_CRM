'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

function StepIndicator({ number, label, isActive, isCompleted }: { number: number; label: string; isActive: boolean; isCompleted: boolean }) {
  const bgColor = isActive ? 'bg-yellow-400' : isCompleted ? 'bg-green-500' : 'bg-gray-200';
  const textColor = isActive || isCompleted ? 'text-white' : 'text-gray-400';
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-full ${bgColor} ${textColor} flex items-center justify-center font-bold text-lg`}>
        {isCompleted ? '✓' : number}
      </div>
      <span className="text-xs text-gray-500 font-medium text-center max-w-24">
        {label}
      </span>
    </div>
  );
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter();
  const { id: orderId } = React.use(params);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productRows, setProductRows] = useState([{ id: Date.now(), product: 'prosxact', qty: '1' }]);

  const addRow = () => {
    setProductRows([...productRows, { id: Date.now(), product: 'prosxact', qty: '1' }]);
  };

  const removeRow = (id: number) => {
    if (productRows.length > 1) {
      setProductRows(productRows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: number, field: 'product' | 'qty', value: string) => {
    setProductRows(productRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const adjustQty = (id: number, delta: number) => {
    setProductRows(productRows.map(row => {
      if (row.id === id) {
        const newQty = Math.max(1, parseInt(row.qty) + delta);
        return { ...row, qty: String(newQty) };
      }
      return row;
    }));
  };




  const orderStatusMap: Record<string, string> = {
    '1': 'pending', '2': 'pending', '3': 'pending',
    '4': 'confirmed', '5': 'confirmed',
    '6': 'delivered', '7': 'delivered',
    '8': 'cancelled',
    '9': 'failed',
  };
  const orderStatus = orderStatusMap[orderId] || 'pending';

  const orderData = {
    pending: {
      id: '012994248', status: 'Pending Order', statusColor: '#FCD34D',
      steps: [
        { number: 1, label: 'Order is Pending', isActive: true, isCompleted: false },
        { number: 2, label: 'Order is yet to be Confirmed', isActive: false, isCompleted: false },
        { number: 3, label: 'Order is yet to be Delivered', isActive: false, isCompleted: false },
      ],
      customer: { fullName: 'Victor Uche', phone: '+234 803 456 1290', whatsapp: '+234 803 456 1290', email: 'victor.uche.ng@gmail.com', address: 'No. 42 Adeoyo Ring Road, Ibadan, Oyo State', state: 'Oyo State', lga: 'Ibadan North Local Government Area', landmark: 'Near University College Hospital (UCH)' },
      product: 'Shred Belly', quantity: 6, totalPrice: '₦99,000', deliveryFee: null, agentAssigned: null, agentLocation: null, estimatedDelivery: null, deliveredDate: null, source: 'WhatsApp',
    },
    confirmed: {
      id: '012994248', status: 'Confirmed Order', statusColor: '#10B981',
      steps: [
        { number: 1, label: 'Order Processed', isActive: false, isCompleted: true },
        { number: 2, label: 'Order has been confirmed', isActive: true, isCompleted: false },
        { number: 3, label: 'Order is yet to be Delivered', isActive: false, isCompleted: false },
      ],
      customer: { fullName: 'Adewale Johnson', phone: '08023784913', whatsapp: '08023784913', email: 'adewale.johnson.ng@gmail.com', address: '15 Adeyemi Crescent, Bodija Estate, Ibadan, Oyo State', state: 'Oyo State', lga: 'Ibadan North Local Government Area', landmark: 'Bodija Market / University of Ibadan Main Gate' },
      product: 'Prosxact', quantity: 4, totalPrice: '₦84,000', deliveryFee: '₦2,025', agentAssigned: 'Mrs. Sunmi', agentLocation: 'Oyo State', estimatedDelivery: '24hours', deliveredDate: null, source: 'WhatsApp',
    },
    delivered: {
      id: '012994248', status: 'Delivered Order', statusColor: '#10B981',
      steps: [
        { number: 1, label: 'Order Processed', isActive: false, isCompleted: true },
        { number: 2, label: 'Order Confirmed', isActive: false, isCompleted: true },
        { number: 3, label: 'Order Delivered', isActive: false, isCompleted: true },
      ],
      customer: { fullName: 'Samuel Adebayo', phone: '08023784913', whatsapp: '08023784913', email: 'samuel.adebayo@gmail.com', address: '15 Adeyemi Crescent, Bodija Estate, Ibadan, Oyo State', state: 'Oyo State', lga: 'Ibadan North Local Government Area', landmark: 'Bodija Market / University of Ibadan Main Gate' },
      product: 'Prosxact', quantity: 2, totalPrice: '₦42,000', deliveryFee: '₦1,000', agentAssigned: 'Flymack', agentLocation: 'Kaduna', estimatedDelivery: null, deliveredDate: '03-02-2026', source: 'WhatsApp',
    },
    cancelled: {
      id: '012994248', status: 'Cancelled Order', statusColor: '#F87171',
      steps: [
        { number: 1, label: 'Order Processed', isActive: false, isCompleted: true },
        { number: 2, label: 'Order Cancelled', isActive: true, isCompleted: false },
        { number: 3, label: 'N/A', isActive: false, isCompleted: false },
      ],
      customer: { fullName: 'Victor Uche', phone: '+234 803 456 1290', whatsapp: '+234 803 456 1290', email: 'victor.uche.ng@gmail.com', address: 'No. 42 Adeoyo Ring Road, Ibadan, Oyo State', state: 'Oyo State', lga: 'Ibadan North Local Government Area', landmark: 'Near University College Hospital (UCH)' },
      product: 'Fonio-Mill', quantity: 7, totalPrice: '₦77,000', deliveryFee: null, agentAssigned: null, agentLocation: null, estimatedDelivery: null, deliveredDate: null, source: 'WhatsApp',
    },
    failed: {
      id: '012994248', status: 'Failed Order', statusColor: '#EF4444',
      steps: [
        { number: 1, label: 'Order Processed', isActive: false, isCompleted: true },
        { number: 2, label: 'Order Failed', isActive: true, isCompleted: false },
        { number: 3, label: 'N/A', isActive: false, isCompleted: false },
      ],
      customer: { fullName: 'Victor Uche', phone: '+234 803 456 1290', whatsapp: '+234 803 456 1290', email: 'victor.uche.ng@gmail.com', address: 'No. 42 Adeoyo Ring Road, Ibadan, Oyo State', state: 'Oyo State', lga: 'Ibadan North Local Government Area', landmark: 'Near University College Hospital (UCH)' },
      product: 'Fonio-Mill', quantity: 7, totalPrice: '₦77,000', deliveryFee: '₦2,000', agentAssigned: 'Mrs. Sunmi', agentLocation: 'Oyo State', estimatedDelivery: null, deliveredDate: null, source: 'WhatsApp',
    },
  };

  const o = orderData[orderStatus as keyof typeof orderData] || orderData.pending;

  const field = (label: string, value: string) => (
    <div>
      <label className="text-xs text-gray-500 font-semibold">{label}</label>
      <p className="text-sm text-gray-900 font-medium mt-1 mb-3">{value}</p>
      <div className="border-b border-dashed border-gray-200 mb-2" />
    </div>
  );

  const getStatusColor = () => {
    switch (orderStatus) {
      case 'pending': return 'bg-yellow-400';
      case 'confirmed': return 'bg-green-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };

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
        <h2 className="text-lg font-bold text-gray-900 m-0">
          Order ID: {o.id}
        </h2>
        <span className={`${getStatusColor()} text-white px-5 py-2 rounded-full text-sm font-semibold`}>
          {o.status}
        </span>
      </div>

      {/* Steps */}
      <div className="bg-white p-8 rounded-xl flex items-start gap-4">
        {o.steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            <StepIndicator {...step} />
            {idx < o.steps.length - 1 && (
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
            {field('Full Name', o.customer.fullName)}
            {field('Phone Number', o.customer.phone)}
            {field('WhatsApp number', o.customer.whatsapp)}
            {field('Email', o.customer.email)}
            <div className="col-span-2">{field('Full delivery address', o.customer.address)}</div>
            {field('State', o.customer.state)}
            {field('LGA', o.customer.lga)}
            <div className="col-span-2">{field('Landmark', o.customer.landmark)}</div>
            {field('Product(s)', o.product)}
            {field('Quantity', String(o.quantity))}
          </div>

          {orderStatus === 'pending' && (
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
              {[
                { label: 'Order Created', date: '2025-11-08 14:37:52', sub: null },
                { label: 'Sales Rep Assigned', date: '2025-11-08 14:37:52', sub: 'Adebimpe Tolani' },
                { label: 'Order Confirmed', date: '2025-11-08 14:37:52', sub: null },
                ...(orderStatus !== 'pending' ? [{ label: 'Prescription Sent', date: '2025-11-08 14:37:52', sub: null }] : []),
              ].map((h) => (
                <div key={h.label} className="flex justify-between text-gray-500">
                  <span>{h.label}</span>
                  <div className="text-right">
                    <div>{h.date}</div>
                    {h.sub && <div className="text-gray-900 font-medium">{h.sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Product & Actions */}
        <div className="col-span-2 flex flex-col gap-6">
          {/* Product Image placeholder */}
          <div className="bg-gray-100 rounded-xl min-h-45 flex items-center justify-center text-gray-400 text-sm border border-gray-200">
            📦 {o.product} — {o.quantity} units
          </div>

          {/* Price / Actions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Source: <strong className="text-gray-900">{o.source}</strong></span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Price</span>
              <span className="text-base font-bold text-gray-900">{o.totalPrice}</span>
            </div>

            {orderStatus === 'pending' && (
              <>
                <p className="text-xs text-gray-500 m-0">Set Delivery Date</p>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full border-2 border-purple-600 px-3 py-2 rounded-lg text-sm outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-purple-100 border border-purple-200 px-4 py-2 rounded-lg text-purple-600 font-semibold text-sm hover:bg-purple-50 transition">Cancel</button>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-700 transition">Confirm →</button>
                </div>
              </>
            )}

            {(orderStatus === 'confirmed' || orderStatus === 'delivered') && o.deliveryFee && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Estimated Delivery Date</span>
                  <span className="font-semibold text-gray-900">{o.estimatedDelivery || '24hours'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Delivery Fee</span>
                  <span className="font-semibold text-gray-900">{o.deliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Agent Assigned</span>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{o.agentAssigned}</div>
                    <div className="text-xs text-gray-400">{o.agentLocation}</div>
                  </div>
                </div>
                <button className="w-full bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-500 font-semibold text-sm hover:bg-gray-50 transition">View Agent Info</button>
                <button className="w-full bg-purple-100 border border-purple-200 px-4 py-2 rounded-lg text-purple-600 font-semibold text-sm hover:bg-purple-50 transition">Reassign Agent</button>
              </>
            )}

            {orderStatus === 'delivered' && o.deliveredDate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 m-0">✓ Order delivered on {o.deliveredDate}</p>
              </div>
            )}
          </div>

          {/* Contact method */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-xs text-gray-500 mb-4">Customer has been reached out to on</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`contact-${orderId}`} value="phone" className="accent-purple-600" />
                <span className="text-sm text-gray-900">Phone Call</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`contact-${orderId}`} value="whatsapp" defaultChecked className="accent-purple-600" />
                <span className="text-sm text-gray-900">WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Prescription */}
          {orderStatus !== 'pending' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Set Prescription</h4>
              <textarea
                placeholder="Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days."
                className="w-full min-h-24 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 resize-none outline-none focus:border-purple-600"
              />
            </div>
          )}

          {/* Confirm / Fail buttons for confirmed orders */}
          {orderStatus === 'confirmed' && (
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg text-red-500 font-semibold text-sm hover:bg-red-100 transition">✕ Fail</button>
              <button className="bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-purple-700 transition">✓ Delivered</button>
            </div>
          )}
        </div>
      </div>
      {/* ── Add Product Modal ── */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           {/* Overlay */}
           <div 
             className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
             onClick={() => setIsAddProductOpen(false)}
           />

           {/* Modal Body */}
           <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[650px] p-12 animate-in fade-in zoom-in duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-2xl font-black text-slate-400">Add Product</h2>
                 <button 
                  onClick={() => setIsAddProductOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                 >
                    <X size={20} />
                 </button>
              </div>

              {/* Product Rows Container */}
              <div className="space-y-4 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {productRows.map((row) => (
                  <div key={row.id} className="flex gap-3 items-center group">
                    <div className="flex-1 bg-slate-50 rounded-2xl p-6 flex gap-4 items-center border border-slate-100">
                      <div className="flex-1">
                        <Select 
                          value={row.product} 
                          onValueChange={(val) => updateRow(row.id, 'product', val)}
                        >
                          <SelectTrigger className="w-full h-[48px] border-none bg-white/50 rounded-xl text-[1.1rem] font-black shadow-sm px-4">
                            <SelectValue placeholder="Select Product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prosxact">Prosxact</SelectItem>
                            <SelectItem value="shred-belly">Shred Belly</SelectItem>
                            <SelectItem value="fonio-mill">Fonio-Mill</SelectItem>
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
                        title="Remove product"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                 <button 
                  onClick={addRow}
                  className="w-full border-2 border-purple-600 text-purple-600 py-4 rounded-2xl text-[1rem] font-black hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                 >
                    Add Another Product <span className="text-xl">→</span>
                 </button>
                 
                 <button 
                  onClick={() => setIsAddProductOpen(false)}
                  className="w-full bg-purple-600 text-white py-4 rounded-2xl text-[1rem] font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
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

