import jwt from "jsonwebtoken";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

/**
 * PLACEHOLDER — DoorDash Drive dispatch.
 *
 * DoorDash Drive auth uses a signed JWT (developer-id / key-id / signing
 * secret from the DoorDash Developer Portal), not a simple bearer token.
 * Fill in DOORDASH_DEVELOPER_ID / DOORDASH_KEY_ID / DOORDASH_SIGNING_SECRET
 * in .env.local once you have Drive API access, then flesh out the delivery
 * payload (pickup address needs to come from the creator's `location`,
 * dropoff from `order.delivery_address`, and you'll want real dropoff
 * `dropoff_phone_number` collected at checkout).
 *
 * Docs: https://developer.doordash.com/en-US/docs/drive/how-to/manage-deliveries/
 */
export async function dispatchDoorDashDelivery(order: Order) {
  if (!process.env.DOORDASH_DEVELOPER_ID) {
    console.warn(`[doordash] Not configured — skipping dispatch for order ${order.id}`);
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("handle, location")
    .eq("id", order.creator_id)
    .single();

  const token = jwt.sign(
    {},
    Buffer.from(process.env.DOORDASH_SIGNING_SECRET!, "base64"),
    {
      algorithm: "HS256",
      expiresIn: "5m",
      header: {
        "dd-ver": "DD-JWT-V1",
        alg: "HS256",
        typ: "JWT",
      } as any,
      issuer: process.env.DOORDASH_DEVELOPER_ID,
      keyid: process.env.DOORDASH_KEY_ID,
    },
  );

  const address = order.delivery_address as
    | { line1: string; city: string; state: string; zip: string }
    | null;

  const payload = {
    external_delivery_id: order.id,
    pickup_address: creator?.location ?? "TODO: creator street address",
    pickup_business_name: creator?.handle ?? "LiveBite Creator",
    pickup_phone_number: "+10000000000", // TODO: store per-creator pickup phone
    dropoff_address: address ? `${address.line1}, ${address.city}, ${address.state} ${address.zip}` : "",
    dropoff_phone_number: "+10000000000", // TODO: collect at checkout
    order_value: Math.round(order.total_amount * 100),
  };

  const response = await fetch("https://openapi.doordash.com/drive/v2/deliveries", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`DoorDash dispatch failed: ${response.status} ${await response.text()}`);
  }

  const delivery = (await response.json()) as { delivery_id: string };
  await supabase.from("orders").update({ doordash_delivery_id: delivery.delivery_id }).eq("id", order.id);
  return delivery;
}
