import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Instagram, Music2, Plus, Share2, Star } from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { CartBanner } from "@/components/livebite/CartBanner";
import { StreamChat } from "@/components/livebite/StreamChat";
import { LiveVideoPlayer } from "@/components/LiveVideoPlayer";
import { cartStore } from "@/lib/cart-store";
import { useMenuItems } from "@/hooks/use-menu-items";
import { useAuth } from "@/hooks/use-auth";
import { useMyLatestOrder } from "@/hooks/use-my-latest-order";
import { getCreatorPageData } from "@/lib/api/creators";

export const Route = createFileRoute("/live/$id")({
  loader: ({ params }) => getCreatorPageData({ data: { creatorId: params.id } }),
  head: ({ loaderData }) => {
    const c = loaderData?.creator;
    const title = c ? `${c.handle} is live · LiveBite` : "Live · LiveBite";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: c ? `Watch ${c.handle} cook live and order for instant delivery.` : "Watch food creators live on LiveBite.",
        },
        { property: "og:title", content: title },
        { property: "og:type", content: "video.other" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: LiveView,
});

function LiveView() {
  const { creator, activeStream } = Route.useLoaderData();
  const menu = useMenuItems(creator.id); // realtime — starts from loader data implicitly on first render
  const { profile } = useAuth();
  const myOrder = useMyLatestOrder(profile?.id, creator.id);
  const [tab, setTab] = useState<"menu" | "bio">("menu");
  const profileInfo = (creator as any).profiles;

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

        {/* Stream — real Agora playback, keyed off the active live_streams row */}
        {activeStream ? (
          <div className="relative">
            <LiveVideoPlayer channelName={activeStream.id} />
            <div className="mt-2 flex items-center justify-between">
              <span className="live-dot text-xs">On air</span>
            </div>

            {myOrder && myOrder.status !== "declined" && (
              <div className="mt-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Your order · ${myOrder.total_amount}
                  </span>
                  <span className="font-black uppercase tracking-widest text-primary">
                    {myOrder.status.replace("_", " ")}
                  </span>
                </div>
                {(myOrder as any).estimated_ready_at && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Ready around{" "}
                    {new Date((myOrder as any).estimated_ready_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            )}

            <StreamChat
              streamId={activeStream.id}
              currentUserId={profile?.id}
              currentHandle={(profile as any)?.full_name?.split(" ")[0] ?? "guest"}
              isCreator={false}
              className="mt-3 h-72"
            />
          </div>
        ) : (
          <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-border bg-surface text-sm font-semibold text-muted-foreground">
            {creator.handle} isn't live right now — check the Daily Feed for the next drop time.
          </div>
        )}

        {/* Creator strip */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
          <img
            src={profileInfo?.avatar_url ?? "https://i.pravatar.cc/120"}
            alt=""
            className="h-12 w-12 rounded-full border-2 border-primary object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-bold">@{creator.handle}</span>
              <span className="text-xs text-muted-foreground">· {creator.follower_count} subs</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="font-semibold text-foreground">{creator.rating}</span>
            </div>
          </div>
          <button
            onClick={() => toast.success(`Following @${creator.handle}`)}
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
                (tab === "menu" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              Today's Drop Menu
            </button>
            <button
              onClick={() => setTab("bio")}
              className={
                "flex-1 rounded-lg py-2 text-sm font-bold transition " +
                (tab === "bio" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              Creator Bio &amp; Story
            </button>
          </div>

          {tab === "menu" ? (
            <div className="space-y-3">
              {menu.map((m) => {
                const soldOut = !m.is_available || m.remaining_inventory <= 0;
                const pct = m.total_inventory > 0
                  ? Math.round(((m.total_inventory - m.remaining_inventory) / m.total_inventory) * 100)
                  : 0;
                return (
                  <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
                    <img
                      src={m.image_url ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=60"}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-bold">{m.name}</div>
                        <div className="shrink-0 font-black text-primary">${m.price}</div>
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{m.description}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-elevated">
                          <div className="h-full bg-gradient-to-r from-primary to-destructive" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {soldOut ? "Sold out" : `${m.remaining_inventory} left`}
                        </span>
                      </div>
                    </div>
                    <button
                      disabled={soldOut}
                      onClick={() => {
                        cartStore.add(
                          {
                            id: m.id,
                            name: m.name,
                            desc: m.description ?? "",
                            price: m.price,
                            emoji: "🍽️",
                            left: m.remaining_inventory,
                            total: m.total_inventory,
                          },
                          creator.id,
                          `@${creator.handle}`,
                        );
                        toast.success(`Added ${m.name}`, { description: `From @${creator.handle}` });
                      }}
                      className="shrink-0 rounded-full bg-primary p-2.5 text-primary-foreground glow-primary disabled:opacity-40"
                      aria-label={`Add ${m.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              {menu.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">No menu items posted yet.</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-black">{profileInfo?.full_name ?? creator.handle}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{creator.bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href="#" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold hover:border-primary">
                  <Instagram className="h-3.5 w-3.5" /> Instagram
                </a>
                <a href="#" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold hover:border-primary">
                  <Music2 className="h-3.5 w-3.5" /> TikTok
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
