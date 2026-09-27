/**
 * Duplicate-order badge for order rows and detail headers.
 *
 * Two states, driven by the flags set in
 * modules/orders/services/duplicate-order.service.ts:
 *   - a DISABLED duplicate (`disabled` true) → red "Duplicate — disabled" pill;
 *     this copy cannot be confirmed until a data team-lead re-enables it.
 *   - the KEPT original (`hasDuplicates` true) → amber "Has duplicate" pill; a
 *     non-blocking heads-up so a rep knows a twin exists before confirming.
 *
 * Shared by the sales-rep list and the oversight order lists (data,
 * sales-manager, sales-rep team-lead, admin) and their detail views.
 */
export function DuplicateBadge({
  duplicateDisabled,
  hasDuplicates,
  className = "",
}: {
  duplicateDisabled?: boolean | null;
  hasDuplicates?: boolean | null;
  className?: string;
}) {
  if (duplicateDisabled) {
    return (
      <span
        title="Disabled: an identical, still-open order already exists. A data team-lead can re-enable it."
        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-[#F8D7DA] text-[#842029] ${className}`}
      >
        Duplicate — disabled
      </span>
    );
  }
  if (hasDuplicates) {
    return (
      <span
        title="A duplicate copy of this order exists in the system."
        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-[#FFF3CD] text-[#856404] ${className}`}
      >
        Has duplicate
      </span>
    );
  }
  return null;
}
