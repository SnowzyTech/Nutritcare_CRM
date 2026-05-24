"use client";

import { useActionState, useState, useEffect, useRef, useCallback } from "react";
import { signupAction, type SignupActionState } from "@/modules/auth/actions/signup.action";
import { Loader2, ArrowRight, Camera, X } from "lucide-react";
import Link from "next/link";

const initialState: SignupActionState = {};

const roleOptions = [
  { value: "SALES_REP", label: "Sales Rep" },
  { value: "SALES_REP_MANAGER", label: "Sales Rep Manager" },
  { value: "DATA_ANALYST", label: "Data Analyst" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "INVENTORY_MANAGER", label: "Inventory Manager" },
  { value: "WAREHOUSE_MANAGER", label: "Warehouse Manager" },
  { value: "LOGISTICS_MANAGER", label: "Logistics Manager" },
];

const inp: React.CSSProperties = {
  width: "100%", padding: "0.75rem 1rem", borderRadius: "0.375rem",
  border: "1.5px solid #e5e7eb", background: "#fff", color: "#111",
  fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: "0.85rem", fontWeight: 500,
  color: "#374151", marginBottom: "0.4rem",
};
const fld: React.CSSProperties = { display: "flex", flexDirection: "column" };
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.currentTarget.style.borderColor = "#8B2FE8");
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.currentTarget.style.borderColor = "#e5e7eb");

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: "2.5rem" }}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1; const isActive = n === current; const isDone = n < current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              border: isActive || isDone ? "2px solid #8B2FE8" : "2px solid #d1d5db",
              background: isDone ? "#8B2FE8" : "#fff",
              color: isDone ? "#fff" : isActive ? "#8B2FE8" : "#9ca3af",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.78rem", fontWeight: 600, flexShrink: 0, transition: "all 0.3s",
            }}>{n}</div>
            {i < total - 1 && (
              <div style={{ height: 2, width: 100, background: n < current ? "#8B2FE8" : "#e5e7eb", transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

type Warehouse = { id: string; name: string; referenceCode?: string | null };
type Team = { id: string; name: string; department: string };

export default function SignupPage() {
  const [state, action, isPending] = useActionState(signupAction, initialState);
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [role, setRole] = useState(state.fields?.role ?? "");
  const [warehouseId, setWarehouseId] = useState(state.fields?.warehouseId ?? "");
  const [teamId, setTeamId] = useState(state.fields?.teamId ?? "");

  // Avatar upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>(state.fields?.avatarUrl ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Remote data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Step 2 fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => { if (state?.pendingApproval) setStep(3); }, [state?.pendingApproval]);

  // Fetch warehouses & teams once
  useEffect(() => {
    fetch("/api/warehouses").then(r => r.json()).then(d => setWarehouses(d.warehouses ?? [])).catch(() => {});
    fetch("/api/teams").then(r => r.json()).then(d => setTeams(d.teams ?? [])).catch(() => {});
  }, []);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setAvatarError(data.error ?? "Upload failed."); setAvatarPreview(""); return; }
      setAvatarUrl(data.url);
    } catch {
      setAvatarError("Upload failed. Please try again.");
      setAvatarPreview("");
    } finally {
      setAvatarUploading(false);
    }
  }, []);

  const removeAvatar = () => {
    setAvatarPreview(""); setAvatarUrl(""); setAvatarError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const canAdvance =
    firstName && lastName && phone && workEmail && role &&
    (role !== "WAREHOUSE_MANAGER" || warehouseId) &&
    (role !== "SALES_REP" || teamId) &&
    !avatarUploading;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 660 }}>
        <StepIndicator current={step} total={3} />
      </div>

      <div style={{ width: "100%", maxWidth: 660, background: "#fff", borderRadius: "1rem", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", padding: "2.5rem 2.5rem 2rem" }}>
        {state?.error && (
          <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "0.875rem" }}>
            {state.error}
          </div>
        )}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: "0.35rem" }}>Personal Info</h1>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "2rem" }}>Provide all necessary information</p>

            {/* Avatar upload */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.75rem" }}>
              <div
                onClick={() => !avatarUploading && fileRef.current?.click()}
                style={{ position: "relative", width: 96, height: 96, borderRadius: "50%", background: "#f3e8ff", border: "2.5px dashed #8B2FE8", display: "flex", alignItems: "center", justifyContent: "center", cursor: avatarUploading ? "wait" : "pointer", overflow: "hidden", flexShrink: 0 }}
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Camera size={28} color="#8B2FE8" />
                )}
                {avatarUploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(139,47,232,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 size={22} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                  </div>
                )}
                {avatarPreview && !avatarUploading && (
                  <button type="button" onClick={e => { e.stopPropagation(); removeAvatar(); }} style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={11} color="#fff" />
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={handleAvatarChange} />
              <p style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "#6b7280" }}>
                {avatarUploading ? "Uploading…" : avatarUrl ? "✓ Photo uploaded" : "Click to upload profile photo"}
              </p>
              {avatarError && <p style={{ fontSize: "0.78rem", color: "#dc2626", marginTop: "0.25rem" }}>{avatarError}</p>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem 1.5rem" }}>
              <div style={fld}>
                <label style={lbl}>First Name</label>
                <input id="firstName" type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
              </div>
              <div style={fld}>
                <label style={lbl}>Last Name</label>
                <input id="lastName" type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
              </div>
              <div style={fld}>
                <label style={lbl}>Phone Number</label>
                <input id="phone" type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
              </div>
              <div style={fld}>
                <label style={lbl}>WhatsApp Number</label>
                <input id="whatsapp" type="tel" placeholder="WhatsApp Number" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ ...fld, gridColumn: "1 / -1" }}>
                <label style={lbl}>Work Email</label>
                <input id="workEmail" type="email" placeholder="Work Email" value={workEmail} onChange={e => setWorkEmail(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
              </div>

              {/* Role */}
              <div style={{ ...fld, gridColumn: "1 / -1" }}>
                <label style={lbl}>Role</label>
                <div style={{ position: "relative" }}>
                  <select
                    id="roleSelect"
                    value={role}
                    onChange={e => { setRole(e.target.value); setWarehouseId(""); setTeamId(""); }}
                    style={{ ...inp, appearance: "none", paddingRight: "2.5rem", cursor: "pointer", color: role ? "#111" : "#9ca3af" }}
                    onFocus={focus} onBlur={blur}
                  >
                    <option value="" disabled>Select your role</option>
                    {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <svg style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Warehouse dropdown — WAREHOUSE_MANAGER only */}
              {role === "WAREHOUSE_MANAGER" && (
                <div style={{ ...fld, gridColumn: "1 / -1" }}>
                  <label style={lbl}>Warehouse to Manage</label>
                  {warehouses.length === 0 ? (
                    <p style={{ fontSize: "0.83rem", color: "#f59e0b", padding: "0.6rem 0" }}>⚠ No warehouses found. Please ask an admin to create one first.</p>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <select
                        id="warehouseSelect"
                        value={warehouseId}
                        onChange={e => setWarehouseId(e.target.value)}
                        style={{ ...inp, appearance: "none", paddingRight: "2.5rem", cursor: "pointer", color: warehouseId ? "#111" : "#9ca3af" }}
                        onFocus={focus} onBlur={blur}
                      >
                        <option value="" disabled>Select a warehouse</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}{w.referenceCode ? ` (${w.referenceCode})` : ""}</option>
                        ))}
                      </select>
                      <svg style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              )}

              {/* Team dropdown — SALES_REP only */}
              {role === "SALES_REP" && (
                <div style={{ ...fld, gridColumn: "1 / -1" }}>
                  <label style={lbl}>Sales Team</label>
                  {teams.length === 0 ? (
                    <p style={{ fontSize: "0.83rem", color: "#f59e0b", padding: "0.6rem 0" }}>⚠ No teams found. Please ask an admin to create a team first.</p>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <select
                        id="teamSelect"
                        value={teamId}
                        onChange={e => setTeamId(e.target.value)}
                        style={{ ...inp, appearance: "none", paddingRight: "2.5rem", cursor: "pointer", color: teamId ? "#111" : "#9ca3af" }}
                        onFocus={focus} onBlur={blur}
                      >
                        <option value="" disabled>Select your team</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name} — {t.department.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                      <svg style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              id="step1-continue"
              type="button"
              disabled={!canAdvance}
              onClick={() => canAdvance && setStep(2)}
              style={{ width: "100%", marginTop: "2rem", padding: "0.9rem", borderRadius: "0.5rem", border: "none", background: canAdvance ? "#8B2FE8" : "#d1d5db", color: "#fff", fontSize: "1rem", fontWeight: 600, cursor: canAdvance ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "background 0.2s" }}
            >
              Continue <ArrowRight size={18} />
            </button>
            <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.8rem", color: "#9ca3af" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#8B2FE8", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
            </p>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <form action={action}>
            {/* Hidden fields */}
            <input type="hidden" name="name" value={`${firstName} ${lastName}`} />
            <input type="hidden" name="email" value={workEmail} />
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="whatsapp" value={whatsapp} />
            <input type="hidden" name="avatarUrl" value={avatarUrl} />
            <input type="hidden" name="warehouseId" value={warehouseId} />
            <input type="hidden" name="teamId" value={teamId} />

            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginBottom: "0.35rem" }}>Account Security</h1>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "2rem" }}>Set a strong password for your account</p>

            {/* Avatar summary */}
            {avatarUrl && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", padding: "0.75rem 1rem", background: "#f3e8ff", borderRadius: "0.5rem" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt="Your avatar" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                <div>
                  <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#4b1e8a" }}>Profile photo uploaded ✓</p>
                  <button type="button" onClick={() => setStep(1)} style={{ background: "none", border: "none", padding: 0, fontSize: "0.75rem", color: "#8B2FE8", cursor: "pointer", textDecoration: "underline" }}>Change photo</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={fld}>
                <label style={lbl}>Password</label>
                <input id="password" name="password" type="password" autoComplete="new-password" required placeholder="Min. 8 chars with a letter & number" value={password} onChange={e => setPassword(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
              </div>
              <div style={fld}>
                <label style={lbl}>Confirm Password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: "0.9rem", borderRadius: "0.5rem", border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: "1rem", fontWeight: 600, cursor: "pointer" }}>
                Back
              </button>
              <button id="signup-submit" type="submit" disabled={isPending} style={{ flex: 2, padding: "0.9rem", borderRadius: "0.5rem", border: "none", background: isPending ? "#d1d5db" : "#8B2FE8", color: "#fff", fontSize: "1rem", fontWeight: 600, cursor: isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "background 0.2s" }}>
                {isPending ? (
                  <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Creating account…</>
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
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8B2FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>Request Submitted!</h2>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", maxWidth: 360, margin: "0 auto 1.5rem" }}>
              Your account is pending admin approval. You will be able to log in once an admin activates your account.
            </p>
            <Link href="/login" style={{ display: "inline-block", padding: "0.75rem 2rem", borderRadius: "0.5rem", background: "#8B2FE8", color: "#fff", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
