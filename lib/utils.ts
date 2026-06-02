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
 * Generates a short, human-friendly order number.
 *
 * Produces a 5-character uppercase alphanumeric code (base36) derived from the
 * current timestamp plus a random component, so collisions are vanishingly
 * unlikely while keeping the id short. The `orderNumber` column is `@unique`,
 * which acts as the final backstop against duplicates.
 */
export function generateOrderNumber(): string {
  const entropy = Date.now().toString(36) + Math.random().toString(36).slice(2);
  return entropy.slice(-5).toUpperCase();
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
