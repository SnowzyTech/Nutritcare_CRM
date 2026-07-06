"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginActionState } from "@/modules/auth/actions/login.action";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const initialState: LoginActionState = {};

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Full-screen video background ─────────────────────────────── */}
      <video
        src="/banner-video.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />

      {/* ── Sign-in card ────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex min-h-screen items-center justify-center px-6 lg:justify-end lg:px-16"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "470px",
            background: "#ffffff",
            borderRadius: "1.25rem",
            padding: "2.5rem 2.25rem",
            boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nucle-logo.png"
              alt="Nucle logo"
              style={{ height: "30px", width: "auto", objectFit: "contain" }}
            />
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#1f2937",
                lineHeight: 1.1,
              }}
            >
              Sign In
            </h1>
          </div>

          {/* Error */}
          {state?.error && (
            <div
              style={{
                marginBottom: "1.25rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#dc2626",
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
                style={{ display: "block", fontSize: "0.875rem", color: "#374151", marginBottom: "0.5rem", fontWeight: 600 }}
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
                  borderRadius: "0.65rem",
                  border: "1px solid #e5e7eb",
                  background: "#f3f4f6",
                  color: "#1f2937",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: "0.875rem", color: "#374151", marginBottom: "0.5rem", fontWeight: 600 }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter Password"
                  style={{
                    width: "100%",
                    padding: "0.85rem 2.5rem 0.85rem 1rem",
                    borderRadius: "0.65rem",
                    border: "1px solid #e5e7eb",
                    background: "#f3f4f6",
                    color: "#1f2937",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.25rem",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Feedback / Forgot password row */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "-0.5rem" }}>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "0.8rem", padding: 0 }}
              >
                Feedback
              </button>
              <Link
                href="/forgot-password"
                style={{ color: "#8B2FE8", fontSize: "0.8rem", textDecoration: "none", fontWeight: 500 }}
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
                borderRadius: "0.65rem",
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
                marginTop: "0.75rem",
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
                  borderRadius: "0.65rem",
                  border: "none",
                  background: "#F0E6FF",
                  color: "#8B2FE8",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#E4D3FF";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#F0E6FF";
                }}
              >
                Sign Up
              </button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
