"use client";

/**
 * Browser side of Web Push: capability checks, subscribe/unsubscribe, and the
 * logout cleanup that keeps a shared phone from receiving the previous user's
 * alerts. Server side lives in lib/notifications/web-push.ts.
 */
import {
  removePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/modules/notifications/actions/notifications.action";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushSupport =
  /** Push can be offered. */
  | "supported"
  /** iOS Safari tab: push exists only once installed to the home screen (16.4+). */
  | "ios-needs-install"
  /** Browser has no push, the service worker isn't running (dev), or no VAPID key. */
  | "unsupported";

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function getPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  if (isIOS() && !isStandalone()) return "ios-needs-install";
  if (!VAPID_PUBLIC_KEY) return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  return "supported";
}

/**
 * The registered worker, or null. Never waits on `serviceWorker.ready`, which
 * hangs forever when no worker is registered (e.g. in `next dev`).
 */
async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    return reg?.active ? reg : null;
  } catch {
    return null;
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  const reg = await getRegistration();
  if (!reg) return null;
  try {
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type EnablePushResult =
  | { ok: true }
  | { ok: false; reason: "denied" | "unsupported" | "no-worker" | "failed" };

/** Must be called from a user gesture (iOS refuses otherwise). */
export async function enablePush(): Promise<EnablePushResult> {
  if (getPushSupport() !== "supported") return { ok: false, reason: "unsupported" };

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return { ok: false, reason: "denied" };

  const reg = await getRegistration();
  if (!reg) return { ok: false, reason: "no-worker" };

  try {
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));
    const saved = await savePushSubscriptionAction(sub.toJSON());
    return saved.ok ? { ok: true } : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/**
 * Re-claims this device for the signed-in user on every load (shared phones:
 * the device follows whoever is signed in). Silent — never prompts.
 */
export async function syncPushSubscription(): Promise<void> {
  if (getPushSupport() !== "supported" || Notification.permission !== "granted") return;
  const sub = await getCurrentPushSubscription();
  if (sub) await savePushSubscriptionAction(sub.toJSON());
}

/** Stops this device receiving pushes for the current user. Never throws. */
export async function disablePush(): Promise<void> {
  try {
    const sub = await getCurrentPushSubscription();
    if (!sub) return;
    await removePushSubscriptionAction(sub.endpoint).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  } catch {
    // best-effort
  }
}
