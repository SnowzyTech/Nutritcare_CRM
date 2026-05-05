'use client';

import React from 'react';
import Image from 'next/image';
import { Mail, Phone, MapPin, Shield, Bell, Palette } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      <div className="grid grid-cols-[320px_1fr] gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-purple-100 shadow-md">
              <Image
                src="https://ui-avatars.com/api/?name=Victoria+Nwachukwu&background=f3e8ff&color=7c3aed&bold=true&size=160"
                alt="Victoria Nwachukwu"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-3">Victoria Nwachukwu</h2>
            <span className="text-xs text-gray-400 font-medium">Accountant</span>
            <button className="mt-3 px-4 py-2 bg-[#A020F0] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-200 hover:bg-[#8B1FD0] transition-colors">
              Edit Profile
            </button>
          </div>
          <div className="space-y-3 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail size={16} className="text-gray-400" />
              victoria@nutricare.com
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone size={16} className="text-gray-400" />
              +234 801 234 5678
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400" />
              Lagos, Nigeria
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {[
            { icon: Shield, title: 'Security', description: 'Manage your password and two-factor authentication', items: ['Change Password', 'Enable 2FA', 'Login History'] },
            { icon: Bell, title: 'Notifications', description: 'Configure how and when you receive notifications', items: ['Email Alerts', 'Push Notifications', 'Report Reminders'] },
            { icon: Palette, title: 'Appearance', description: 'Customize the look and feel of your dashboard', items: ['Dark Mode', 'Compact View', 'Font Size'] },
          ].map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-[#A020F0]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-800">{section.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      {section.items.map((item) => (
                        <button key={item} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-medium text-gray-600 hover:bg-purple-50 hover:text-[#A020F0] hover:border-purple-200 transition-colors">
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
