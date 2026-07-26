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
  Trash2,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { StreamChat } from "@/components/livebite/StreamChat";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useMenuItems, setMenuItemAvailability } from "@/hooks/use-menu-items";
import { useRealtimeOrders, useRequestNotificationPermission } from "@/hooks/use-realtime-orders";
import { useAgoraBroadcast } from "@/hooks/use-agora-broadcast";
import { updateOrderStatus } from "@/lib/api/orders";
import { updateCreatorProfile } from "@/lib/api/creator-profile";
import { createPost, getMyPosts, deletePost } from "@/lib/api/posts";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/api/menu-items";
import { uploadImage } from "@/lib/storage";
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
  const verificationStatus =
    (profile as any)?.creators?.[0]?.verification_status ?? (profile as any)?.creators?.verification_status;
  const isVerified = verificationStatus === "approved";

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
    if (!isVerified) {
      toast.error("Kitchen not verified yet", {
        description: "We're reviewing your kitchen details — you'll be able to go live once approved.",
      });
      return;
    }
    const supabase = getSupabaseBrowserClient();

    if (!live) {
      // 0. Safety: end any stream this creator left "live" in the DB from
      // another device/tab before starting a fresh one — otherwise viewers
      // can land on a stale channel nobody is actually publishing to.
      const { data: stale } = await supabase
        .from("live_streams")
        .select("id")
        .eq("creator_id", creatorId)
        .eq("status", "live");
      if (stale && stale.length > 0) {
        await supabase
          .from("live_streams")
          .update({ status: "ended", ended_at: new Date().toISOString() })
          .eq("creator_id", creatorId)
          .eq("status", "live");
        toast("Ended a previous session on another device before going live here.");
      }

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
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        Loading studio…
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <p className="text-lg font-bold text-foreground">
            {profile ? "This page is for creators only." : "Please log in as a creator to access the Studio."}
          </p>
          <div className="mt-3 flex justify-center gap-4">
            {!profile && (
              <Link to="/login" className="text-primary underline">
                Log in
              </Link>
            )}
            <Link to="/" className="text-primary underline">
              Back to LiveBite
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            {creatorId && (
              <Link
                to="/studio-dashboard"
                className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
              >
                Dashboard
              </Link>
            )}
            {creatorId && (
              <Link
                to="/creator/$id"
                params={{ id: creatorId }}
                className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
              >
                View public profile
              </Link>
            )}
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Creator Studio
            </span>
          </div>
        </div>

        {!isVerified && (
          <div className="mb-4 rounded-xl border border-yellow-600/40 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-500">
            {verificationStatus === "rejected"
              ? "Your kitchen application was not approved. Contact support for details."
              : "Your kitchen details are pending review. You can build your menu, but you can't go live until you're approved."}
          </div>
        )}

        {creatorId && <EditProfilePanel creatorId={creatorId} />}
        {creatorId && <CreatePostPanel creatorId={creatorId} />}

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
                  Toggle to mark sold out
                </span>
              </div>
              <ul className="space-y-2">
                {inventory.map((m) => (
                  <MenuItemRow key={m.id} item={m} />
                ))}
              </ul>
              {creatorId && <AddMenuItemForm creatorId={creatorId} />}
            </section>
          </div>

          {/* RIGHT: Incoming orders + live chat */}
          <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
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
          </div>

          <StreamChat
            streamId={currentStreamId ?? undefined}
            currentUserId={(profile as any)?.id}
            currentHandle={(profile as any)?.creators?.[0]?.handle ?? (profile as any)?.creators?.handle ?? "chef"}
            isCreator
            className="h-72"
          />
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
        checked ? "border-destructive bg-destructive" : "border-green-600/40 bg-green-500/20"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 grid h-4 w-4 place-items-center rounded-full shadow-sm transition-transform",
          checked ? "translate-x-6 bg-white" : "translate-x-0.5 bg-green-600",
        )}
      />
    </button>
  );
}

function EditProfilePanel({ creatorId }: { creatorId: string }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [deliveryRadius, setDeliveryRadius] = useState("5");
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("creators")
      .select("bio, location, banner_url, delivery_radius_miles, profiles(avatar_url)")
      .eq("id", creatorId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBio(data.bio ?? "");
          setLocation(data.location ?? "");
          setBannerUrl(data.banner_url ?? "");
          setAvatarUrl((data as any).profiles?.avatar_url ?? "");
          setDeliveryRadius(String(data.delivery_radius_miles ?? 5));
        }
        setLoaded(true);
      });
  }, [open, loaded, creatorId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, kind: "avatar" | "banner") {
    const file = e.target.files?.[0];
    if (!file || !(profile as any)?.id) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large — please choose one under 5MB");
      return;
    }
    setUploading(kind);
    try {
      const url = await uploadImage(file, kind === "avatar" ? "avatars" : "banners", (profile as any).id);
      if (kind === "avatar") setAvatarUrl(url);
      else setBannerUrl(url);
    } catch (err) {
      toast.error("Upload failed", { description: (err as Error).message });
    } finally {
      setUploading(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCreatorProfile({
        data: {
          creatorId,
          bio: bio || undefined,
          location: location || undefined,
          bannerUrl: bannerUrl === "" ? null : bannerUrl || undefined,
          avatarUrl: avatarUrl === "" ? null : avatarUrl || undefined,
          deliveryRadiusMiles: Number(deliveryRadius) || undefined,
        },
      });
      toast.success("Profile updated");
      setOpen(false);
    } catch (err) {
      toast.error("Couldn't save profile", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-black uppercase tracking-widest text-muted-foreground"
      >
        Edit profile
        <span className="text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && !loaded && (
        <p className="border-t border-border p-4 text-sm text-muted-foreground">Loading your current profile…</p>
      )}
      {open && loaded && (
        <form onSubmit={handleSave} className="space-y-3 border-t border-border p-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
              placeholder="Tell customers about your kitchen…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
              placeholder="e.g. Los Angeles, CA"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Avatar photo <span className="normal-case text-muted-foreground">(optional)</span>
            </label>
            {avatarUrl && <img src={avatarUrl} alt="" className="mb-1.5 h-12 w-12 rounded-full object-cover" />}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, "avatar")}
              disabled={uploading === "avatar"}
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-foreground"
            />
            {uploading === "avatar" && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
            {avatarUrl && uploading !== "avatar" && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="mt-1.5 text-xs font-semibold text-destructive hover:underline"
              >
                Remove photo
              </button>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Banner photo <span className="normal-case text-muted-foreground">(optional)</span>
            </label>
            {bannerUrl && <img src={bannerUrl} alt="" className="mb-1.5 h-16 w-full rounded-lg object-cover" />}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUpload(e, "banner")}
              disabled={uploading === "banner"}
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-foreground"
            />
            {uploading === "banner" && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
            {bannerUrl && uploading !== "banner" && (
              <button
                type="button"
                onClick={() => setBannerUrl("")}
                className="mt-1.5 text-xs font-semibold text-destructive hover:underline"
              >
                Remove photo
              </button>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Delivery radius (miles)
            </label>
            <input
              type="number"
              min={0.5}
              max={50}
              step={0.5}
              value={deliveryRadius}
              onChange={(e) => setDeliveryRadius(e.target.value)}
              className="w-32 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      )}
    </div>
  );
}

function CreatePostPanel({ creatorId }: { creatorId: string }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadedPosts, setLoadedPosts] = useState(false);

  const [contentType, setContentType] = useState<"photo" | "video" | "upcoming_drop">("photo");
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [dropTime, setDropTime] = useState("");
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  async function refreshPosts() {
    setPosts(await getMyPosts({ data: { creatorId } }));
    setLoadedPosts(true);
  }

  useEffect(() => {
    if (open && !loadedPosts) refreshPosts();
  }, [open, loadedPosts]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !(profile as any)?.id) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large — please choose one under 20MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, "posts", (profile as any).id);
      setMediaUrl(url);
    } catch (err) {
      toast.error("Upload failed", { description: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaUrl) {
      toast.error("Add a photo or video first");
      return;
    }
    setPosting(true);
    try {
      await createPost({
        data: {
          creatorId,
          contentType,
          mediaUrl,
          caption: caption || undefined,
          dropTime: contentType === "upcoming_drop" && dropTime ? new Date(dropTime).toISOString() : undefined,
          price: contentType === "upcoming_drop" && price ? Number(price) : undefined,
        },
      });
      toast.success("Posted!");
      setMediaUrl("");
      setCaption("");
      setDropTime("");
      setPrice("");
      refreshPosts();
    } catch (err) {
      toast.error("Couldn't post", { description: (err as Error).message });
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-black uppercase tracking-widest text-muted-foreground"
      >
        Daily Feed posts
        <span className="text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="border-t border-border p-4">
          <form onSubmit={handlePost} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Post type
              </label>
              <div className="flex gap-2">
                {(["photo", "video", "upcoming_drop"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setContentType(t)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold",
                      contentType === t
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground"
                    )}
                  >
                    {t === "photo" ? "Photo" : t === "video" ? "Video clip" : "Upcoming drop"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {contentType === "video" ? "Video" : "Photo"}
              </label>
              {mediaUrl && (
                <img src={mediaUrl} alt="" className="mb-1.5 h-24 w-24 rounded-lg object-cover" />
              )}
              <input
                type="file"
                accept={contentType === "video" ? "video/*" : "image/*"}
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-foreground"
              />
              {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                maxLength={300}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                placeholder="What are you cooking?"
              />
            </div>

            {contentType === "upcoming_drop" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Drop time
                  </label>
                  <input
                    type="datetime-local"
                    value={dropTime}
                    onChange={(e) => setDropTime(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-32 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={posting || uploading}
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {posting ? "Posting…" : "Post to Daily Feed"}
            </button>
          </form>

          {posts.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Your posts</p>
              <div className="grid grid-cols-4 gap-2">
                {posts.map((p) => (
                  <div key={p.id} className="group relative overflow-hidden rounded-lg">
                    <img src={p.media_url} alt="" className="aspect-square w-full object-cover" />
                    <button
                      onClick={async () => {
                        await deletePost({ data: { postId: p.id } });
                        toast("Post removed");
                        refreshPosts();
                      }}
                      className="absolute inset-0 hidden items-center justify-center bg-black/60 text-white group-hover:flex"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItemRow({ item }: { item: any }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState(String(item.price));
  const [totalInventory, setTotalInventory] = useState(String(item.total_inventory));
  const [remainingInventory, setRemainingInventory] = useState(String(item.remaining_inventory));
  const [saving, setSaving] = useState(false);

  const soldOut = !item.is_available || item.remaining_inventory <= 0;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMenuItem({
        data: {
          menuItemId: item.id,
          name,
          description: description || null,
          price: Number(price),
          totalInventory: Number(totalInventory),
          remainingInventory: Number(remainingInventory),
        },
      });
      toast.success("Menu item updated");
      setEditing(false);
    } catch (err) {
      toast.error("Couldn't save", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${item.name}" from your menu?`)) return;
    try {
      await deleteMenuItem({ data: { menuItemId: item.id } });
      toast("Menu item removed");
    } catch (err) {
      toast.error("Couldn't remove item", { description: (err as Error).message });
    }
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-primary/40 bg-surface-elevated p-3">
        <form onSubmit={handleSave} className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm font-bold"
            placeholder="Item name"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
            placeholder="Description"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-bold uppercase text-muted-foreground">Price</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-bold uppercase text-muted-foreground">Total made</label>
              <input
                type="number"
                min={0}
                value={totalInventory}
                onChange={(e) => setTotalInventory(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-bold uppercase text-muted-foreground">Left now</label>
              <input
                type="number"
                min={0}
                value={remainingInventory}
                onChange={(e) => setRemainingInventory(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="ml-auto flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-surface-elevated p-3 transition",
        soldOut && "opacity-60"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("truncate text-sm font-bold", soldOut && "line-through")}>{item.name}</span>
          <span className="shrink-0 text-xs font-bold text-primary">${item.price}</span>
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {soldOut ? "Sold out" : `${item.remaining_inventory} of ${item.total_inventory} left`}
        </div>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-bold text-muted-foreground hover:border-primary/60 hover:text-primary"
      >
        Edit
      </button>
      <ToggleSwitch
        checked={!item.is_available}
        onChange={async (v) => {
          try {
            await setMenuItemAvailability(item.id, !v);
            toast(v ? `${item.name} marked sold out` : `${item.name} available again`);
          } catch (err) {
            toast.error("Update failed", { description: (err as Error).message });
          }
        }}
        label={`Mark ${item.name} sold out`}
      />
    </li>
  );
}

function AddMenuItemForm({ creatorId }: { creatorId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [totalInventory, setTotalInventory] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createMenuItem({
        data: {
          creatorId,
          name,
          description: description || undefined,
          price: Number(price),
          totalInventory: Number(totalInventory),
        },
      });
      toast.success(`${name} added to your menu`);
      setName("");
      setDescription("");
      setPrice("");
      setTotalInventory("");
      setOpen(false);
    } catch (err) {
      toast.error("Couldn't add item", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/40 py-2.5 text-sm font-bold text-primary hover:border-primary"
      >
        <DollarSign className="h-4 w-4" /> Add a new menu item
      </button>
    );
  }

  return (
    <form onSubmit={handleAdd} className="mt-3 space-y-2 rounded-xl border border-primary/40 bg-surface-elevated p-3">
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name (e.g. Birria Tacos)"
        className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm font-bold"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Description"
        className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-0.5 block text-[10px] font-bold uppercase text-muted-foreground">Price ($)</label>
          <input
            required
            type="number"
            min={0}
            step={0.5}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-bold uppercase text-muted-foreground">
            How many are you making?
          </label>
          <input
            required
            type="number"
            min={1}
            value={totalInventory}
            onChange={(e) => setTotalInventory(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add to menu"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-4 py-1.5 text-sm font-bold text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
