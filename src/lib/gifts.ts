import { supabase } from "@/integrations/supabase/client";

// A present idea on the birthday wishlist.
export type GiftItemRow = {
  id: string;
  event_id: string;
  created_by: string | null;
  name: string;
  emoji: string;
  url: string | null;
  note: string | null;
  price: number | null;
  created_at: string;
  updated_at: string;
};

// One person's pledge on a gift — either "I'll buy it" or a chip-in amount
// (Splitser / wie betaalt wat). One row per person per gift.
export type GiftContributionRow = {
  id: string;
  gift_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  is_buyer: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchGiftItems(eventId: string) {
  const { data, error } = await supabase
    .from("gift_items")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as GiftItemRow[]) ?? [];
}

export async function fetchGiftContributions(eventId: string) {
  const { data, error } = await supabase
    .from("gift_contributions")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as GiftContributionRow[]) ?? [];
}

export async function addGiftItem(input: {
  event_id: string;
  created_by: string;
  name: string;
  emoji?: string;
  url?: string | null;
  note?: string | null;
  price?: number | null;
}) {
  const { error } = await supabase.from("gift_items").insert({
    event_id: input.event_id,
    created_by: input.created_by,
    name: input.name,
    emoji: input.emoji ?? "🎁",
    url: input.url ?? null,
    note: input.note ?? null,
    price: input.price ?? null,
  });
  if (error) throw error;
}

export async function deleteGiftItem(id: string) {
  const { error } = await supabase.from("gift_items").delete().eq("id", id);
  if (error) throw error;
}

// Add or update the signed-in user's pledge on a gift.
export async function upsertMyGiftContribution(input: {
  gift_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  is_buyer: boolean;
}) {
  const { error } = await supabase.from("gift_contributions").upsert(
    {
      gift_id: input.gift_id,
      event_id: input.event_id,
      user_id: input.user_id,
      amount: Math.max(0, input.amount),
      is_buyer: input.is_buyer,
    },
    { onConflict: "gift_id,user_id" },
  );
  if (error) throw error;
}

export async function removeMyGiftContribution(giftId: string, userId: string) {
  const { error } = await supabase
    .from("gift_contributions")
    .delete()
    .eq("gift_id", giftId)
    .eq("user_id", userId);
  if (error) throw error;
}
