import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Search, User, ChevronDown, Flame, LogOut, UtensilsCrossed, UserCog, Plus, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getMyAddresses, setDefaultAddress } from "@/lib/api/customer-profile";
import { search } from "@/lib/api/search";

export function AppHeader() {
  const { profile, isCreator, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ creators: any[]; dishes: any[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (profile) {
      getMyAddresses().then(setAddresses);
    } else {
      setAddresses([]);
    }
  }, [profile]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      search({ data: { query: query.trim() } })
        .then((r) => {
          setResults(r);
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];
  const addressLabel = !profile
    ? "Log in to set"
    : defaultAddress
      ? `${defaultAddress.label} · ${defaultAddress.city}`
      : "Set address";

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

        <div className="relative hidden shrink-0 sm:block">
          <button
            onClick={() => setAddressMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Delivering to: <span className="text-foreground font-semibold">{addressLabel}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {addressMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAddressMenuOpen(false)} />
              <div className="absolute left-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                {!profile ? (
                  <Link
                    to="/login"
                    onClick={() => setAddressMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm hover:bg-surface-elevated"
                  >
                    Log in to set a delivery address
                  </Link>
                ) : addresses.length === 0 ? (
                  <Link
                    to="/account"
                    onClick={() => setAddressMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-surface-elevated"
                  >
                    <Plus className="h-4 w-4" /> Add a delivery address
                  </Link>
                ) : (
                  <>
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        onClick={async () => {
                          if (!a.is_default) {
                            await setDefaultAddress({ data: { addressId: a.id } });
                            setAddresses(await getMyAddresses());
                          }
                          setAddressMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-surface-elevated"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold">{a.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {a.line1}, {a.city}, {a.state}
                          </span>
                        </span>
                        {a.is_default && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                    <Link
                      to="/account"
                      onClick={() => setAddressMenuOpen(false)}
                      className="flex items-center gap-2 border-t border-border px-3 py-2.5 text-sm text-primary hover:bg-surface-elevated"
                    >
                      <Plus className="h-4 w-4" /> Manage addresses
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search creators, dishes, cuisines…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {searchOpen && query.trim() && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
              <div className="absolute left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                {searching && <p className="px-3 py-3 text-sm text-muted-foreground">Searching…</p>}
                {!searching && results && results.creators.length === 0 && results.dishes.length === 0 && (
                  <p className="px-3 py-3 text-sm text-muted-foreground">No results for "{query}"</p>
                )}
                {!searching && results && results.creators.length > 0 && (
                  <div>
                    <div className="px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Creators
                    </div>
                    {results.creators.map((c: any) => (
                      <Link
                        key={c.id}
                        to="/creator/$id"
                        params={{ id: c.id }}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-elevated"
                      >
                        <img
                          src={c.profiles?.avatar_url ?? `https://i.pravatar.cc/60?u=${c.id}`}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">
                            @{c.handle} {c.is_live && <span className="text-destructive">· Live</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {!searching && results && results.dishes.length > 0 && (
                  <div>
                    <div className="px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Dishes
                    </div>
                    {results.dishes.map((d: any) => (
                      <Link
                        key={d.id}
                        to="/creator/$id"
                        params={{ id: d.creator_id }}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-elevated"
                      >
                        <img
                          src={d.image_url ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=60"}
                          alt=""
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">{d.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            ${d.price} · @{d.creators?.handle}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
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
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-elevated overflow-hidden"
              aria-label="Account menu"
            >
              {(profile as any).avatar_url ? (
                <img src={(profile as any).avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4" />
              )}
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
                  {!isCreator && (
                    <Link
                      to="/become-creator"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface-elevated"
                    >
                      <UtensilsCrossed className="h-4 w-4" /> Become a Creator
                    </Link>
                  )}
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-elevated"
                  >
                    <UserCog className="h-4 w-4" /> My Account
                  </Link>
                  {(profile as any).is_admin && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-elevated"
                    >
                      <ShieldCheck className="h-4 w-4" /> Admin
                    </Link>
                  )}
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
