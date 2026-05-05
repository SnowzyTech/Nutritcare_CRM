"use client";

import React from "react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ShieldCheck, 
  Bell, 
  Lock,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const profile = {
    name: "Felix Adeyemo",
    role: "Logistics Manager",
    email: "felix.adeyemo@nutritcare.com",
    phone: "+234 801 234 5678",
    address: "123, Victoria Island, Lagos, Nigeria",
    employeeId: "LM-2024-001",
    department: "Logistics & Operations",
    joined: "Jan 15, 2024",
    avatar: null // Will use initials
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 pt-2">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-gray-800">Profile Settings</h1>
        <p className="text-sm text-gray-400 font-medium">Manage your personal information and account preferences.</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-[#f3e8ff] flex items-center justify-center border-4 border-white shadow-md overflow-hidden text-4xl font-bold text-[#ad1df4]">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              "FA"
            )}
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-[#ad1df4] text-white rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <span className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Briefcase className="w-4 h-4 text-[#ad1df4]" />
              {profile.role}
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <MapPin className="w-4 h-4 text-[#ad1df4]" />
              Lagos, Nigeria
            </span>
          </div>
          <div className="pt-2">
            <span className="px-3 py-1 bg-[#faf5ff] text-[#ad1df4] text-[10px] font-bold rounded-full border border-[#f3e8ff]">
              Active Account
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="border-gray-200 text-gray-600 font-bold px-6 h-10">
            Cancel
          </Button>
          <Button className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-8 h-10 font-bold shadow-lg shadow-purple-200">
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <div className="p-2 bg-[#faf5ff] rounded-lg">
              <User className="w-5 h-5 text-[#ad1df4]" />
            </div>
            <h3 className="font-bold text-gray-800">Personal Information</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
              <Input defaultValue={profile.name} className="h-10 text-xs border-gray-100 bg-gray-50/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
              <Input defaultValue={profile.email} className="h-10 text-xs border-gray-100 bg-gray-50/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
              <Input defaultValue={profile.phone} className="h-10 text-xs border-gray-100 bg-gray-50/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Residential Address</label>
              <Input defaultValue={profile.address} className="h-10 text-xs border-gray-100 bg-gray-50/30" />
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <div className="p-2 bg-[#faf5ff] rounded-lg">
              <ShieldCheck className="w-5 h-5 text-[#ad1df4]" />
            </div>
            <h3 className="font-bold text-gray-800">Work Information</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Employee ID</label>
              <Input disabled defaultValue={profile.employeeId} className="h-10 text-xs border-gray-100 bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Department</label>
              <Input disabled defaultValue={profile.department} className="h-10 text-xs border-gray-100 bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Joined Date</label>
              <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border border-gray-100 rounded-md text-xs text-gray-500 font-medium">
                <Calendar className="w-4 h-4" />
                {profile.joined}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
              <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border border-gray-100 rounded-md text-xs text-[#22c55e] font-bold">
                Permanent Employee
              </div>
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <div className="p-2 bg-[#faf5ff] rounded-lg">
              <Lock className="w-5 h-5 text-[#ad1df4]" />
            </div>
            <h3 className="font-bold text-gray-800">Security</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-[10px] text-gray-400 font-medium uppercase">Password Management</p>
            <Button variant="outline" className="w-full justify-start h-12 text-xs font-bold gap-3 border-gray-100">
              <div className="p-1.5 bg-gray-100 rounded">
                <Lock className="w-4 h-4" />
              </div>
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 text-xs font-bold gap-3 border-gray-100 text-red-500 hover:text-red-600 hover:bg-red-50">
              <div className="p-1.5 bg-red-100 rounded">
                <ShieldCheck className="w-4 h-4" />
              </div>
              Enable 2FA Authentication
            </Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <div className="p-2 bg-[#faf5ff] rounded-lg">
              <Bell className="w-5 h-5 text-[#ad1df4]" />
            </div>
            <h3 className="font-bold text-gray-800">Preferences</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs font-bold text-gray-800">Email Notifications</p>
                <p className="text-[10px] text-gray-400">Receive daily delivery reports</p>
              </div>
              <div className="w-10 h-5 bg-[#ad1df4] rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs font-bold text-gray-800">Push Notifications</p>
                <p className="text-[10px] text-gray-400">Real-time tracking alerts</p>
              </div>
              <div className="w-10 h-5 bg-gray-200 rounded-full relative">
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
