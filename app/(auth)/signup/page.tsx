"use client";

import { useActionState } from "react";
import { signupAction, type SignupActionState } from "@/modules/auth/actions/signup.action";
import { Loader2, Lock, Mail, User, ChevronDown, Leaf } from "lucide-react";
import Link from "next/link";

const initialState: SignupActionState = {};

const roleOptions = [
  { value: "SALES_REP", label: "Sales Rep" },
  { value: "DELIVERY_AGENT", label: "Delivery Agent" },
  { value: "DATA_ANALYST", label: "Data Analyst" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "INVENTORY_MANAGER", label: "Inventory Manager" },
  { value: "WAREHOUSE_MANAGER", label: "Warehouse Manager" },
  { value: "LOGISTICS_MANAGER", label: "Logistics Manager" },
];

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition";

export default function SignupPage() {
  const [state, action, isPending] = useActionState(signupAction, initialState);

  return (
    <div className="w-full max-w-md px-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-4">
            <Leaf className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Nutricare CRM
          </h1>
          <p className="text-sm text-slate-400 mt-1">Create your account</p>
        </div>

        {/* Error */}
        {state?.error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-5">
          {/* Full name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-slate-300">
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Jane Smith"
                defaultValue={state.fields?.name ?? ""}
                key={`name-${state.fields?.name}`}
                className={inputClass}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                defaultValue={state.fields?.email ?? ""}
                key={`email-${state.fields?.email}`}
                className={inputClass}
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label htmlFor="role" className="block text-sm font-medium text-slate-300">
              Role
            </label>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                id="role"
                name="role"
                required
                defaultValue={state.fields?.role ?? ""}
                key={`role-${state.fields?.role}`}
                className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 py-2.5 pl-4 pr-10 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  Select your role…
                </option>
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Min. 8 chars with a letter &amp; number"
                className={inputClass}
              />
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
