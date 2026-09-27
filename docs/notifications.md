# Notifications

How the app gets someone's attention — in the app, and when the app is closed.
Built primarily for **sales reps** (a new order has landed) and **delivery
agents** (a delivery was assigned / changed / cancelled), and used by every
role for back-office alerts.

## Pipeline

```
business action (after its DB write commits)
  └─ notify({ type, vars, to, actorId?, entityType?, entityId?, dedupeKey? })
       1. resolve recipients → active + APPROVED users, minus the actor
       2. INSERT notifications (createManyAndReturn, skipDuplicates)   ← source of truth
       3. after the response (next/server `after()`):
            ├─ realtime  "notification.created" → open tabs (toast, chime, badge)
            ├─ web push  → every PushSubscription of the user
            └─ SMS       → critical only, when push could not reach the user
```

| Piece | File |
|---|---|
| Entry point | `modules/notifications/services/notify.service.ts` |
| Type registry (priority, icon, title/body/SMS text, link) | `lib/notifications/catalog.ts` |
| Order events for reps + agents (one-line call sites) | `modules/notifications/services/order-events.service.ts` |
| Channel fan-out | `modules/notifications/services/dispatch.service.ts` |
| Web Push sender (VAPID) | `lib/notifications/web-push.ts` |
| SMS sender (Termii) | `lib/notifications/sms.ts` |
| Reads, pagination, mark-read | `modules/notifications/services/notifications.service.ts` |
| Server actions | `modules/notifications/actions/notifications.action.ts` |
| Service worker handlers | `public/sw.js` (bottom) |
| Client state (count, toasts, chime, app badge, poll) | `components/notifications/notification-provider.tsx` |
| Bell / list / permission card | `components/notifications/*` |

### Invariants

- **Never throws into business logic.** `notify()` and every `order-events` helper swallow and log.
- **Out-of-band.** `order-events` helpers run entirely after the response; `notify()` writes the row in-request and dispatches after. Nothing sits inside the caller's transaction.
- **Call after the write commits** — a rolled-back write must not leave a phantom alert.
- **The actor is never notified about their own action** (`actorId`).
- **Lock-screen safe.** Push and SMS text may carry order number, product, quantity and state — **never** customer name / phone / address, and never an upsell **amount** to fulfilment roles (quantities only).
- **Idempotent.** `dedupeKey` is unique per recipient (`@@unique([recipientId, dedupeKey])`); a retry or double submit inserts nothing and sends nothing.

## Event catalog (reps + agents)

| Type | Priority | To | Fired from |
|---|---|---|---|
| `order.new` | critical | rep | public form intake (`app/api/orders/form-submit`), analyst-keyed order |
| `orders.assigned_to_you` | critical | rep | manager/admin rep reassignment — **one aggregated alert per rep** |
| `order.failed` | high | rep | agent / analyst / manager / admin marks failed (reason included) |
| `order.delivered` | normal | rep | any of the four mark-delivered paths |
| `order.rescheduled` | normal | rep | agent reschedules |
| `order.delivery_blocked` | high | rep | `deliverOrder` refused (agent short of stock) |
| `delivery.assigned` | critical | agent | rep/admin confirm, FAILED→CONFIRMED revive, reassignment (new agent) |
| `delivery.unassigned` | critical | agent | reassignment (previous agent) — "do not deliver" |
| `delivery.cancelled` | critical | agent | a CONFIRMED order is cancelled — "do not deliver" |
| `delivery.items_changed` | critical | agent | products added to a CONFIRMED order (quantities only) |
| `delivery.notes_changed` | normal | agent | order notes (prescription) edited |
| `delivery_fee_changed` | normal | agent | accounting edits the fee |

Back-office types (`stock_adjustment_*`, `raps_*`, `agent_stock_*`,
`product_needs_cost_price`) compose their text at the call site and pass
`{ title, message, link }`.

Agents are external `Agent` rows; their login is the `User` whose `agentId`
points at them (`to: { agentId }`). An agent with no login resolves to nobody.

## Channels

### In-app (always on)
The bell (header or sidebar row per role) and the `/sales-rep/notifications`,
`/delivery-agents/notifications`, `/media-buyer/notifications` pages. The
provider seeds from the layout and bumps on realtime events. It re-checks the
count on mount, when the tab comes back into view (throttled to once per 30s),
and once when the socket reconnects. It **polls (every 2.5 min, visible tabs
only) only while the socket is down** or realtime isn't configured — a live
socket already delivers every event, so polling on top of it would be pure
cost. The chat unread badge follows the same rule; both share
`lib/realtime/use-fallback-refresh.ts`. Unseen arrivals found by a re-check are
toasted too.

On a new alert the provider toasts (critical ones stay 15s), plays a WebAudio
chime for critical alerts (unlocked on first tap; on/off toggle in the
permission card, stored in localStorage), vibrates, sets `(n)` in the tab title
and the installed app's icon badge (Badging API), and `router.refresh()`es the
current page when the alert is about the section the user is looking at — so a
rep's order list shows the new order without a reload.

### Realtime
Rides the existing chat socket server unchanged: its `/publish` forwards any
`event` to `recipientUserIds`. The browser keeps **one WebSocket per tab**
(`lib/realtime/socket-client.ts`) shared by chat and notifications.

### Web Push (app closed)
- Needs `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Only in a **production build** (the service worker is not registered in `next dev`).
- Android Chrome: works with the browser closed. **iOS: only once installed to the
  home screen (16.4+)** — the permission card explains this.
- Permission is only ever requested from a tap (`PushPermissionCard`, shown as a
  snoozable nudge on the rep/agent order screens and in full on settings/profile).
- Critical pushes: `urgency: high`, TTL 1h, `requireInteraction`, vibration,
  `renotify`. One tray entry per order (`tag`), so "assigned" then "cancelled"
  replaces rather than stacks.
- 404/410 from the push service deletes the subscription; other failures count
  up and the device is dropped after 5.

**Shared phones.** A subscription is keyed by browser endpoint and upserted on
every app load, so a device always belongs to whoever is signed in now. Every
logout unregisters the device: client logouts via `signOutAndUnsubscribe()`
(`lib/auth/client-sign-out.ts`), and server `logoutAction`s via the httpOnly
`nc_push_ep` cookie (`lib/notifications/push-device-cookie.ts`).

### SMS fallback
- Needs `TERMII_API_KEY`, `TERMII_SENDER_ID` (sender ID registered with Termii; uses
  the `dnd` transactional route so DND-listed numbers still receive it).
- Only for **critical** types that define `sms` text, and only when the user has
  no push device or every push to them failed.
- **Max one SMS per user per 10 minutes** — enforced under a per-user advisory
  lock, so a burst of orders is one text, not five.
- Number: `User.phone`, falling back to `whatsappNumber`.

Every push/SMS attempt is logged in `notification_deliveries`
(`channel`, `status` SENT / FAILED / SKIPPED / PENDING, `error`) — the first
place to look when someone says "I never got it".

## Adding an event

1. Add the type to `NOTIFICATION_TYPES` in `lib/notifications/catalog.ts`
   (priority, icon, `title`/`body`/`link`, and `sms` if it is critical).
2. Call `notify({ type, vars, to, actorId, entityType, entityId, dedupeKey })`
   after the write commits — or add a helper to `order-events.service.ts` if it
   is an order-lifecycle event.
3. Never write `prisma.notification` directly.

## Not built yet (needs a scheduler)

There is no cron today, so there are no timed reminders ("order untouched for
15 min"), no "critical still unread after N min → SMS" escalation, no daily
"today's deliveries" digest, and no retention cleanup. The `priority` field and
`notification_deliveries` log are what those will build on.

## Schema

Migration `prisma/migrations/20260926120000_notifications_v2/migration.sql`
(additive, idempotent; applied with `prisma db execute`, never `db push`):
`notifications` gained `priority`, `readAt`, `data`, `dedupeKey`; new tables
`push_subscriptions` and `notification_deliveries`.
