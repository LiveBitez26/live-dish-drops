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
import { CREATORS } from "@/lib/livebite-data";
import { cn } from "@/lib/utils";

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

type OrderNotif = {
  id: string;
  customer: string;
  item: string;
  qty: number;
  price: number;
  time: string;
};

const SEED_ORDERS: OrderNotif[] = [
  { id: "104", customer: "Sarah K.", item: "Birria Tacos (3)", qty: 2, price: 28, time: "just now" },
  { id: "103", customer: "Mike R.", item: "Quesabirria Combo", qty: 1, price: 17, time: "1m ago" },
  { id: "102", customer: "Priya J.", item: "Consommé Cup", qty: 3, price: 15, time: "3m ago" },
];

const INCOMING_POOL = [
  { customer: "Ali M.", item: "Birria Tacos (3)", price: 14 },
  { customer: "Nina R.", item: "Quesabirria Combo", price: 17 },
  { customer: "Chris P.", item: "Consommé Cup", price: 5 },
  { customer: "Jordan L.", item: "Birria Tacos (3)", price: 14 },
  { customer: "Riya S.", item: "Quesabirria Combo", price: 17 },
];

function StudioDashboard() {
  const me = CREATORS[0]; // ChefMarco as the studio owner
  const [live, setLive] = useState(true);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [viewers, setViewers] = useState(me.viewers);
  const [orders, setOrders] = useState<OrderNotif[]>(SEED_ORDERS);
  const [inventory, setInventory] = useState(() =>
    me.menu.map((m) => ({ ...m, soldOut: false }))
  );

  // simulate incoming orders + viewer drift while live
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      setViewers((v) => Math.max(400, v + Math.floor(Math.random() * 30) - 12));
      if (Math.random() > 0.55) {
        const pick = INCOMING_POOL[Math.floor(Math.random() * INCOMING_POOL.length)];
        const newOrder: OrderNotif = {
          id: String(105 + Math.floor(Math.random() * 900)),
          customer: pick.customer,
          item: pick.item,
          qty: 1 + Math.floor(Math.random() * 2),
          price: pick.price,
          time: "just now",
        };
        setOrders((prev) => [newOrder, ...prev].slice(0, 8));
        toast.success(`New order · ${newOrder.customer}`, {
          description: `${newOrder.qty}× ${newOrder.item}`,
        });
      }
    }, 4500);
    return () => clearInterval(t);
  }, [live]);

  const revenue = orders.reduce((s, o) => s + o.price * o.qty, 0);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
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
            {/* Camera preview */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
              <div className="relative aspect-video w-full">
                {cam ? (
                  <img
                    src={me.cover}
                    alt="Camera preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-black text-muted-foreground">
                    <div className="flex flex-col items-center gap-2 text-sm font-semibold">
                      <VideoOff className="h-8 w-8" /> Camera off
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />

                {/* Top overlays */}
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

                {/* Bottom controls */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <div className="flex gap-2">
                    <IconToggle active={mic} onClick={() => setMic((v) => !v)} onIcon={Mic} offIcon={MicOff} />
                    <IconToggle active={cam} onClick={() => setCam((v) => !v)} onIcon={Video} offIcon={VideoOff} />
                    <button className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/60 text-white hover:bg-black/80">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setLive((v) => {
                        const next = !v;
                        toast(next ? "You're live!" : "Stream ended", {
                          description: next
                            ? "Fans are being notified across LiveBite."
                            : "Nice drop. Order flow paused.",
                        });
                        return next;
                      });
                    }}
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

            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Viewers" value={viewers.toLocaleString()} icon={<Users className="h-4 w-4" />} accent />
              <Stat label="Orders" value={orders.length.toString()} icon={<Camera className="h-4 w-4" />} />
              <Stat label="Revenue" value={`$${revenue}`} icon={<DollarSign className="h-4 w-4" />} />
            </div>

            {/* Inventory */}
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
                {inventory.map((m, i) => (
                  <li
                    key={m.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-border bg-surface-elevated p-3 transition",
                      m.soldOut && "opacity-60"
                    )}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-xl">
                      {m.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("truncate text-sm font-bold", m.soldOut && "line-through")}>
                          {m.name}
                        </span>
                        <span className="shrink-0 text-xs font-bold text-primary">${m.price}</span>
                      </div>
                      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {m.soldOut ? "Sold out" : `${m.left} of ${m.total} left`}
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={m.soldOut}
                      onChange={(v) => {
                        setInventory((prev) => {
                          const next = [...prev];
                          next[i] = { ...next[i], soldOut: v };
                          return next;
                        });
                        toast(v ? `${m.name} marked sold out` : `${m.name} available again`);
                      }}
                      label={`Mark ${m.name} sold out`}
                    />
                  </li>
                ))}
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
                    i === 0
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-surface-elevated"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      #{o.id} · {o.time}
                    </span>
                    <span className="font-black text-primary">${o.price * o.qty}</span>
                  </div>
                  <div className="mt-1 truncate text-sm font-bold">{o.customer}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {o.qty}× {o.item}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => toast.success(`Order #${o.id} accepted`)}
                      className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-bold text-primary-foreground"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        setOrders((prev) => prev.filter((p) => p.id !== o.id));
                        toast(`Order #${o.id} declined`);
                      }}
                      className="rounded-lg border border-border px-3 text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
                    >
                      Decline
                    </button>
                  </div>
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
    <div
      className={cn(
        "rounded-2xl border p-4",
        accent ? "border-primary/40 bg-primary/10" : "border-border bg-surface"
      )}
    >
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
