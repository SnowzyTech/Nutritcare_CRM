"use client";

import { useActionState } from "react";
import {
  adminLoginAction,
  type AdminLoginActionState,
} from "@/modules/auth/actions/admin-login.action";
import { Loader2, ShieldCheck } from "lucide-react";

const initialState: AdminLoginActionState = {};

export default function AdminLoginPage() {
  const [state, action, isPending] = useActionState(
    adminLoginAction,
    initialState
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 55% 45%, #ede9fe 0%, #f5f3ff 40%, #faf5ff 100%)",
        }}
      >
        {/* Nuycle logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/nuycle-logo.png"
          alt="Nuycle logo"
          width={150}
          style={{ marginBottom: "2.5rem", objectFit: "contain" }}
        />

        {/* Shield illustration */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7C3AED 0%, #4C0099 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 60px rgba(124,58,237,0.35)",
            }}
          >
            <ShieldCheck size={56} color="#fff" strokeWidth={1.5} />
          </div>
          <p
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "#4C0099",
              letterSpacing: "-0.01em",
            }}
          >
            Administrator Portal
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#7c6b9e",
              textAlign: "center",
              maxWidth: 240,
              lineHeight: 1.6,
            }}
          >
            Restricted access — authorised administrators only.
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div
        className="flex flex-col justify-center flex-1 lg:max-w-[520px] px-10 py-16"
        style={{
          background:
            "linear-gradient(160deg, #4C0099 0%, #2D0060 60%, #1A0040 100%)",
        }}
      >
        {/* Mobile logo */}
        <div
          className="lg:hidden"
          style={{ marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nuycle-logo.png" alt="Nuycle logo" height={36} style={{ filter: "brightness(0) invert(1)" }} />
        </div>

        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "999px",
            padding: "0.3rem 0.9rem",
            marginBottom: "1.5rem",
            width: "fit-content",
          }}
        >
          <ShieldCheck size={14} color="#c4b5fd" />
          <span style={{ fontSize: "0.78rem", color: "#c4b5fd", fontWeight: 600, letterSpacing: "0.04em" }}>
            ADMIN ACCESS ONLY
          </span>
        </div>

        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#fff",
            marginBottom: "2rem",
            lineHeight: 1.1,
          }}
        >
          Admin Sign In
        </h1>

        {/* Error */}
        {state?.error && (
          <div
            style={{
              marginBottom: "1.25rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "#fca5a5",
              fontSize: "0.875rem",
            }}
          >
            {state.error}
          </div>
        )}

        <form
          action={action}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* E-mail */}
          <div>
            <label
              htmlFor="admin-email"
              style={{
                display: "block",
                fontSize: "0.875rem",
                color: "#e9d5ff",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              E-mail
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@nutricare.com"
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#fff",
                color: "#1a1a2e",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="admin-password"
              style={{
                display: "block",
                fontSize: "0.875rem",
                color: "#e9d5ff",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter Password"
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#fff",
                color: "#1a1a2e",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>

          {/* Sign In Button */}
          <button
            id="admin-login-submit"
            type="submit"
            disabled={isPending}
            style={{
              marginTop: "0.5rem",
              width: "100%",
              padding: "0.9rem",
              borderRadius: "0.5rem",
              border: "none",
              background: isPending ? "rgba(139,92,246,0.5)" : "#8B2FE8",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 700,
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
                <Loader2
                  style={{
                    width: 18,
                    height: 18,
                    animation: "spin 1s linear infinite",
                  }}
                />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            marginTop: "2rem",
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.35)",
            textAlign: "center",
          }}
        >
          Not an admin?{" "}
          <a
            href="/login"
            style={{ color: "#c4b5fd", textDecoration: "none", fontWeight: 500 }}
          >
            Go to staff login →
          </a>
        </p>
      </div>
    </div>
  );
}
