import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Heart,
  MapPin,
  MessageCircle,
  Play,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { CartBanner } from "@/components/livebite/CartBanner";
import { CommentDrawer } from "@/components/livebite/CommentDrawer";
import { useAuth } from "@/hooks/use-auth";
import { useDailyFeed } from "@/hooks/use-daily-feed";
import { getCreatorPageData } from "@/lib/api/creators";
import { scheduleDrop, toggleFollow } from "@/lib/api/creator-profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/creator/$id")({
  loader: ({ params }) => getCreatorPageData({ data: { creatorId: params.id } }),
  head: ({ loaderData }) => {
    const c = loaderData?.creator;
    const title = c ? `@${c.handle} · LiveBite` : "Creator · LiveBite";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: c ? `@${c.handle} — follow their drop calendar and reviews on LiveBite.` : "Creator profile on LiveBite.",
        },
        { property: "og:title", content: title },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CreatorProfile,
});

type TabKey = "posts" | "calendar" | "reviews";
const KITCHEN_TYPE_LABEL: Record<string, string> = {
  licensed_commercial: "Licensed Kitchen",
  food_truck: "Food Truck",
  ghost_kitchen: "Ghost Kitchen",
  home_kitchen: "Home Kitchen",
};

function CreatorProfile() {
  const { creator, activeStream, reviews, upcomingDrops, isFollowing } = Route.useLoaderData();
  const { profile } = useAuth();
  const { posts: allPosts } = useDailyFeed();
  const [tab, setTab] = useState<TabKey>("posts");
  const [following, setFollowing] = useState(isFollowing);
  const [notify, setNotify] = useState(false);
  const [openPost, setOpenPost] = useState<any>(null);

  const profileInfo = (creator as any).profiles;
  const myCreators = (profile as any)?.creators;
  const myCreatorId = Array.isArray(myCreators) ? myCreators[0]?.id : myCreators?.id;
  const isOwner = Boolean(myCreatorId && myCreatorId === creator.id);
  const posts = allPosts.filter((p: any) => p.creator_id === creator.id);

  async function handleFollow() {
    if (!profile) {
      toast.error("Log in to follow creators");
      return;
    }
    try {
      const result = await toggleFollow({ data: { creatorId: creator.id } });
      setFollowing(result.following);
      toast.success(result.following ? `Following @${creator.handle}` : "Unfollowed");
    } catch (err) {
      toast.error("Couldn't update follow status", { description: (err as Error).message });
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-5">
        <div className="mb-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        {/* Cover + header */}
        <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
          <div className="relative h-40 sm:h-52">
            <img
              src={creator.banner_url ?? "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=60"}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
          </div>

          <div className="px-5 pb-5">
            <div className="-mt-12 flex items-end justify-between gap-3">
              <img
                src={profileInfo?.avatar_url ?? `https://i.pravatar.cc/150?u=${creator.id}`}
                alt={creator.handle}
                className="h-24 w-24 rounded-2xl border-4 border-surface object-cover shadow-md"
              />
              {!isOwner && (
                <div className="flex gap-2 pt-12">
                  <button
                    onClick={handleFollow}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-bold transition shadow-sm",
                      following
                        ? "border border-border bg-surface text-foreground"
                        : "bg-primary text-primary-foreground glow-primary"
                    )}
                  >
                    {following ? "Following" : "+ Follow"}
                  </button>
                  <button
                    onClick={() => {
                      setNotify((v) => !v);
                      toast.success(notify ? "Notifications off" : `You'll be notified for @${creator.handle}`);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition shadow-sm",
                      notify
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-foreground hover:border-primary/60"
                    )}
                    aria-pressed={notify}
                  >
                    <Bell className={cn("h-4 w-4", notify && "fill-primary")} /> Notify
                  </button>
                </div>
              )}
              {isOwner && (
                <Link
                  to="/studio"
                  className="mt-12 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-foreground hover:border-primary/60"
                >
                  Manage in Studio
                </Link>
              )}
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-2xl font-black tracking-tight">@{creator.handle}</h1>
                {activeStream && <span className="live-dot">Live now</span>}
              </div>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{creator.bio}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <Stat icon={<Users className="h-4 w-4" />} label="followers" value={String(creator.follower_count)} />
                <Stat
                  icon={<Star className="h-4 w-4 fill-primary text-primary" />}
                  label={`${reviews.length} reviews`}
                  value={creator.rating.toFixed(1)}
                />
                {creator.location && (
                  <Stat icon={<MapPin className="h-4 w-4 text-primary" />} label={creator.location} value="" />
                )}
                {creator.kitchen_type && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {KITCHEN_TYPE_LABEL[creator.kitchen_type] ?? creator.kitchen_type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-xl border border-border bg-surface p-1 shadow-sm">
          <TabBtn active={tab === "posts"} onClick={() => setTab("posts")}>
            Posts &amp; Clips
          </TabBtn>
          <TabBtn active={tab === "calendar"} onClick={() => setTab("calendar")}>
            Drop Calendar
          </TabBtn>
          <TabBtn active={tab === "reviews"} onClick={() => setTab("reviews")}>
            Customer Reviews
          </TabBtn>
        </div>

        <div className="mt-5">
          {tab === "posts" && <PostsGrid posts={posts} onOpen={(p) => setOpenPost(p)} />}
          {tab === "calendar" && (
            <DropCalendar
              drops={upcomingDrops}
              creatorId={creator.id}
              isOwner={isOwner}
              activeStream={activeStream}
            />
          )}
          {tab === "reviews" && <ReviewList reviews={reviews} rating={creator.rating} handle={creator.handle} />}
        </div>
      </main>

      <CartBanner />

      <CommentDrawer
        open={!!openPost}
        onClose={() => setOpenPost(null)}
        postHandle={creator.handle}
        postImage={openPost?.media_url ?? ""}
        postCaption={openPost?.caption ?? ""}
      />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      {icon}
      {value && <span className="font-black text-foreground">{value}</span>}
      <span>{label}</span>
    </span>
  );
}

function TabBtn({
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
        "flex-1 rounded-lg py-2 text-sm font-bold transition",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function PostsGrid({ posts, onOpen }: { posts: any[]; onOpen: (p: any) => void }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground shadow-sm">
        No posts yet — check back after the next drop.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {posts.map((p) => (
        <article key={p.id} className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="relative aspect-square overflow-hidden">
            <img
              src={p.media_url ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=60"}
              alt={p.caption ?? ""}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
            {p.content_type === "video" && (
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
                <Play className="h-2.5 w-2.5" /> clip
              </span>
            )}
            {p.content_type === "upcoming_drop" && (
              <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                Drop
              </span>
            )}
            <div className="absolute inset-x-2 bottom-2 flex items-center justify-between text-white drop-shadow">
              <span className="flex items-center gap-1 text-[11px] font-bold">
                <Heart className="h-3 w-3" /> {p.likes_count ?? 0}
              </span>
              <button
                onClick={() => onOpen(p)}
                className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold backdrop-blur hover:bg-black/80"
                aria-label="Open comments"
              >
                <MessageCircle className="h-3 w-3" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function DropCalendar({
  drops,
  creatorId,
  isOwner,
  activeStream,
}: {
  drops: any[];
  creatorId: string;
  isOwner: boolean;
  activeStream: any;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !when) return;
    setSubmitting(true);
    try {
      await scheduleDrop({ data: { creatorId, title, scheduledAt: new Date(when).toISOString() } });
      toast.success("Drop scheduled!");
      setShowForm(false);
      setTitle("");
      setWhen("");
      window.location.reload();
    } catch (err) {
      toast.error("Couldn't schedule drop", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      {isOwner && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-bold text-primary"
            >
              <Plus className="h-4 w-4" /> Schedule a drop
            </button>
          ) : (
            <form onSubmit={handleAdd} className="space-y-2 rounded-2xl border border-border bg-surface p-4">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Birria Special"
                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
              />
              <input
                required
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-bold text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeStream && (
        <div className="flex items-center gap-4 rounded-2xl border border-primary/40 bg-primary/10 p-4">
          <span className="live-dot shrink-0">Live</span>
          <span className="flex-1 text-sm font-bold">Streaming right now</span>
          <Link
            to="/live/$id"
            params={{ id: creatorId }}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            Watch
          </Link>
        </div>
      )}

      {drops.length === 0 && !activeStream && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          No upcoming drops scheduled yet.
        </div>
      )}

      <ul className="space-y-3">
        {drops.map((d) => {
          const date = new Date(d.scheduled_at);
          return (
            <li key={d.id} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-surface-elevated text-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {date.toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div className="text-sm font-black leading-tight">{date.getDate()}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{d.title}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                  {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </div>
                {d.description && <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReviewList({ reviews, rating, handle }: { reviews: any[]; rating: number; handle: string }) {
  const buckets = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));
  const total = reviews.length || 1;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:grid-cols-[auto_1fr]">
        <div className="text-center sm:border-r sm:border-border sm:pr-6">
          <div className="text-4xl font-black">{rating.toFixed(1)}</div>
          <div className="mt-1 flex justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("h-4 w-4", s <= Math.round(rating) ? "fill-primary text-primary" : "text-border")} />
            ))}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{reviews.length} verified orders</div>
        </div>
        <div className="space-y-1.5">
          {buckets.map((b) => (
            <div key={b.stars} className="flex items-center gap-2 text-xs">
              <span className="w-6 font-semibold text-muted-foreground">{b.stars}★</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                <div className="h-full bg-primary" style={{ width: `${(b.count / total) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-muted-foreground">{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          No reviews yet — reviews appear after a customer's order is delivered.
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-surface-elevated text-sm font-bold">
                  {(r.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">{r.profiles?.full_name ?? "A customer"}</span>
                    <span className="text-[11px] text-muted-foreground">
                      · {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-3 w-3", s <= r.rating ? "fill-primary text-primary" : "text-border")} />
                    ))}
                  </div>
                </div>
              </div>
              {r.body && <p className="mt-3 text-sm leading-relaxed text-foreground">{r.body}</p>}
              <div className="mt-3 text-[11px] font-semibold text-muted-foreground">Verified order from {handle}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
