/**
 * Resolves the timestamp to store as an order's delivery date from an optional
 * calendar date picked in a "mark delivered" override (data analyst / admin /
 * sales manager). The picked value is `yyyy-mm-dd`; omitted → now.
 *
 * Validated by CALENDAR DAY: not in the future, and not before the order was
 * confirmed (its earliest delivery row's `createdAt`). When the picked day is
 * today we keep the exact current time; a backdated day sits at noon so it's
 * safely inside that day for range filters and never before same-day confirmation.
 *
 * Shared by every override so the rule (and the date that flows to both
 * `Delivery.deliveredTime` and the agent ledger) never diverges between modules.
 */
export function resolveDeliveredDate(
  deliveredDate: string | undefined,
  confirmedAt: Date,
  now: Date = new Date(),
): { deliveredAt: Date } | { error: string } {
  if (!deliveredDate) return { deliveredAt: now };

  const parsed = new Date(`${deliveredDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return { error: "Invalid delivery date." };

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const pickedDay = new Date(parsed);
  pickedDay.setHours(0, 0, 0, 0);

  if (pickedDay.getTime() > startOfToday.getTime()) {
    return { error: "Delivery date can't be in the future." };
  }
  const confirmDay = new Date(confirmedAt);
  confirmDay.setHours(0, 0, 0, 0);
  if (pickedDay.getTime() < confirmDay.getTime()) {
    return { error: "Delivery date can't be before the order was confirmed." };
  }

  return { deliveredAt: pickedDay.getTime() === startOfToday.getTime() ? now : parsed };
}
