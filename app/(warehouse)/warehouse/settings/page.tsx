import type { Metadata } from "next";
import { User, Bell, Lock, Building2, Save } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your warehouse profile and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <User className="w-4 h-4 text-[#7C3AED]" />
          <h2 className="text-sm font-semibold text-gray-600">Profile Information</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-5 mb-5">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-xl font-bold text-[#7C3AED]">
              FA
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Felix Adeyemo</p>
              <p className="text-xs text-gray-500">Warehouse Manager</p>
              <button className="mt-1.5 text-xs text-[#7C3AED] font-semibold hover:underline">
                Change photo
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "First Name",   value: "Felix",                      type: "text" },
              { label: "Last Name",    value: "Adeyemo",                    type: "text" },
              { label: "Email",        value: "felix.adeyemo@nutricare.com", type: "email" },
              { label: "Phone",        value: "+234 801 234 5678",           type: "tel" },
            ].map(({ label, value, type }) => (
              <div key={label}>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                  {label}
                </label>
                <input
                  type={type}
                  defaultValue={value}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Role</label>
            <input
              type="text"
              defaultValue="Warehouse Manager"
              disabled
              className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Warehouse Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#7C3AED]" />
          <h2 className="text-sm font-semibold text-gray-600">Warehouse Preferences</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Default Zone",     value: "Zone A"       },
              { label: "QC Alert Threshold", value: "5 items"    },
              { label: "Auto-assign Pickers", value: "Enabled"   },
              { label: "Low Stock Alert",  value: "10 units"     },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  defaultValue={value}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#7C3AED]" />
          <h2 className="text-sm font-semibold text-gray-600">Notification Preferences</h2>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: "Damage alerts",           desc: "Get notified when bin damage is reported" },
            { label: "Overdue pick orders",      desc: "Alert when a pick order exceeds 1 hour" },
            { label: "QC check reminders",       desc: "Remind when items await QC clearance" },
            { label: "Low stock warnings",       desc: "Notify when bin stock drops below threshold" },
            { label: "Dispatch confirmations",   desc: "Get confirmation on outgoing dispatches" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-[13px] font-semibold text-gray-700">{label}</p>
                <p className="text-[11px] text-gray-400">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7C3AED]" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#7C3AED]" />
          <h2 className="text-sm font-semibold text-gray-600">Security</h2>
        </div>
        <div className="p-5 space-y-4">
          {["Current Password", "New Password", "Confirm New Password"].map((label) => (
            <div key={label}>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                {label}
              </label>
              <input
                type="password"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pb-6">
        <button className="flex items-center gap-2 bg-[#7C3AED] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#6B21A8] transition-colors shadow-sm">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
