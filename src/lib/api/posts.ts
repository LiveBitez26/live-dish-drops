import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const createPostSchema = z.object({
  creatorId: z.string().uuid(),
  contentType: z.enum(["photo", "video", "upcoming_drop"]),
  mediaUrl: z.string().url(),
  caption: z.string().max(300).optional(),
  dropTime: z.string().optional(), // ISO datetime, only meaningful for upcoming_drop
  price: z.number().nonnegative().optional(),
});

export const createPost = createServerFn({ method: "POST" })
  .inputValidator(createPostSchema)
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

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        creator_id: data.creatorId,
        content_type: data.contentType,
        media_url: data.mediaUrl,
        caption: data.caption ?? null,
        drop_time: data.dropTime ?? null,
        price: data.price ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return post;
  });

export const getMyPosts = createServerFn({ method: "GET" })
  .inputValidator(z.object({ creatorId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("creator_id", data.creatorId)
      .order("created_at", { ascending: false });
    if (error) console.error("[getMyPosts] failed:", error.message);
    return posts ?? [];
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator(z.object({ postId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("posts").delete().eq("id", data.postId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
