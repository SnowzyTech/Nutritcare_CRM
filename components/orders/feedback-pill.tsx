import type { OrderStatus } from '@prisma/client';
import { FEEDBACK_TONE_CLASSES, feedbackLabel, feedbackTone } from '@/lib/orders/order-feedback';

/**
 * Latest call-feedback pill ("Not Picking", …) for an order row. Hidden once an
 * order is delivered (the call-attempt outcome is stale by then). Shared by the
 * sales-rep list and the oversight order lists (data, sales-manager,
 * sales-rep team-lead, admin).
 */
export function FeedbackPill({
  lastFeedback,
  lastFeedbackAt,
  status,
}: {
  lastFeedback: string | null;
  lastFeedbackAt: string | null;
  status: OrderStatus;
}) {
  if (!lastFeedback || status === 'DELIVERED') return null;
  const when = lastFeedbackAt
    ? new Date(lastFeedbackAt).toLocaleString('en-NG', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  return (
    <span
      title={when ? `Recorded ${when}` : undefined}
      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${FEEDBACK_TONE_CLASSES[feedbackTone(lastFeedback)]}`}
    >
      {feedbackLabel(lastFeedback)}
    </span>
  );
}
