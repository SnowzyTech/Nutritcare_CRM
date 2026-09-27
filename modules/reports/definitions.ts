/**
 * Narrative section definitions for the executive reports.
 *
 * These are transcribed from the documents the managers write today (see
 * docs/reports/) so an exported report is recognisable to whoever currently
 * fills in the Word template. Section order and wording deliberately match the
 * originals.
 */

import type { NarrativeSectionDef } from "@/modules/reports/types";

const IMPACT_OPTIONS = ["Low", "Medium", "High"];
const YES_NO = ["Yes", "No"];

/** Shared "did anything unusual happen today" block on both daily reports. */
function criticalEventsSection(subject: string): NarrativeSectionDef {
  return {
    key: "events",
    heading: "Critical Events & Exceptions",
    fields: [
      {
        key: "event",
        question: `Did any significant event affect ${subject} performance today?`,
        kind: "text",
        placeholder:
          "e.g. stockout, system downtime, courier disruption, fuel scarcity, weather, staff shortage",
      },
      { key: "impact", question: "Impact on business", kind: "choice", options: IMPACT_OPTIONS },
      { key: "impactDetail", question: "What was the impact?", kind: "bullets" },
      { key: "actionTaken", question: "What action has been taken?", kind: "bullets" },
    ],
  };
}

const decisionSection: NarrativeSectionDef = {
  key: "decision",
  heading: "Decision Needed",
  fields: [
    {
      key: "decisionNeeded",
      question: "Do you need a decision or support from management?",
      kind: "choice",
      options: YES_NO,
    },
    { key: "decisionDetail", question: "If yes, what is required?", kind: "text" },
  ],
};

// Sales reports moved to modules/reports/sales/ (built on
// docs/CRM_Sales_Reporting_Template_.pdf — see docs/sales-reporting.md).

export const LOGISTICS_DAILY: NarrativeSectionDef[] = [
  criticalEventsSection("logistics"),
  {
    key: "failedInsight",
    heading: "Failed Delivery Insight",
    fields: [
      {
        key: "failedReasons",
        question:
          "Break down failed deliveries by reason (customer unreachable, wrong address, customer rejected, courier delay, product unavailable, other)",
        kind: "bullets",
      },
      { key: "failedComments", question: "Additional comments", kind: "text" },
    ],
  },
  decisionSection,
];

export const LOGISTICS_MONTHLY: NarrativeSectionDef[] = [
  {
    key: "summary",
    heading: "Executive Summary",
    fields: [
      {
        key: "summary",
        question: "Summarise the month's logistics performance.",
        kind: "text",
      },
    ],
  },
  {
    key: "issues",
    heading: "Issues & Recommendations",
    fields: [
      {
        key: "issues",
        question: "Issues this month — one per line, as: issue | impact | recommendation | owner & timeline",
        kind: "bullets",
        placeholder:
          "Delivery rate fell to 79.6% | Lost revenue and declining trust | Identify root cause by agent and state | Logistics, week 1",
      },
      {
        key: "carriedOver",
        question: "Which issues were raised in a previous month and remain unresolved?",
        kind: "bullets",
      },
    ],
  },
  {
    key: "conclusion",
    heading: "Conclusion",
    fields: [
      {
        key: "conclusion",
        question: "What must management decide on, and what went well?",
        kind: "text",
      },
    ],
  },
];
