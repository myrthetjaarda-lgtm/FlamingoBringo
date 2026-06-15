import { supabase } from "@/integrations/supabase/client";

export type EventRow = {
  id: string;
  organizer_id: string;
  name: string;
  description: string | null;
  starts_at: string | null;
  location: string | null;
  event_type: string | null;
  group_id: string | null;
  created_at: string;
  // Football match details (only meaningful when event_type === "football")
  home_team: string | null;
  away_team: string | null;
  home_score: number | null;
  away_score: number | null;
};

// Selectable event types with their emoji. event_type is a freeform text column,
// so this list drives the picker UI without needing a DB enum.
export type EventTypeMeta = { value: string; label: string; emoji: string };

export const EVENT_TYPES: EventTypeMeta[] = [
  { value: "birthday", label: "Birthday", emoji: "🎂" },
  { value: "football", label: "Football", emoji: "⚽" },
  { value: "gym", label: "Gym buddies", emoji: "💪" },
  { value: "cooking", label: "Cooking", emoji: "👨‍🍳" },
  { value: "picnic", label: "Picnic", emoji: "🧺" },
  { value: "bbq", label: "BBQ", emoji: "🔥" },
  { value: "party", label: "Party", emoji: "🎉" },
  { value: "dinner", label: "Dinner", emoji: "🍽️" },
  { value: "trip", label: "Trip", emoji: "🧳" },
  { value: "other", label: "Other", emoji: "📅" },
];

export const eventTypeEmoji = (t: string | null | undefined) =>
  EVENT_TYPES.find((e) => e.value === t)?.emoji ?? "📅";

export const eventTypeLabel = (t: string | null | undefined) =>
  EVENT_TYPES.find((e) => e.value === t)?.label ?? null;

export type BringItemRow = {
  id: string;
  event_id: string;
  name: string;
  emoji: string;
  quantity: string | null;
  ingredients: string | null;
  required: boolean;
  category: string;
  has_this: boolean;
  claimed_by: string | null;
  created_by: string | null;
  status: "pending" | "confirmed";
  created_at: string;
  qty_needed: number;
  is_byo: boolean;
};

export type BringClaimRow = {
  id: string;
  item_id: string;
  event_id: string;
  user_id: string;
  qty: number;
  has_this: boolean;
  created_at: string;
};

export type ProfileLite = {
  id: string;
  display_name: string;
  emoji_avatar: string;
};

export type ProfileFull = {
  id: string;
  display_name: string;
  emoji_avatar: string;
  bio: string | null;
  dietary: string[];
  phone: string | null;
  instagram: string | null;
  facebook: string | null;
  show_phone: boolean;
  default_location: string | null;
  equipment: string[];
};

// Payment handles live behind a migration and are fetched separately (see
// fetchPaymentHandles) so a missing migration can't break core profile loads.
export type PaymentHandles = {
  paypal: string | null;
  iban: string | null;
  payment_note: string | null;
};

// Common staples that people usually already have at home.
export const STAPLES = ["oil", "salt", "pepper", "butter", "flour", "sugar", "water", "ice"];

export function isStaple(name: string) {
  const n = name.toLowerCase();
  return STAPLES.some((s) => n.includes(s));
}

export async function fetchEvent(id: string) {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as EventRow | null) ?? null;
}

export async function fetchUserEvents(userId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", userId)
    .order("starts_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data as EventRow[]) ?? [];
}

export async function fetchAllEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data as EventRow[]) ?? [];
}

export async function fetchBringItems(eventId: string) {
  const { data, error } = await supabase
    .from("bring_items")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as BringItemRow[]) ?? [];
}

// Items the user has claimed across all events (with the event for context).
export async function fetchMyClaimedItems(userId: string) {
  const { data, error } = await supabase
    .from("bring_items")
    .select("*, events(id, name, starts_at)")
    .eq("claimed_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (BringItemRow & {
    events: { id: string; name: string; starts_at: string | null } | null;
  })[];
}

export async function fetchBringItemCounts(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, { total: number; claimed: number }>();
  const { data, error } = await supabase
    .from("bring_items")
    .select("event_id, claimed_by")
    .in("event_id", eventIds);
  if (error) throw error;
  const map = new Map<string, { total: number; claimed: number }>();
  (data ?? []).forEach((r: { event_id: string; claimed_by: string | null }) => {
    const cur = map.get(r.event_id) ?? { total: 0, claimed: 0 };
    cur.total += 1;
    if (r.claimed_by) cur.claimed += 1;
    map.set(r.event_id, cur);
  });
  return map;
}

export async function fetchProfiles(ids: string[]) {
  if (ids.length === 0) return new Map<string, ProfileLite>();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, emoji_avatar")
    .in("id", ids);
  if (error) throw error;
  const map = new Map<string, ProfileLite>();
  (data as ProfileLite[] | null)?.forEach((p) => map.set(p.id, p));
  return map;
}

export async function fetchProfilesFull(ids: string[]) {
  if (ids.length === 0) return new Map<string, ProfileFull>();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, emoji_avatar, bio, dietary, phone, instagram, facebook, show_phone, default_location, equipment",
    )
    .in("id", ids);
  if (error) throw error;
  const map = new Map<string, ProfileFull>();
  (data as ProfileFull[] | null)?.forEach((p) => map.set(p.id, p));
  return map;
}

// Fetch PayPal / IBAN / payment-note handles. These columns live behind the
// 20260614120000 migration; if it hasn't been applied yet the query errors, so
// we swallow it and return an empty map — the "settle up" handles just don't
// show, rather than breaking the calling page.
export async function fetchPaymentHandles(ids: string[]) {
  const map = new Map<string, PaymentHandles>();
  if (ids.length === 0) return map;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, paypal, iban, payment_note")
    .in("id", ids);
  if (error) return map;
  (data as (PaymentHandles & { id: string })[] | null)?.forEach((p) =>
    map.set(p.id, { paypal: p.paypal, iban: p.iban, payment_note: p.payment_note }),
  );
  return map;
}

export async function claimItem(itemId: string, userId: string, hasThis = false) {
  const { error } = await supabase
    .from("bring_items")
    .update({ claimed_by: userId, status: "confirmed", has_this: hasThis })
    .eq("id", itemId);
  if (error) throw error;
}

export async function unclaimItem(itemId: string) {
  const { error } = await supabase
    .from("bring_items")
    .update({ claimed_by: null, status: "pending", has_this: false })
    .eq("id", itemId);
  if (error) throw error;
}

export async function setHasThis(itemId: string, hasThis: boolean) {
  const { error } = await supabase
    .from("bring_items")
    .update({ has_this: hasThis })
    .eq("id", itemId);
  if (error) throw error;
}

export async function createEvent(input: {
  organizer_id: string;
  name: string;
  starts_at: string | null;
  location: string | null;
  description?: string | null;
  event_type?: string | null;
  group_id?: string | null;
}) {
  const { data, error } = await supabase
    .from("events")
    .insert({
      organizer_id: input.organizer_id,
      name: input.name,
      starts_at: input.starts_at,
      location: input.location,
      description: input.description ?? null,
      event_type: input.event_type ?? null,
      group_id: input.group_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventRow;
}

export async function updateEvent(
  id: string,
  patch: Partial<Omit<EventRow, "id" | "organizer_id" | "created_at">>,
) {
  const { error } = await supabase.from("events").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function addBringItem(input: {
  event_id: string;
  created_by: string;
  name: string;
  emoji?: string;
  quantity?: string | null;
  ingredients?: string | null;
  required?: boolean;
  category?: string;
  qty_needed?: number;
  is_byo?: boolean;
}) {
  const { error } = await supabase.from("bring_items").insert({
    event_id: input.event_id,
    created_by: input.created_by,
    name: input.name,
    emoji: input.emoji ?? "🧺",
    quantity: input.quantity ?? null,
    ingredients: input.ingredients ?? null,
    required: input.required ?? false,
    category: input.category ?? "other",
    qty_needed: Math.max(1, input.qty_needed ?? 1),
    is_byo: input.is_byo ?? false,
  });
  if (error) throw error;
}

export async function updateBringItem(
  id: string,
  patch: Partial<
    Pick<
      BringItemRow,
      | "name"
      | "emoji"
      | "quantity"
      | "ingredients"
      | "required"
      | "category"
      | "has_this"
      | "qty_needed"
    >
  >,
) {
  const { error } = await supabase.from("bring_items").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteBringItem(id: string) {
  const { error } = await supabase.from("bring_items").delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Partial / split claims ----------------

export async function fetchBringClaims(eventId: string) {
  const { data, error } = await supabase
    .from("bring_claims")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as BringClaimRow[]) ?? [];
}

// Add or update the signed-in user's claim on an item (one claim per person per item).
export async function upsertMyClaim(input: {
  item_id: string;
  event_id: string;
  user_id: string;
  qty: number;
  has_this: boolean;
}) {
  const { error } = await supabase.from("bring_claims").upsert(
    {
      item_id: input.item_id,
      event_id: input.event_id,
      user_id: input.user_id,
      qty: Math.max(1, input.qty),
      has_this: input.has_this,
    },
    { onConflict: "item_id,user_id" },
  );
  if (error) throw error;
}

export async function setClaimHasThis(itemId: string, userId: string, hasThis: boolean) {
  const { error } = await supabase
    .from("bring_claims")
    .update({ has_this: hasThis })
    .eq("item_id", itemId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeMyClaim(itemId: string, userId: string) {
  const { error } = await supabase
    .from("bring_claims")
    .delete()
    .eq("item_id", itemId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ---------------- RSVPs ----------------

export type RsvpStatus = "coming" | "maybe" | "declined";

export type RsvpRow = {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  relationship_label: string | null;
  arrival_time: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchRsvps(eventId: string) {
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as RsvpRow[]) ?? [];
}

export async function upsertRsvp(input: {
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  relationship_label?: string | null;
  arrival_time?: string | null;
  note?: string | null;
}) {
  const { data, error } = await supabase
    .from("rsvps")
    .upsert(
      {
        event_id: input.event_id,
        user_id: input.user_id,
        status: input.status,
        relationship_label: input.relationship_label ?? null,
        arrival_time: input.arrival_time ?? null,
        note: input.note ?? null,
      },
      { onConflict: "event_id,user_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as RsvpRow;
}

export async function deleteRsvp(eventId: string, userId: string) {
  const { error } = await supabase
    .from("rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ---------------- Find a date (date poll) ----------------

export type Availability = "yes" | "maybe" | "no";

export type DateOptionRow = {
  id: string;
  event_id: string;
  option_date: string; // YYYY-MM-DD
  time_label: string | null;
  created_by: string | null;
  created_at: string;
};

export type DateVoteRow = {
  id: string;
  option_id: string;
  event_id: string;
  user_id: string;
  availability: Availability;
  created_at: string;
  updated_at: string;
};

export async function fetchDateOptions(eventId: string) {
  const { data, error } = await supabase
    .from("date_options")
    .select("*")
    .eq("event_id", eventId)
    .order("option_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DateOptionRow[]) ?? [];
}

export async function fetchDateVotes(eventId: string) {
  const { data, error } = await supabase.from("date_votes").select("*").eq("event_id", eventId);
  if (error) throw error;
  return (data as DateVoteRow[]) ?? [];
}

export async function addDateOption(input: {
  event_id: string;
  created_by: string;
  option_date: string;
  time_label?: string | null;
}) {
  const { data, error } = await supabase
    .from("date_options")
    .insert({
      event_id: input.event_id,
      created_by: input.created_by,
      option_date: input.option_date,
      time_label: input.time_label ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as DateOptionRow;
}

export async function deleteDateOption(id: string) {
  const { error } = await supabase.from("date_options").delete().eq("id", id);
  if (error) throw error;
}

export async function castDateVote(input: {
  option_id: string;
  event_id: string;
  user_id: string;
  availability: Availability;
}) {
  const { error } = await supabase.from("date_votes").upsert(
    {
      option_id: input.option_id,
      event_id: input.event_id,
      user_id: input.user_id,
      availability: input.availability,
    },
    { onConflict: "option_id,user_id" },
  );
  if (error) throw error;
}

export async function removeDateVote(optionId: string, userId: string) {
  const { error } = await supabase
    .from("date_votes")
    .delete()
    .eq("option_id", optionId)
    .eq("user_id", userId);
  if (error) throw error;
}
