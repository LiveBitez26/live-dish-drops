import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getStripe() {
  const key = getEnv("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Payments aren't set up yet — ask the platform owner to add Stripe keys.");
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" });
}

/** Ensures this profile has a Stripe Customer, creating one on first use. */
async function ensureStripeCustomer(supabase: ReturnType<typeof getSupabaseServerClient>, userId: string, email?: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({ email, metadata: { profile_id: userId } });
  await supabase.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

export const getMyPaymentMethods = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("profile_id", userData.user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) console.error("[getMyPaymentMethods] failed:", error.message);
  return data ?? [];
});

/**
 * Starts the "add a card" flow: creates a Stripe SetupIntent and returns its
 * client secret for the frontend to confirm with Stripe Elements/Payment
 * Element. Requires STRIPE_SECRET_KEY and a Stripe publishable key
 * (VITE_STRIPE_PUBLISHABLE_KEY) configured before it'll actually work.
 */
export const createSetupIntent = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("UNAUTHENTICATED");

  const stripe = getStripe();
  const customerId = await ensureStripeCustomer(supabase, userData.user.id, userData.user.email);

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
  });

  return { clientSecret: setupIntent.client_secret };
});

/**
 * Call after Stripe Elements confirms the SetupIntent client-side — saves
 * the resulting payment method's display info (brand/last4/expiry) so it
 * shows up in the account page. Never touches raw card data.
 */
const saveCardSchema = z.object({ stripePaymentMethodId: z.string(), isDefault: z.boolean().default(false) });

export const savePaymentMethod = createServerFn({ method: "POST" })
  .inputValidator(saveCardSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    const stripe = getStripe();
    const pm = await stripe.paymentMethods.retrieve(data.stripePaymentMethodId);
    if (!pm.card) throw new Error("Not a card payment method");

    if (data.isDefault) {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("profile_id", userData.user.id)
        .eq("is_default", true);
    }

    const { error } = await supabase.from("payment_methods").insert({
      profile_id: userData.user.id,
      stripe_payment_method_id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      exp_month: pm.card.exp_month,
      exp_year: pm.card.exp_year,
      is_default: data.isDefault,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePaymentMethod = createServerFn({ method: "POST" })
  .inputValidator(z.object({ paymentMethodId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    const { data: pm } = await supabase
      .from("payment_methods")
      .select("stripe_payment_method_id")
      .eq("id", data.paymentMethodId)
      .single();

    if (pm) {
      try {
        const stripe = getStripe();
        await stripe.paymentMethods.detach(pm.stripe_payment_method_id);
      } catch {
        // best-effort — still remove our record even if Stripe detach fails
      }
    }

    const { error } = await supabase.from("payment_methods").delete().eq("id", data.paymentMethodId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
