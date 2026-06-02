import type { Metadata } from "next";
import Link from "next/link";
import { getPendingAdjustments } from "@/modules/inventory/services/inventory.service";
import { ClipboardCheck } from "lucide-react";

export const metadata: Metadata = { title: "Inventory Approvals" };

export default async function AdminInventoryPage() {
  const pending = await getPendingAdjustments();

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111", margin: 0 }}>
          Stock Adjustment Approvals
        </h2>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: 4 }}>
          Review and approve stock adjustments submitted by Inventory Managers.
        </p>
      </div>

      {pending.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "2rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
            gap: 12,
          }}
        >
          <ClipboardCheck style={{ width: 48, height: 48, color: "#d1d5db" }} strokeWidth={1} />
          <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>
            No pending stock adjustments — all clear.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#3D0066" }}>
                {["Reference", "Date", "Warehouse", "Submitted By", "Products", "Items", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#fff",
                        padding: "12px 16px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {pending.map((row, i) => (
                <tr
                  key={row.id}
                  style={{
                    borderTop: i > 0 ? "1px solid #f3f4f6" : undefined,
                    backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    {row.referenceNumber}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{row.date}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{row.warehouse}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{row.submittedBy}</td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 12,
                      color: "#6b7280",
                      maxWidth: 260,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={row.products}
                  >
                    {row.products}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{row.itemCount}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Link
                      href={`/admin/inventory/adjustment/${row.id}`}
                      style={{
                        display: "inline-block",
                        padding: "6px 16px",
                        borderRadius: 6,
                        backgroundColor: "#3D0066",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
