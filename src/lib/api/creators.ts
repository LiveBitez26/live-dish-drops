import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ creatorId: z.string().uuid() });

/**
 * Everything /live/$id and /creator/$id need in one round trip:
 * creator + owner profile, full menu, current live_streams row (if any),
 * recent reviews, upcoming scheduled drops, and whether the current viewer
 * follows this creator.
 */
export const getCreatorPageData = createServerFn({ method: "GET" })
  .inputValidator(schema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    const { data: creator, error } = await supabase
      .from("creators")
      .select("*, profiles(full_name, avatar_url)")
      .eq("id", data.creatorId)
      .single();
    if (error || !creator) throw notFound();

    const { data: menu } = await supabase
      .from("menu_items")
      .select("*")
      .eq("creator_id", data.creatorId)
      .order("created_at");

    const { data: activeStream } = await supabase
      .from("live_streams")
      .select("*")
      .eq("creator_id", data.creatorId)
      .eq("status", "live")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: reviews } = await supabase
      .from("reviews")
      .select("*, profiles(full_name)")
      .eq("creator_id", data.creatorId)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: upcomingDrops } = await supabase
      .from("scheduled_drops")
      .select("*")
      .eq("creator_id", data.creatorId)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });

    const { data: userData } = await supabase.auth.getUser();
    let isFollowing = false;
    if (userData.user) {
      const { data: followRow } = await supabase
        .from("follows")
        .select("creator_id")
        .eq("follower_id", userData.user.id)
        .eq("creator_id", data.creatorId)
        .maybeSingle();
      isFollowing = Boolean(followRow);
    }

    return {
      creator,
      menu: menu ?? [],
      activeStream,
      reviews: reviews ?? [],
      upcomingDrops: upcomingDrops ?? [],
      isFollowing,
    };
  });
