import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ creatorId: z.string().uuid() });

export const getCreatorAnalytics = createServerFn({ method: "GET" })
  .inputValidator(schema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    const { data: creator } = await supabase
      .from("creators")
      .select("profile_id")
      .eq("id", data.creatorId)
      .single();
    if (!creator || creator.profile_id !== userData.user.id) throw new Error("FORBIDDEN");

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("creator_id", data.creatorId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const all = orders ?? [];
    const completed = all.filter((o) => o.status !== "declined" && o.status !== "pending");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = completed.filter((o) => new Date(o.created_at) >= sevenDaysAgo);

    const totalRevenue = completed.reduce((s, o) => s + o.creator_payout_amount, 0);
    const weekRevenue = thisWeek.reduce((s, o) => s + o.creator_payout_amount, 0);
    const totalOrders = completed.length;
    const weekOrders = thisWeek.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // best-sellers, tallied across every order's line items
    const itemCounts = new Map<string, number>();
    for (const o of completed) {
      for (const line of o.items as { name: string; qty: number }[]) {
        itemCounts.set(line.name, (itemCounts.get(line.name) ?? 0) + line.qty);
      }
    }
    const bestSellers = [...itemCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    return {
      totalRevenue,
      weekRevenue,
      totalOrders,
      weekOrders,
      avgOrderValue,
      bestSellers,
      recentOrders: all.slice(0, 30),
    };
  });
