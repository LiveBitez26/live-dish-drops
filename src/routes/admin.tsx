import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, UtensilsCrossed, Package, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { useAuth } from "@/hooks/use-auth";
import { getAdminStats, getPendingCreators, getAllCreators, reviewCreatorVerification, getAllOrders } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type TabKey = "overview" | "verification" | "creators" | "orders";

function AdminPage() {
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<TabKey>("overview");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!profile) return;
    getAdminStats()
      .then((s) => {
        setStats(s);
        setAuthorized(true);
      })
      .catch(() => setAuthorized(false));
  }, [profile]);

  if (loading || (profile && authorized === null)) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!profile || authorized === false) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="p-8 text-center">
          <p className="text-sm font-semibold text-muted-foreground">This page is restricted to platform admins.</p>
          <Link to="/" className="mt-2 inline-block text-primary underline">
            Back to LiveBite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-1 text-2xl font-black tracking-tight">Admin</h1>
        <p className="mb-6 text-sm text-muted-foreground">Platform oversight — visible only to admins.</p>

        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard icon={<UtensilsCrossed className="h-4 w-4" />} label="Creators" value={String(stats.creatorCount)} />
            <StatCard icon={<Users className="h-4 w-4" />} label="Foodies" value={String(stats.customerCount)} />
            <StatCard icon={<Package className="h-4 w-4" />} label="Orders" value={String(stats.totalOrders)} />
            <StatCard icon={<DollarSign className="h-4 w-4" />} label="Platform GMV" value={`$${stats.totalGMV.toFixed(2)}`} />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Pending review"
              value={String(stats.pendingVerifications)}
              accent={stats.pendingVerifications > 0}
            />
          </div>
        )}

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>
            Overview
          </TabBtn>
          <TabBtn active={tab === "verification"} onClick={() => setTab("verification")}>
            Verification queue
            {stats?.pendingVerifications > 0 && (
              <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">
                {stats.pendingVerifications}
              </span>
            )}
          </TabBtn>
          <TabBtn active={tab === "creators"} onClick={() => setTab("creators")}>
            All creators
          </TabBtn>
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")}>
            All orders
          </TabBtn>
        </div>

        {tab === "overview" && stats && (
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground">
            Platform take so far: <span className="font-bold text-foreground">${stats.platformRevenue.toFixed(2)}</span> in fees
            across <span className="font-bold text-foreground">{stats.totalOrders}</span> completed orders.
          </div>
        )}
        {tab === "verification" && <VerificationQueue />}
        {tab === "creators" && <AllCreators />}
        {tab === "orders" && <AllOrders />}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4", accent ? "border-destructive/40 bg-destructive/5" : "border-border bg-surface")}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function VerificationQueue() {
  const [pending, setPending] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    setPending(await getPendingCreators());
    setLoaded(true);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function handleReview(creatorId: string, decision: "approved" | "rejected") {
    const notes = decision === "rejected" ? window.prompt("Reason for rejection (shown to the creator):") ?? undefined : undefined;
    try {
      await reviewCreatorVerification({ data: { creatorId, decision, notes } });
      toast.success(decision === "approved" ? "Creator approved" : "Creator rejected");
      refresh();
    } catch (err) {
      toast.error("Couldn't update", { description: (err as Error).message });
    }
  }

  if (!loaded) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (pending.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
        No pending applications — you're all caught up.
      </p>
    );
  }

  const KITCHEN_LABEL: Record<string, string> = {
    licensed_commercial: "Licensed Kitchen",
    food_truck: "Food Truck",
    ghost_kitchen: "Ghost Kitchen",
    home_kitchen: "Home Kitchen",
  };

  return (
    <ul className="space-y-3">
      {pending.map((c: any) => (
        <li key={c.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold">@{c.handle}</div>
              <div className="text-xs text-muted-foreground">
                {c.profiles?.full_name} · {c.profiles?.email}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {KITCHEN_LABEL[c.kitchen_type] ?? c.kitchen_type}
                {c.business_name && ` · ${c.business_name}`}
              </div>
              {c.permit_number && (
                <div className="text-xs text-muted-foreground">Permit: {c.permit_number}</div>
              )}
              <div className="text-[11px] text-muted-foreground">
                Applied {new Date(c.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => handleReview(c.id, "approved")}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() => handleReview(c.id, "rejected")}
                className="flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AllCreators() {
  const [creators, setCreators] = useState<any[]>([]);
  useEffect(() => {
    getAllCreators().then(setCreators);
  }, []);

  const statusColor: Record<string, string> = {
    approved: "text-primary",
    pending: "text-yellow-600",
    rejected: "text-destructive",
  };

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
      {creators.map((c: any) => (
        <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <span className="font-bold">@{c.handle}</span>{" "}
            <span className="text-xs text-muted-foreground">· {c.profiles?.email}</span>
          </div>
          <span className={cn("text-xs font-bold uppercase tracking-widest", statusColor[c.verification_status])}>
            {c.verification_status}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AllOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    getAllOrders().then(setOrders);
  }, []);

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No orders yet.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
      {orders.map((o: any) => (
        <li key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div className="min-w-0">
            <div className="truncate">
              <span className="font-bold">@{o.creators?.handle}</span>{" "}
              <span className="text-xs text-muted-foreground">→ {o.profiles?.email}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-bold text-primary">${o.total_amount}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{o.status}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
