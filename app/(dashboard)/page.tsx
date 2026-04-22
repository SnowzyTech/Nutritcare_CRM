import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

/* ── Shared card shell ── */
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "1.25rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Period badge ── */
function PeriodBadge({ label = "This Month" }: { label?: string }) {
  return (
    <span
      style={{
        fontSize: "0.72rem",
        background: "#f3f4f6",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        padding: "2px 8px",
        color: "#6b7280",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      {label} ▾
    </span>
  );
}

/* ── Delta badge ── */
function Delta({ value }: { value: string }) {
  const positive = value.startsWith("+");
  return (
    <span
      style={{
        fontSize: "0.78rem",
        fontWeight: 600,
        color: positive ? "#10b981" : "#ef4444",
      }}
    >
      {value}
    </span>
  );
}

/* ── Tiny SVG sparkline ── */
function Sparkline({ color = "#8B2FE8" }: { color?: string }) {
  const points =
    "0,40 15,30 30,38 45,20 60,30 75,15 90,25 105,10 120,20 135,12";
  return (
    <svg width="100%" height="60" viewBox="0 0 140 50" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
      <polygon
        fill={`url(#grad-${color.replace("#", "")})`}
        points={`0,50 ${points} 140,50`}
      />
    </svg>
  );
}

/* ── Mini bar chart ── */
function BarChart() {
  const bars = [35, 55, 40, 65, 50, 70, 45, 80, 60, 75];
  return (
    <svg width="100%" height="80" viewBox="0 0 120 80" preserveAspectRatio="none">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 12 + 2}
          y={80 - h}
          width={9}
          height={h}
          rx={3}
          fill={i === bars.length - 2 ? "#8B2FE8" : "#bfdbfe"}
        />
      ))}
    </svg>
  );
}

/* ── Stat tile (for Sales/Inventory sections) ── */
function StatTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: "1rem",
        border: "1px solid #f0f0f3",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 500 }}>
          {label}
        </span>
        <PeriodBadge />
      </div>
      <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "#111", margin: 0 }}>
        {value}
      </p>
      <p style={{ fontSize: "0.78rem", margin: "4px 0 0" }}>
        <Delta value={delta} />{" "}
        <span style={{ color: "#9ca3af" }}>vs last month</span>
      </p>
    </div>
  );
}

/* ── Product overview tile ── */
function ProductTile({
  label,
  value,
  badge,
  badgeColor,
  bg,
}: {
  label: string;
  value: string;
  badge?: string;
  badgeColor?: string;
  bg?: string;
}) {
  return (
    <div
      style={{
        background: bg ?? "#fff",
        borderRadius: 10,
        padding: "0.85rem 1rem",
        border: "1px solid #f0f0f3",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.4rem",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            color: bg ? "rgba(255,255,255,0.8)" : "#6b7280",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <PeriodBadge />
      </div>
      <p
        style={{
          fontSize: "1.3rem",
          fontWeight: 700,
          color: bg ? "#fff" : "#111",
          margin: "0 0 0.25rem",
        }}
      >
        {value}
      </p>
      {badge && (
        <span
          style={{
            fontSize: "0.7rem",
            background: badgeColor ?? "#ede9fe",
            color: "#fff",
            padding: "2px 8px",
            borderRadius: 999,
            fontWeight: 600,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── 1. Account stats ─────────────────────────────────────────── */}
      <Card>
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "1rem",
          }}
        >
          Account
        </p>

        {/* Stat cards row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          {[
            { label: "Total Revenue", value: "₦60,000,000" },
            { label: "Net Profit", value: "₦52,000,000" },
            { label: "Total Expenses", value: "₦8,000,000" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}>
                  {s.label}
                </span>
                <PeriodBadge />
              </div>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111", margin: 0 }}>
                {s.value}
              </p>
              <p style={{ fontSize: "0.78rem", margin: "4px 0 0" }}>
                <Delta value="+12%" />{" "}
                <span style={{ color: "#9ca3af" }}>vs last month</span>
              </p>
            </div>
          ))}
        </div>

        {/* Sparklines row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {[{ color: "#8B2FE8" }, { color: "#3b82f6" }].map((c, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "0.75rem 1rem 0",
                overflow: "hidden",
              }}
            >
              <p
                style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0 0 0.25rem" }}
              >
                ₦60.7M
              </p>
              <Sparkline color={c.color} />
            </div>
          ))}
        </div>
      </Card>

      {/* ── 2. Product Overview + Growth Chart ───────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1.25rem" }}>

        {/* Product Overview */}
        <Card>
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "1rem",
            }}
          >
            Product Overview
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <ProductTile label="Total Products Sold" value="12,600" badge="+21% vs last month" badgeColor="#10b981" />
            <ProductTile label="Total Order/Customer" value="6000" badge="+12% vs last month" badgeColor="#10b981" />
            <ProductTile label="Best Selling Product" value="Prosxact" badge="Neuro-Vive Balm" badgeColor="#7C3AED" />
            <ProductTile
              label="Least Selling Product"
              value="Fonioi-Mill"
              badge="Neuro-Vive Balm"
              badgeColor="#ec4899"
              bg="linear-gradient(135deg,#fce7f3,#fbcfe8)"
            />
            <ProductTile
              label="Most Damaged Product"
              value="Prosxact"
              badge="Neuro-Vive Balm"
              badgeColor="#f97316"
              bg="linear-gradient(135deg,#fff7ed,#fed7aa)"
            />
            <ProductTile
              label="Remaining Stock"
              value="15,200"
              badge="Neuro-Vive Balm"
              badgeColor="#10b981"
              bg="linear-gradient(135deg,#ecfdf5,#a7f3d0)"
            />
          </div>
        </Card>

        {/* Growth Chart */}
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <p
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: 0,
              }}
            >
              Growth Chart
            </p>
            <PeriodBadge />
          </div>
          <p style={{ fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
            Sales
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#111", margin: 0 }}>
            540
          </p>
          <BarChart />
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "0.5rem",
              fontSize: "0.72rem",
              color: "#9ca3af",
            }}
          >
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su", "Mo", "Tu", "We"].map((d) => (
              <span key={d} style={{ flex: 1, textAlign: "center" }}>
                {d}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* ── 3. Sales Overview + Inventory Insight ────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* Sales Overview */}
        <Card>
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "1rem",
            }}
          >
            Sales Overview
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <StatTile label="Average Orders/Day" value="80%" delta="+12%" />
            <StatTile label="Failed Order Rate" value="80%" delta="+12%" />
            <StatTile label="Confirmation Rate" value="76%" delta="+12%" />
            <StatTile label="Delivery Rate" value="60%" delta="+12%" />
          </div>
        </Card>

        {/* Inventory Insight */}
        <Card>
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "1rem",
            }}
          >
            Inventory Insight
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <StatTile label="Average Orders/Day" value="80%" delta="+12%" />
            <StatTile label="Failed Order Rate" value="80%" delta="+12%" />
            <StatTile label="Confirmation Rate" value="76%" delta="+12%" />
            <StatTile label="Delivery Rate" value="60%" delta="+12%" />
          </div>
        </Card>
      </div>

    </div>
  );
}
