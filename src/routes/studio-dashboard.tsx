import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, DollarSign, TrendingUp, Package, CreditCard, ExternalLink } from "lucide-react";
import { AppHeader } from "@/components/livebite/AppHeader";
import { useAuth } from "@/hooks/use-auth";
import { getCreatorAnalytics } from "@/lib/api/analytics";
import { startCreatorStripeOnboarding, getCreatorStripeStatus } from "@/lib/api/stripe-connect";

export const Route = createFileRoute("/studio-dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, loading, isCreator } = useAuth();
  const creators = (profile as any)?.creators;
  const creatorId = Array.isArray(creators) ? creators[0]?.id : creators?.id;

  const [analytics, setAnalytics] = useState<any>(null);
  const [stripeStatus, setStripeStatus] = useState<{ connected: boolean; complete: boolean } | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!creatorId) return;
    getCreatorAnalytics({ data: { creatorId } }).then(setAnalytics);
    getCreatorStripeStatus().then(setStripeStatus);
  }, [creatorId]);

  async function handleConnectPayouts() {
    setConnecting(true);
    try {
      const { url } = await startCreatorStripeOnboarding({
        data: {
          returnUrl: window.location.href,
          refreshUrl: window.location.href,
        },
      });
      window.location.href = url;
    } catch (err) {
      toast.error("Couldn't start payout setup", { description: (err as Error).message });
      setConnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isCreator || !creatorId) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="p-8 text-center">
          <p className="text-sm font-semibold text-muted-foreground">This page is for creators only.</p>
          <Link to="/studio" className="mt-2 inline-block text-primary underline">
            Back to Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/studio"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Studio
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dashboard</span>
        </div>

        {/* Payout status — the piece that was built but never surfaced anywhere */}
        <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
          <div className="mb-1 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Payouts</h2>
          </div>
          {stripeStatus === null ? (
            <p className="text-sm text-muted-foreground">Checking payout status…</p>
          ) : stripeStatus.complete ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-green-600">
              ✅ Payouts connected — you'll receive money directly from customer orders.
            </p>
          ) : (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                {stripeStatus.connected
                  ? "Your payout setup is incomplete — finish it to start receiving money from orders."
                  : "You haven't connected a payout account yet. Customers can't pay you until this is done."}
              </p>
              <button
                onClick={handleConnectPayouts}
                disabled={connecting}
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {connecting ? "Redirecting…" : stripeStatus.connected ? "Finish payout setup" : "Connect payouts"}
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* Revenue summary */}
        {analytics && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={<DollarSign className="h-4 w-4" />} label="Total revenue" value={`$${analytics.totalRevenue.toFixed(2)}`} />
              <StatCard icon={<TrendingUp className="h-4 w-4" />} label="This week" value={`$${analytics.weekRevenue.toFixed(2)}`} />
              <StatCard icon={<Package className="h-4 w-4" />} label="Total orders" value={String(analytics.totalOrders)} />
              <StatCard icon={<Package className="h-4 w-4" />} label="Avg order" value={`$${analytics.avgOrderValue.toFixed(2)}`} />
            </div>

            {analytics.bestSellers.length > 0 && (
              <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-muted-foreground">
                  Best sellers
                </h2>
                <ul className="space-y-2">
                  {analytics.bestSellers.map((b: any, i: number) => (
                    <li key={b.name} className="flex items-center justify-between text-sm">
                      <span className="font-semibold">
                        {i + 1}. {b.name}
                      </span>
                      <span className="text-muted-foreground">{b.qty} sold</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-muted-foreground">
                Order history
              </h2>
              {analytics.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {analytics.recentOrders.map((o: any) => (
                    <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs text-muted-foreground">
                          {o.items.map((i: any) => `${i.qty}× ${i.name}`).join(", ")}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(o.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <div className="font-bold text-primary">${o.total_amount}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {o.status.replace("_", " ")}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}
