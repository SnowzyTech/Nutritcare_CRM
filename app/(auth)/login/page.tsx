"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/modules/auth/actions/login.action";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const initialState: LoginActionState = {};

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Left Panel ─────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden"
        style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 55% 45%, #ede9fe 0%, #f5f3ff 40%, #faf5ff 100%)" }}
      >
        {/* Nuycle logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/nuycle-logo.png"
          alt="Nuycle logo"
          width={150}
          style={{ marginBottom: "2.5rem", objectFit: "contain" }}
        />

        {/* Product image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/products.png"
          alt="Nutricare health products"
          width={420}
          style={{ objectFit: "contain", maxWidth: "90%" }}
        />
      </div>

      {/* ── Right Panel ────────────────────────────────────────────── */}
      <div
        className="flex flex-col justify-center flex-1 lg:max-w-[520px] px-10 py-16"
        style={{
          background: "linear-gradient(160deg, #4C0099 0%, #2D0060 60%, #1A0040 100%)",
        }}
      >
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>Nutricare CRM</span>
        </div>

        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#fff", marginBottom: "2rem", lineHeight: 1.1 }}>
          Sign In
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

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* E-mail */}
          <div>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: "0.875rem", color: "#e9d5ff", marginBottom: "0.5rem", fontWeight: 500 }}
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="E-mail"
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
              htmlFor="password"
              style={{ display: "block", fontSize: "0.875rem", color: "#e9d5ff", marginBottom: "0.5rem", fontWeight: 500 }}
            >
              Password
            </label>
            <input
              id="password"
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

          {/* Feedback / Forgot password row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "-0.5rem" }}>
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#c4b5fd", fontSize: "0.8rem", padding: 0 }}
            >
              Feedback
            </button>
            <Link
              href="/forgot-password"
              style={{ color: "#c4b5fd", fontSize: "0.8rem", textDecoration: "none" }}
            >
              Forgot Password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button
            id="login-submit"
            type="submit"
            disabled={isPending}
            style={{
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
              marginTop: "0.25rem",
            }}
          >
            {isPending ? (
              <>
                <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Sign Up Button */}
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <button
              type="button"
              style={{
                width: "100%",
                padding: "0.9rem",
                borderRadius: "0.5rem",
                border: "2px solid rgba(255,255,255,0.25)",
                background: "transparent",
                color: "#fff",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              Sign Up
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
}
