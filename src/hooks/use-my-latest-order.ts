import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

/**
 * For a logged-in customer watching a specific creator's stream: their most
 * recent non-final order against that creator, live-updating as the creator
 * accepts/declines/preps/delivers it. Lets a viewer see their own order
 * status change in real time without leaving the stream.
 */
export function useMyLatestOrder(customerId: string | undefined, creatorId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!customerId || !creatorId) return;
    const supabase = getSupabaseBrowserClient();

    supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customerId)
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setOrder(data));

    const channel = supabase
      .channel(`my-orders:${customerId}:${creatorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${customerId}` },
        (payload) => {
          const row = payload.new as Order;
          if (row.creator_id === creatorId) setOrder(row);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, creatorId]);

  return order;
}
