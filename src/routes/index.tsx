import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Flame, Clock, Users, ChevronRight, Play, Heart, MessageCircle, Bell, Camera } from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { CartBanner } from "@/components/livebite/CartBanner";
import { CommentDrawer } from "@/components/livebite/CommentDrawer";
import { CATEGORIES, CREATORS, DAILY_FEED } from "@/lib/livebite-data";
import type { DailyPost } from "@/lib/livebite-data";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LiveBite — Watch. Order. Devour." },
      {
        name: "description",
        content:
          "Live-stream food drops from independent chefs and pop-up cooks. Watch them cook, order the moment it hits the pan, delivered hot.",
      },
      { property: "og:title", content: "LiveBite — Live-stream food drops" },
      {
        property: "og:description",
        content:
          "Watch independent chefs cook limited-edition meals on camera and order for instant local delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

function Discover() {
  const [tab, setTab] = useState<"live" | "feed">("live");
  const [cat, setCat] = useState("All Drops");
  const filtered =
    cat === "All Drops" ? CREATORS : CREATORS.filter((c) => c.category === cat);
  const hero = CREATORS.slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Segmented tab switcher */}
        <div className="mb-6 flex rounded-full border border-border bg-surface p-1 shadow-sm">
          <TabButton active={tab === "live"} onClick={() => setTab("live")}>
            🔥 Live Drops
          </TabButton>
          <TabButton active={tab === "feed"} onClick={() => setTab("feed")}>
            📸 Daily Feed
          </TabButton>
        </div>

        {tab === "live" ? (
          <LiveDropsView cat={cat} setCat={setCat} filtered={filtered} hero={hero} />
        ) : (
          <DailyFeedView />
        )}
      </main>

      <CartBanner />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-full px-4 py-2 text-sm font-bold transition",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function LiveDropsView({
  cat,
  setCat,
  filtered,
  hero,
}: {
  cat: string;
  setCat: (c: string) => void;
  filtered: typeof CREATORS;
  hero: typeof CREATORS;
}) {
  return (
    <>

        {/* Hero: Live Drops Happening Now */}
        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-destructive">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                </span>
                Live Right Now
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Live Drops Happening Now
              </h1>
            </div>
            <button className="hidden sm:flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
              See all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
            {hero.map((c) => (
              <Link
                key={c.id}
                to="/live/$id"
                params={{ id: c.id }}
                className="group relative w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-surface sm:w-[46%] lg:w-[32%]"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={c.cover}
                    alt={c.dish}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span className="live-dot">Live</span>
                    <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                      <Users className="h-3 w-3" /> {c.viewers.toLocaleString()}
                    </span>
                  </div>
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                    <Clock className="h-3 w-3 text-primary" /> {c.countdown}
                  </div>
                  <div className="absolute inset-x-3 bottom-3 flex items-center gap-3">
                    <img
                      src={c.avatar}
                      alt=""
                      className="h-10 w-10 rounded-full border-2 border-primary object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-white">
                        {c.handle}
                      </div>
                      <div className="truncate text-xs text-white/80">
                        {c.dish}
                      </div>
                    </div>
                    <div className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                      <Play className="inline h-3 w-3 -mt-0.5" /> Watch
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Filter chips */}
        <section className="mb-6">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition " +
                  (cat === c
                    ? "border-primary bg-primary text-primary-foreground glow-primary"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground")
                }
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Creator feed grid */}
        <section>
          <h2 className="mb-4 text-lg font-black tracking-tight">
            <Flame className="mr-1.5 inline h-5 w-5 -mt-0.5 text-primary" />
            All Creators Live
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const pct = Math.round(
                ((c.ordersTotal - c.ordersLeft) / c.ordersTotal) * 100
              );
              return (
                <article
                  key={c.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-primary/50"
                >
                  <Link
                    to="/live/$id"
                    params={{ id: c.id }}
                    className="relative block aspect-video overflow-hidden"
                  >
                    <img
                      src={c.cover}
                      alt={c.dish}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                    <div className="absolute left-3 top-3">
                      <span className="live-dot">Live</span>
                    </div>
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                      <Users className="h-3 w-3" /> {c.viewers.toLocaleString()}
                    </div>
                    <div className="absolute inset-x-3 bottom-3">
                      <button className="w-full rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground shadow-lg transition group-hover:scale-[1.02]">
                        Watch Live &amp; Order →
                      </button>
                    </div>
                  </Link>

                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.avatar}
                        alt=""
                        className="h-10 w-10 rounded-full border border-border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-bold">{c.handle}</span>
                          <span className="text-xs text-muted-foreground">
                            · {c.subs} subs
                          </span>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {c.dish} · ${c.price}
                        </div>
                      </div>
                      <div className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs font-bold text-primary">
                        ★ {c.rating}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">
                          {c.ordersLeft} / {c.ordersTotal} orders left
                        </span>
                        <span className="font-bold text-primary">
                          {c.ordersLeft < 10 ? "Almost gone" : "Available"}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-destructive transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
    </>
  );
}

function DailyFeedView() {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Camera className="h-3.5 w-3.5" /> Fresh today
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            Daily Feed
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Photos, teaser clips, and upcoming drops from your favorite creators.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {DAILY_FEED.map((p) => (
          <FeedCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}

function FeedCard({ post }: { post: (typeof DAILY_FEED)[number] }) {
  const isDrop = post.kind === "drop";
  const isClip = post.kind === "clip";
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:border-primary/50 hover:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={post.image}
          alt={post.caption}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Kind badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1">
          {isClip && (
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
              <Play className="h-2.5 w-2.5" /> {post.duration}
            </span>
          )}
          {isDrop && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
              Upcoming
            </span>
          )}
          {post.kind === "photo" && (
            <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
              Photo
            </span>
          )}
        </div>

        {/* Creator */}
        <div className="absolute inset-x-2 bottom-2 flex items-center gap-2">
          <img
            src={post.avatar}
            alt=""
            className="h-7 w-7 rounded-full border-2 border-white/90 object-cover"
          />
          <span className="truncate text-xs font-bold text-white drop-shadow">
            {post.handle}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 p-3">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
          {post.caption}
        </p>

        {isDrop && post.dropTime && (
          <div className="flex items-center justify-between rounded-lg bg-primary/10 px-2.5 py-1.5">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Drops
              </div>
              <div className="truncate text-xs font-black text-foreground">
                {post.dropTime}
              </div>
            </div>
            {post.price && (
              <div className="shrink-0 text-sm font-black text-primary">
                ${post.price}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> {post.likes.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> {post.comments}
            </span>
          </div>
          {isDrop ? (
            <button
              onClick={() =>
                toast.success("You'll be notified", {
                  description: `We'll ping you before ${post.handle}'s drop.`,
                })
              }
              className="flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-bold text-background hover:opacity-90"
            >
              <Bell className="h-3 w-3" /> Notify
            </button>
          ) : (
            <Link
              to="/live/$id"
              params={{ id: post.creatorId }}
              className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground hover:opacity-90"
            >
              Watch
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

