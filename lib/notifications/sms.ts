/**
 * SMS sender — the fallback channel for `critical` notifications when a user has
 * no working push device. Server-only.
 *
 * Provider: Termii (Nigerian aggregator). Uses the `dnd` channel, the
 * transactional route that still reaches numbers on the NCC Do-Not-Disturb list;
 * the sender ID must be registered and approved on the Termii dashboard.
 *
 * Env (both required; missing → SMS disabled, every send is a no-op):
 *   TERMII_API_KEY
 *   TERMII_SENDER_ID
 * Optional: TERMII_BASE_URL (defaults to https://api.ng.termii.com)
 */
import { toInternationalPhone } from "@/lib/phone";

const API_KEY = process.env.TERMII_API_KEY ?? "";
const SENDER_ID = process.env.TERMII_SENDER_ID ?? "";
const BASE_URL = (process.env.TERMII_BASE_URL ?? "https://api.ng.termii.com").replace(/\/+$/, "");

const SEND_TIMEOUT_MS = 8000;

export function isSmsEnabled(): boolean {
  return Boolean(API_KEY && SENDER_ID);
}

export type SmsSendResult = { ok: true } | { ok: false; error: string };

export async function sendSms(phone: string, text: string): Promise<SmsSendResult> {
  if (!isSmsEnabled()) return { ok: false, error: "sms not configured" };

  const to = toInternationalPhone(phone);
  if (to.length < 10) return { ok: false, error: "invalid phone number" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/api/sms/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: API_KEY,
        to,
        from: SENDER_ID,
        sms: text.slice(0, 160),
        type: "plain",
        channel: "dnd",
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `${res.status}: ${body}`.slice(0, 500) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err).slice(0, 500) };
  } finally {
    clearTimeout(timer);
  }
}
