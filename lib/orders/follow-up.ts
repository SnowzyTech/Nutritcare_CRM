/**
 * Post-delivery customer journey — the "Customer Journey" table of the CRM
 * Sales Reporting Template. Day N = N Lagos calendar days after the order was
 * delivered. Plain TS — safe to import from client + server.
 */

export const FOLLOW_UP_STAGES = [
  { value: "DAY1", day: 1, label: "Day 1", action: "Prescription / first follow-up" },
  { value: "DAY2", day: 2, label: "Day 2", action: "Thank-you / customer check-in" },
  { value: "DAY4", day: 4, label: "Day 4", action: "Feedback call" },
  { value: "DAY7", day: 7, label: "Day 7", action: "Upsell / cross-sell / reorder opportunity" },
] as const;

export type FollowUpStage = (typeof FOLLOW_UP_STAGES)[number]["value"];

export const FOLLOW_UP_STAGE_VALUES = FOLLOW_UP_STAGES.map((s) => s.value) as [
  FollowUpStage,
  ...FollowUpStage[],
];

export function isFollowUpStage(v: unknown): v is FollowUpStage {
  return typeof v === "string" && FOLLOW_UP_STAGES.some((s) => s.value === v);
}

export function followUpStage(value: FollowUpStage) {
  return FOLLOW_UP_STAGES.find((s) => s.value === value)!;
}

/** How far back the rep's follow-up page shows missed (overdue) follow-ups. */
export const FOLLOW_UP_OVERDUE_WINDOW_DAYS = 7;
