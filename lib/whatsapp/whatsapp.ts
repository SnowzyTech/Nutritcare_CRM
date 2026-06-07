/**
 * WhatsApp Cloud API (Meta) integration.
 *
 * Required environment variables (add to .env):
 *   WHATSAPP_PHONE_NUMBER_ID  — The numeric Phone Number ID from Meta Business
 *   WHATSAPP_API_TOKEN        — Permanent system-user access token
 */

/**
 * Normalises a Nigerian (or other) phone number to the international format
 * WhatsApp expects: digits only, country code prefix, no leading +.
 * e.g.  "08012345678"  →  "2348012345678"
 *       "+2348163810804" →  "2348163810804"
 */
function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
}

async function postWhatsAppMessage(
  phoneNumberId: string,
  token: string,
  body: object,
): Promise<{ success: boolean; error?: string }> {
  const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
  const bodyStr = JSON.stringify(body);

  console.log("[WhatsApp] POST", url);
  console.log("[WhatsApp] request body:", bodyStr);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: bodyStr,
    });

    console.log("[WhatsApp] HTTP status:", res.status, res.statusText);

    const payload = await res.json().catch(() => ({}));
    console.log("[WhatsApp] response body:", JSON.stringify(payload));

    if (!res.ok) {
      console.error("[WhatsApp] API error:", payload);
      return { success: false, error: JSON.stringify(payload) };
    }

    return { success: true };
  } catch (err) {
    console.error("[WhatsApp] send failed (network/exception):", err);
    return { success: false, error: String(err) };
  }
}

export interface OrderConfirmationTemplateOpts {
  to: string;
  customerName: string;
  orderNumber: string;
  deliveryAddress: string;
  deliveryDate: string;
  items: { name: string; quantity: number }[];
  productDetails: string;
  totalAmount: string;
}

/**
 * Sends the `nucle_order_confirmation` approved template message.
 * Template variables (in order):
 *   {{1}} customerName
 *   {{2}} orderNumber
 *   {{3}} deliveryAddress
 *   {{4}} deliveryDate
 *   {{5}} itemsList        (bullet lines joined by \n)
 *   {{6}} productDetails   (order notes / dosage instructions)
 *   {{7}} totalAmount
 *
 * Fails silently so a WhatsApp hiccup never breaks the confirmation flow.
 */
export async function sendOrderConfirmationTemplate(
  opts: OrderConfirmationTemplateOpts,
): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_API_TOKEN;

  console.log("[WhatsApp] sendOrderConfirmationTemplate called");
  console.log("[WhatsApp] WHATSAPP_PHONE_NUMBER_ID set:", !!phoneNumberId);
  console.log("[WhatsApp] WHATSAPP_API_TOKEN set:", !!token);

  if (!phoneNumberId || !token) {
    console.warn("[WhatsApp] env vars not set — skipping send.");
    return { success: false, error: "WhatsApp not configured" };
  }

  const recipient = formatPhoneForWhatsApp(opts.to);
  console.log("[WhatsApp] raw 'to':", opts.to);
  console.log("[WhatsApp] formatted recipient:", recipient);

  const itemsList = opts.items.map((i) => `${i.quantity} ${i.name}`).join("\n");

  return postWhatsAppMessage(phoneNumberId, token, {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: "nucle_order_confirmation",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: opts.customerName },
            { type: "text", text: opts.orderNumber },
            { type: "text", text: opts.deliveryAddress },
            { type: "text", text: opts.deliveryDate },
            { type: "text", text: itemsList },
            { type: "text", text: opts.productDetails },
            { type: "text", text: opts.totalAmount },
          ],
        },
      ],
    },
  });
}

export interface OrderDeliveredTemplateOpts {
  to: string;
  customerName: string;
  orderNumber: string;
}

/**
 * Sends the `nucle_order_delivered` approved template message when an order is marked delivered.
 * Template variables (in order):
 *   {{1}} customerName
 *   {{2}} orderNumber
 *
 * Fails silently so a WhatsApp hiccup never breaks the delivery flow.
 */
export async function sendOrderDeliveredTemplate(
  opts: OrderDeliveredTemplateOpts,
): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_API_TOKEN;

  console.log("[WhatsApp] sendOrderDeliveredTemplate called");
  console.log("[WhatsApp] WHATSAPP_PHONE_NUMBER_ID set:", !!phoneNumberId);
  console.log("[WhatsApp] WHATSAPP_API_TOKEN set:", !!token);

  if (!phoneNumberId || !token) {
    console.warn("[WhatsApp] env vars not set — skipping send.");
    return { success: false, error: "WhatsApp not configured" };
  }

  const recipient = formatPhoneForWhatsApp(opts.to);
  console.log("[WhatsApp] raw 'to':", opts.to);
  console.log("[WhatsApp] formatted recipient (delivered):", recipient);

  return postWhatsAppMessage(phoneNumberId, token, {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: "nucle_order_delivered",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: opts.customerName },
            { type: "text", text: opts.orderNumber },
          ],
        },
      ],
    },
  });
}

export interface DeliveryCodeTemplateOpts {
  to: string;
  deliveryCode: string;
}

/**
 * Sends the delivery verification code as a second message after order confirmation.
 * `nucle_delivery_code` is an Authentication-category template:
 *   body  {{1}} deliveryCode  →  "{{1}} is your verification code"
 *   copy-code button          →  same deliveryCode (required, else Meta returns #131008)
 *
 * Authentication templates expose the copy-code button as a URL-type button, so it
 * must receive its own parameter — the OTP value — in addition to the body parameter.
 *
 * Fails silently so a WhatsApp hiccup never breaks the confirmation flow.
 */
export async function sendDeliveryCodeTemplate(
  opts: DeliveryCodeTemplateOpts,
): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_API_TOKEN;

  console.log("[WhatsApp] sendDeliveryCodeTemplate called");
  console.log("[WhatsApp] WHATSAPP_PHONE_NUMBER_ID set:", !!phoneNumberId);
  console.log("[WhatsApp] WHATSAPP_API_TOKEN set:", !!token);

  if (!phoneNumberId || !token) {
    console.warn("[WhatsApp] env vars not set — skipping send.");
    return { success: false, error: "WhatsApp not configured" };
  }

  const recipient = formatPhoneForWhatsApp(opts.to);
  console.log("[WhatsApp] raw 'to':", opts.to);
  console.log("[WhatsApp] formatted recipient (delivery code):", recipient);

  return postWhatsAppMessage(phoneNumberId, token, {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: "nucle_delivery_code",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: opts.deliveryCode }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: opts.deliveryCode }],
        },
      ],
    },
  });
}
