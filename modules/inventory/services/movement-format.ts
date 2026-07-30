// Display formatters and status labels shared by every stock-movement read
// path (inventory operator screens + data-analysis reporting screens). Kept in
// a plain module so both can import without duplicating the maps.

export function formatMovementDate(date: Date): string {
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatMovementTime(date: Date): string {
  return date
    .toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true })
    .toLowerCase();
}

export const INCOMING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  RECORDED: "Recorded",
  RECEIVED: "Received",
  NOT_RECEIVED: "Not Received",
  QC_CHECK: "QC Check",
  SHELVED: "Shelved",
  REVERSED: "Reversed",
};

export const OUTGOING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  RECORDED: "Recorded",
  NOT_RECEIVED: "Not Received",
  RECEIVED: "Received",
  SHELVED: "Shelved",
  REVERSED: "Reversed",
};

export const TRANSFER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  IN_TRANSIT: "In Transit",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REVERSED: "Reversed",
};

export const ADJUSTMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  RECORDED: "Recorded",
  REVERSED: "Reversed",
  REJECTED: "Rejected",
};

export const RAPS_STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
