import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/api/orders";

function getStripe() {
  return new Stripe(getEnv("STRIPE_SECRET_KEY")!, { apiVersion: "2024-12-18.acacia" });
}

const checkoutSchema = z.object({
  creatorId: z.string().uuid(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        name: z.string(),
        qty: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .min(1),
  deliveryAddress: z.object({
    line1: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

/**
 * 1. Creates the order + reserves inventory (via createOrder).
 * 2. Creates a Stripe Checkout Session as a destination charge against the
 *    creator's connected account, with LiveBite's cut taken as an
 *    application fee.
 * 3. Returns the Checkout URL for the client to redirect to.
 *
 * The order is only marked "accepted"/paid once the webhook confirms
 * `checkout.session.completed` — see src/routes/api/stripe/webhook.ts.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(checkoutSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("stripe_account_id, stripe_onboarding_complete, handle")
      .eq("id", data.creatorId)
      .single();
    if (creatorError || !creator) throw new Error("CREATOR_NOT_FOUND");
    if (!creator.stripe_account_id || !creator.stripe_onboarding_complete) {
      throw new Error("CREATOR_PAYOUTS_NOT_ENABLED");
    }

    const order = await createOrder({
      data: {
        creatorId: data.creatorId,
        items: data.items,
        deliveryAddress: data.deliveryAddress,
      },
    });

    const platformFeeCents = Math.round(order.platform_fee_amount * 100);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: data.items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.qty,
      })),
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: creator.stripe_account_id },
        metadata: { order_id: order.id },
      },
      metadata: { order_id: order.id },
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
    });

    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return { checkoutUrl: session.url, orderId: order.id };
  });
