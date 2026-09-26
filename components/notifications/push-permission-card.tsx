"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, BellOff, Plus, Share, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import {
  enablePush,
  getCurrentPushSubscription,
  getPushSupport,
} from "@/lib/notifications/push-client";
import { sendTestNotificationAction } from "@/modules/notifications/actions/notifications.action";
import { useNotifications } from "./notification-provider";

type State =
  | "loading"
  | "unsupported"
  | "ios-needs-install"
  | "prompt"
  | "denied"
  | "enabled";

async function detectState(): Promise<State> {
  const support = getPushSupport();
  if (support !== "supported") return support;
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted" && (await getCurrentPushSubscription())) {
    return "enabled";
  }
  return "prompt";
}

const SNOOZE_KEY = "nutricare:push-prompt-snoozed-at";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

function isSnoozed(): boolean {
  try {
    const at = Number(window.localStorage.getItem(SNOOZE_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

/**
 * "Turn on order alerts" — asks for notification permission (only ever from a
 * tap: iOS refuses otherwise), explains the iOS install requirement, and lets
 * the user test the channel and toggle the in-app chime.
 *
 * `variant="nudge"` is for work screens (orders lists): it renders only while
 * alerts are NOT on, and can be snoozed for a few days. `"full"` (default) is
 * for settings / the notifications page and always shows the current state.
 */
export function PushPermissionCard({
  className = "",
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "nudge";
}) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [snoozed, setSnoozed] = useState(true);
  const { soundEnabled, setSoundEnabled } = useNotifications();

  useEffect(() => {
    let cancelled = false;
    void detectState().then((s) => {
      if (cancelled) return;
      setState(s);
      setSnoozed(isSnoozed());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const snooze = useCallback(() => {
    setSnoozed(true);
    try {
      window.localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    } catch {
      // reappears next visit
    }
  }, []);

  const turnOn = useCallback(async () => {
    setBusy(true);
    const res = await enablePush();
    setBusy(false);
    if (res.ok) {
      setState("enabled");
      toast.success("Alerts are on. You'll be notified even when the app is closed.");
      return;
    }
    if (res.reason === "denied") setState("denied");
    else toast.error("Couldn't turn on alerts on this device. Please try again.");
  }, []);

  const sendTest = useCallback(async () => {
    setBusy(true);
    const res = await sendTestNotificationAction();
    setBusy(false);
    if (res.ok) toast("Test sent — it should arrive in a few seconds.");
  }, []);

  if (state === "loading" || state === "unsupported") return null;
  if (variant === "nudge" && (state === "enabled" || snoozed)) return null;

  const soundToggle = (
    <button
      type="button"
      onClick={() => setSoundEnabled(!soundEnabled)}
      className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-700"
    >
      {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      Sound {soundEnabled ? "on" : "off"}
    </button>
  );

  if (state === "enabled") {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <BellRing className="w-4 h-4" />
          Phone alerts are on
        </div>
        <div className="flex items-center gap-4">
          {soundToggle}
          <button
            type="button"
            onClick={sendTest}
            disabled={busy}
            className="text-[11px] font-bold text-[#ad1df4] disabled:text-gray-300"
          >
            Send test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-[#eddcfb] bg-[#faf5ff] p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-[#ad1df4]/10 text-[#ad1df4] flex items-center justify-center">
          {state === "denied" ? <BellOff className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">
            {state === "denied" ? "Alerts are blocked on this device" : "Get alerted when an order arrives"}
          </p>

          {state === "prompt" && (
            <>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Turn on alerts so new orders and delivery changes reach your phone even when the app is closed.
              </p>
              <button
                type="button"
                onClick={turnOn}
                disabled={busy}
                className="mt-3 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#ad1df4] text-white text-xs font-semibold hover:bg-[#9615d6] disabled:opacity-60 transition-colors"
              >
                {busy ? "Turning on…" : "Turn on alerts"}
              </button>
            </>
          )}

          {state === "denied" && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Tap the lock icon next to the address bar (or open your phone&apos;s Settings → Apps → your browser →
              Notifications), allow notifications for this site, then reload the page.
            </p>
          )}

          {state === "ios-needs-install" && (
            <>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                On iPhone, alerts only work once the app is on your home screen:
              </p>
              <ol className="mt-2 space-y-1.5">
                <li className="flex items-center gap-2 text-[11px] text-gray-600">
                  <span className="font-bold text-[#ad1df4]">1.</span> Tap
                  <Share className="w-3.5 h-3.5 text-[#ad1df4]" /> Share in Safari
                </li>
                <li className="flex items-center gap-2 text-[11px] text-gray-600">
                  <span className="font-bold text-[#ad1df4]">2.</span> Choose
                  <Plus className="w-3.5 h-3.5 text-[#ad1df4]" /> Add to Home Screen
                </li>
                <li className="flex items-center gap-2 text-[11px] text-gray-600">
                  <span className="font-bold text-[#ad1df4]">3.</span> Open the app from the home screen and turn
                  on alerts here
                </li>
              </ol>
            </>
          )}

          <div className="mt-3 flex items-center gap-4">
            {soundToggle}
            {variant === "nudge" && (
              <button
                type="button"
                onClick={snooze}
                className="text-[11px] font-semibold text-gray-400 hover:text-gray-600"
              >
                Not now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
