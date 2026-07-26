import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// --- Delivery addresses -------------------------------------------------------

export const getMyAddresses = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data } = await supabase
    .from("delivery_addresses")
    .select("*")
    .eq("profile_id", userData.user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
});

const addressSchema = z.object({
  label: z.string().min(1).max(40),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  isDefault: z.boolean().default(false),
});

export const addAddress = createServerFn({ method: "POST" })
  .inputValidator(addressSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    // Only one default allowed — clear any existing default first if this one is being set.
    if (data.isDefault) {
      await supabase
        .from("delivery_addresses")
        .update({ is_default: false })
        .eq("profile_id", userData.user.id)
        .eq("is_default", true);
    }

    const { data: address, error } = await supabase
      .from("delivery_addresses")
      .insert({
        profile_id: userData.user.id,
        label: data.label,
        line1: data.line1,
        line2: data.line2 ?? null,
        city: data.city,
        state: data.state,
        zip: data.zip,
        is_default: data.isDefault,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return address;
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .inputValidator(z.object({ addressId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("delivery_addresses").delete().eq("id", data.addressId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setDefaultAddress = createServerFn({ method: "POST" })
  .inputValidator(z.object({ addressId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    await supabase
      .from("delivery_addresses")
      .update({ is_default: false })
      .eq("profile_id", userData.user.id)
      .eq("is_default", true);
    const { error } = await supabase
      .from("delivery_addresses")
      .update({ is_default: true })
      .eq("id", data.addressId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Order history -------------------------------------------------------------

export const getMyOrderHistory = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data } = await supabase
    .from("orders")
    .select("*, creators(handle), reviews(id)")
    .eq("customer_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
});

// --- Followed creators -----------------------------------------------------------

export const getMyFollowedCreators = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data } = await supabase
    .from("follows")
    .select("creator_id, creators(id, handle, is_live, rating, follower_count, profiles!profile_id(avatar_url))")
    .eq("follower_id", userData.user.id)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row: any) => row.creators).filter(Boolean);
});

// --- Notification preferences -----------------------------------------------------

const notifySchema = z.object({
  notifyNewDrops: z.boolean().optional(),
  notifyOrderUpdates: z.boolean().optional(),
});

export const updateNotificationPrefs = createServerFn({ method: "POST" })
  .inputValidator(notifySchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    const updates: Record<string, boolean> = {};
    if (data.notifyNewDrops !== undefined) updates.notify_new_drops = data.notifyNewDrops;
    if (data.notifyOrderUpdates !== undefined) updates.notify_order_updates = data.notifyOrderUpdates;

    const { error } = await supabase.from("profiles").update(updates).eq("id", userData.user.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
