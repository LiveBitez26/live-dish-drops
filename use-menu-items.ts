import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

/**
 * Subscribes to new/updated orders for a given creator and keeps a live
 * list in state. Drives the "Incoming orders" panel in /studio.
 */
export function useRealtimeOrders(creatorId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!creatorId) return;
    const supabase = getSupabaseBrowserClient();

    // initial load: anything still actionable
    supabase
      .from("orders")
      .select("*")
      .eq("creator_id", creatorId)
      .in("status", ["pending", "accepted", "preparing"])
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data);
      });

    const channel = supabase
      .channel(`orders:creator:${creatorId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `creator_id=eq.${creatorId}` },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((prev) => [newOrder, ...prev].slice(0, 20));

          toast.success("New order!", {
            description: `${newOrder.items.map((i) => `${i.qty}x ${i.name}`).join(", ")} · $${newOrder.total_amount}`,
          });
          playChime();
          if (Notification.permission === "granted") {
            new Notification("New LiveBite order", {
              body: `$${newOrder.total_amount} · ${newOrder.items.length} item(s)`,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `creator_id=eq.${creatorId}` },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            ["declined", "delivered"].includes(updated.status)
              ? prev.filter((o) => o.id !== updated.id)
              : prev.map((o) => (o.id === updated.id ? updated : o)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorId]);

  return orders;
}

function playChime() {
  try {
    const audio = new Audio("/sounds/new-order.mp3");
    audio.volume = 0.6;
    void audio.play();
  } catch {
    // best-effort only — some browsers block autoplay until user interaction
  }
}

/** Call once on mount (e.g. when the studio page loads) to ask for permission. */
export function useRequestNotificationPermission() {
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
}
