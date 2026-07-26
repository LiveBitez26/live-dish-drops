import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ query: z.string().min(1).max(100) });

export const search = createServerFn({ method: "GET" })
  .inputValidator(schema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const q = data.query.trim();
    if (!q) return { creators: [], dishes: [] };

    const [{ data: creators }, { data: dishes }] = await Promise.all([
      supabase
        .from("creators")
        .select("id, handle, bio, is_live, profiles!profile_id(avatar_url)")
        .ilike("handle", `%${q}%`)
        .limit(8),
      supabase
        .from("menu_items")
        .select("id, name, price, image_url, creator_id, creators(handle)")
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .eq("is_available", true)
        .limit(8),
    ]);

    return { creators: creators ?? [], dishes: dishes ?? [] };
  });
