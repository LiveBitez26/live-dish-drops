import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Flame, Clock, Users, ChevronRight, Play, Heart, MessageCircle, Bell, Camera } from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { CartBanner } from "@/components/livebite/CartBanner";
import { CommentDrawer } from "@/components/livebite/CommentDrawer";
import { cn } from "@/lib/utils";
import { getDiscoverCreators } from "@/lib/api/discover";
import { useDailyFeed } from "@/hooks/use-daily-feed";

type DiscoverCreator = Awaited<ReturnType<typeof getDiscoverCreators>>["creators"][number];

export const Route = createFileRoute("/")({
  loader: () => getDiscoverCreators(),
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
  const { creators, error } = Route.useLoaderData();
  const [tab, setTab] = useState<"live" | "feed">("live");
  const live = creators.filter((c) => c.isLive);
  const hero = live.slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            Couldn't load creators: {error}
          </div>
        )}

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
          <LiveDropsView allCreators={creators} liveCreators={live} hero={hero} />
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
  allCreators,
  liveCreators,
  hero,
}: {
  allCreators: DiscoverCreator[];
  liveCreators: DiscoverCreator[];
  hero: DiscoverCreator[];
}) {
  return (
    <>

        {/* Hero: Live Drops Happening Now */}
        {hero.length > 0 && (
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
            </div>

            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
              {hero.map((c) => (
                <div
                  key={c.id}
                  className="group relative w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-surface sm:w-[46%] lg:w-[32%]"
                >
                  <Link to="/live/$id" params={{ id: c.id }} className="relative block aspect-video overflow-hidden">
                    <img
                      src={c.cover}
                      alt={c.dish}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span className="live-dot">Live</span>
                    </div>
                    <div className="absolute right-3 top-3 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                      <Play className="inline h-3 w-3 -mt-0.5" /> Watch
                    </div>
                  </Link>
                  <Link
                    to="/creator/$id"
                    params={{ id: c.id }}
                    className="flex items-center gap-3 p-3 hover:bg-surface-elevated"
                  >
                    <img
                      src={c.avatar}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border-2 border-primary object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold hover:underline">@{c.handle}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.dish}</div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Creator feed grid */}
        <section>
          <h2 className="mb-4 text-lg font-black tracking-tight">
            <Flame className="mr-1.5 inline h-5 w-5 -mt-0.5 text-primary" />
            All Creators
          </h2>
          {allCreators.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
              No creators yet — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allCreators.map((c) => {
                const pct =
                  c.ordersTotal > 0
                    ? Math.round(((c.ordersTotal - c.ordersLeft) / c.ordersTotal) * 100)
                    : 0;
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
                      {c.isLive && (
                        <div className="absolute left-3 top-3">
                          <span className="live-dot">Live</span>
                        </div>
                      )}
                      <div className="absolute inset-x-3 bottom-3">
                        <button className="w-full rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground shadow-lg transition group-hover:scale-[1.02]">
                          {c.isLive ? "Watch Live & Order →" : "View Menu →"}
                        </button>
                      </div>
                    </Link>

                    <Link
                      to="/creator/$id"
                      params={{ id: c.id }}
                      className="flex items-center gap-3 p-4 hover:bg-surface-elevated"
                    >
                      <img
                        src={c.avatar}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-bold hover:underline">@{c.handle}</span>
                          <span className="text-xs text-muted-foreground">
                            · {c.subs} subs
                          </span>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {c.dish}
                          {c.price !== null && ` · $${c.price}`}
                        </div>
                      </div>
                      <div className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs font-bold text-primary">
                        ★ {c.rating}
                      </div>
                    </Link>

                    {c.ordersTotal > 0 && (
                      <div className="px-4 pb-4">
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
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
    </>
  );
}

function DailyFeedView() {
  const { posts, loading } = useDailyFeed();
  const [openPost, setOpenPost] = useState<any>(null);
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

      {!loading && posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          No posts yet — check back after creators start posting.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((p: any) => (
            <FeedCard key={p.id} post={p} onOpenComments={() => setOpenPost(p)} />
          ))}
        </div>
      )}

      <CommentDrawer
        open={!!openPost}
        onClose={() => setOpenPost(null)}
        postHandle={openPost?.creators?.handle ?? ""}
        postImage={openPost?.media_url ?? ""}
        postCaption={openPost?.caption ?? ""}
      />
    </section>
  );
}

function FeedCard({ post, onOpenComments }: { post: any; onOpenComments: () => void }) {
  const isDrop = post.content_type === "upcoming_drop";
  const isClip = post.content_type === "video";
  const handle = post.creators?.handle;
  const avatar = post.creators?.profiles?.avatar_url ?? `https://i.pravatar.cc/100?u=${post.creator_id}`;
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:border-primary/50 hover:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={post.media_url ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=60"}
          alt={post.caption ?? ""}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Kind badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1">
          {isClip && (
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
              <Play className="h-2.5 w-2.5" /> clip
            </span>
          )}
          {isDrop && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
              Upcoming
            </span>
          )}
          {post.content_type === "photo" && (
            <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
              Photo
            </span>
          )}
        </div>

        {/* Creator */}
        {handle && (
          <Link
            to="/creator/$id"
            params={{ id: post.creator_id }}
            className="absolute inset-x-2 bottom-2 flex items-center gap-2"
          >
            <img src={avatar} alt="" className="h-7 w-7 rounded-full border-2 border-white/90 object-cover" />
            <span className="truncate text-xs font-bold text-white drop-shadow hover:underline">@{handle}</span>
          </Link>
        )}
      </div>

      <div className="space-y-2.5 p-3">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
          {post.caption}
        </p>
        <button
          onClick={onOpenComments}
          className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary"
        >
          <MessageCircle className="h-3 w-3" /> {post.likes_count ?? 0} likes
        </button>
      </div>
    </article>
  );
}

