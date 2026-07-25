import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ creatorId: z.string().uuid() });

/**
 * Everything /live/$id and /creator/$id need in one round trip:
 * creator + owner profile, full menu, and the current live_streams row
 * (if any) so the page knows whether to show the video player.
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

    return { creator, menu: menu ?? [], activeStream };
  });
