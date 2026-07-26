import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Star, Heart, Package, Bell, CreditCard, UserRound } from "lucide-react";
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
  updateMyProfile,
  updateMyAvatar,
} from "@/lib/api/customer-profile";
import { getMyPaymentMethods, createSetupIntent, deletePaymentMethod } from "@/lib/api/payments";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/storage";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

type TabKey = "addresses" | "payment" | "orders" | "following" | "settings";

function AccountPage() {
  const { profile, loading, isCreator } = useAuth();
  const [tab, setTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") return "addresses";
    const t = new URLSearchParams(window.location.search).get("tab");
    return (["addresses", "payment", "orders", "following", "settings"] as const).includes(t as TabKey)
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
        <ProfileHeader profile={profile} />

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
          <TabBtn active={tab === "addresses"} onClick={() => setTab("addresses")} icon={<MapPin className="h-4 w-4" />}>
            Addresses
          </TabBtn>
          <TabBtn active={tab === "payment"} onClick={() => setTab("payment")} icon={<CreditCard className="h-4 w-4" />}>
            Payment
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
        {tab === "payment" && <PaymentTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "following" && <FollowingTab />}
        {tab === "settings" && <NotificationsTab profile={profile} />}

        {!isCreator && (
          <Link
            to="/become-creator"
            className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm hover:border-primary/40"
          >
            <span>
              <span className="font-bold">Have a kitchen?</span>{" "}
              <span className="text-muted-foreground">Become a creator and start going live.</span>
            </span>
            <span className="font-bold text-primary">Apply →</span>
          </Link>
        )}
      </main>
    </div>
  );
}

function ProfileHeader({ profile }: { profile: any }) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone_number ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large — please choose one under 5MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, "avatars", profile.id);
      setAvatarUrl(url);
    } catch (err) {
      toast.error("Upload failed", { description: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({ data: { fullName, phoneNumber: phone || undefined } });
      if (avatarUrl !== (profile.avatar_url ?? "")) {
        await updateMyAvatar({ data: { avatarUrl: avatarUrl || null } });
      }
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      toast.error("Couldn't save", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full border border-border object-cover" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-full border border-dashed border-border bg-surface-elevated text-muted-foreground">
                <UserRound className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tight">{profile.full_name ?? "My Account"}</h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <p className="text-sm text-muted-foreground">
                {profile.phone_number ? profile.phone_number : "No phone number on file"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary/60"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="mb-6 space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-14 w-14 shrink-0 rounded-full border border-border object-cover" />
        ) : (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-dashed border-border bg-surface-elevated text-muted-foreground">
            <UserRound className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Profile picture <span className="normal-case text-muted-foreground">(optional)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-foreground"
          />
          {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
          {avatarUrl && !uploading && (
            <button
              type="button"
              onClick={() => setAvatarUrl("")}
              className="mt-1.5 text-xs font-semibold text-destructive hover:underline"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Full name
        </label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Phone number <span className="normal-case text-muted-foreground">(so drivers can reach you)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +1 555 123 4567"
          className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
        <input
          disabled
          value={profile.email}
          className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-muted-foreground"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Email changes require verification and aren't supported here yet — contact support if you need this changed.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-border px-4 py-1.5 text-sm font-bold text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
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

function PaymentTab() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setMethods(await getMyPaymentMethods());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function handleAddCard() {
    setLoading(true);
    try {
      await createSetupIntent();
      // Real Stripe keys are configured — the next step is opening Stripe's
      // Payment Element to actually collect the card. That UI isn't built
      // yet since there's nothing to test it against until Stripe is live.
      toast("Stripe is connected — card entry form coming next.");
    } catch (err) {
      toast.error("Payments aren't connected yet", {
        description: "The platform owner needs to add Stripe API keys before cards can be saved.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {methods.map((m) => (
        <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
          <CreditCard className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold capitalize">{m.brand}</span>
              <span className="text-sm text-muted-foreground">•••• {m.last4}</span>
              {m.is_default && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Expires {String(m.exp_month).padStart(2, "0")}/{m.exp_year}
            </p>
          </div>
          <button
            onClick={async () => {
              await deletePaymentMethod({ data: { paymentMethodId: m.id } });
              toast("Card removed");
              refresh();
            }}
            className="text-destructive hover:opacity-80"
            aria-label="Remove card"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {methods.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          No saved payment methods yet.
        </p>
      )}

      <button
        onClick={handleAddCard}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-bold text-primary disabled:opacity-50"
      >
        <Plus className="h-4 w-4" /> {loading ? "Checking…" : "Add payment method"}
      </button>
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
              {o.estimated_ready_at && (
                <>
                  {" "}
                  · Ready{" "}
                  {new Date(o.estimated_ready_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </>
              )}
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
