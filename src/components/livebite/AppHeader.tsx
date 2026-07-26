import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Search, User, ChevronDown, Flame, LogOut, UtensilsCrossed, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function AppHeader() {
  const { profile, isCreator, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-4 w-4" />
          </div>
          <span className="text-lg font-black tracking-tight text-foreground">
            Live<span className="text-primary">Bite</span>
          </span>
        </Link>

        <button className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground shrink-0">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Delivering to: <span className="text-foreground font-semibold">Downtown</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            placeholder="Search creators, dishes, cuisines…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {!profile ? (
          <Link
            to="/login"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-elevated"
            aria-label="Log in"
          >
            <User className="h-4 w-4" />
          </Link>
        ) : (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-elevated"
              aria-label="Account menu"
            >
              <User className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                  <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                    {(profile as any).full_name ?? (profile as any).email}
                  </div>
                  {isCreator && (
                    <Link
                      to="/studio"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-elevated"
                    >
                      <UtensilsCrossed className="h-4 w-4" /> Creator Studio
                    </Link>
                  )}
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-elevated"
                  >
                    <UserCog className="h-4 w-4" /> My Account
                  </Link>
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await signOut();
                      navigate({ to: "/" });
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-surface-elevated"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
