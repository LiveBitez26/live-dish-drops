import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/livebite/AppHeader";
import { useAuth } from "@/hooks/use-auth";
import { becomeCreator } from "@/lib/api/creator-profile";

export const Route = createFileRoute("/become-creator")({
  component: BecomeCreatorPage,
});

function BecomeCreatorPage() {
  const { profile, loading, isCreator } = useAuth();
  const navigate = useNavigate();
  const [handle, setHandle] = useState("");
  const [kitchenType, setKitchenType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kitchenType) {
      toast.error("Please select your kitchen type");
      return;
    }
    setSubmitting(true);
    try {
      await becomeCreator({ data: { handle, kitchenType: kitchenType as any, businessName, permitNumber } });
      toast.success("Application submitted!", {
        description: "We'll review your kitchen details before you can go live.",
      });
      navigate({ to: "/studio" });
    } catch (err) {
      toast.error("Couldn't submit", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="p-8 text-center">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            Log in first to apply as a creator.
          </p>
          <Link to="/login" className="text-primary underline">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (isCreator) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="p-8 text-center">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            You already have a creator profile.
          </p>
          <Link to="/studio" className="text-primary underline">
            Go to Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-sm px-4 py-12">
        <h1 className="mb-2 text-center text-2xl font-black">Become a Creator</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Keep your existing account — this just adds a Studio to it so you can start selling and going live.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Handle
            </label>
            <input
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
              placeholder="ChefJane"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Shown to customers as @{handle || "yourhandle"}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Kitchen type
            </label>
            <select
              required
              value={kitchenType}
              onChange={(e) => setKitchenType(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
            >
              <option value="" disabled>
                Select one…
              </option>
              <option value="licensed_commercial">Licensed commercial kitchen</option>
              <option value="food_truck">Food truck</option>
              <option value="ghost_kitchen">Ghost kitchen</option>
              <option value="home_kitchen">Home kitchen (cottage food)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Business name <span className="normal-case text-muted-foreground">(optional)</span>
            </label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
              placeholder="Marco's Birria Co."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Health permit / cottage food registration number
            </label>
            <input
              value={permitNumber}
              onChange={(e) => setPermitNumber(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
              placeholder="e.g. LA-2026-00123"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              We'll verify this before you're able to go live. You can add it later if you don't have it handy yet.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </form>
      </main>
    </div>
  );
}
