import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string;
  display_name: string;
  emoji_avatar: string;
  neighborhood: string | null;
  driving_license: boolean;
  owns_car: boolean;
  bike_scooter_provider: string | null;
  transit_passes: string[];
  rideshare_provider: string | null;
};

export const getAdminUsers = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? "";
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

  if (!url || !serviceKey) throw new Error("Missing Supabase service role env vars");

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: authData, error: authErr } = await admin.auth.admin.listUsers({ perPage: 500 });
  if (authErr) throw new Error(authErr.message);

  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select(
      "id, display_name, emoji_avatar, neighborhood, driving_license, owns_car, bike_scooter_provider, transit_passes, rideshare_provider",
    );
  if (profErr) throw new Error(profErr.message);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (authData.users ?? []).map((u) => {
    const p = profileMap.get(u.id);
    const provider = u.app_metadata?.provider ?? "email";
    return {
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      provider,
      display_name: p?.display_name ?? u.email?.split("@")[0] ?? "?",
      emoji_avatar: p?.emoji_avatar ?? "🦩",
      neighborhood: p?.neighborhood ?? null,
      driving_license: p?.driving_license ?? false,
      owns_car: p?.owns_car ?? false,
      bike_scooter_provider: p?.bike_scooter_provider ?? null,
      transit_passes: p?.transit_passes ?? [],
      rideshare_provider: p?.rideshare_provider ?? null,
    } satisfies AdminUser;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
});
