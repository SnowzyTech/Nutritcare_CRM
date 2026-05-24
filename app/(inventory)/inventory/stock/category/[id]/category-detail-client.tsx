"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Trash2, Tag, Phone, Mail, MessageSquare, Send } from "lucide-react";
import { deleteProductCategoryAction } from "@/modules/inventory/actions/stock.action";

export default function CategoryDetailClient({ category }: { category: any }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProductCategoryAction(category.id);
    if (result?.error) {
      alert(result.error);
      setIsDeleting(false);
      setShowConfirm(false);
    } else {
      router.push("/inventory/stock?tab=Product+Categories");
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#9D00FF] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Stock
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#3D0066] to-[#5C0099] p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Tag className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{category.categoryName}</h1>
                <p className="text-white/60 text-sm mt-1">Brand: {category.brandName || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/inventory/stock/category/${category.id}/edit`)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Brand Contact
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 py-3 border-b border-gray-50">
                    <Phone className="w-4 h-4 text-[#9D00FF]" />
                    <span className="text-gray-900 font-semibold">{category.brandPhone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 py-3 border-b border-gray-50">
                    <Mail className="w-4 h-4 text-[#9D00FF]" />
                    <span className="text-gray-900 font-semibold">{category.brandEmail || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 py-3 border-b border-gray-50">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    <span className="text-gray-900 font-semibold">{category.brandWhatsappNumber || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
               <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Marketing Details
                </h3>
                <div className="p-6 bg-gray-50 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 uppercase font-bold tracking-tight">SMS Sender ID</p>
                  <p className="text-xl font-bold text-gray-900">{category.smsSenderId || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Category?</h2>
            <p className="text-gray-500 text-sm mb-8">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{category.categoryName}"</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600">
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
