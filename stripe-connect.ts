import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Post = Database["public"]["Tables"]["posts"]["Row"] & {
  creators: { handle: string; profile_id: string; profiles: { avatar_url: string | null } | null } | null;
};

/** Powers the Daily Feed tab. Fetches recent posts and stays live for new drops. */
export function useDailyFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase
      .from("posts")
      .select("*, creators(handle, profile_id, profiles(avatar_url))")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setPosts(data as unknown as Post[]);
        setLoading(false);
      });

    const channel = supabase
      .channel("posts:feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => setPosts((prev) => [payload.new as Post, ...prev]),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { posts, loading };
}

type Comment = Database["public"]["Tables"]["post_comments"]["Row"] & {
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

/** Comments for a single post — used in the feed's comment sheet/modal. */
export function usePostComments(postId: string | undefined) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!postId) return;
    const supabase = getSupabaseBrowserClient();

    supabase
      .from("post_comments")
      .select("*, profiles(full_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setComments(data as unknown as Comment[]);
      });

    const channel = supabase
      .channel(`comments:post:${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        (payload) => setComments((prev) => [...prev, payload.new as Comment]),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return comments;
}

export async function postComment(postId: string, authorId: string, body: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("post_comments").insert({ post_id: postId, author_id: authorId, body });
  if (error) throw new Error(error.message);
}
