import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Forms" };

export default function FormsPage() {
  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-[2rem] font-black text-slate-800 leading-tight">Forms</h2>
          <p className="text-sm text-slate-500 mt-1">Manage all your forms here.</p>
        </div>
        <Link 
          href="/admin/forms/add"
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md text-sm transition-colors"
        >
          Add Form
        </Link>
      </div>

      <div className="bg-white rounded-lg p-8 text-center text-gray-500 border border-gray-200">
        No forms have been created yet. Click "Add Form" to create one.
      </div>
    </div>
  );
}
