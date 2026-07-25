import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreamChat, sendStreamMessage } from "@/hooks/use-stream-chat";

export function StreamChat({
  streamId,
  currentUserId,
  currentHandle,
  isCreator,
  className,
}: {
  streamId: string | undefined;
  currentUserId: string | undefined;
  currentHandle: string;
  isCreator: boolean;
  className?: string;
}) {
  const messages = useStreamChat(streamId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !streamId || !currentUserId) return;
    setSending(true);
    try {
      await sendStreamMessage({
        streamId,
        senderId: currentUserId,
        senderHandle: currentHandle,
        isCreator,
        body: draft.trim(),
      });
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("flex flex-col rounded-2xl border border-border bg-surface", className)}>
      <div className="border-b border-border px-4 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
        Live chat
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {!streamId && (
          <p className="text-center text-sm text-muted-foreground">Chat opens once the stream is live.</p>
        )}
        {streamId && messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No messages yet — say hi!</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className={cn("font-bold", m.is_creator ? "text-primary" : "text-foreground")}>
              @{m.sender_handle}
              {m.is_creator && " 👨‍🍳"}
            </span>{" "}
            <span className="text-muted-foreground">{m.body}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!streamId || !currentUserId}
          placeholder={currentUserId ? "Say something…" : "Log in to chat"}
          maxLength={300}
          className="min-w-0 flex-1 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending || !streamId || !currentUserId}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
