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

export const SALES_DAILY: NarrativeSectionDef[] = [
  {
    key: "objections",
    heading: "Top Customer Objections",
    fields: [
      {
        key: "objections",
        question: "What were the top customer objections today?",
        kind: "bullets",
        placeholder: "One objection per line",
      },
    ],
  },
  criticalEventsSection("sales"),
  decisionSection,
];

export const SALES_WEEKLY: NarrativeSectionDef[] = [
  {
    key: "analysis",
    heading: "Performance Analysis",
    fields: [
      {
        key: "improvedMetric",
        question: "Which metric improved the most this week?",
        kind: "text",
      },
      { key: "improvedWhy", question: "Why do you think it improved?", kind: "bullets" },
      {
        key: "declinedMetric",
        question: "Which metric declined the most this week?",
        kind: "text",
      },
      { key: "declinedWhy", question: "Why do you think it declined?", kind: "bullets" },
    ],
  },
  {
    key: "customer",
    heading: "Customer Intelligence — what is the market telling us?",
    fields: [
      { key: "topObjections", question: "What were the top customer objections this week?", kind: "bullets" },
      {
        key: "newBehaviour",
        question: "What new customer behaviour, concern, desire or buying pattern emerged this week?",
        kind: "bullets",
      },
      {
        key: "learned",
        question: "What is the most important thing Sales learned about customers this week?",
        kind: "text",
      },
    ],
  },
  {
    key: "bottleneck",
    heading: "Sales Bottleneck Analysis — what is slowing growth?",
    fields: [
      {
        key: "constraint",
        question: "What is currently the biggest constraint limiting sales growth?",
        kind: "text",
      },
      { key: "evidence", question: "What evidence supports this conclusion?", kind: "bullets" },
      {
        key: "ifSolved",
        question: "If this bottleneck is solved, what result would improve most?",
        kind: "text",
      },
    ],
  },
  {
    key: "opportunity",
    heading: "Sales Opportunity Analysis",
    fields: [
      {
        key: "opportunity",
        question: "What is the biggest opportunity leadership should pay attention to?",
        kind: "text",
      },
      { key: "oppEvidence", question: "What evidence supports this opportunity?", kind: "bullets" },
      {
        key: "oppImpact",
        question: "What impact could it have on revenue, customers or growth?",
        kind: "bullets",
      },
    ],
  },
  {
    key: "support",
    heading: "Support Needed From Leadership",
    fields: [
      {
        key: "support",
        question: "What support, decision or intervention is required from leadership?",
        kind: "bullets",
      },
      { key: "supportWhy", question: "Why is it needed?", kind: "text" },
    ],
  },
  {
    key: "insight",
    heading: "Executive Insight",
    fields: [
      {
        key: "oneIssue",
        question: "If leadership focused on solving ONE issue next week, it should be:",
        kind: "text",
      },
      { key: "oneIssueWhy", question: "Because:", kind: "text" },
    ],
  },
  {
    key: "outcomes",
    heading: "Next Week's Outcomes",
    fields: [
      {
        key: "outcomes",
        question: "The top three outcomes the Sales team should focus on achieving next week:",
        kind: "bullets",
      },
    ],
  },
];

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
