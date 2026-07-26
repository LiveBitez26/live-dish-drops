import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Uploads a file to the shared `livebite-images` bucket under
 * `<folder>/<userId>/<timestamp>-<filename>` and returns its public URL.
 * `folder` is just a label (e.g. "avatars", "banners") for organization —
 * the RLS policy only cares that the second path segment is the user's own id.
 */
export async function uploadImage(file: File, folder: string, userId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("livebite-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("livebite-images").getPublicUrl(path);
  return data.publicUrl;
}
