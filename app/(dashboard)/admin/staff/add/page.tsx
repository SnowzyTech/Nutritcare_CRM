import type { Metadata } from "next";
export const metadata: Metadata = { title: "Add Staff" };

export default function AddStaffPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111", margin: 0 }}>Add Staff</h2>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: 4 }}>Onboard a new team member.</p>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: "2rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "#9ca3af", fontSize: "0.9rem" }}>
        Staff onboarding form coming soon.
      </div>
    </div>
  );
}
