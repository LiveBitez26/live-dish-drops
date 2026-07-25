import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/livebite/AppHeader";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"customer" | "creator">("customer");
  const [fullName, setFullName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, fullName, role);

      // If they signed up as a creator, also create their creators row now
      // (the auth trigger only creates the base `profiles` row).
      if (role === "creator") {
        const supabase = getSupabaseBrowserClient();
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { error } = await supabase.from("creators").insert({
            profile_id: userData.user.id,
            handle: handle.trim().replace(/\s+/g, ""),
          });
          if (error) throw new Error(error.message);
        }
      }

      toast.success("Welcome to LiveBite!");
      navigate({ to: role === "creator" ? "/studio" : "/" });
    } catch (err) {
      toast.error("Sign up failed", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="theme-dark min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-sm px-4 py-12">
        <h1 className="mb-6 text-center text-2xl font-black">Join LiveBite</h1>

        <div className="mb-6 flex rounded-full border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-bold transition",
              role === "customer"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            I'm a Foodie
          </button>
          <button
            type="button"
            onClick={() => setRole("creator")}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-bold transition",
              role === "creator"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            I'm a Creator
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Full name
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
              placeholder="Jane Doe"
            />
          </div>

          {role === "creator" && (
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
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary underline">
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}
