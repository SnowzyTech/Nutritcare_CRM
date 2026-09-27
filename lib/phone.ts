/**
 * Normalises a Nigerian (or other) phone number to international format: digits
 * only, country code prefix, no leading +. Shared by WhatsApp and SMS sends.
 * e.g.  "08012345678"    →  "2348012345678"
 *       "+2348163810804" →  "2348163810804"
 */
export function toInternationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
}
