import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Radio, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { to: "/live/chefmarco", label: "Live", icon: Radio, match: (p: string) => p.startsWith("/live") },
  { to: "/order/104", label: "Orders", icon: Receipt, match: (p: string) => p.startsWith("/order") },
  { to: "/studio", label: "Studio", icon: User, match: (p: string) => p.startsWith("/studio") },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                params={it.to === "/live/chefmarco" ? { id: "chefmarco" } : it.to === "/order/104" ? { id: "104" } : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wide transition",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl transition",
                    active ? "bg-primary/15 glow-primary" : "bg-transparent"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={2.4} />
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
