"use client";

import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { X, Share, Plus, Download } from "lucide-react";

/**
 * Install banner for staff on phones.
 *
 * Two paths, because the platforms genuinely differ:
 *   • Chromium/Android fires `beforeinstallprompt`, which we stash and replay
 *     behind our own button.
 *   • iOS Safari has no such event and never will — installing is a manual
 *     Share → "Add to Home Screen". All we can do there is show the steps.
 *
 * Shown only on small viewports (this exists for the reps and delivery agents
 * working off phones) and never once the app is already running installed.
 *
 * Display-mode and viewport width are read through useSyncExternalStore rather
 * than an effect: they are external platform state, they can change while the
 * page is open, and the server snapshot keeps the banner out of the SSR output
 * so there is nothing to hydrate-mismatch.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SNOOZE_KEY = "nutricare:install-prompt-dismissed-at";
const SNOOZE_DAYS = 14;

function subscribeToMedia(query: string) {
  return (onChange: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  };
}

const subscribeStandalone = subscribeToMedia("(display-mode: standalone)");
const subscribePhone = subscribeToMedia("(max-width: 768px)");

function getIsStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag for home-screen launches.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function getIsPhone() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function isSnoozed(): boolean {
  try {
    const raw = window.localStorage.getItem(SNOOZE_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    // Private mode / storage disabled — treat as not snoozed.
    return false;
  }
}

function getIsIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  );
}

export function InstallPrompt() {
  // Server snapshots are chosen so the banner renders nothing during SSR.
  const isStandalone = useSyncExternalStore(subscribeStandalone, getIsStandalone, () => true);
  const isPhone = useSyncExternalStore(subscribePhone, getIsPhone, () => false);

  // Static for the lifetime of the page; the lazy initialiser keeps it off the
  // server, where `navigator` does not exist.
  const [isIOS] = useState(() => (typeof window === "undefined" ? false : getIsIOS()));
  const [snoozed, setSnoozed] = useState(() =>
    typeof window === "undefined" ? true : isSnoozed(),
  );

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeInstall = (e: Event) => {
      // Suppress Chrome's own mini-infobar so ours is the only prompt.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setSnoozed(true);
    try {
      window.localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    } catch {
      // Nothing to do — the banner just reappears next session.
    }
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // The event can only be used once, whatever the user chose.
    setDeferred(null);
  }, [deferred]);

  // iOS gets the instructions unprompted; everyone else waits for the browser
  // to tell us the app is actually installable.
  const hasSomethingToShow = isIOS || deferred !== null;
  if (installed || snoozed || isStandalone || !isPhone || !hasSomethingToShow) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            className="w-10 h-10 rounded-xl border border-gray-100 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-gray-900">Install Nutricare</p>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              {isIOS
                ? "Add it to your home screen to open it like an app — no typing the address each time."
                : "Keep it on your home screen and open it like any other app."}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {isIOS ? (
          <ol className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
            <li className="flex items-center gap-2 text-[11px] text-gray-600">
              <span className="w-4 h-4 rounded-full bg-[#F6E8FF] text-[#ad1df4] text-[9px] font-bold flex items-center justify-center shrink-0">
                1
              </span>
              Tap <Share className="w-3.5 h-3.5 text-[#ad1df4]" /> Share in the toolbar
            </li>
            <li className="flex items-center gap-2 text-[11px] text-gray-600">
              <span className="w-4 h-4 rounded-full bg-[#F6E8FF] text-[#ad1df4] text-[9px] font-bold flex items-center justify-center shrink-0">
                2
              </span>
              Choose <Plus className="w-3.5 h-3.5 text-[#ad1df4]" /> Add to Home Screen
            </li>
          </ol>
        ) : (
          <button
            onClick={install}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ad1df4] text-white text-[13px] font-semibold hover:bg-[#9615d6] transition-colors"
          >
            <Download className="w-4 h-4" />
            Install app
          </button>
        )}
      </div>
    </div>
  );
}
