"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function GameChat({
  code,
  guestId,
  enabled,
}: {
  code: string;
  guestId: string;
  enabled: boolean;
}) {
  const messages = useQuery(
    api.chat.listMessages,
    enabled ? { code, guestId } : "skip",
  );
  const sendMessage = useMutation(api.chat.sendMessage);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function onSend(event: React.FormEvent) {
    event.preventDefault();
    if (!enabled) return;
    const next = text.trim();
    if (!next) return;
    setError(null);
    setText("");
    try {
      await sendMessage({ code, guestId, text: next });
    } catch (err) {
      setText(next);
      setError(err instanceof Error ? err.message : "Could not send.");
    }
  }

  return (
    <section className="flex min-h-48 flex-1 flex-col rounded-md border border-[#3d4a44] bg-[#121916]">
      <h2 className="border-b border-[#3d4a44] px-3 py-2 text-sm font-medium text-[#c8b48a]">
        Chat
      </h2>
      <div className="flex max-h-56 flex-1 flex-col gap-2 overflow-y-auto px-3 py-2 text-sm">
        {!enabled ? (
          <p className="text-[#d7d1c4]">Join the game to chat.</p>
        ) : messages === undefined ? (
          <p className="text-[#d7d1c4]">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-[#d7d1c4]">No messages yet.</p>
        ) : (
          messages.map((message) => (
            <p key={message._id}>
              <span className="text-[#c8b48a]">{message.name}: </span>
              <span className="whitespace-pre-wrap break-words">{message.text}</span>
            </p>
          ))
        )}
        <div ref={bottom} />
      </div>
      <form onSubmit={onSend} className="flex gap-2 border-t border-[#3d4a44] p-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={!enabled}
          maxLength={240}
          placeholder="Message"
          className="min-w-0 flex-1 rounded-md border border-[#3d4a44] bg-[#1b2420] px-2 py-1.5 text-sm outline-none focus:border-[#c8b48a] disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!enabled || text.trim().length === 0}
          className="rounded-md bg-[#c8b48a] px-3 py-1.5 text-sm font-medium text-[#1b2420] disabled:opacity-40"
        >
          Send
        </button>
      </form>
      {error ? <p className="px-3 pb-2 text-xs text-red-300">{error}</p> : null}
    </section>
  );
}
