"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Trash2, Package, Tag, Globe, BarChart2, Gift, Layers, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteProductAction } from "@/modules/inventory/actions/stock.action";

export default function ProductDetailClient({ product }: { product: any }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProductAction(product.id);
    if (result?.error) {
      alert(result.error);
      setIsDeleting(false);
      setShowConfirm(false);
    } else {
      router.push("/inventory/stock?tab=Product");
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
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#3D0066] to-[#5C0099] p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Package className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <p className="text-white/60 text-sm mt-1">SKU: {product.sku}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/inventory/stock/product/${product.id}/edit`)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Product
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

        {/* Content Section */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column: Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Product Info
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Category</span>
                    <span className="text-gray-900 font-semibold">{product.category?.categoryName || "—"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Brand</span>
                    <span className="text-gray-900 font-semibold">{product.category?.brandName || "—"}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Country</span>
                    <span className="text-gray-900 font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      {product.country || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  Pricing & Stock
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs mb-1">Cost Price</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(product.costPrice)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-500 text-xs mb-1">Selling Price</p>
                    <p className="text-xl font-bold text-[#9D00FF]">{formatCurrency(product.sellingPrice)}</p>
                  </div>
                  <div className="bg-[#FAF5FF] p-4 rounded-xl col-span-2 border border-[#9D00FF]/10">
                    <p className="text-[#9D00FF] text-xs mb-1 font-semibold uppercase">Quantity Left</p>
                    <p className="text-3xl font-black text-gray-900">{product.quantity.toLocaleString()} <span className="text-sm font-normal text-gray-400">Units</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Image & Description */}
            <div className="space-y-8">
               {product.imageUrl ? (
                 <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                   <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                 </div>
               ) : (
                 <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                    <div className="text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm font-medium">No Image Uploaded</p>
                    </div>
                 </div>
               )}

               <div>
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
                 <p className="text-gray-600 leading-relaxed text-sm">
                   {product.description || "No description provided for this product."}
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Section */}
      {product.packages && product.packages.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
          <div className="px-8 py-5 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Pricing Packages
            </h3>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {product.packages.map((pkg: any, idx: number) => (
                <div key={pkg.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Package {idx + 1}
                  </p>
                  <p className="text-base font-bold text-gray-900 mb-2">{pkg.name || "—"}</p>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Quantity</span>
                    <span className="font-semibold text-gray-800">{pkg.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold text-[#9D00FF]">{formatCurrency(pkg.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Offers Section */}
      {product.offers && product.offers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
          <div className="px-8 py-5 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4" />
              Product Offers
            </h3>
          </div>
          <div className="p-8 space-y-6">
            {product.offers.map((offer: any) => (
              <div key={offer.id} className="border border-[#9D00FF]/15 rounded-xl p-6 bg-[#FAF5FF]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{offer.offerName}</p>
                    {offer.recurring && (
                      <span className="inline-block mt-1 text-xs font-semibold text-[#9D00FF] bg-[#9D00FF]/10 px-2 py-0.5 rounded-full capitalize">
                        {offer.recurring}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-black text-[#9D00FF]">{formatCurrency(offer.sellingPrice)}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-gray-400 text-xs mb-0.5">Offer Quantity</p>
                    <p className="font-semibold text-gray-800">{offer.offerQuantity}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-gray-400 text-xs mb-0.5">Offer Unit</p>
                    <p className="font-semibold text-gray-800">{offer.offerUnit || "—"}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-gray-400 text-xs mb-0.5">Show Qty & Unit</p>
                    <p className="font-semibold text-gray-800">{offer.showQuantityAndUnit ? "Yes" : "No"}</p>
                  </div>
                </div>

                {/* Combo products */}
                {product.combos && product.combos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Combo Products
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {product.combos.map((combo: any) => (
                        <div key={combo.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-100 text-sm">
                          <span className="text-gray-700 font-medium">{combo.comboProduct?.name ?? "—"}</span>
                          <span className="text-gray-400 text-xs ml-2">×{combo.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gift products */}
                {product.gifts && product.gifts.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5" /> Free Gift Products
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {product.gifts.map((gift: any) => (
                        <div key={gift.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-100 text-sm">
                          <span className="text-gray-700 font-medium">{gift.giftProduct?.name ?? "—"}</span>
                          <span className="text-gray-400 text-xs ml-2">×{gift.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Product?</h2>
            <p className="text-gray-500 text-sm mb-8">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{product.name}"</span>? 
              This action can be undone by an administrator.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
