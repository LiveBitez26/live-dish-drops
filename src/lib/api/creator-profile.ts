import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// --- Follow / unfollow ------------------------------------------------------

const followSchema = z.object({ creatorId: z.string().uuid() });

export const toggleFollow = createServerFn({ method: "POST" })
  .inputValidator(followSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    const { data: existing } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", userData.user.id)
      .eq("creator_id", data.creatorId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userData.user.id)
        .eq("creator_id", data.creatorId);
      return { following: false };
    } else {
      await supabase.from("follows").insert({ follower_id: userData.user.id, creator_id: data.creatorId });
      return { following: true };
    }
  });

export const getIsFollowing = createServerFn({ method: "GET" })
  .inputValidator(followSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { following: false };

    const { data: existing } = await supabase
      .from("follows")
      .select("creator_id")
      .eq("follower_id", userData.user.id)
      .eq("creator_id", data.creatorId)
      .maybeSingle();

    return { following: Boolean(existing) };
  });

// --- Reviews (verified purchase only) ---------------------------------------

const reviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
});

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator(reviewSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, customer_id, creator_id, status")
      .eq("id", data.orderId)
      .single();
    if (orderError || !order) throw new Error("ORDER_NOT_FOUND");
    if (order.customer_id !== userData.user.id) throw new Error("FORBIDDEN");
    if (order.status !== "delivered") throw new Error("ORDER_NOT_DELIVERED_YET");

    const { error } = await supabase.from("reviews").insert({
      order_id: order.id,
      customer_id: userData.user.id,
      creator_id: order.creator_id,
      rating: data.rating,
      body: data.body ?? null,
    });
    if (error) {
      if (error.message.includes("duplicate")) throw new Error("You've already reviewed this order.");
      throw new Error(error.message);
    }
    return { ok: true };
  });

/** Orders a customer can leave a review for right now (delivered, no review yet). */
export const getReviewableOrders = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("*, reviews(id)")
    .eq("customer_id", userData.user.id)
    .eq("status", "delivered");

  return (orders ?? []).filter((o: any) => !o.reviews || o.reviews.length === 0);
});

// --- Scheduled drops (drop calendar) -----------------------------------------

const scheduleDropSchema = z.object({
  creatorId: z.string().uuid(),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  scheduledAt: z.string(), // ISO datetime
});

export const scheduleDrop = createServerFn({ method: "POST" })
  .inputValidator(scheduleDropSchema)
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

    const { data: drop, error } = await supabase
      .from("scheduled_drops")
      .insert({
        creator_id: data.creatorId,
        title: data.title,
        description: data.description ?? null,
        scheduled_at: data.scheduledAt,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return drop;
  });

export const deleteScheduledDrop = createServerFn({ method: "POST" })
  .inputValidator(z.object({ dropId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("scheduled_drops").delete().eq("id", data.dropId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Profile editing ----------------------------------------------------------

const updateProfileSchema = z.object({
  creatorId: z.string().uuid(),
  bio: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  deliveryRadiusMiles: z.number().min(0.5).max(50).optional(),
});

export const updateCreatorProfile = createServerFn({ method: "POST" })
  .inputValidator(updateProfileSchema)
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

    const updates: Record<string, unknown> = {};
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.location !== undefined) updates.location = data.location;
    if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl; // note: lives on profiles, handled separately below
    if (data.bannerUrl !== undefined) updates.banner_url = data.bannerUrl;
    if (data.deliveryRadiusMiles !== undefined) updates.delivery_radius_miles = data.deliveryRadiusMiles;

    // avatar_url actually lives on `profiles`, not `creators` — split it out.
    if (data.avatarUrl !== undefined) {
      delete updates.avatar_url;
      await supabase.from("profiles").update({ avatar_url: data.avatarUrl }).eq("id", userData.user.id);
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from("creators").update(updates).eq("id", data.creatorId);
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });
