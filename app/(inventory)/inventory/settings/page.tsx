"use client";

import React from "react";
import { Mail, Phone, MapPin, Building2, Calendar, ShieldCheck, Edit3 } from "lucide-react";

export default function SettingsProfilePage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header section with cover & avatar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {/* Cover photo (soft gradient) */}
        <div className="h-40 bg-gradient-to-r from-[#9D00FF]/20 to-[#9D00FF]/5 relative">
          <button className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white/80 rounded-full backdrop-blur-sm transition-colors text-gray-700">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Profile info block */}
        <div className="px-8 pb-8 relative flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:-mt-12">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-white shrink-0">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300"
              alt="Yusuf Adeyemi"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title / Role */}
          <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Yusuf Adeyemi</h1>
            <p className="text-[#9D00FF] font-semibold text-sm flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4" />
              Inventory Manager
            </p>
          </div>

          {/* Action button */}
          <div className="shrink-0">
            <button className="px-6 py-2.5 bg-[#9D00FF] hover:bg-[#8500d9] text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-sm font-medium text-gray-800">yusuf.adeyemi@nutritcare.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="text-sm font-medium text-gray-800">+234 800 123 4567</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                <p className="text-sm font-medium text-gray-800">Owerri, Imo State, Nigeria</p>
              </div>
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Work Details</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Warehouse</p>
                <p className="text-sm font-medium text-gray-800">Owerri HQ / Oricho</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#9D00FF]" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">System Role</p>
                <p className="text-sm font-medium text-gray-800">Administrator (Inventory Module)</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Joined Date</p>
                <p className="text-sm font-medium text-gray-800">12 October 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
