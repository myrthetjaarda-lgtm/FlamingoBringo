import { supabase } from "@/integrations/supabase/client";

export type RecommendationCategory = "restaurant" | "café" | "bar" | "activity" | "sight" | "other";
export type RecommendationRegion = "Netherlands" | "Berlin";

export type RecommendationRow = {
  id: string;
  owner_id: string;
  name: string;
  category: RecommendationCategory;
  region: RecommendationRegion;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  rating: number | null;
  added_by: string;
  added_by_user_id: string | null;
  share_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ShareRow = {
  id: string;
  owner_id: string;
  name: string;
  token: string;
  created_at: string;
  revoked_at: string | null;
};

export async function fetchMyRecommendations(ownerId: string) {
  const { data, error } = await supabase
    .from("recommendations")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as RecommendationRow[]) ?? [];
}

export async function createRecommendation(input: {
  owner_id: string;
  name: string;
  category: RecommendationCategory;
  region: RecommendationRegion;
  city: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
  rating?: number | null;
  added_by: string;
  added_by_user_id: string;
}) {
  const { data, error } = await supabase
    .from("recommendations")
    .insert({
      owner_id: input.owner_id,
      name: input.name,
      category: input.category,
      region: input.region,
      city: input.city,
      address: input.address,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      notes: input.notes ?? null,
      rating: input.rating ?? null,
      added_by: input.added_by,
      added_by_user_id: input.added_by_user_id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as RecommendationRow;
}

// Used from the public /share/$token page — no Supabase session, RLS allows
// this insert only when share_id points at a non-revoked share whose
// owner_id matches the one supplied here.
export async function createSharedRecommendation(input: {
  owner_id: string;
  share_id: string;
  name: string;
  category: RecommendationCategory;
  region: RecommendationRegion;
  city: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
  rating?: number | null;
  added_by: string;
}) {
  const { data, error } = await supabase
    .from("recommendations")
    .insert({
      owner_id: input.owner_id,
      share_id: input.share_id,
      name: input.name,
      category: input.category,
      region: input.region,
      city: input.city,
      address: input.address,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      notes: input.notes ?? null,
      rating: input.rating ?? null,
      added_by: input.added_by,
    })
    .select()
    .single();
  if (error) throw error;
  return data as RecommendationRow;
}

export async function updateRecommendation(
  id: string,
  patch: Partial<
    Pick<
      RecommendationRow,
      "name" | "category" | "region" | "city" | "address" | "lat" | "lng" | "notes" | "rating"
    >
  >,
) {
  const { error } = await supabase.from("recommendations").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteRecommendation(id: string) {
  const { error } = await supabase.from("recommendations").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchMyShares(ownerId: string) {
  const { data, error } = await supabase
    .from("recommendation_shares")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ShareRow[]) ?? [];
}

export async function createShare(input: { owner_id: string; name: string }) {
  const { data, error } = await supabase
    .from("recommendation_shares")
    .insert({ owner_id: input.owner_id, name: input.name })
    .select()
    .single();
  if (error) throw error;
  return data as ShareRow;
}

export async function revokeShare(id: string) {
  const { error } = await supabase
    .from("recommendation_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
