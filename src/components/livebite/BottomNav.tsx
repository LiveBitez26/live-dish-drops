import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Receipt, User, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, isCreator } = useAuth();

  const items = [
    { to: "/" as const, label: "Home", icon: Home, match: (p: string) => p === "/" },
    ...(isCreator
      ? [{ to: "/studio" as const, label: "Studio", icon: UtensilsCrossed, match: (p: string) => p.startsWith("/studio") }]
      : [{ to: "/account" as const, label: "Orders", icon: Receipt, match: () => false, search: { tab: "orders" } as any }]),
    ...(profile
      ? [{ to: "/account" as const, label: "Account", icon: User, match: (p: string) => p.startsWith("/account") }]
      : [{ to: "/login" as const, label: "Log in", icon: User, match: (p: string) => p.startsWith("/login") }]),
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className={cn("mx-auto grid max-w-md", items.length === 3 ? "grid-cols-3" : "grid-cols-4")}>
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.label}>
              <Link
                to={it.to}
                search={(it as any).search}
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
