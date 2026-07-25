import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  DollarSign,
  Mic,
  MicOff,
  Radio,
  Settings,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useMenuItems, setMenuItemAvailability } from "@/hooks/use-menu-items";
import { useRealtimeOrders, useRequestNotificationPermission } from "@/hooks/use-realtime-orders";
import { useAgoraBroadcast } from "@/hooks/use-agora-broadcast";
import { updateOrderStatus } from "@/lib/api/orders";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRef } from "react";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Creator Studio · Go Live · LiveBite" },
      {
        name: "description",
        content:
          "Broadcast dashboard for LiveBite chefs. Go live, watch incoming orders in real time, and manage inventory.",
      },
      { property: "og:title", content: "LiveBite Creator Studio" },
      {
        property: "og:description",
        content: "Camera preview, live viewer count, incoming orders, and sold-out toggles for creators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioDashboard,
});

function StudioDashboard() {
  const { profile, loading: authLoading, isCreator } = useAuth();
  const creatorId = (profile as any)?.creators?.[0]?.id ?? (profile as any)?.creators?.id;

  useRequestNotificationPermission();

  const previewRef = useRef<HTMLDivElement>(null);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [viewers, setViewers] = useState(0);
  const broadcast = useAgoraBroadcast();
  const live = broadcast.state === "live";
  const mic = broadcast.micOn;
  const cam = broadcast.camOn;

  const orders = useRealtimeOrders(creatorId);
  const inventory = useMenuItems(creatorId);

  // Lightweight viewer-count polling while live (swap for your real stream
  // provider's viewer webhook/analytics if you have one).
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      setViewers((v) => Math.max(0, v + Math.floor(Math.random() * 20) - 8));
    }, 5000);
    return () => clearInterval(t);
  }, [live]);

  async function toggleLive() {
    if (!creatorId) return;
    const supabase = getSupabaseBrowserClient();

    if (!live) {
      // 1. create the live_streams row first — its id becomes the Agora channel name
      const { data: stream, error } = await supabase
        .from("live_streams")
        .insert({ creator_id: creatorId, status: "live", started_at: new Date().toISOString() })
        .select()
        .single();
      if (error || !stream || !previewRef.current) {
        toast.error("Couldn't start stream", { description: error?.message });
        return;
      }
      setCurrentStreamId(stream.id);

      // 2. connect to Agora using that stream id as the channel name
      await broadcast.start(stream.id, previewRef.current);
      await supabase.from("creators").update({ is_live: true }).eq("id", creatorId);

      toast("You're live!", { description: "Fans are being notified across LiveBite." });
    } else {
      await broadcast.stop();
      if (currentStreamId) {
        await supabase
          .from("live_streams")
          .update({ status: "ended", ended_at: new Date().toISOString() })
          .eq("id", currentStreamId);
      }
      await supabase.from("creators").update({ is_live: false }).eq("id", creatorId);
      setCurrentStreamId(null);

      toast("Stream ended", { description: "Nice drop. Order flow paused." });
    }
  }

  async function acceptOrder(orderId: string) {
    try {
      await updateOrderStatus({ data: { orderId, status: "accepted" } });
      toast.success(`Order accepted — dispatching delivery`);
    } catch (err) {
      toast.error("Couldn't accept order", { description: (err as Error).message });
    }
  }

  async function declineOrder(orderId: string) {
    try {
      await updateOrderStatus({ data: { orderId, status: "declined" } });
      toast(`Order declined`);
    } catch (err) {
      toast.error("Couldn't decline order", { description: (err as Error).message });
    }
  }

  const revenue = orders
    .filter((o) => o.status !== "declined")
    .reduce((s, o) => s + o.total_amount, 0);

  if (authLoading) {
    return (
      <div className="theme-dark grid min-h-screen place-items-center bg-background text-muted-foreground">
        Loading studio…
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="theme-dark grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <p className="text-lg font-bold">This page is for creators only.</p>
          <Link to="/" className="mt-2 inline-block text-sm text-primary underline">
            Back to LiveBite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-dark min-h-screen bg-background pb-24 md:pb-10">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Exit studio
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Creator Studio
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* LEFT: Camera + controls */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
              <div className="relative aspect-video w-full">
                {/* Agora renders the local camera track into this element once live */}
                <div ref={previewRef} className="absolute inset-0 h-full w-full bg-black" />
                {!live && (
                  <div className="absolute inset-0 grid place-items-center bg-black text-muted-foreground">
                    <span className="text-sm">Camera preview — press "Go Live" to start</span>
                  </div>
                )}
                {live && !cam && (
                  <div className="absolute inset-0 grid place-items-center bg-black text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 text-sm font-semibold">
                      <VideoOff className="h-8 w-8" /> Camera off
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />

                <div className="absolute left-3 top-3 flex items-center gap-2">
                  {live ? (
                    <span className="live-dot">
                      <Radio className="h-3 w-3" /> On air
                    </span>
                  ) : (
                    <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Off air
                    </span>
                  )}
                  <span className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    <Users className="h-3 w-3" /> {viewers.toLocaleString()}
                  </span>
                </div>
                <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  1080p · 60fps
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <div className="flex gap-2">
                    <IconToggle active={mic} onClick={broadcast.toggleMic} onIcon={Mic} offIcon={MicOff} />
                    <IconToggle active={cam} onClick={broadcast.toggleCam} onIcon={Video} offIcon={VideoOff} />
                    <button className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/60 text-white hover:bg-black/80">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={toggleLive}
                    className={cn(
                      "rounded-full px-5 py-2.5 text-sm font-black uppercase tracking-widest transition",
                      live
                        ? "bg-white text-black hover:bg-white/90"
                        : "bg-destructive text-destructive-foreground glow-primary"
                    )}
                  >
                    {live ? "End stream" : "Go Live"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Viewers" value={viewers.toLocaleString()} icon={<Users className="h-4 w-4" />} accent />
              <Stat label="Orders" value={orders.length.toString()} icon={<Camera className="h-4 w-4" />} />
              <Stat label="Revenue" value={`$${revenue.toFixed(2)}`} icon={<DollarSign className="h-4 w-4" />} />
            </div>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                  Today's drop menu
                </h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  Tap toggle to mark sold out
                </span>
              </div>
              <ul className="space-y-2">
                {inventory.map((m) => {
                  const soldOut = !m.is_available || m.remaining_inventory <= 0;
                  return (
                    <li
                      key={m.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border border-border bg-surface-elevated p-3 transition",
                        soldOut && "opacity-60"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("truncate text-sm font-bold", soldOut && "line-through")}>
                            {m.name}
                          </span>
                          <span className="shrink-0 text-xs font-bold text-primary">${m.price}</span>
                        </div>
                        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {soldOut ? "Sold out" : `${m.remaining_inventory} of ${m.total_inventory} left`}
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={!m.is_available}
                        onChange={async (v) => {
                          try {
                            await setMenuItemAvailability(m.id, !v);
                            toast(v ? `${m.name} marked sold out` : `${m.name} available again`);
                          } catch (err) {
                            toast.error("Update failed", { description: (err as Error).message });
                          }
                        }}
                        label={`Mark ${m.name} sold out`}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          {/* RIGHT: Incoming orders */}
          <aside className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Incoming orders
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-destructive">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                Live
              </span>
            </div>

            <ul className="space-y-2">
              {orders.length === 0 && (
                <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Waiting for your first order…
                </li>
              )}
              {orders.map((o, i) => (
                <li
                  key={o.id}
                  className={cn(
                    "rounded-xl border p-3 transition",
                    i === 0 ? "border-primary/60 bg-primary/10" : "border-border bg-surface-elevated"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      #{o.id.slice(0, 6)} · {new Date(o.created_at).toLocaleTimeString()}
                    </span>
                    <span className="font-black text-primary">${o.total_amount}</span>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {o.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
                  </div>
                  {o.status === "pending" && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => acceptOrder(o.id)}
                        className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-bold text-primary-foreground"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineOrder(o.id)}
                        className="rounded-lg border border-border px-3 text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {o.status !== "pending" && (
                    <div className="mt-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                      {o.status.replace("_", " ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}

function IconToggle({
  active,
  onClick,
  onIcon: On,
  offIcon: Off,
}: {
  active: boolean;
  onClick: () => void;
  onIcon: React.ComponentType<{ className?: string }>;
  offIcon: React.ComponentType<{ className?: string }>;
}) {
  const Icon = active ? On : Off;
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full border transition",
        active
          ? "border-white/20 bg-black/60 text-white hover:bg-black/80"
          : "border-destructive/60 bg-destructive/20 text-destructive"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border p-4", accent ? "border-primary/40 bg-primary/10" : "border-border bg-surface")}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition",
        checked ? "border-destructive bg-destructive" : "border-border bg-surface"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 grid h-4 w-4 place-items-center rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
