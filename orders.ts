import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });
}

const onboardSchema = z.object({
  returnUrl: z.string().url(),
  refreshUrl: z.string().url(),
});

/**
 * Creates (if needed) a Stripe Connect Express account for the signed-in
 * creator and returns the onboarding link URL to redirect them to.
 */
export const startCreatorStripeOnboarding = createServerFn({ method: "POST" })
  .inputValidator(onboardSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    const { data: creator, error } = await supabase
      .from("creators")
      .select("*")
      .eq("profile_id", userData.user.id)
      .single();
    if (error || !creator) throw new Error("CREATOR_PROFILE_NOT_FOUND");

    const stripe = getStripe();
    let accountId = creator.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: userData.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
      });
      accountId = account.id;
      await supabase.from("creators").update({ stripe_account_id: accountId }).eq("id", creator.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: data.returnUrl,
      refresh_url: data.refreshUrl,
    });

    return { url: link.url };
  });

/** Checks onboarding completion status; call after redirect back from Stripe. */
export const getCreatorStripeStatus = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("UNAUTHENTICATED");

  const { data: creator } = await supabase
    .from("creators")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("profile_id", userData.user.id)
    .single();
  if (!creator?.stripe_account_id) return { connected: false, complete: false };

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(creator.stripe_account_id);
  const complete = Boolean(account.charges_enabled && account.payouts_enabled);

  if (complete !== creator.stripe_onboarding_complete) {
    await supabase
      .from("creators")
      .update({ stripe_onboarding_complete: complete })
      .eq("stripe_account_id", creator.stripe_account_id);
  }

  return { connected: true, complete };
});
