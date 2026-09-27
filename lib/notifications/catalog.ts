/**
 * Notification type registry — the one place every notification's priority,
 * icon and wording lives. The bell, the push payload and the SMS fallback all
 * render from here, so copy never drifts between channels.
 *
 * `Notification.type` is stored as a String (no migration per new type); adding
 * a type means adding an entry here and calling `notify()` at the event.
 *
 * PRIVACY: push and SMS text lands on lock screens of phones that get shared.
 * Titles/bodies may carry order number, product, quantity and state — never a
 * customer's name, phone or address, and never an upsell amount for
 * fulfilment roles.
 *
 * Plain TS — safe to import from client and server.
 */

export type NotificationPriority = "critical" | "high" | "normal";

export type NotificationIcon =
  | "order"
  | "users"
  | "truck"
  | "check"
  | "alert"
  | "cancel"
  | "calendar"
  | "package"
  | "note"
  | "money"
  | "bell";

interface TypeDef<V> {
  priority: NotificationPriority;
  icon: NotificationIcon;
  title: (v: V) => string;
  body: (v: V) => string;
  /** Where tapping the notification goes (relative URL). */
  link: (v: V) => string | null;
  /** ≤160-char SMS text. Only used for `critical` types. */
  sms?: (v: V) => string;
}

function defineType<V>(def: TypeDef<V>): TypeDef<V> {
  return def;
}

type OrderRef = { orderId: string; orderNumber: string };

/**
 * For back-office notifications whose text is composed at the call site (the
 * pre-v2 notifications, kept word-for-word when moved onto `notify()`).
 */
type Composed = { title: string; message: string; link: string | null };

function composed(priority: NotificationPriority, icon: NotificationIcon): TypeDef<Composed> {
  return defineType<Composed>({
    priority,
    icon,
    title: (v) => v.title,
    body: (v) => v.message,
    link: (v) => v.link,
  });
}

const repOrderLink = (v: OrderRef) => `/sales-rep/orders/${v.orderId}`;
const agentOrderLink = (v: OrderRef) => `/delivery-agents/${v.orderId}`;

export const NOTIFICATION_TYPES = {
  // ── Sales rep ────────────────────────────────────────────────────────────
  "order.new": defineType<OrderRef & { summary: string; state: string }>({
    priority: "critical",
    icon: "order",
    title: (v) => `New order ${v.orderNumber}`,
    body: (v) => `${v.summary}${v.state ? ` · ${v.state}` : ""}. Call the customer to confirm.`,
    link: repOrderLink,
    sms: (v) => `Nucle CRM: new order ${v.orderNumber} (${v.summary}) is waiting for you. Open the app to confirm it.`,
  }),
  "orders.assigned_to_you": defineType<{ count: number; orderNumbers: string; firstOrderId: string }>({
    priority: "critical",
    icon: "users",
    title: (v) => (v.count === 1 ? "An order was assigned to you" : `${v.count} orders were assigned to you`),
    body: (v) => `${v.orderNumbers}. Open your orders to follow up.`,
    link: (v) => (v.count === 1 ? `/sales-rep/orders/${v.firstOrderId}` : "/sales-rep/orders/pending"),
    sms: (v) =>
      `Nucle CRM: ${v.count === 1 ? "an order was" : `${v.count} orders were`} assigned to you. Open the app to follow up.`,
  }),
  "order.failed": defineType<OrderRef & { reason: string; actorName: string }>({
    priority: "high",
    icon: "alert",
    title: (v) => `Delivery failed — ${v.orderNumber}`,
    body: (v) => `${v.actorName} marked it failed${v.reason ? `: ${v.reason}` : ""}. Call the customer to recover it.`,
    link: repOrderLink,
  }),
  "order.delivered": defineType<OrderRef & { actorName: string }>({
    priority: "normal",
    icon: "check",
    title: (v) => `Delivered — ${v.orderNumber}`,
    body: (v) => `${v.actorName} marked your order delivered.`,
    link: repOrderLink,
  }),
  "order.rescheduled": defineType<OrderRef & { date: string }>({
    priority: "normal",
    icon: "calendar",
    title: (v) => `Rescheduled — ${v.orderNumber}`,
    body: (v) => `The delivery agent moved delivery to ${v.date}.`,
    link: repOrderLink,
  }),
  "order.delivery_blocked": defineType<OrderRef>({
    priority: "high",
    icon: "alert",
    title: (v) => `Delivery blocked — ${v.orderNumber}`,
    body: () => "The agent is short of stock for this order. The inventory team has been alerted.",
    link: repOrderLink,
  }),

  // ── Delivery agent ───────────────────────────────────────────────────────
  "delivery.assigned": defineType<OrderRef & { summary: string; state: string; date: string }>({
    priority: "critical",
    icon: "truck",
    title: (v) => `New delivery ${v.orderNumber}`,
    body: (v) =>
      `${v.summary}${v.state ? ` · ${v.state}` : ""}${v.date ? ` · due ${v.date}` : ""}.`,
    link: agentOrderLink,
    sms: (v) => `Nucle CRM: new delivery ${v.orderNumber} (${v.summary}) assigned to you. Open the app for details.`,
  }),
  "delivery.unassigned": defineType<OrderRef>({
    priority: "critical",
    icon: "cancel",
    title: (v) => `Reassigned — ${v.orderNumber}`,
    body: () => "This order was moved to another agent. Do not deliver it.",
    link: () => "/delivery-agents",
    sms: (v) => `Nucle CRM: order ${v.orderNumber} was moved to another agent. Do NOT deliver it.`,
  }),
  "delivery.cancelled": defineType<OrderRef>({
    priority: "critical",
    icon: "cancel",
    title: (v) => `Cancelled — ${v.orderNumber}`,
    body: () => "This order was cancelled. Do not deliver it.",
    link: () => "/delivery-agents",
    sms: (v) => `Nucle CRM: order ${v.orderNumber} was cancelled. Do NOT deliver it.`,
  }),
  "delivery.items_changed": defineType<OrderRef & { summary: string }>({
    priority: "critical",
    icon: "package",
    title: (v) => `Items changed — ${v.orderNumber}`,
    body: (v) => `Now: ${v.summary}. Check the order before you go out.`,
    link: agentOrderLink,
    sms: (v) => `Nucle CRM: items on order ${v.orderNumber} changed (now ${v.summary}). Check the app before delivering.`,
  }),
  "delivery.notes_changed": defineType<OrderRef>({
    priority: "normal",
    icon: "note",
    title: (v) => `Notes updated — ${v.orderNumber}`,
    body: () => "The order notes were updated. Review them before delivery.",
    link: agentOrderLink,
  }),
  delivery_fee_changed: composed("normal", "money"),

  // ── Back office (text composed at the call site) ────────────────────────
  agent_stock_shortfall: composed("high", "alert"),
  agent_stock_correction_approval: composed("normal", "package"),
  agent_stock_correction_approved: composed("normal", "check"),
  agent_stock_correction_rejected: composed("normal", "cancel"),
  stock_adjustment_approval: composed("normal", "package"),
  stock_adjustment_approved: composed("normal", "check"),
  stock_adjustment_rejected: composed("normal", "cancel"),
  raps_pending_approval: composed("normal", "package"),
  raps_approved: composed("normal", "check"),
  raps_rejected: composed("normal", "cancel"),
  product_needs_cost_price: composed("normal", "money"),

  // ── System ──────────────────────────────────────────────────────────────
  "system.test": defineType<Record<string, never>>({
    priority: "normal",
    icon: "bell",
    title: () => "Notifications are working",
    body: () => "This is a test. You'll get alerts like this when work needs your attention.",
    link: () => null,
  }),
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export type NotificationVars<T extends NotificationType> = Parameters<
  (typeof NOTIFICATION_TYPES)[T]["title"]
>[0];

export function isNotificationType(value: string): value is NotificationType {
  return Object.prototype.hasOwnProperty.call(NOTIFICATION_TYPES, value);
}

/** Icon for a stored type; unknown/legacy types fall back to a bell. */
export function notificationIcon(type: string): NotificationIcon {
  return isNotificationType(type) ? NOTIFICATION_TYPES[type].icon : "bell";
}

/** Rendered text for one notification. */
export interface RenderedNotification {
  title: string;
  body: string;
  link: string | null;
  priority: NotificationPriority;
  sms: string | null;
}

export function renderNotification<T extends NotificationType>(
  type: T,
  vars: NotificationVars<T>,
): RenderedNotification {
  // The generic erases to a union of builders; each accepts its own vars shape.
  const def = NOTIFICATION_TYPES[type] as unknown as TypeDef<NotificationVars<T>>;
  return {
    title: def.title(vars),
    body: def.body(vars),
    link: def.link(vars),
    priority: def.priority,
    sms: def.sms ? def.sms(vars).slice(0, 160) : null,
  };
}

/**
 * Human item summary for push/SMS text, e.g. "Neuro-Vive Balm ×2, Linix ×1".
 * Quantities only — never prices (fulfilment roles must not see upsell money).
 */
export function summarizeItems(items: { name: string; quantity: number }[], max = 3): string {
  const head = items.slice(0, max).map((i) => `${i.name} ×${i.quantity}`);
  const rest = items.length - head.length;
  return rest > 0 ? `${head.join(", ")} +${rest} more` : head.join(", ");
}
