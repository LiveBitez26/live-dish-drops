import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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
  Star,
  Users,
} from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { CartBanner } from "@/components/livebite/CartBanner";
import { CommentDrawer } from "@/components/livebite/CommentDrawer";
import { CREATORS, DAILY_FEED } from "@/lib/livebite-data";
import type { Creator, DailyPost } from "@/lib/livebite-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/creator/$id")({
  loader: ({ params }): { creator: Creator } => {
    const creator = CREATORS.find((c) => c.id === params.id);
    if (!creator) throw notFound();
    return { creator };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.creator;
    const title = c ? `${c.handle} · LiveBite` : "Creator · LiveBite";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: c
            ? `${c.handle} — ${c.bio}. Follow their drop calendar and reviews on LiveBite.`
            : "Creator profile on LiveBite.",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: c ? c.bio : "" },
        ...(c
          ? [
              { property: "og:image", content: c.cover },
              { name: "twitter:image", content: c.cover },
            ]
          : []),
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CreatorProfile,
});

type TabKey = "posts" | "calendar" | "reviews";

function CreatorProfile() {
  const { creator } = Route.useLoaderData();
  const [tab, setTab] = useState<TabKey>("posts");
  const [following, setFollowing] = useState(false);
  const [notify, setNotify] = useState(false);
  const [openPost, setOpenPost] = useState<DailyPost | null>(null);

  const posts = DAILY_FEED.filter((p) => p.creatorId === creator.id);
  const drops = MOCK_DROPS(creator);
  const reviews = MOCK_REVIEWS;

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
            <img src={creator.cover} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
          </div>

          <div className="px-5 pb-5">
            <div className="-mt-12 flex items-end justify-between gap-3">
              <img
                src={creator.avatar}
                alt={creator.name}
                className="h-24 w-24 rounded-2xl border-4 border-surface object-cover shadow-md"
              />
              <div className="flex gap-2 pt-12">
                <button
                  onClick={() => {
                    setFollowing((v) => !v);
                    toast.success(following ? "Unfollowed" : `Following ${creator.handle}`);
                  }}
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
                    toast.success(
                      notify ? "Notifications off" : `You'll be notified for ${creator.handle}`
                    );
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
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-2xl font-black tracking-tight">{creator.handle}</h1>
                <span className="text-sm text-muted-foreground">· {creator.name}</span>
              </div>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{creator.bio}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <Stat icon={<Users className="h-4 w-4" />} label="followers" value={creator.subs} />
                <Stat
                  icon={<Star className="h-4 w-4 fill-primary text-primary" />}
                  label={`${reviews.length} reviews`}
                  value={creator.rating.toFixed(1)}
                />
                <Stat
                  icon={<MapPin className="h-4 w-4 text-primary" />}
                  label="Downtown · 1.4 mi"
                  value=""
                />
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  {creator.category}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-xl border border-border bg-surface p-1 shadow-sm">
          <TabBtn active={tab === "posts"} onClick={() => setTab("posts")}>
            Posts & Clips
          </TabBtn>
          <TabBtn active={tab === "calendar"} onClick={() => setTab("calendar")}>
            Drop Calendar
          </TabBtn>
          <TabBtn active={tab === "reviews"} onClick={() => setTab("reviews")}>
            Customer Reviews
          </TabBtn>
        </div>

        <div className="mt-5">
          {tab === "posts" && (
            <PostsGrid posts={posts} onOpen={(p) => setOpenPost(p)} />
          )}
          {tab === "calendar" && <DropCalendar drops={drops} creatorId={creator.id} />}
          {tab === "reviews" && (
            <ReviewList reviews={reviews} rating={creator.rating} handle={creator.handle} />
          )}
        </div>
      </main>

      <CartBanner />

      <CommentDrawer
        open={!!openPost}
        onClose={() => setOpenPost(null)}
        postHandle={openPost?.handle ?? ""}
        postImage={openPost?.image ?? ""}
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
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function PostsGrid({
  posts,
  onOpen,
}: {
  posts: DailyPost[];
  onOpen: (p: DailyPost) => void;
}) {
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
        <article
          key={p.id}
          className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
        >
          <div className="relative aspect-square overflow-hidden">
            <img
              src={p.image}
              alt={p.caption}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
            {p.kind === "clip" && (
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
                <Play className="h-2.5 w-2.5" /> {p.duration}
              </span>
            )}
            {p.kind === "drop" && (
              <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                Drop
              </span>
            )}
            <div className="absolute inset-x-2 bottom-2 flex items-center justify-between text-white drop-shadow">
              <span className="flex items-center gap-1 text-[11px] font-bold">
                <Heart className="h-3 w-3" /> {p.likes.toLocaleString()}
              </span>
              <button
                onClick={() => onOpen(p)}
                className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold backdrop-blur hover:bg-black/80"
                aria-label="Open comments"
              >
                <MessageCircle className="h-3 w-3" /> {p.comments}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

type Drop = {
  id: string;
  date: string;
  weekday: string;
  time: string;
  title: string;
  price: number;
  spots: number;
  status: "upcoming" | "live" | "past";
};

function MOCK_DROPS(c: Creator): Drop[] {
  return [
    {
      id: "d-live",
      date: "Today",
      weekday: "Now",
      time: "Live",
      title: c.dish,
      price: c.price,
      spots: c.ordersLeft,
      status: "live",
    },
    {
      id: "d-1",
      date: "Fri Jul 31",
      weekday: "Fri",
      time: "6:30 PM",
      title: `${c.category} Late-Night Special`,
      price: c.price + 2,
      spots: 40,
      status: "upcoming",
    },
    {
      id: "d-2",
      date: "Sat Aug 1",
      weekday: "Sat",
      time: "1:00 PM",
      title: `Weekend Family Bundle`,
      price: c.price + 8,
      spots: 25,
      status: "upcoming",
    },
    {
      id: "d-3",
      date: "Wed Aug 5",
      weekday: "Wed",
      time: "7:00 PM",
      title: `Collab: ${c.handle} × @SourdoughSam`,
      price: c.price + 4,
      spots: 30,
      status: "upcoming",
    },
    {
      id: "d-past",
      date: "Mon Jul 27",
      weekday: "Mon",
      time: "Sold out",
      title: `${c.dish} — batch #14`,
      price: c.price,
      spots: 0,
      status: "past",
    },
  ];
}

function DropCalendar({ drops, creatorId }: { drops: Drop[]; creatorId: string }) {
  return (
    <ul className="space-y-3">
      {drops.map((d) => (
        <li
          key={d.id}
          className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm"
        >
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-surface-elevated text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {d.weekday}
            </div>
            <div className="text-sm font-black leading-tight">{d.date.split(" ").slice(-1)[0]}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-bold">{d.title}</span>
              {d.status === "live" && <span className="live-dot">Live</span>}
              {d.status === "past" && (
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Past
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> {d.date} · {d.time}
              {d.status === "upcoming" && (
                <span className="ml-1 font-semibold text-foreground">
                  · {d.spots} spots
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-black text-primary">${d.price}</div>
            {d.status === "live" ? (
              <Link
                to="/live/$id"
                params={{ id: creatorId }}
                className="mt-1 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground glow-primary"
              >
                Watch
              </Link>
            ) : d.status === "upcoming" ? (
              <button
                onClick={() =>
                  toast.success("Pre-ordered", { description: `${d.date} · ${d.time}` })
                }
                className="mt-1 rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
              >
                Pre-order
              </button>
            ) : (
              <span className="mt-1 inline-block text-xs font-semibold text-muted-foreground">
                Sold out
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

type Review = {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  time: string;
  dish: string;
  text: string;
};

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    user: "sarah.k",
    avatar: "https://i.pravatar.cc/80?img=47",
    rating: 5,
    time: "2 days ago",
    dish: "Birria Tacos (3)",
    text: "Best birria I've had outside of Jalisco. Consommé was rich, tortillas perfectly crisp.",
  },
  {
    id: "r2",
    user: "mike_eats",
    avatar: "https://i.pravatar.cc/80?img=15",
    rating: 5,
    time: "5 days ago",
    dish: "Quesabirria Combo",
    text: "Watching him prep and getting it hot 20 min later feels illegal. Instant follow.",
  },
  {
    id: "r3",
    user: "priya.j",
    avatar: "https://i.pravatar.cc/80?img=25",
    rating: 4,
    time: "1 week ago",
    dish: "Consommé Cup",
    text: "Loved the broth, wish there was a spicier option. Delivery was 12 min flat.",
  },
  {
    id: "r4",
    user: "devon.b",
    avatar: "https://i.pravatar.cc/80?img=51",
    rating: 5,
    time: "2 weeks ago",
    dish: "Birria Tacos (3)",
    text: "The livestream sold me. Watched the whole cook and it delivered — literally.",
  },
];

function ReviewList({
  reviews,
  rating,
  handle,
}: {
  reviews: Review[];
  rating: number;
  handle: string;
}) {
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
              <Star
                key={s}
                className={cn(
                  "h-4 w-4",
                  s <= Math.round(rating)
                    ? "fill-primary text-primary"
                    : "text-border"
                )}
              />
            ))}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {reviews.length} verified orders
          </div>
        </div>
        <div className="space-y-1.5">
          {buckets.map((b) => (
            <div key={b.stars} className="flex items-center gap-2 text-xs">
              <span className="w-6 font-semibold text-muted-foreground">{b.stars}★</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(b.count / total) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-muted-foreground">{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <img src={r.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold">@{r.user}</span>
                  <span className="text-[11px] text-muted-foreground">· {r.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-3 w-3",
                        s <= r.rating ? "fill-primary text-primary" : "text-border"
                      )}
                    />
                  ))}
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    · ordered {r.dish}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{r.text}</p>
            <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
              <button className="flex items-center gap-1 hover:text-primary">
                <Heart className="h-3 w-3" /> Helpful
              </button>
              <span>· Verified order from {handle}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
