import type {
  PanelCallFeedback,
  PanelCustomerFeedback,
  PanelFollowUp,
} from "@/components/orders/customer-interaction-panel";

/**
 * Serializes the sales-rep customer-interaction trail (call feedback, customer
 * feedback, follow-up journey) into the shape the read-only
 * CustomerInteractionPanel expects. Shared by every oversight order-detail page
 * (data, sales-manager, sales-rep team-lead, admin) so the mapping lives once.
 *
 * Inputs mirror the existing read services:
 * - `feedbacks` — `Order.feedbacks` (getOrderWithDetails / data include)
 * - `customerFeedback` — getOrderFeedback()
 * - `followUps` — getOrderFollowUps()
 */

type RawCallFeedback = {
  id: string;
  outcome: string;
  note: string | null;
  createdAt: Date;
  author: { name: string };
};

type RawCustomerFeedback = {
  id: string;
  category: string;
  message: string;
  status: string;
  action: string | null;
  createdAt: Date;
  product: { name: string } | null;
  author: { name: string };
};

type RawFollowUp = {
  stage: string;
  completedAt: Date;
  note: string | null;
  completedBy: { name: string };
};

export type OrderInteraction = {
  callFeedback: PanelCallFeedback[];
  customerFeedback: PanelCustomerFeedback[];
  followUps: PanelFollowUp[];
};

export function mapOrderInteraction(
  feedbacks: RawCallFeedback[],
  customerFeedback: RawCustomerFeedback[],
  followUps: RawFollowUp[],
): OrderInteraction {
  return {
    callFeedback: feedbacks.map((f) => ({
      id: f.id,
      outcome: f.outcome,
      note: f.note ?? null,
      authorName: f.author.name,
      at: f.createdAt.toISOString(),
    })),
    customerFeedback: customerFeedback.map((f) => ({
      id: f.id,
      category: f.category,
      message: f.message,
      status: f.status,
      action: f.action ?? null,
      productName: f.product?.name ?? null,
      authorName: f.author.name,
      at: f.createdAt.toISOString(),
    })),
    followUps: followUps.map((f) => ({
      stage: f.stage,
      note: f.note ?? null,
      completedByName: f.completedBy.name,
      at: f.completedAt.toISOString(),
    })),
  };
}
