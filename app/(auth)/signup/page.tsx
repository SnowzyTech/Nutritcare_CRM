"use client";

import { useActionState, useState, useEffect } from "react";
import { signupAction, type SignupActionState } from "@/modules/auth/actions/signup.action";
import { Loader2, ArrowRight } from "lucide-react";
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

// ── Inline styles helpers ────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "0.375rem",
  border: "1.5px solid #e5e7eb",
  background: "#fff",
  color: "#111",
  fontSize: "0.9rem",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "#374151",
  marginBottom: "0.4rem",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

// ── Step indicator ───────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: "2.5rem" }}>
      {Array.from({ length: total }).map((_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {/* Circle */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: isActive || isDone ? "2px solid #8B2FE8" : "2px solid #d1d5db",
                background: isDone ? "#8B2FE8" : isActive ? "#fff" : "#fff",
                color: isDone ? "#fff" : isActive ? "#8B2FE8" : "#9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.78rem",
                fontWeight: 600,
                flexShrink: 0,
                zIndex: 1,
                transition: "all 0.3s",
              }}
            >
              {stepNum}
            </div>
            {/* Connector */}
            {i < total - 1 && (
              <div
                style={{
                  height: 2,
                  width: 120,
                  background: stepNum < current ? "#8B2FE8" : "#e5e7eb",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────
export default function SignupPage() {
  const [state, action, isPending] = useActionState(signupAction, initialState);
  const [step, setStep] = useState(1);

  // Step 1 local state (collected before submission)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [role, setRole] = useState(state.fields?.role ?? "");

  // Step 2 local state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Advance to step 3 when the server signals pending approval
  useEffect(() => {
    if (state?.pendingApproval) setStep(3);
  }, [state?.pendingApproval]);

  // Validation for step 1 advance
  const canAdvance = firstName && lastName && phone && workEmail && role;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Step indicator (outside card) ── */}
      <div style={{ width: "100%", maxWidth: 640, marginBottom: 0 }}>
        <StepIndicator current={step} total={3} />
      </div>

      {/* ── Card ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: "#fff",
          borderRadius: "1rem",
          boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
          padding: "2.5rem 2.5rem 2rem",
        }}
      >
        {/* Error banner */}
        {state?.error && (
          <div
            style={{
              marginBottom: "1.25rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: "0.875rem",
            }}
          >
            {state.error}
          </div>
        )}

        {/* ── Step 1: Personal Info ── */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: "0.35rem" }}>
              Personal Info
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "2rem" }}>
              Provide all necessary informations
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem 1.5rem" }}>
              {/* First Name */}
              <div style={fieldStyle}>
                <label style={labelStyle}>First Name</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Enter First Name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#8B2FE8")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
              </div>

              {/* Last Name */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Enter Last Name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#8B2FE8")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
              </div>

              {/* Phone Number */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter Phone Number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#8B2FE8")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
              </div>

              {/* WhatsApp Number */}
              <div style={fieldStyle}>
                <label style={labelStyle}>WhatsApp Number</label>
                <input
                  id="whatsapp"
                  type="tel"
                  placeholder="Enter WhatsApp Number"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#8B2FE8")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
              </div>

              {/* Work Email */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Work Email</label>
                <input
                  id="workEmail"
                  type="email"
                  placeholder="Enter Your Work Email"
                  value={workEmail}
                  onChange={e => setWorkEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#8B2FE8")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
              </div>

              {/* Role */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Role</label>
                <div style={{ position: "relative" }}>
                  <select
                    id="roleSelect"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      paddingRight: "2.5rem",
                      cursor: "pointer",
                      color: role ? "#111" : "#9ca3af",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#8B2FE8")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                  >
                    <option value="" disabled>Sales Rep</option>
                    {roleOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <svg
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Continue button */}
            <button
              id="step1-continue"
              type="button"
              disabled={!canAdvance}
              onClick={() => canAdvance && setStep(2)}
              style={{
                width: "100%",
                marginTop: "2rem",
                padding: "0.9rem",
                borderRadius: "0.5rem",
                border: "none",
                background: canAdvance ? "#8B2FE8" : "#d1d5db",
                color: "#fff",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: canAdvance ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "background 0.2s",
              }}
            >
              Continue <ArrowRight size={18} />
            </button>

            <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.8rem", color: "#9ca3af" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#8B2FE8", fontWeight: 600, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* ── Step 2: Account Security ── */}
        {step === 2 && (
          <form action={action}>
            {/* Hidden fields carry step 1 data through the server action */}
            <input type="hidden" name="name" value={`${firstName} ${lastName}`} />
            <input type="hidden" name="email" value={workEmail} />
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="whatsapp" value={whatsapp} />

            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: "0.35rem" }}>
              Account Security
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "2rem" }}>
              Set a strong password for your account
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Password */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Min. 8 chars with a letter & number"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#8B2FE8")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
              </div>

              {/* Confirm Password */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#8B2FE8")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                />
              </div>
            </div>

            {/* Buttons row */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: "0.9rem",
                  borderRadius: "0.5rem",
                  border: "1.5px solid #e5e7eb",
                  background: "#fff",
                  color: "#374151",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
              >
                Back
              </button>

              <button
                id="signup-submit"
                type="submit"
                disabled={isPending}
                style={{
                  flex: 2,
                  padding: "0.9rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: isPending ? "#d1d5db" : "#8B2FE8",
                  color: "#fff",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: isPending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "background 0.2s",
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                    Creating account…
                  </>
                ) : (
                  <>Create Account <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Pending Approval ── */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8B2FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
              Request Submitted!
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", maxWidth: 360, margin: "0 auto 1.5rem" }}>
              Your account is pending admin approval. You will be able to log in once an admin activates your account.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "0.75rem 2rem",
                borderRadius: "0.5rem",
                background: "#8B2FE8",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
