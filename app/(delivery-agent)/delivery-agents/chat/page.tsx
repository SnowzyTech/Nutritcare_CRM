"use client";

import React from "react";
import { 
  ArrowLeft, 
  MoreVertical, 
  Megaphone, 
  Camera, 
  Send,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-48px)] -m-4 lg:-m-8 bg-white relative">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-purple-50 bg-[#fafafa]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/delivery-agents" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
              <span className="text-[8px] text-yellow-500 font-bold tracking-tighter leading-none text-center">Corona</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h1 className="font-bold text-[#1e1e2d] text-base leading-tight">Flymack</h1>
            <p className="text-[10px] text-gray-400 font-medium">Abuja</p>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600">
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      {/* Announcement Bar */}
      <div className="bg-white border-b border-purple-50 px-4 py-2 flex items-center gap-3">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Megaphone className="w-3.5 h-3.5 text-gray-700 fill-gray-700" />
        </div>
        <p className="text-[10px] text-gray-500 font-medium truncate">
          <span className="font-black text-gray-700">Linda Ihekuna:</span> The remittance account number is 000012374889, Zenit...
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 bg-[#fafafb]/30">
        {/* Date Separator */}
        <div className="flex justify-center">
          <span className="bg-[#f5ebff] text-[#ad1df4] text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
            Today
          </span>
        </div>

        {/* Message from You */}
        <div className="flex flex-row-reverse items-end gap-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
             <span className="text-[6px] text-yellow-500 font-bold leading-none scale-75">Corona</span>
          </div>
          <div className="relative group max-w-[80%]">
            <div className="absolute top-2 right-4 text-[9px] text-purple-200 font-bold">8:31 | 20/3</div>
            <div className="bg-[#ad1df4] text-white p-5 pt-8 rounded-[24px] rounded-tr-none shadow-sm shadow-purple-100">
              <p className="text-sm font-medium leading-relaxed">I'm at the delivery address for the trim and tone order</p>
            </div>
            {/* Tail */}
            <div className="absolute -right-1 top-0 w-4 h-4 bg-[#ad1df4] clip-path-bubble-right"></div>
          </div>
        </div>

        {/* Message with Quote */}
        <div className="flex items-end gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
            <img 
              src="https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=100" 
              alt="User" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative max-w-[80%] space-y-1">
             <div className="bg-[#fdfaff] border border-purple-50 p-4 rounded-[24px] rounded-tl-none shadow-sm space-y-3">
                {/* Quote Bubble */}
                <div className="bg-white border border-purple-100 rounded-xl p-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-100"></div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-gray-700">You</span>
                    <span className="text-[9px] text-gray-300 font-bold">8:31 | 20/3</span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-2">I'm at the delivery address for the trim and tone order</p>
                </div>
                
                <div className="space-y-1">
                   <p className="text-sm font-medium text-gray-700 leading-relaxed">
                     alright. What's the ETA for the next order <span className="text-[#ad1df4] font-black italic underline decoration-2">#Order ID: 012994248</span>?
                   </p>
                   <div className="text-right">
                     <span className="text-[9px] text-gray-300 font-bold italic">8:32 | 20/3</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Message from Other */}
        <div className="flex items-end gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
            <img 
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100" 
              alt="User" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative max-w-[80%]">
             <div className="bg-[#fdfaff] border border-purple-50 p-5 rounded-[24px] rounded-tl-none shadow-sm space-y-2">
                <div className="flex justify-between items-center -mt-1">
                  <span className="text-[10px] font-black text-gray-500">Blessing Ehijie</span>
                  <span className="text-[9px] text-gray-300 font-bold italic">8:31 | 20/3</span>
                </div>
                <p className="text-sm font-medium text-gray-700 leading-relaxed">
                  <span className="text-[#ad1df4] font-black underline decoration-2">@Flymack</span> Can you get to the next location in 20min?
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <footer className="p-4 lg:p-6 bg-white border-t border-purple-50 sticky bottom-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Message"
              className="w-full h-14 bg-[#faf5ff] border-none rounded-full px-8 text-gray-700 font-medium placeholder:text-purple-200 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
            />
            <button className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ad1df4] transition-colors">
              <Camera className="w-6 h-6 stroke-[1.5px]" />
            </button>
          </div>
          <button className="w-14 h-14 bg-[#ad1df4] text-white rounded-full flex items-center justify-center hover:bg-[#8e14cc] transition-all shadow-lg shadow-purple-100 hover:scale-105 active:scale-95">
            <Send className="w-6 h-6 -mr-1 -mt-0.5" />
          </button>
        </div>
      </footer>

      <style jsx>{`
        .clip-path-bubble-right {
          clip-path: polygon(0 0, 0% 100%, 100% 0);
        }
      `}</style>
    </div>
  );
}
