import { useEffect, useState } from "react";
import { X, Heart, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedComment = {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
};

const SEED: FeedComment[] = [
  { id: "c1", user: "sarah.k", avatar: "https://i.pravatar.cc/80?img=47", text: "Okay this looks unreal 🤤 saving my appetite for the drop", time: "12m", likes: 24 },
  { id: "c2", user: "mike_eats", avatar: "https://i.pravatar.cc/80?img=15", text: "Bro the crust on that thing 🔥🔥", time: "34m", likes: 12 },
  { id: "c3", user: "priya.j", avatar: "https://i.pravatar.cc/80?img=25", text: "Any chance of a gluten-free version soon?", time: "1h", likes: 8 },
  { id: "c4", user: "devon.b", avatar: "https://i.pravatar.cc/80?img=51", text: "Ordered last week — 10/10 would eat off the floor", time: "2h", likes: 41 },
  { id: "c5", user: "nina.r", avatar: "https://i.pravatar.cc/80?img=36", text: "notify me the SECOND this drops please", time: "3h", likes: 6 },
];

type Props = {
  open: boolean;
  onClose: () => void;
  postHandle: string;
  postImage: string;
  postCaption: string;
};

export function CommentDrawer({ open, onClose, postHandle, postImage, postCaption }: Props) {
  const [comments, setComments] = useState<FeedComment[]>(SEED);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    setComments((prev) => [
      { id: `c${Date.now()}`, user: "you", avatar: "https://i.pravatar.cc/80?img=12", text: v, time: "now", likes: 0 },
      ...prev,
    ]);
    setText("");
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label="Comments"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-3xl border-t border-border bg-background shadow-2xl transition-transform duration-300",
          "mx-auto max-w-2xl",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border" />

        <div className="flex items-start gap-3 border-b border-border px-4 py-3">
          <img src={postImage} alt="" className="h-11 w-11 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">{postHandle}</div>
            <div className="line-clamp-1 text-xs text-muted-foreground">{postCaption}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close comments"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-4 py-3">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {comments.length} comments
          </div>
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <img src={c.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold">@{c.user}</span>
                    <span className="text-[11px] text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-foreground">{c.text}</p>
                  <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-primary">
                      <Heart className="h-3 w-3" /> {c.likes}
                    </button>
                    <button className="hover:text-foreground">Reply</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={submit}
          className="flex items-center gap-2 border-t border-border bg-surface p-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <img src="https://i.pravatar.cc/80?img=12" alt="" className="h-8 w-8 rounded-full object-cover" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition disabled:opacity-40"
            aria-label="Post comment"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
}
