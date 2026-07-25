import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { getEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function getStripe() {
  return new Stripe(getEnv("STRIPE_SECRET_KEY")!, { apiVersion: "2024-12-18.acacia" });
}

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripe = getStripe();
        const signature = request.headers.get("stripe-signature");
        const rawBody = await request.text();

        let event: Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(
            rawBody,
            signature ?? "",
            getEnv("STRIPE_WEBHOOK_SECRET")!,
          );
        } catch (err) {
          console.error("Stripe webhook signature verification failed:", err);
          return new Response("Invalid signature", { status: 400 });
        }

        const supabase = getSupabaseAdminClient();

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = session.metadata?.order_id;
            if (orderId) {
              await supabase
                .from("orders")
                .update({
                  status: "accepted",
                  stripe_payment_intent_id:
                    typeof session.payment_intent === "string" ? session.payment_intent : null,
                })
                .eq("id", orderId);
            }
            break;
          }

          case "checkout.session.expired": {
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = session.metadata?.order_id;
            if (orderId) {
              // Release reserved inventory and mark declined when payment never completes.
              const { data: order } = await supabase.from("orders").select("items").eq("id", orderId).single();
              if (order) {
                for (const line of order.items as { menu_item_id: string; qty: number }[]) {
                  await supabase.rpc("decrement_inventory", {
                    p_menu_item_id: line.menu_item_id,
                    p_qty: -line.qty,
                  });
                }
              }
              await supabase.from("orders").update({ status: "declined" }).eq("id", orderId);
            }
            break;
          }

          default:
            break;
        }

        return Response.json({ received: true });
      },
    },
  },
});
