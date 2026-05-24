import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormBuilder } from "@/components/dashboard/forms/FormBuilder";

export const metadata: Metadata = { title: "Add Form" };

export default function AddFormPage() {
  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <div className="mb-8">
        <Link 
          href="/admin/forms" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Forms
        </Link>
        <h2 className="text-[2rem] font-black text-slate-800 leading-tight">Add Form</h2>
        <p className="text-sm text-slate-500 mt-1">Build and manage customer capture forms.</p>
      </div>
      <FormBuilder />
    </div>
  );
}
