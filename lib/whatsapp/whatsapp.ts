/**
 * WhatsApp Cloud API (Meta) integration.
 *
 * Required environment variables (add to .env):
 *   WHATSAPP_PHONE_NUMBER_ID  — The numeric Phone Number ID from Meta Business
 *   WHATSAPP_API_TOKEN        — Permanent system-user access token
 */

interface SendTextOptions {
  to: string;
  message: string;
}

/**
 * Normalises a Nigerian (or other) phone number to the international format
 * WhatsApp expects: digits only, country code prefix, no leading +.
 * e.g.  "08012345678"  →  "2348012345678"
 *       "+2348012345678" →  "2348012345678"
 */
function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Strip leading + that got through
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
}

/**
 * Sends a plain-text WhatsApp message via the Cloud API.
 * Fails silently (logs & returns { success: false }) so a WhatsApp hiccup
 * never breaks the order confirmation flow.
 */
export async function sendWhatsAppTextMessage({
  to,
  message,
}: SendTextOptions): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_API_TOKEN;

  if (!phoneNumberId || !token) {
    console.warn(
      "[WhatsApp] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_API_TOKEN not set — skipping send.",
    );
    return { success: false, error: "WhatsApp not configured" };
  }

  const recipient = formatPhoneForWhatsApp(to);

  try {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "text",
          text: { body: message },
        }),
      },
    );

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      console.error("[WhatsApp] API error:", payload);
      return { success: false, error: JSON.stringify(payload) };
    }

    return { success: true };
  } catch (err) {
    console.error("[WhatsApp] Send failed:", err);
    return { success: false, error: String(err) };
  }
}

// ── Message builders ──────────────────────────────────────────────────────────

export function buildOrderConfirmationMessage(opts: {
  customerName: string;
  orderNumber: string;
  deliveryAddress: string;
  deliveryDate: string;
  items: { name: string; quantity: number }[];
  totalAmount: string;
  deliveryCode: string;
}): string {
  const itemsList = opts.items.map((i) => `• ${i.name} x${i.quantity}`).join("\n");

  return (
    `Hello ${opts.customerName}! 🎉\n\n` +
    `Your Nutritcare order has been *confirmed* and is on its way!\n\n` +
    `📦 *Order:* ${opts.orderNumber}\n` +
    `📍 *Delivery to:* ${opts.deliveryAddress}\n` +
    `📅 *Expected Delivery:* ${opts.deliveryDate}\n\n` +
    `*Items Ordered:*\n${itemsList}\n\n` +
    `💰 *Total:* ${opts.totalAmount}\n\n` +
    `🔑 *Your Delivery Code:* *${opts.deliveryCode}*\n\n` +
    `_Please share this code with the delivery agent when they arrive to confirm receipt of your order._\n\n` +
    `Thank you for choosing Nutritcare! 💚`
  );
}
