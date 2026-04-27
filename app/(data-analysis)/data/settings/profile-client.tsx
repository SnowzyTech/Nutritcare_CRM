'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User, Mail, Shield, Camera, Save } from 'lucide-react';

export function ProfileClient() {
  const [formData, setFormData] = useState({
    name: 'Favour Isunuoya',
    email: 'favour@nutricare.com',
    role: 'Senior Data Analyst',
    bio: 'Experienced data analyst focused on supply chain optimization and sales performance tracking.',
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-2">Manage your personal information and account preferences.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header/Cover area */}
        <div className="h-32 bg-gradient-to-r from-purple-600 to-indigo-600 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-100 shadow-md">
                <Image
                  src="https://ui-avatars.com/api/?name=Favour+Isunuoya&background=f3f4f6&color=6b7280"
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-purple-600 transition-colors">
                <Camera size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-10 px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.role}
                    disabled
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Bio & More */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="block w-full p-4 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Account Security</h4>
                <p className="text-xs text-purple-600 mb-4">Your account is secured with two-factor authentication.</p>
                <button className="text-sm font-bold text-purple-700 hover:underline">Manage Security Settings</button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <button className="flex items-center gap-2 px-8 py-3 bg-[#A020F0] text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-[#8e1cd8] transition-all active:scale-95">
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
