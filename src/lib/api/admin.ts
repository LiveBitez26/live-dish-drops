import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";

/** Throws unless the calling user has profiles.is_admin = true. Returns their user id. */
async function requireAdmin(): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("UNAUTHENTICATED");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();
  if (!profile?.is_admin) throw new Error("FORBIDDEN");

  return userData.user.id;
}

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const admin = getSupabaseAdminClient();

  const [{ count: creatorCount }, { count: customerCount }, { data: orders }] = await Promise.all([
    admin.from("creators").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    admin.from("orders").select("total_amount, platform_fee_amount, status"),
  ]);

  const completedOrders = (orders ?? []).filter((o) => o.status !== "declined" && o.status !== "pending");
  const totalGMV = completedOrders.reduce((s, o) => s + o.total_amount, 0);
  const platformRevenue = completedOrders.reduce((s, o) => s + o.platform_fee_amount, 0);

  const { count: pendingCount } = await admin
    .from("creators")
    .select("*", { count: "exact", head: true })
    .eq("verification_status", "pending");

  return {
    creatorCount: creatorCount ?? 0,
    customerCount: customerCount ?? 0,
    totalOrders: completedOrders.length,
    totalGMV,
    platformRevenue,
    pendingVerifications: pendingCount ?? 0,
  };
});

export const getPendingCreators = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("creators")
    .select("*, profiles!profile_id(email, full_name)")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });
  return data ?? [];
});

export const getAllCreators = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("creators")
    .select("*, profiles!profile_id(email, full_name)")
    .order("created_at", { ascending: false });
  return data ?? [];
});

const reviewCreatorSchema = z.object({
  creatorId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().max(500).optional(),
});

export const reviewCreatorVerification = createServerFn({ method: "POST" })
  .inputValidator(reviewCreatorSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from("creators")
      .update({ verification_status: data.decision, verification_notes: data.notes ?? null })
      .eq("id", data.creatorId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAllOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("orders")
    .select("*, creators(handle), profiles!customer_id(email)")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
});
