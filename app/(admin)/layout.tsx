import { auth } from "@/lib/auth/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationRoot } from "@/components/notifications/notification-root";
import { NotificationBell } from "@/components/notifications/notification-bell";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Nutricare CRM",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const name = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <NotificationRoot>
      <div
        className="admin-shell"
        style={{
          display: "flex",
          height: "100vh",
          background: "#f0f0f3",
          fontFamily: "'Inter', system-ui, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <div className="print:hidden">
          <Sidebar />
        </div>

        {/* Main area */}
        <div
          className="admin-col"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Top bar */}
          <header
            className="print:hidden"
            style={{
              height: 64,
              background: "#f0f0f3",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 1.75rem",
              borderBottom: "1px solid #e5e7eb",
              flexShrink: 0,
            }}
          >
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#1a1a2e",
                margin: 0,
              }}
            >
              Welcome Back {name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <NotificationBell
                className="w-[42px] h-[42px] rounded-full bg-white text-[#8B2FE8] border border-gray-200 hover:bg-purple-50 hover:text-[#8B2FE8]"
              />
              {/* Chat icon */}
              <Link
                href="/chat"
                aria-label="Messages"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "#8B2FE8",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "1.1rem",
                }}
              >
                💬
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main
            className="admin-main"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1.5rem 1.75rem",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </NotificationRoot>
  );
}
