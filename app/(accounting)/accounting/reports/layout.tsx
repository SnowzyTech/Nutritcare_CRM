import { ChevronLeft, ChevronRight, RotateCcw, MessageCircle } from 'lucide-react';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F9FAFB]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <ChevronRight size={20} />
          </button>
          <button className="p-1.5 text-purple-400 hover:text-purple-600 transition-colors bg-purple-50 rounded-lg">
            <RotateCcw size={18} />
          </button>
        </div>
        <div className="w-14 h-14 bg-[#F3E8FF] rounded-full flex items-center justify-center">
          <div className="w-10 h-10 bg-[#AE00FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-200 cursor-pointer">
            <MessageCircle size={22} fill="currentColor" />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
