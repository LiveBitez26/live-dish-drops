import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Powers the homepage "Live Drops" / "All Creators" feed. Real data only —
 * no mock creators mixed in. If nobody has ever gone live or added a menu,
 * this legitimately returns an empty list, and the UI should handle that
 * gracefully rather than falling back to placeholder content.
 */
export const getDiscoverCreators = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();

  const { data: creators, error } = await supabase
    .from("creators")
    .select("*, profiles(avatar_url), menu_items(id, name, price, image_url, total_inventory, remaining_inventory)")
    .order("is_live", { ascending: false })
    .order("follower_count", { ascending: false });

  if (error) {
    console.error("[getDiscoverCreators] query failed:", error.message);
    return { creators: [], error: error.message };
  }
  if (!creators) return { creators: [], error: null };

  const mapped = creators.map((c: any) => {
    const menu = c.menu_items ?? [];
    const totalInventory = menu.reduce((s: number, m: any) => s + (m.total_inventory ?? 0), 0);
    const remainingInventory = menu.reduce((s: number, m: any) => s + (m.remaining_inventory ?? 0), 0);
    const featured = menu[0];

    return {
      id: c.id as string,
      handle: c.handle as string,
      avatar: c.profiles?.avatar_url ?? `https://i.pravatar.cc/150?u=${c.id}`,
      cover: featured?.image_url ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=60",
      dish: featured?.name ?? "New menu coming soon",
      price: featured?.price ?? null,
      isLive: c.is_live as boolean,
      subs: c.follower_count as number,
      rating: c.rating as number,
      ordersTotal: totalInventory,
      ordersLeft: remainingInventory,
    };
  });

  return { creators: mapped, error: null };
});
