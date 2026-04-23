import type { Metadata } from "next";
import { FormBuilder } from "@/components/dashboard/forms/FormBuilder";

export const metadata: Metadata = { title: "Forms" };

export default function FormsPage() {
  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-[2rem] font-black text-slate-800 leading-tight">Forms</h2>
        <p className="text-sm text-slate-500 mt-1">Build and manage customer capture forms.</p>
      </div>
      <FormBuilder />
    </div>
  );
}
