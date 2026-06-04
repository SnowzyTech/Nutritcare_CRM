import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge.
 * Required by ShadCN components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Nigerian Naira currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date to a readable string.
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Generates a short, time-based order number: `ORD-<base36 timestamp><2 random>`.
 *
 * The base36-encoded millisecond timestamp keeps the id compact (~8 chars) and
 * roughly time-ordered, while two random base36 chars break ties between orders
 * created in the same millisecond. Far shorter than a raw epoch ms, and not
 * sequential. The `orderNumber` column is `@unique` as a final backstop.
 * e.g. `ORD-LT8X2K9ZQ4`
 */
export function generateOrderNumber(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 4).padEnd(2, "0");
  return `ORD-${(ts + rand).toUpperCase()}`;
}

/**
 * Returns initials from a full name.
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
