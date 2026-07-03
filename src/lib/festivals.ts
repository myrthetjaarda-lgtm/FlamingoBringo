import { supabase } from "@/integrations/supabase/client";
import type { RecommendationRegion } from "@/lib/spots";

export type FestivalRow = {
  id: string;
  source: string;
  external_id: string;
  name: string;
  region: RecommendationRegion;
  city: string | null;
  starts_on: string | null;
  ends_on: string | null;
  url: string | null;
  fetched_at: string;
};

export async function fetchFestivals() {
  const { data, error } = await supabase
    .from("festivals")
    .select("*")
    .order("starts_on", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data as FestivalRow[]) ?? [];
}
