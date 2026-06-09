/**
 * Chat message tokens — isomorphic (used by both the composer and the renderer).
 *
 * A message body is plain text that may contain self-contained inline tokens:
 *   - Mention:   @[Display Name](user:USER_ID)
 *   - Order tag: #[ORD-1042](order:ORDER_ID)
 *
 * Storing tokens inline keeps each message portable (no extra joins needed to
 * render it), while the send path also materializes MessageMention /
 * MessageOrderRef rows so "do I have unread mentions" and "click an order tag"
 * stay indexed lookups rather than body scans.
 */

export type MentionSegment = {
  kind: "mention";
  userId: string;
  label: string;
};

export type OrderSegment = {
  kind: "order";
  orderId: string;
  label: string; // e.g. ORD-1042 (the order number)
};

export type TextSegment = {
  kind: "text";
  text: string;
};

export type Segment = TextSegment | MentionSegment | OrderSegment;

// Matches @[label](user:id) and #[label](order:id). Labels may not contain ']'.
const TOKEN_RE = /([@#])\[([^\]]+)\]\((user|order):([^)]+)\)/g;

/** Parse a stored body into ordered segments for rendering. */
export function parseTokens(body: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(body)) !== null) {
    const [full, sigil, label, kind, id] = match;

    // Mentions use '@', order tags use '#'. Mismatched sigils fall through as text.
    const valid =
      (kind === "user" && sigil === "@") || (kind === "order" && sigil === "#");
    if (!valid) continue;

    if (match.index > lastIndex) {
      segments.push({ kind: "text", text: body.slice(lastIndex, match.index) });
    }

    if (kind === "user") {
      segments.push({ kind: "mention", userId: id, label });
    } else {
      segments.push({ kind: "order", orderId: id, label });
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < body.length) {
    segments.push({ kind: "text", text: body.slice(lastIndex) });
  }

  return segments;
}

/** Serialize segments back into a storable body string. */
export function serializeTokens(segments: Segment[]): string {
  return segments
    .map((seg) => {
      if (seg.kind === "text") return seg.text;
      if (seg.kind === "mention") return `@[${seg.label}](user:${seg.userId})`;
      return `#[${seg.label}](order:${seg.orderId})`;
    })
    .join("");
}

/** Extract the unique user IDs mentioned in a body. */
export function extractMentionUserIds(body: string): string[] {
  return uniqueIds(parseTokens(body), "mention", (s) => (s as MentionSegment).userId);
}

/** Extract the unique order IDs tagged in a body. */
export function extractOrderIds(body: string): string[] {
  return uniqueIds(parseTokens(body), "order", (s) => (s as OrderSegment).orderId);
}

function uniqueIds(
  segments: Segment[],
  kind: Segment["kind"],
  pick: (s: Segment) => string
): string[] {
  const ids = new Set<string>();
  for (const seg of segments) {
    if (seg.kind === kind) ids.add(pick(seg));
  }
  return [...ids];
}

/** Plain-text rendering of a body (tokens collapse to their labels) for previews. */
export function toPlainText(body: string): string {
  return parseTokens(body)
    .map((seg) => {
      if (seg.kind === "text") return seg.text;
      if (seg.kind === "mention") return `@${seg.label}`;
      return `#${seg.label}`;
    })
    .join("")
    .trim();
}
