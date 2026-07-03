import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { RecommendationRow } from "@/lib/spots";

// Same Lovable Cloud connector gateway used by weather.functions.ts for the
// Google Maps Platform. Geocoding is best-effort: if the gateway path or
// keys don't resolve, we fall back to no coordinates rather than blocking
// the create flow — the entry still saves with its typed address.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      address: z.string().min(1),
      city: z.string().min(1),
      region: z.enum(["Netherlands", "Berlin"]),
    }),
  )
  .handler(async ({ data }): Promise<{ lat: number; lng: number } | null> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) return null;

    const countryHint = data.region === "Berlin" ? "Germany" : "Netherlands";
    const query = [data.address, data.city, countryHint].filter(Boolean).join(", ");

    try {
      const url = `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        },
      });
      if (!res.ok) {
        console.error("Geocoding error", res.status, await res.text());
        return null;
      }
      const json = (await res.json()) as {
        results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
      };
      const loc = json.results?.[0]?.geometry?.location;
      if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") return null;
      return { lat: loc.lat, lng: loc.lng };
    } catch (e) {
      console.error("Geocoding fetch failed", e);
      return null;
    }
  });

export type SharedRecommendations = {
  share: { id: string; name: string; ownerId: string };
  recommendations: RecommendationRow[];
};

// Public share page reads go through this service-role function instead of
// a direct anon SELECT policy, so the recommendations table stays closed to
// blanket anonymous reads — only a request presenting a valid, non-revoked
// token gets the owner's list back.
export const getSharedRecommendations = createServerFn({ method: "GET" })
  .inputValidator(z.object({ token: z.string().min(1) }))
  .handler(async ({ data }): Promise<SharedRecommendations | null> => {
    const { data: share, error: shareErr } = await supabaseAdmin
      .from("recommendation_shares")
      .select("id, name, owner_id, revoked_at")
      .eq("token", data.token)
      .maybeSingle();

    if (shareErr) throw new Error(shareErr.message);
    if (!share || share.revoked_at) return null;

    const { data: recommendations, error: recErr } = await supabaseAdmin
      .from("recommendations")
      .select("*")
      .eq("owner_id", share.owner_id)
      .order("created_at", { ascending: false });

    if (recErr) throw new Error(recErr.message);

    return {
      share: { id: share.id, name: share.name, ownerId: share.owner_id },
      recommendations: (recommendations ?? []) as RecommendationRow[],
    };
  });
