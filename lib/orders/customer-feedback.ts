/**
 * Customer / product feedback a rep records on an order — the "Customer /
 * Product Feedback" table of the CRM Sales Reporting Template.
 *
 * Categories and statuses are Strings validated against these lists (not
 * Prisma enums), so adding one needs no migration — the same convention as
 * lib/orders/order-feedback.ts. Plain TS — safe to import from client + server.
 */

export const CUSTOMER_FEEDBACK_CATEGORIES = [
  { value: "POSITIVE", label: "Positive" },
  { value: "NEGATIVE", label: "Negative" },
  { value: "PRODUCT_COMPLAINT", label: "Product Complaint" },
  { value: "DELIVERY_COMPLAINT", label: "Delivery Complaint" },
  { value: "OTHER", label: "Other" },
] as const;

export type CustomerFeedbackCategory = (typeof CUSTOMER_FEEDBACK_CATEGORIES)[number]["value"];

export const CUSTOMER_FEEDBACK_CATEGORY_VALUES = CUSTOMER_FEEDBACK_CATEGORIES.map((c) => c.value) as [
  CustomerFeedbackCategory,
  ...CustomerFeedbackCategory[],
];

export const CUSTOMER_FEEDBACK_STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "ACTIONED", label: "Actioned" },
  { value: "RESOLVED", label: "Resolved" },
] as const;

export type CustomerFeedbackStatus = (typeof CUSTOMER_FEEDBACK_STATUSES)[number]["value"];

export const CUSTOMER_FEEDBACK_STATUS_VALUES = CUSTOMER_FEEDBACK_STATUSES.map((s) => s.value) as [
  CustomerFeedbackStatus,
  ...CustomerFeedbackStatus[],
];

export const CUSTOMER_FEEDBACK_MESSAGE_MAX = 1000;
export const CUSTOMER_FEEDBACK_ACTION_MAX = 500;

export function customerFeedbackCategoryLabel(value: string): string {
  return CUSTOMER_FEEDBACK_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function customerFeedbackStatusLabel(value: string): string {
  return CUSTOMER_FEEDBACK_STATUSES.find((s) => s.value === value)?.label ?? value;
}
