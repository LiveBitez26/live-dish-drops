import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(["customer", "creator"]).default("customer"),
});

export const signUp = createServerFn({ method: "POST" })
  .inputValidator(signUpSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.fullName } },
    });
    if (error) throw new Error(error.message);

    // profiles.role defaults to 'customer' via the DB trigger; bump it to
    // 'creator' here if they signed up as one.
    if (data.role === "creator" && authData.user) {
      await supabase.from("profiles").update({ role: "creator" }).eq("id", authData.user.id);
    }

    return { userId: authData.user?.id ?? null };
  });

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signIn = createServerFn({ method: "POST" })
  .inputValidator(signInSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { userId: authData.user?.id ?? null };
  });

/** Social login (Google, Apple, etc.) — returns the URL to redirect the browser to. */
const oauthSchema = z.object({
  provider: z.enum(["google", "apple", "facebook"]),
  redirectTo: z.string().url(),
});

export const signInWithOAuth = createServerFn({ method: "POST" })
  .inputValidator(oauthSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: oauthData, error } = await supabase.auth.signInWithOAuth({
      provider: data.provider,
      options: { redirectTo: data.redirectTo },
    });
    if (error) throw new Error(error.message);
    return { url: oauthData.url };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, creators(id, handle, is_live, verification_status)")
    .eq("id", userData.user.id)
    .single();

  return profile;
});
