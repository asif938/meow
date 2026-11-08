"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, SendHorizontal } from "lucide-react";
import type { ChatMessage } from "@/actions/chat";
import { cn } from "@/lib/utils";

const POLL_MS = 5000;

export function ChatThread({ conversationId, meId, initial }: { conversationId: string; meId: string; initial: ChatMessage[] }) {
  const [msgs, setMsgs] = useState<ChatMessage[]>(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<string | null>(initial.at(-1)?.createdAt ?? null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length]);

  // Simple polling (MVP); swap for Pusher/Ably later.
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      if (document.hidden) return;
      const q = lastRef.current ? `?after=${encodeURIComponent(lastRef.current)}` : "";
      const res = await fetch(`/api/conversations/${conversationId}/messages${q}`, { cache: "no-store" }).catch(() => null);
      if (!res?.ok || stopped) return;
      const data = (await res.json()) as { messages: ChatMessage[] };
      if (data.messages.length) {
        setMsgs((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const merged = [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
          lastRef.current = merged.at(-1)?.createdAt ?? lastRef.current;
          return merged;
        });
      }
    };
    const t = setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [conversationId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }).catch(() => null);
    setSending(false);
    const data = res ? ((await res.json()) as { error?: string; message?: ChatMessage }) : { error: "Network error" };
    if (data.error || !data.message) {
      setError(data.error ?? "Could not send");
      return;
    }
    setText("");
    setMsgs((prev) => (prev.some((m) => m.id === data.message!.id) ? prev : [...prev, data.message!]));
    lastRef.current = data.message.createdAt;
  }

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-96 flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
      <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
        Stay safe: never pay in advance, meet in public, and keep chats on Meow.
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-muted">Say hello 👋 Ask about health, age, or condition.</p>}
        {msgs.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                  mine ? "rounded-br-md bg-brand-500 text-white" : "rounded-bl-md bg-stone-100 text-ink",
                )}
              >
                {m.body}
              </div>
              {m.flagged && !mine && (
                <p className="mt-1 flex max-w-[80%] items-start gap-1 text-[11px] text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  This message contains contact details or a link. Be careful moving off Meow — scammers often do this.
                </p>
              )}
              <span className="mt-0.5 text-[10px] text-muted">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {mine && m.readAt && " · Seen"}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(e);
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Write a message…"
          aria-label="Message"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-stone-50 px-4 py-2.5 text-sm focus:border-brand-300 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-brand-500 text-white disabled:opacity-50"
          aria-label="Send"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
