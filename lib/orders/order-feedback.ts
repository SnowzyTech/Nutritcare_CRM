/**
 * Sales-rep call feedback on an order ("Not Picking", "Will Call Back", …).
 *
 * Feedback is a LABEL ONLY — it never changes `Order.status` (the "Cancelled"
 * option records what the customer said; the rep still uses the real Cancel
 * button). Each entry is an `OrderFeedback` row; the latest is denormalized onto
 * `Order.lastFeedback` / `lastFeedbackAt` so lists can show and filter by it.
 *
 * Stored as a String validated against this list (not a Prisma enum), so adding
 * an option needs no migration. Plain TS — safe to import from client + server.
 */

export const ORDER_FEEDBACK_OPTIONS = [
  { value: "NOT_PICKING", label: "Not Picking", tone: "amber" },
  { value: "NOT_REACHABLE", label: "Not Reachable", tone: "amber" },
  { value: "SWITCHED_OFF", label: "Switched Off", tone: "amber" },
  { value: "WILL_CALL_BACK", label: "Customer Will Call Back", tone: "blue" },
  { value: "WRONG_NUMBER", label: "Wrong Number", tone: "red" },
  { value: "UNDECIDED", label: "Customer Undecided", tone: "blue" },
  { value: "CANCELLED", label: "Cancelled", tone: "red" },
  { value: "OTHER", label: "Other", tone: "gray" },
] as const;

export type OrderFeedbackOutcome = (typeof ORDER_FEEDBACK_OPTIONS)[number]["value"];
export type OrderFeedbackTone = (typeof ORDER_FEEDBACK_OPTIONS)[number]["tone"];

/** Tuple of every outcome value, for `z.enum(...)`. */
export const ORDER_FEEDBACK_VALUES = ORDER_FEEDBACK_OPTIONS.map((o) => o.value) as [
  OrderFeedbackOutcome,
  ...OrderFeedbackOutcome[],
];

/** List-filter sentinel for "orders with no feedback recorded yet". */
export const NO_FEEDBACK_FILTER = "NONE";

/** Max length of the optional free-text note on a feedback entry. */
export const ORDER_FEEDBACK_NOTE_MAX = 500;

export function isOrderFeedbackOutcome(value: unknown): value is OrderFeedbackOutcome {
  return typeof value === "string" && ORDER_FEEDBACK_OPTIONS.some((o) => o.value === value);
}

/** Human label for a stored outcome; falls back to the raw value for unknown/legacy strings. */
export function feedbackLabel(value: string): string {
  return ORDER_FEEDBACK_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function feedbackTone(value: string): OrderFeedbackTone {
  return ORDER_FEEDBACK_OPTIONS.find((o) => o.value === value)?.tone ?? "gray";
}

/** Tailwind classes for a feedback pill, keyed by tone. */
export const FEEDBACK_TONE_CLASSES: Record<OrderFeedbackTone, string> = {
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-sky-100 text-sky-800",
  red: "bg-rose-100 text-rose-700",
  gray: "bg-gray-100 text-gray-700",
};
