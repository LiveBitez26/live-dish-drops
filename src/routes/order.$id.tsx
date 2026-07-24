import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, ChefHat, MapPin, ShieldCheck, Truck } from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { VideoPlayer } from "@/components/livebite/VideoPlayer";
import { getCreator } from "@/lib/livebite-data";
import { cartStore, useCart, cartTotal } from "@/lib/cart-store";

export const Route = createFileRoute("/order/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Order #${params.id} — Live prep · LiveBite` },
      {
        name: "description",
        content: "Watch your order being assembled live and follow it to your door.",
      },
      { property: "og:title", content: `Order #${params.id} — Live prep` },
      { property: "og:description", content: "Live kitchen prep and delivery tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderTracker,
});

const STEPS = [
  { key: "confirmed", label: "Order Confirmed", icon: Check },
  { key: "prep", label: "Live Kitchen Prep", icon: ChefHat },
  { key: "sealed", label: "Quality Check & Sealed", icon: ShieldCheck },
  { key: "delivery", label: "Out for Delivery via DoorDash Drive", icon: Truck },
] as const;

function OrderTracker() {
  const { id } = Route.useParams();
  const cart = useCart();
  const total = cartTotal(cart);
  const creator = getCreator(cart[0]?.creatorId ?? "chefmarco");
  const [view, setView] = useState<"kitchen" | "map">("kitchen");
  const activeStep = 1; // Live Kitchen Prep

  useEffect(() => {
    // fire once on mount
    const t = setTimeout(() => {
      toast.success(`Order #${id} submitted!`, {
        description: `${creator.handle} is starting your batch.`,
      });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Order #{id}
          </span>
        </div>

        {/* Toggle */}
        <div className="mb-3 inline-flex rounded-full border border-border bg-surface p-1 text-xs font-bold">
          <button
            onClick={() => setView("kitchen")}
            className={
              "rounded-full px-3 py-1.5 transition " +
              (view === "kitchen"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground")
            }
          >
            Kitchen Prep Stream
          </button>
          <button
            onClick={() => setView("map")}
            className={
              "rounded-full px-3 py-1.5 transition " +
              (view === "map"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground")
            }
          >
            Driver Delivery Map
          </button>
        </div>

        {view === "kitchen" ? (
          <VideoPlayer
            cover={creator.cover}
            handle={creator.handle}
            viewers={creator.viewers}
            topRight={
              <div className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                Assembling Order #{id} · YOUR ORDER
              </div>
            }
            bottom={
              <div className="w-full bg-gradient-to-t from-black/90 to-transparent px-4 py-4">
                <div className="rounded-xl border border-primary/40 bg-black/60 p-3 backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-widest text-primary">
                    Live status
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Chef {creator.name.split(" ")[0]} is assembling Order #{id} (your order!)
                  </div>
                </div>
              </div>
            }
          />
        ) : (
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-surface">
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80"
              alt="Map"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
            <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              Driver: Jordan · Toyota Prius · ETA 14 min
            </div>
            <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground glow-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-xl border border-border bg-surface/90 p-3 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Route
              </div>
              <div className="text-sm font-semibold">
                {creator.handle}'s kitchen → 24 Market St · 1.4 mi
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-muted-foreground">
            Timeline
          </h2>
          <ol className="space-y-4">
            {STEPS.map((s, i) => {
              const state =
                i < activeStep ? "done" : i === activeStep ? "active" : "pending";
              const Icon = s.icon;
              return (
                <li key={s.key} className="flex items-start gap-3">
                  <div
                    className={
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 " +
                      (state === "done"
                        ? "border-primary bg-primary text-primary-foreground"
                        : state === "active"
                        ? "border-destructive bg-destructive/20 text-destructive animate-pulse"
                        : "border-border bg-surface-elevated text-muted-foreground")
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{s.label}</span>
                      {state === "active" && (
                        <span className="live-dot">Live</span>
                      )}
                      {state === "done" && (
                        <span className="text-xs font-bold text-primary">Completed ✓</span>
                      )}
                      {state === "pending" && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          Pending
                        </span>
                      )}
                    </div>
                    {state === "active" && (
                      <div className="text-xs text-muted-foreground">
                        Video feed playing above · ~6 min remaining
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Order summary */}
        <section className="mt-4 rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-muted-foreground">
            Your order
          </h2>
          {cart.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Sample order — 1x {creator.menu[0].name}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {cart.map((l) => (
                <li key={l.item.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-xl">{l.item.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{l.item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.creatorHandle} · Qty {l.qty}
                    </div>
                  </div>
                  <div className="shrink-0 font-bold">
                    ${(l.item.price * l.qty).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold text-muted-foreground">Total</span>
            <span className="text-lg font-black text-primary">
              ${(cart.length ? total : creator.menu[0].price).toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => {
              cartStore.clear();
              toast("Order archived");
            }}
            className="mt-4 w-full rounded-xl border border-border bg-surface-elevated py-2.5 text-sm font-bold hover:border-primary"
          >
            Back to discover
          </button>
        </section>
      </main>
    </div>
  );
}
