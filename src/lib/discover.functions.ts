import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type DiscoverProfile = {
  id: string;
  display_name: string;
  emoji_avatar: string;
  neighborhood: string | null;
  interests: string[];
  availability_status: string;
  social_mode: string;
};

export const fetchDiscoverProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? "";
  const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? "";
  if (!url || !key) throw new Error("Missing Supabase env vars");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, emoji_avatar, neighborhood, interests, availability_status, social_mode")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as DiscoverProfile[];
});
