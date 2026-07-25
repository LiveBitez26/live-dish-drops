import { Link } from "@tanstack/react-router";
import { MapPin, Search, User, ChevronDown, Flame } from "lucide-react";

export function AppHeader() {
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

        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-elevated">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
