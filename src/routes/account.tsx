import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Star, Heart, Package, Bell } from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  getMyOrderHistory,
  getMyFollowedCreators,
  updateNotificationPrefs,
} from "@/lib/api/customer-profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

type TabKey = "addresses" | "orders" | "following" | "settings";

function AccountPage() {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") return "addresses";
    const t = new URLSearchParams(window.location.search).get("tab");
    return (["addresses", "orders", "following", "settings"] as const).includes(t as TabKey)
      ? (t as TabKey)
      : "addresses";
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="p-8 text-center">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Log in to see your account.</p>
          <Link to="/login" className="text-primary underline">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-1 text-2xl font-black tracking-tight">
          {(profile as any).full_name ?? "My Account"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">{(profile as any).email}</p>

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
          <TabBtn active={tab === "addresses"} onClick={() => setTab("addresses")} icon={<MapPin className="h-4 w-4" />}>
            Addresses
          </TabBtn>
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} icon={<Package className="h-4 w-4" />}>
            Orders
          </TabBtn>
          <TabBtn active={tab === "following"} onClick={() => setTab("following")} icon={<Heart className="h-4 w-4" />}>
            Following
          </TabBtn>
          <TabBtn active={tab === "settings"} onClick={() => setTab("settings")} icon={<Bell className="h-4 w-4" />}>
            Notifications
          </TabBtn>
        </div>

        {tab === "addresses" && <AddressesTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "following" && <FollowingTab />}
        {tab === "settings" && <NotificationsTab profile={profile} />}
      </main>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon} {children}
    </button>
  );
}

function AddressesTab() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "Home", line1: "", line2: "", city: "", state: "", zip: "" });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setAddresses(await getMyAddresses());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addAddress({ data: { ...form, isDefault: addresses.length === 0 } });
      toast.success("Address added");
      setForm({ label: "Home", line1: "", line2: "", city: "", state: "", zip: "" });
      setShowForm(false);
      await refresh();
    } catch (err) {
      toast.error("Couldn't add address", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {addresses.map((a) => (
        <div key={a.id} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">{a.label}</span>
              {a.is_default && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.zip}
            </p>
            <div className="mt-1 flex gap-3 text-xs font-semibold">
              {!a.is_default && (
                <button
                  onClick={async () => {
                    await setDefaultAddress({ data: { addressId: a.id } });
                    refresh();
                  }}
                  className="text-primary hover:underline"
                >
                  Set as default
                </button>
              )}
              <button
                onClick={async () => {
                  await deleteAddress({ data: { addressId: a.id } });
                  toast("Address removed");
                  refresh();
                }}
                className="flex items-center gap-1 text-destructive hover:underline"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-bold text-primary"
        >
          <Plus className="h-4 w-4" /> Add address
        </button>
      ) : (
        <form onSubmit={handleAdd} className="space-y-2 rounded-2xl border border-border bg-surface p-4">
          <input
            required
            placeholder="Label (Home, Work…)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Street address"
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
          />
          <input
            placeholder="Apt/Unit (optional)"
            value={form.line2}
            onChange={(e) => setForm({ ...form, line2: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="ZIP"
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save address"}
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
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    getMyOrderHistory().then(setOrders);
  }, []);

  if (orders.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
        No orders yet — go find something live to order!
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-bold">@{o.creators?.handle ?? "creator"}</span>
            <span className="font-black text-primary">${o.total_amount}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {o.items.map((i: any) => `${i.qty}× ${i.name}`).join(", ")}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {o.status.replace("_", " ")} · {new Date(o.created_at).toLocaleDateString()}
            </span>
            {o.status === "delivered" && (!o.reviews || o.reviews.length === 0) && (
              <span className="text-[11px] font-bold text-primary">Leave a review on the creator's page →</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function FollowingTab() {
  const [creators, setCreators] = useState<any[]>([]);
  useEffect(() => {
    getMyFollowedCreators().then(setCreators);
  }, []);

  if (creators.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
        You're not following any creators yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {creators.map((c: any) => (
        <li key={c.id}>
          <Link
            to="/creator/$id"
            params={{ id: c.id }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 hover:border-primary/50"
          >
            <img
              src={c.profiles?.avatar_url ?? `https://i.pravatar.cc/100?u=${c.id}`}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">@{c.handle}</span>
                {c.is_live && <span className="live-dot text-[10px]">Live</span>}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-primary text-primary" /> {c.rating} · {c.follower_count} followers
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function NotificationsTab({ profile }: { profile: any }) {
  const [newDrops, setNewDrops] = useState(profile.notify_new_drops ?? true);
  const [orderUpdates, setOrderUpdates] = useState(profile.notify_order_updates ?? true);

  async function toggle(key: "notifyNewDrops" | "notifyOrderUpdates", value: boolean) {
    if (key === "notifyNewDrops") setNewDrops(value);
    else setOrderUpdates(value);
    try {
      await updateNotificationPrefs({ data: { [key]: value } });
    } catch (err) {
      toast.error("Couldn't save preference");
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <div>
          <div className="font-bold">New drops from creators you follow</div>
          <div className="text-xs text-muted-foreground">Get notified when they go live or schedule a drop</div>
        </div>
        <input
          type="checkbox"
          checked={newDrops}
          onChange={(e) => toggle("notifyNewDrops", e.target.checked)}
          className="h-5 w-5 accent-orange-500"
        />
      </label>
      <label className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <div>
          <div className="font-bold">Order status updates</div>
          <div className="text-xs text-muted-foreground">Accepted, preparing, out for delivery, delivered</div>
        </div>
        <input
          type="checkbox"
          checked={orderUpdates}
          onChange={(e) => toggle("notifyOrderUpdates", e.target.checked)}
          className="h-5 w-5 accent-orange-500"
        />
      </label>
    </div>
  );
}
