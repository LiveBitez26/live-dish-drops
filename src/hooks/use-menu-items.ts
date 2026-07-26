import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

/**
 * Live menu for one creator. Used on the Studio page (creator toggles
 * availability) AND on customer-facing pages (/live/$id, /creator/$id) so
 * "X LEFT" and sold-out state update instantly for everyone watching.
 */
export function useMenuItems(creatorId: string | undefined) {
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (!creatorId) return;
    const supabase = getSupabaseBrowserClient();

    supabase
      .from("menu_items")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at")
      .then(({ data }) => {
        if (data) setItems(data);
      });

    const channel = supabase
      .channel(`menu_items:creator:${creatorId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "menu_items", filter: `creator_id=eq.${creatorId}` },
        (payload) => {
          const updated = payload.new as MenuItem;
          setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "menu_items", filter: `creator_id=eq.${creatorId}` },
        (payload) => setItems((prev) => [...prev, payload.new as MenuItem]),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "menu_items", filter: `creator_id=eq.${creatorId}` },
        (payload) => setItems((prev) => prev.filter((m) => m.id !== (payload.old as MenuItem).id)),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorId]);

  return items;
}

/** Creator-only: toggle an item's availability from the Studio dashboard. */
export async function setMenuItemAvailability(menuItemId: string, isAvailable: boolean) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", menuItemId);
  if (error) throw new Error(error.message);
}
