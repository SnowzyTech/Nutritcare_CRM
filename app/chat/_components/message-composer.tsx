"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, Send, X, Loader2 } from "lucide-react";
import {
  searchMentionAction,
  searchOrderTagAction,
} from "@/modules/chat/actions/chat.action";
import type { ChatMessage } from "@/modules/chat/services/messages.service";

type Entity = { type: "mention" | "order"; id: string; label: string };

type MentionSuggestion = { id: string; name: string; role: string; avatarUrl: string | null };
type OrderSuggestion = { id: string; orderNumber: string; status: string; customerName: string };

type Autocomplete =
  | { kind: "mention"; query: string; start: number; items: MentionSuggestion[] }
  | { kind: "order"; query: string; start: number; items: OrderSuggestion[] }
  | null;

/** Walk the text and replace each chosen entity's literal with its storage token. */
function serialize(text: string, entities: Entity[]): string {
  let body = text;
  let cursor = 0;
  for (const e of entities) {
    const literal = (e.type === "mention" ? "@" : "#") + e.label;
    const idx = body.indexOf(literal, cursor);
    if (idx === -1) continue; // entity text was edited away — drop it
    const token =
      e.type === "mention"
        ? `@[${e.label}](user:${e.id})`
        : `#[${e.label}](order:${e.id})`;
    body = body.slice(0, idx) + token + body.slice(idx + literal.length);
    cursor = idx + token.length;
  }
  return body;
}

export function MessageComposer({
  conversationId,
  disabled,
  replyTo,
  onCancelReply,
  onSend,
}: {
  conversationId: string;
  disabled?: boolean;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (body: string, imageUrl: string | null, replyToId: string | null) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [ac, setAc] = useState<Autocomplete>(null);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const acTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect an active @ / # token immediately before the caret.
  const detectToken = useCallback((value: string, caret: number) => {
    let i = caret - 1;
    while (i >= 0) {
      const ch = value[i];
      if (ch === "@" || ch === "#") {
        const before = i === 0 ? " " : value[i - 1];
        if (!/\s/.test(before) && i !== 0) break; // sigil must start a word
        return { sigil: ch as "@" | "#", start: i, query: value.slice(i + 1, caret) };
      }
      if (/\s/.test(ch)) break;
      i--;
    }
    return null;
  }, []);

  const runSearch = useCallback(
    (tok: { sigil: "@" | "#"; start: number; query: string }) => {
      if (acTimer.current) clearTimeout(acTimer.current);
      acTimer.current = setTimeout(async () => {
        if (tok.sigil === "@") {
          const res = await searchMentionAction(conversationId, tok.query);
          setAc({
            kind: "mention",
            query: tok.query,
            start: tok.start,
            items: res.ok ? (res.data as MentionSuggestion[]) : [],
          });
        } else {
          const res = await searchOrderTagAction(tok.query);
          setAc({
            kind: "order",
            query: tok.query,
            start: tok.start,
            items: res.ok ? (res.data as OrderSuggestion[]) : [],
          });
        }
      }, 180);
    },
    [conversationId]
  );

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setText(value);
    const caret = e.target.selectionStart ?? value.length;
    const tok = detectToken(value, caret);
    if (tok && tok.query.length >= 0) runSearch(tok);
    else setAc(null);
  }

  function pickMention(s: MentionSuggestion) {
    if (!ac) return;
    insertToken("@" + s.name, ac.start, ac.query.length + 1);
    setEntities((prev) => [...prev, { type: "mention", id: s.id, label: s.name }]);
  }

  function pickOrder(s: OrderSuggestion) {
    if (!ac) return;
    insertToken("#" + s.orderNumber, ac.start, ac.query.length + 1);
    setEntities((prev) => [...prev, { type: "order", id: s.id, label: s.orderNumber }]);
  }

  function insertToken(literal: string, start: number, removeLen: number) {
    setText((prev) => {
      const next = prev.slice(0, start) + literal + " " + prev.slice(start + removeLen);
      return next;
    });
    setAc(null);
    requestAnimationFrame(() => taRef.current?.focus());
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/chat", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) setImage(json.url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit() {
    const body = serialize(text.trim(), entities);
    if ((!body && !image) || sending) return;
    setSending(true);
    try {
      await onSend(body, image, replyTo?.id ?? null);
      setText("");
      setEntities([]);
      setImage(null);
      setAc(null);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") setAc(null);
  }

  useEffect(
    () => () => {
      if (acTimer.current) clearTimeout(acTimer.current);
    },
    []
  );

  if (disabled) {
    return (
      <div className="border-t border-gray-100 px-4 py-4 text-center text-sm text-gray-400">
        This conversation is archived.
      </div>
    );
  }

  return (
    <div className="relative border-t border-gray-100 bg-white px-3 py-3">
      {/* Autocomplete dropdown */}
      {ac && ac.items.length > 0 && (
        <div className="absolute bottom-full left-3 right-3 mb-1 max-h-56 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
          {ac.kind === "mention"
            ? (ac.items as MentionSuggestion[]).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickMention(s)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-purple-50"
                >
                  <span className="font-medium text-gray-900">{s.name}</span>
                  <span className="text-xs text-gray-400">
                    {s.role.replaceAll("_", " ").toLowerCase()}
                  </span>
                </button>
              ))
            : (ac.items as OrderSuggestion[]).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickOrder(s)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-purple-50"
                >
                  <span className="font-medium text-purple-700">{s.orderNumber}</span>
                  <span className="truncate text-xs text-gray-400">
                    {s.customerName} · {s.status}
                  </span>
                </button>
              ))}
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-purple-600">
              {replyTo.senderName ?? "Message"}
            </p>
            <p className="truncate text-xs text-gray-500">{replyTo.body || "📷 Photo"}</p>
          </div>
          <button onClick={onCancelReply} aria-label="Cancel reply" className="rounded-full p-1 hover:bg-gray-200">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Image preview */}
      {image && (
        <div className="mb-2 inline-block relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="preview" className="max-h-28 rounded-lg" />
          <button
            onClick={() => setImage(null)}
            aria-label="Remove image"
            className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 shadow"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-3xl bg-purple-50 px-4 py-2">
          <textarea
            ref={taRef}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Message"
            className="max-h-32 w-full resize-none bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach photo"
            className="text-gray-400 hover:text-gray-600"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          </button>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
