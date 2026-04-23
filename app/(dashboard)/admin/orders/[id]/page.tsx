"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MessageCircle, Phone, CheckCircle2, Circle } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Mock data based on screenshots
const ordersData: Record<string, any> = {
  "012994248": {
    id: "012994248",
    status: "confirmed",
    customer: {
      name: "John Ade",
      phone: "08023764913",
      whatsapp: "08023764913",
      email: "johnade@gmail.com",
      address: "No. 18 Independence Way, Kaduna",
      state: "Kaduna State",
      lga: "Kaduna North Local Government Area",
      landmark: "Near Arewa House",
    },
    products: [
      { name: "Prosxact", quantity: 3 },
    ],
    upsoldProducts: [
      { name: "Prosxact", quantity: 2 },
    ],
    history: [
      { event: "Order Created", date: "2025-11-08", time: "14:37:52" },
      { event: "Sales Rep Assiged", detail: "Adebimpe Tolani", date: "2025-11-08", time: "14:37:52" },
      { event: "Order Comfirmed", date: "2025-11-08", time: "14:37:52" },
      { event: "Prescription Sent", date: "2025-11-08", time: "14:37:52" },
      { event: "Delivery Agent Assigned", detail: "Mrs Sunmi", date: "2025-11-08", time: "14:37:52" },
    ],
    sidebar: {
      productImage: "/klinka.png", // Placeholder
      productName: "Prosxact",
      source: "WhatsApp",
      totalPrice: "N84,000",
      deliveryDate: "24hours",
      agent: "Flymack",
      agentState: "Kaduna",
      reachedOut: { phone: false, whatsapp: true },
      prescription: "Cap. Amoxicillin 500mg Take 1 capsule every 8 hours for 5 days."
    }
  },
  "pending-order": {
    id: "012994248", // Same ID used in screenshot 2 as well
    status: "pending",
    customer: {
      name: "Adewale Johnson",
      phone: "0906 713 6429",
      whatsapp: "0906 713 6429",
      email: "08023764913", // Screenshot shows email as a phone number?
      address: "15 Adeyemi Crescent, Bodija Estate, Ibadan, Oyo State, Nigeria",
      state: "Oyo State",
      lga: "Ibadan North Local Government Area",
      landmark: "Bodija Market / University of Ibadan Main Gate",
    },
    products: [
      { name: "Prosxact", quantity: 4 },
    ],
    history: [
      { event: "Order Created", date: "2025-11-08", time: "14:37:52" },
      { event: "Sales Rep Assiged", detail: "Adebimpe Tolani", date: "2025-11-08", time: "14:37:52" },
    ],
    sidebar: {
      productImage: "/klinka.png",
      productName: "Prosxact",
      source: "WhatsApp",
      totalPrice: "N84,000",
      reachedOut: { phone: false, whatsapp: false },
    }
  }
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // For demo purposes, if id is 1, use confirmed, if 2 use pending
  const orderId = id === "1" ? "012994248" : "pending-order";
  const order = ordersData[orderId] || ordersData["012994248"];

  const isConfirmed = order.status === "confirmed";

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors w-fit font-bold text-sm"
      >
        <ChevronLeft size={16} />
        Back to Orders
      </button>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
             <Image src="https://avatar.iran.liara.run/public/60" alt="Avatar" width={48} height={48} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Adebimpe Tolani's</h1>
            <p className="text-sm text-slate-500">Dashboard</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg">
          <MessageCircle size={20} />
        </button>
      </div>

      {/* Order Title & Badge */}
      <div className="flex items-center gap-4 mt-2">
        <h2 className="text-lg font-bold text-slate-700">Order ID: {order.id}</h2>
        <Badge className={isConfirmed ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-100 px-4 py-1" : "bg-amber-100 text-amber-600 hover:bg-amber-100 px-4 py-1"}>
          {isConfirmed ? "Comfirmed Order" : "Pending Order"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Stepper */}
          <div className="flex items-center justify-between px-10 relative">
            {/* Connector Lines */}
            <div className="absolute top-5 left-20 right-20 h-0.5 bg-slate-200 -z-10" />
            
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-2 text-center max-w-[120px]">
              <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold">1</div>
              <span className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-tight">
                {isConfirmed ? "Order Processed" : "Order is Pending"}
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-2 text-center max-w-[120px]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isConfirmed ? "bg-emerald-400" : "bg-slate-200"}`}>2</div>
              <span className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-tight">
                {isConfirmed ? "Order has been comfirmed" : "Order is yet to be Comfirmed"}
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-2 text-center max-w-[120px]">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-white font-bold">3</div>
              <span className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-tight">
                Order is yet to Delivered
              </span>
            </div>
          </div>

          {/* Order Details Card */}
          <Card className="rounded-[1.5rem] border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-100/50 px-8 py-4 border-b border-slate-100">
               <h3 className="text-lg font-bold text-slate-700">Order Details</h3>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 gap-x-12 gap-y-10 mb-12">
                <DetailItem label="Full Name" value={order.customer.name} />
                <DetailItem label="Phone Number" value={order.customer.phone} />
                <DetailItem label="WhatsApp number" value={order.customer.whatsapp} />
                <DetailItem label="Email" value={order.customer.email} />
                <DetailItem label="Full delivery address" value={order.customer.address} />
                <DetailItem label="State" value={order.customer.state} />
                <DetailItem label="LGA" value={order.customer.lga} />
                <DetailItem label="Landmark" value={order.customer.landmark} />
              </div>

              {/* Products Section */}
              <div className="flex flex-col gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-100">
                  <div>
                    <p className="text-[0.7rem] font-bold text-slate-400 uppercase mb-1">Product(s)</p>
                    <p className="text-xl font-bold text-slate-700">{order.products[0].name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.7rem] font-bold text-slate-400 uppercase mb-1">Quantity</p>
                    <p className="text-2xl font-bold text-slate-700">{order.products[0].quantity}</p>
                  </div>
                </div>

                {order.upsoldProducts && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[0.8rem] font-bold text-slate-400 uppercase px-1">Added Product(Upsold)</p>
                    <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-100">
                      <div>
                        <p className="text-[0.7rem] font-bold text-slate-400 uppercase mb-1">Product(s)</p>
                        <p className="text-xl font-bold text-slate-700">{order.upsoldProducts[0].name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[0.7rem] font-bold text-slate-400 uppercase mb-1">Quantity</p>
                        <p className="text-2xl font-bold text-slate-700">{order.upsoldProducts[0].quantity}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Order History */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Order History</h4>
            <div className="flex flex-col gap-6">
              {order.history.map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="min-w-[140px]">
                    <p className="text-[0.8rem] font-bold text-slate-700">{h.event}</p>
                    {h.detail && <p className="text-[0.8rem] font-bold text-slate-700">{h.detail}</p>}
                  </div>
                  <div className="flex-1 border-b border-dotted border-slate-300 mb-1" />
                  <div className="text-right">
                    <p className="text-[0.8rem] font-bold text-slate-500">{h.date}</p>
                    <p className="text-[0.7rem] text-slate-400 font-medium">{h.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Product Image Card */}
          <div className="relative h-[240px] rounded-[2rem] overflow-hidden group">
            <Image 
              src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=2070&auto=format&fit=crop" 
              alt="Product" 
              fill 
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"

            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
               <p className="text-white text-2xl font-bold">{order.sidebar.productName}</p>
            </div>
            {/* Small floating badge */}
            <div className="absolute bottom-12 left-8 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 flex items-center gap-2">
                <span className="text-white text-lg font-bold">{order.products[0].quantity} {order.sidebar.productName}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
             <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-400">Source: <span className="text-slate-800">{order.sidebar.source}</span></span>
             </div>

             <div className="flex justify-between items-center py-4 border-b border-slate-200">
                <span className="text-lg font-bold text-slate-700">Total Price</span>
                <span className="text-xl font-bold text-slate-800">{order.sidebar.totalPrice}</span>
             </div>

             {isConfirmed && (
               <>
                <div className="flex justify-between items-center py-4 border-b border-slate-200">
                  <span className="text-sm font-bold text-slate-700">Estimated Delivery Date</span>
                  <span className="text-sm font-bold text-slate-500">{order.sidebar.deliveryDate}</span>
                </div>

                <div className="flex justify-between items-center py-4">
                  <span className="text-sm font-bold text-slate-700">Agent Assigned</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{order.sidebar.agent}</p>
                    <p className="text-[0.7rem] font-bold text-slate-400 uppercase">{order.sidebar.agentState}</p>
                  </div>
                </div>

                <Button className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold py-6 rounded-xl border-none shadow-none">
                  View Agent Info
                </Button>
               </>
             )}

             <div className="mt-4">
                <p className="text-[0.8rem] font-bold text-slate-400 mb-4">Customer has been reached out to on</p>
                <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${order.sidebar.reachedOut.phone ? "border-purple-600 bg-purple-600" : "border-slate-300"}`}>
                      {order.sidebar.reachedOut.phone && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm font-bold text-slate-500">Phone Call</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${order.sidebar.reachedOut.whatsapp ? "border-purple-600 bg-purple-600" : "border-slate-300"}`}>
                      {order.sidebar.reachedOut.whatsapp && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm font-bold text-slate-500">WhatsApp</span>
                  </div>
                </div>
             </div>

             {isConfirmed && order.sidebar.prescription && (
               <div className="mt-8">
                  <div className="bg-slate-200 p-3 rounded-t-xl text-[0.8rem] font-bold text-slate-500 uppercase">
                    Prescription
                  </div>
                  <div className="bg-white p-6 rounded-b-xl border border-t-0 border-slate-200 shadow-sm relative group">
                    <p className="text-[0.9rem] font-bold text-slate-600 leading-relaxed pr-10">
                      {order.sidebar.prescription}
                    </p>
                    <button className="absolute top-4 right-4 p-1 rounded-md border border-purple-200 text-purple-600 text-[0.6rem] font-bold hover:bg-purple-50">
                       Edit
                    </button>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 group">
      <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-[0.9rem] font-bold text-slate-700 border-b-2 border-slate-100 pb-2 group-hover:border-purple-200 transition-colors">
        {value}
      </p>
    </div>
  );
}
