import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Apple, CreditCard, Home, MapPin, Plus, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { cartStore, useCart, cartTotal, cartCount } from "@/lib/cart-store";

type Props = { open: boolean; onClose: () => void };

const ADDRESSES = [
  { id: "home", label: "Home", line: "24 Market St, Apt 3B", eta: "12–18 min" },
  { id: "work", label: "Work", line: "500 Broadway, Floor 7", eta: "22–28 min" },
];

const TIPS = [0, 2, 4, 6];

const PAYMENTS = [
  { id: "card", label: "Visa •• 4242", icon: CreditCard },
  { id: "apple", label: "Apple Pay", icon: Apple },
  { id: "wallet", label: "LiveBite Wallet · $28.50", icon: Wallet },
];

export function CheckoutDrawer({ open, onClose }: Props) {
  const cart = useCart();
  const subtotal = cartTotal(cart);
  const count = cartCount(cart);
  const navigate = useNavigate();
  const [addr, setAddr] = useState("home");
  const [tip, setTip] = useState(2);
  const [pay, setPay] = useState("card");

  const delivery = 2.99;
  const service = +(subtotal * 0.08).toFixed(2);
  const total = subtotal + delivery + service + tip;

  const submit = () => {
    const id = String(100 + Math.floor(Math.random() * 900));
    toast.success(`Order #${id} submitted!`, {
      description: "Your chef is starting your batch.",
    });
    cartStore.clear();
    onClose();
    navigate({ to: "/order/$id", params: { id } });
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[61] mx-auto max-w-xl rounded-t-3xl border border-border bg-surface p-5 shadow-2xl transition-transform duration-300",
          "max-h-[92vh] overflow-y-auto",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Checkout
            </div>
            <div className="text-xl font-black">
              {count} item{count === 1 ? "" : "s"} · ${subtotal.toFixed(2)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface-elevated hover:border-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Address */}
        <section className="mb-4">
          <SectionLabel icon={<MapPin className="h-3.5 w-3.5" />}>Delivery address</SectionLabel>
          <div className="space-y-2">
            {ADDRESSES.map((a) => {
              const active = addr === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAddr(a.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface-elevated hover:border-primary/60"
                  )}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface">
                    <Home className="h-4 w-4 text-primary" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {a.label}
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        ETA {a.eta}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {a.line}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "h-4 w-4 shrink-0 rounded-full border-2",
                      active ? "border-primary bg-primary" : "border-border"
                    )}
                  />
                </button>
              );
            })}
            <button className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:border-primary hover:text-foreground">
              <Plus className="h-3.5 w-3.5" /> Add new address
            </button>
          </div>
        </section>

        {/* Tip */}
        <section className="mb-4">
          <SectionLabel>Tip your chef</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {TIPS.map((t) => {
              const active = tip === t;
              return (
                <button
                  key={t}
                  onClick={() => setTip(t)}
                  className={cn(
                    "rounded-xl border py-2.5 text-sm font-black transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground glow-primary"
                      : "border-border bg-surface-elevated hover:border-primary/60"
                  )}
                >
                  {t === 0 ? "None" : `$${t}`}
                </button>
              );
            })}
          </div>
        </section>

        {/* Payment */}
        <section className="mb-5">
          <SectionLabel>Payment method</SectionLabel>
          <div className="space-y-2">
            {PAYMENTS.map((p) => {
              const active = pay === p.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPay(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface-elevated hover:border-primary/60"
                  )}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                  <span className="flex-1 text-sm font-bold">{p.label}</span>
                  <span
                    className={cn(
                      "h-4 w-4 shrink-0 rounded-full border-2",
                      active ? "border-primary bg-primary" : "border-border"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* Breakdown */}
        <section className="mb-4 rounded-xl border border-border bg-surface-elevated p-4 text-sm">
          <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
          <Row label="Delivery" value={`$${delivery.toFixed(2)}`} />
          <Row label="Service fee" value={`$${service.toFixed(2)}`} />
          <Row label="Chef tip" value={`$${tip.toFixed(2)}`} />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="font-bold">Total</span>
            <span className="text-lg font-black text-primary">${total.toFixed(2)}</span>
          </div>
        </section>

        <button
          onClick={submit}
          disabled={count === 0}
          className="w-full rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground glow-primary disabled:opacity-50"
        >
          Place order · ${total.toFixed(2)}
        </button>
      </div>
    </>
  );
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
      {icon}
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
