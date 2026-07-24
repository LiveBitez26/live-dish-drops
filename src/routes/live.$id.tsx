import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Instagram, Music2, Plus, Share2, Star } from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { CartBanner } from "@/components/livebite/CartBanner";
import { VideoPlayer } from "@/components/livebite/VideoPlayer";
import { ChatTicker } from "@/components/livebite/ChatTicker";
import { CREATORS, getCreator } from "@/lib/livebite-data";
import { cartStore } from "@/lib/cart-store";

import type { Creator } from "@/lib/livebite-data";

export const Route = createFileRoute("/live/$id")({
  loader: ({ params }): { creator: Creator } => {
    const creator = CREATORS.find((c) => c.id === params.id);
    if (!creator) throw notFound();
    return { creator };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.creator;
    const title = c ? `${c.handle} is live · LiveBite` : "Live · LiveBite";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: c
            ? `Watch ${c.handle} cook ${c.dish} live and order for instant delivery.`
            : "Watch food creators live on LiveBite.",
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: c ? `${c.dish} · $${c.price} · ${c.viewers} watching now.` : "",
        },
        ...(c ? [{ property: "og:image", content: c.cover }, { name: "twitter:image", content: c.cover }] : []),
        { property: "og:type", content: "video.other" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: LiveView,
});

function LiveView() {
  const { creator } = Route.useLoaderData();
  const [tab, setTab] = useState<"menu" | "bio">("menu");

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All drops
          </Link>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-elevated">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>

        {/* Stream */}
        <VideoPlayer
          cover={creator.cover}
          handle={creator.handle}
          viewers={creator.viewers}
          topRight={
            <div className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              Batch #2: Prepping {creator.dish.split(" ")[0]} 🔥
            </div>
          }
          bottom={<ChatTicker />}
        />

        {/* Creator strip */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
          <img
            src={creator.avatar}
            alt=""
            className="h-12 w-12 rounded-full border-2 border-primary object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-bold">{creator.handle}</span>
              <span className="text-xs text-muted-foreground">· {creator.subs} subs</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="font-semibold text-foreground">{creator.rating}</span>
              <span>· {creator.category}</span>
            </div>
          </div>
          <button
            onClick={() => toast.success(`Following ${creator.handle}`)}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
          >
            + Follow
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="mb-4 flex gap-1 rounded-xl border border-border bg-surface p-1">
            <button
              onClick={() => setTab("menu")}
              className={
                "flex-1 rounded-lg py-2 text-sm font-bold transition " +
                (tab === "menu"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              Today's Drop Menu
            </button>
            <button
              onClick={() => setTab("bio")}
              className={
                "flex-1 rounded-lg py-2 text-sm font-bold transition " +
                (tab === "bio"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              Creator Bio &amp; Story
            </button>
          </div>

          {tab === "menu" ? (
            <div className="space-y-3">
              {creator.menu.map((m: typeof creator.menu[number]) => {
                const pct = Math.round(((m.total - m.left) / m.total) * 100);
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-elevated text-2xl">
                      {m.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-bold">{m.name}</div>
                        <div className="shrink-0 font-black text-primary">${m.price}</div>
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {m.desc}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-destructive"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {m.left} left
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        cartStore.add(m, creator.id, creator.handle);
                        toast.success(`Added ${m.name}`, {
                          description: `From ${creator.handle}`,
                        });
                      }}
                      className="shrink-0 rounded-full bg-primary p-2.5 text-primary-foreground glow-primary"
                      aria-label={`Add ${m.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-black">{creator.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{creator.bio}</p>
              <p className="mt-4 text-sm leading-relaxed">{creator.story}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold hover:border-primary"
                >
                  <Instagram className="h-3.5 w-3.5" /> @{creator.socials.ig}
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold hover:border-primary"
                >
                  <Music2 className="h-3.5 w-3.5" /> @{creator.socials.tt}
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <CartBanner />
    </div>
  );
}
