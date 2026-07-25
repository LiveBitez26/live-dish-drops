import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { dispatchDoorDashDelivery } from "@/lib/server/doordash";

const updateStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["accepted", "declined", "preparing", "out_for_delivery", "delivered"]),
});

/**
 * Creator-only. Accept/decline/advance an order's status.
 * On "accepted", triggers the DoorDash Drive dispatch.
 * RLS already restricts UPDATE to the owning creator, but we re-check here
 * too since RLS alone doesn't stop someone from renaming a customer's own
 * order into a status they shouldn't be able to set.
 */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator(updateStatusSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    // Confirm this user actually owns the creator on this order.
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*, creators!inner(profile_id)")
      .eq("id", data.orderId)
      .single();
    if (fetchError || !order) throw new Error("ORDER_NOT_FOUND");
    if ((order as any).creators.profile_id !== userData.user.id) {
      throw new Error("FORBIDDEN");
    }

    const { data: updated, error } = await supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId)
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (data.status === "accepted") {
      // Fire-and-forget-ish: don't block the creator's UI on DoorDash's API,
      // but do log failures so they're visible server-side.
      dispatchDoorDashDelivery(updated).catch((err) => {
        console.error(`DoorDash dispatch failed for order ${updated.id}:`, err);
      });
    }

    return updated;
  });

const createOrderSchema = z.object({
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
});

/**
 * Creates a pending order row and decrements inventory atomically per line
 * item via the decrement_inventory RPC. Does NOT take payment — that
 * happens in the /api/stripe/checkout route, which calls this first and
 * then creates the Checkout Session referencing the resulting order id.
 */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(createOrderSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    // Reserve inventory for every line item first; if any fails, the whole
    // order fails (the earlier successful decrements are best-effort
    // reverted below).
    const reserved: string[] = [];
    for (const line of data.items) {
      const { error } = await supabase.rpc("decrement_inventory", {
        p_menu_item_id: line.menuItemId,
        p_qty: line.qty,
      });
      if (error) {
        // roll back whatever we already reserved
        for (const menuItemId of reserved) {
          const original = data.items.find((i) => i.menuItemId === menuItemId);
          if (original) {
            await supabase.rpc("decrement_inventory", {
              p_menu_item_id: menuItemId,
              p_qty: -original.qty,
            });
          }
        }
        throw new Error(`OUT_OF_STOCK: ${line.name}`);
      }
      reserved.push(line.menuItemId);
    }

    const totalAmount = data.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    const platformFee = Math.round(totalAmount * 0.15 * 100) / 100; // 15% platform fee
    const creatorPayout = Math.round((totalAmount - platformFee) * 100) / 100;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_id: userData.user.id,
        creator_id: data.creatorId,
        items: data.items.map((i) => ({
          menu_item_id: i.menuItemId,
          name: i.name,
          qty: i.qty,
          unit_price: i.unitPrice,
        })),
        total_amount: totalAmount,
        platform_fee_amount: platformFee,
        creator_payout_amount: creatorPayout,
        delivery_address: data.deliveryAddress,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return order;
  });
