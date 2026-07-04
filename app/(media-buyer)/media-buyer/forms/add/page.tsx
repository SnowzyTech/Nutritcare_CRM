import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormBuilder } from "@/components/dashboard/forms/FormBuilder";
import { getProductsWithPackages } from "@/modules/orders/services/products.service";

export const metadata: Metadata = { title: "Create Form" };

export default async function CreateFormPage() {
  const products = await getProductsWithPackages();
  const productsForBuilder = products.map((p) => ({
    ...p,
    sellingPrice: Number(p.sellingPrice),
    unit: p.unit ?? null,
    packages: p.packages.map((pkg) => ({ ...pkg, price: Number(pkg.price) })),
    offers: p.offers.map((offer) => ({ ...offer, sellingPrice: Number(offer.sellingPrice) })),
  }));

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <div className="mb-8">
        <Link
          href="/media-buyer/forms"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to My Forms
        </Link>
        <h2 className="text-[2rem] font-black text-slate-800 leading-tight">Create Form</h2>
        <p className="text-sm text-slate-500 mt-1">Build the order form you&apos;ll embed on your landing page.</p>
      </div>
      <FormBuilder products={productsForBuilder} basePath="/media-buyer/forms" />
    </div>
  );
}
