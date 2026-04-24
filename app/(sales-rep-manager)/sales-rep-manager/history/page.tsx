import type { Metadata } from "next";
import { HistoryClient } from "./history-client";

export const metadata: Metadata = { title: "History" };
export const dynamic = "force-dynamic";

export type ActivityEntry = {
  id: string;
  time: string;
  type: string;
  description: string;
  boldText?: string;
};

export type HistoryGroup = {
  id: string;
  labelPrefix: string;
  dateLabel: string;
  activities: ActivityEntry[];
};

async function getMockActivityHistory(): Promise<HistoryGroup[]> {
  return [
    {
      id: "group-1",
      labelPrefix: "Today",
      dateLabel: "February 9th, 2026",
      activities: [
        {
          id: "1",
          time: "Feb 7, 2026 – 09:42 AM",
          type: "Logged in to manager mode",
          description: "User logged in from Chrome (Desktop)",
        },
        {
          id: "2",
          time: "Feb 7, 2026 – 10:15 AM",
          type: "Monthly Report Generated",
          description: "February Report Generated",
        },
        {
          id: "3",
          time: "Feb 7, 2026 – 10:15 AM",
          type: "Weekly Report Generated",
          description: "Feb Week 2 Report Generated",
        },
        {
          id: "4",
          time: "Feb 7, 2026 – 10:15 AM",
          type: "Order Reassigned",
          description: "Order reassigned to {BOLD}",
          boldText: "6 Sales Rep",
        },
        {
          id: "5",
          time: "Feb 7, 2026 – 10:15 AM",
          type: "Logged out of manager mode",
          description: "Order #ORD-45821 placedPending",
        },
      ],
    },
    {
      id: "group-2",
      labelPrefix: "A Day Ago",
      dateLabel: "February 8th, 2026",
      activities: [
        {
          id: "6",
          time: "Feb 7, 2026 – 10:15 AM",
          type: "Logged in to manager mode",
          description: "User logged in from Chrome (Desktop)",
        },
        {
          id: "7",
          time: "Feb 7, 2026 – 10:15 AM",
          type: "Order Reassigned",
          description: "Order reassigned to {BOLD}",
          boldText: "Adewale Bukunmi",
        },
      ],
    },
  ];
}

export default async function HistoryPage() {
  const groups = await getMockActivityHistory();

  return <HistoryClient groups={groups} />;
}
