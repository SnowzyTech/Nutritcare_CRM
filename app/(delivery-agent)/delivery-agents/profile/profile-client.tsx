"use client";

import React, { useState, useTransition } from "react";
import {
  User,
  Mail,
  Phone,
  MessageCircle,
  Building2,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
  Save,
  Shield,
} from "lucide-react";
import { updateAgentProfileAction, changePasswordAction } from "@/modules/delivery/actions/delivery-agent-portal.action";

interface AgentData {
  companyName: string;
  state: string | null;
  address: string | null;
  phone1: string;
  phone2: string | null;
  status: string;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsappNumber: string | null;
  createdAt: Date;
  agent: AgentData | null;
}

type Tab = "profile" | "security";
type Toast = { type: "success" | "error"; message: string } | null;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special char", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : "bg-gray-100"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`text-[10px] font-semibold flex items-center gap-1 ${c.pass ? "text-emerald-500" : "text-gray-300"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.pass ? "bg-emerald-400" : "bg-gray-200"}`} />
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[10px] font-black ${colors[score - 1].replace("bg-", "text-")}`}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#ad1df4] transition-all pr-11"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function ProfileClient({
  profile,
  avatarUrl,
}: {
  profile: ProfileData;
  avatarUrl: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [isPending, startTransition] = useTransition();

  // Profile form state
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsappNumber ?? "");

  // Password form state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  function handleCancelEdit() {
    setName(profile.name);
    setPhone(profile.phone ?? "");
    setWhatsapp(profile.whatsappNumber ?? "");
    setIsEditing(false);
  }

  function handleSaveProfile() {
    startTransition(async () => {
      const res = await updateAgentProfileAction({ name, phone, whatsappNumber: whatsapp });
      if (res.error) {
        showToast("error", res.error);
      } else {
        showToast("success", "Profile updated successfully");
        setIsEditing(false);
      }
    });
  }

  function handleChangePassword() {
    setPwError("");
    if (!currentPw) return setPwError("Please enter your current password");
    if (newPw.length < 8) return setPwError("New password must be at least 8 characters");
    if (newPw !== confirmPw) return setPwError("Passwords do not match");
    startTransition(async () => {
      const res = await changePasswordAction({ currentPassword: currentPw, newPassword: newPw });
      if (res.error) {
        setPwError(res.error);
      } else {
        showToast("success", "Password changed successfully");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      }
    });
  }

  const joined = new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
  }).format(new Date(profile.createdAt));

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold transition-all ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#ad1df4] via-[#9b10e0] to-[#7209b7] p-6 text-white shadow-lg shadow-purple-200">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white" />
          <div className="absolute -bottom-14 -left-6 w-40 h-40 rounded-full bg-white" />
        </div>

        <div className="relative flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-[20px] overflow-hidden border-4 border-white/20 shadow-lg">
              <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-1">
              Delivery Agent
            </p>
            <h2 className="text-xl font-black leading-tight truncate">{profile.name}</h2>
            <p className="text-purple-200 text-xs mt-0.5 truncate">{profile.email}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="bg-white/15 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {profile.agent?.status ?? "Active"}
              </span>
              <span className="text-purple-200 text-[10px] font-medium">· Joined {joined}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[20px] p-1.5 flex gap-1 shadow-sm">
        {(["profile", "security"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-sm font-bold transition-all ${
              activeTab === tab
                ? "bg-[#ad1df4] text-white shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab === "profile" ? (
              <User className="w-4 h-4" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {tab === "profile" ? "Profile" : "Security"}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          {/* Personal info card */}
          <div className="bg-white rounded-[24px] p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Personal Info</p>
                <p className="text-[10px] text-gray-300 mt-0.5">Your account details</p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#ad1df4] bg-[#faf5ff] px-3 py-2 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isPending}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-[#ad1df4] px-3 py-2 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-60"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isPending ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#ad1df4] transition-all"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                    {profile.name}
                  </div>
                )}
              </div>

              {/* Email — always read only */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </label>
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-400 flex items-center justify-between">
                  <span>{profile.email}</span>
                  <span className="text-[9px] font-bold bg-gray-200 text-gray-400 px-2 py-0.5 rounded-full uppercase">
                    Read only
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#ad1df4] transition-all"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                    {profile.phone || <span className="text-gray-300 font-medium">Not set</span>}
                  </div>
                )}
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Enter WhatsApp number"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#ad1df4] transition-all"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                    {profile.whatsappNumber || <span className="text-gray-300 font-medium">Not set</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Agent details card */}
          {profile.agent && (
            <div className="bg-white rounded-[24px] p-5 shadow-sm space-y-4">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Agent Details</p>
                <p className="text-[10px] text-gray-300 mt-0.5">Your registered agent information</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Company Name
                  </p>
                  <div className="bg-[#faf5ff] rounded-xl px-4 py-3 text-sm font-bold text-[#ad1df4]">
                    {profile.agent.companyName}
                  </div>
                </div>

                {profile.agent.state && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> State
                    </p>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                      {profile.agent.state}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Agent Phone
                  </p>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                    {profile.agent.phone1}
                  </div>
                </div>

                {profile.agent.address && (
                  <div className="col-span-2 space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Address
                    </p>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                      {profile.agent.address}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security tab */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[14px] bg-[#faf5ff] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-[#ad1df4]" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800">Change Password</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Update your account password</p>
              </div>
            </div>

            <div className="h-px bg-gray-50" />

            <div className="space-y-4">
              <PasswordField
                label="Current Password"
                value={currentPw}
                onChange={setCurrentPw}
                placeholder="Enter current password"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <PasswordFieldInner
                    value={newPw}
                    onChange={setNewPw}
                    placeholder="Enter new password"
                  />
                </div>
                <PasswordStrength password={newPw} />
              </div>

              <PasswordField
                label="Confirm New Password"
                value={confirmPw}
                onChange={setConfirmPw}
                placeholder="Repeat new password"
              />

              {confirmPw && newPw !== confirmPw && (
                <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Passwords do not match
                </p>
              )}
              {confirmPw && newPw === confirmPw && newPw.length >= 8 && (
                <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Passwords match
                </p>
              )}

              {pwError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-semibold text-red-500">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {pwError}
                </div>
              )}
            </div>

            <button
              onClick={handleChangePassword}
              disabled={isPending}
              className="w-full bg-[#ad1df4] text-white py-3.5 rounded-[16px] text-sm font-black hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-purple-200"
            >
              <Lock className="w-4 h-4" />
              {isPending ? "Updating…" : "Update Password"}
            </button>
          </div>

          {/* Security tips */}
          <div className="bg-[#faf5ff] border border-purple-100 rounded-[20px] p-5 space-y-3">
            <p className="text-xs font-black text-[#ad1df4] uppercase tracking-wider">Security Tips</p>
            {[
              "Use at least 8 characters with uppercase, numbers and special characters",
              "Never share your password with anyone",
              "Use a unique password not used on other platforms",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-[#ad1df4]" />
                </div>
                <p className="text-xs font-medium text-purple-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Separate inner component to avoid closure issues with the show state
function PasswordFieldInner({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#ad1df4] transition-all pr-11"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
