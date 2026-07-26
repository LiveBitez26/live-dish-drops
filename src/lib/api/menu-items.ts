import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function assertOwnsCreator(supabase: ReturnType<typeof getSupabaseServerClient>, creatorId: string, userId: string) {
  const { data: creator } = await supabase.from("creators").select("profile_id").eq("id", creatorId).single();
  if (!creator || creator.profile_id !== userId) throw new Error("FORBIDDEN");
}

const createMenuItemSchema = z.object({
  creatorId: z.string().uuid(),
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  price: z.number().nonnegative(),
  totalInventory: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional(),
});

export const createMenuItem = createServerFn({ method: "POST" })
  .inputValidator(createMenuItemSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");
    await assertOwnsCreator(supabase, data.creatorId, userData.user.id);

    const { data: item, error } = await supabase
      .from("menu_items")
      .insert({
        creator_id: data.creatorId,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        total_inventory: data.totalInventory,
        remaining_inventory: data.totalInventory,
        image_url: data.imageUrl ?? null,
        is_available: data.totalInventory > 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return item;
  });

const updateMenuItemSchema = z.object({
  menuItemId: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(300).nullable().optional(),
  price: z.number().nonnegative().optional(),
  totalInventory: z.number().int().nonnegative().optional(),
  remainingInventory: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export const updateMenuItem = createServerFn({ method: "POST" })
  .inputValidator(updateMenuItemSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("UNAUTHENTICATED");

    const { data: item } = await supabase
      .from("menu_items")
      .select("creator_id")
      .eq("id", data.menuItemId)
      .single();
    if (!item) throw new Error("NOT_FOUND");
    await assertOwnsCreator(supabase, item.creator_id, userData.user.id);

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.price !== undefined) updates.price = data.price;
    if (data.totalInventory !== undefined) updates.total_inventory = data.totalInventory;
    if (data.remainingInventory !== undefined) updates.remaining_inventory = data.remainingInventory;
    if (data.imageUrl !== undefined) updates.image_url = data.imageUrl;

    const { error } = await supabase.from("menu_items").update(updates).eq("id", data.menuItemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMenuItem = createServerFn({ method: "POST" })
  .inputValidator(z.object({ menuItemId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("menu_items").delete().eq("id", data.menuItemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
