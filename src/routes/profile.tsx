import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Chip, Section } from "@/components/AppShell";
import { LogOut, Check, Loader2, Pencil, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SocialLinks } from "@/components/SocialLinks";
import { type BringItemRow, fetchMyClaimedItems } from "@/lib/events";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · FlamingoBringo" }] }),
  component: ProfilePage,
});

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-free", "Dairy-free",
  "Nut allergy", "Halal", "Kosher", "Pescatarian",
];

const INTEREST_OPTIONS = [
  "BBQs", "Lakes", "Open-air cinema", "Beer gardens", "Picnics",
  "Clubs", "Festivals", "Markets", "Hiking", "Board games",
  "Sports", "Volleyball", "Swimming", "Dancing", "Cycling",
  "Museums", "Karaoke", "Food markets", "Tech meetups", "Cinema",
];

const AVAILABILITY_OPTIONS = [
  "Open for plans", "Free this weekend", "In Berlin",
  "Working remotely", "Busy", "Traveling", "On holiday",
];

const SOCIAL_MODE_OPTIONS = [
  "Looking for plans", "Lake mode ☀️", "Chill only", "Party mode",
  "Outdoor mode", "Sports mood", "Quiet weekend", "Family time",
];

const EMOJI_POOL = ["🦩", "🍉", "🌻", "🥖", "🍑", "🌮", "🥑", "🧁", "🐝", "🐙", "🦊", "🌈"];

function ProfilePage() {
  const { profile, user, refreshProfile, signOut, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [bio, setBio] = useState("");
  const [emoji, setEmoji] = useState("🦩");
  const [phone, setPhone] = useState("");
  const [defaultLocation, setDefaultLocation] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [showPhone, setShowPhone] = useState(true);
  const [dietary, setDietary] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState("In Berlin");
  const [socialMode, setSocialMode] = useState("Looking for plans");

  const hydrate = () => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setNeighborhood(profile.neighborhood ?? "");
    setBio(profile.bio ?? "");
    setEmoji(profile.emoji_avatar);
    setPhone(profile.phone ?? "");
    setDefaultLocation(profile.default_location ?? "");
    setInstagram(profile.instagram ?? "");
    setFacebook(profile.facebook ?? "");
    setShowPhone(profile.show_phone ?? true);
    setDietary(profile.dietary ?? []);
    setInterests(profile.interests ?? []);
    setAvailabilityStatus(profile.availability_status ?? "In Berlin");
    setSocialMode(profile.social_mode ?? "Looking for plans");
  };

  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const toggleDiet = (d: string) =>
    setDietary((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const toggleInterest = (i: string) =>
    setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  const cancel = () => {
    hydrate();
    setEditing(false);
  };

  const save = async () => {
    if (!user) {
      toast.error("You're not signed in");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim().slice(0, 60) || "Friend",
        neighborhood: neighborhood.trim().slice(0, 80) || null,
        bio: bio.trim().slice(0, 280) || null,
        emoji_avatar: emoji,
        phone: phone.trim().slice(0, 40) || null,
        default_location: defaultLocation.trim().slice(0, 120) || null,
        instagram: instagram.trim().slice(0, 100) || null,
        facebook: facebook.trim().slice(0, 200) || null,
        show_phone: showPhone,
        dietary,
        interests,
        availability_status: availabilityStatus,
        social_mode: socialMode,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message || "Couldn't save profile");
      return;
    }
    await refreshProfile();
    toast.success("Profile saved");
    setEditing(false);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          Please sign in to view your profile.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="relative h-32 bg-gradient-sunset">
        <div className="absolute inset-x-0 bottom-0 translate-y-1/2 px-4">
          <div className="flex items-end justify-between">
            <button
              type="button"
              onClick={() => {
                if (!editing) return;
                setEmoji(EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]);
              }}
              className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-background bg-card text-5xl shadow-float"
              aria-label={editing ? "Shuffle avatar" : "Avatar"}
            >
              {emoji}
            </button>
            <div className="mb-2 flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={cancel}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold shadow-soft disabled:opacity-60"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-card/95 px-4 py-1.5 text-xs font-semibold shadow-soft"
                >
                  <Pencil className="h-3 w-3" />
                  Edit profile
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pt-16">
        {editing ? (
          <div className="space-y-3">
            <Field label="Display name">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                placeholder="Your name"
                className="w-full rounded-2xl border border-border/60 bg-card px-3 py-2 font-display text-xl font-semibold outline-none focus:border-coral"
              />
            </Field>

            <Field label="Email" hint="Managed by your login">
              <input
                value={user.email ?? ""}
                readOnly
                className="w-full cursor-not-allowed rounded-2xl border border-border/60 bg-muted px-3 py-2 text-sm text-muted-foreground outline-none"
              />
            </Field>

            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={40}
                placeholder="+31 …"
                className="w-full rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm outline-none focus:border-coral"
              />
            </Field>

            <Field label="Neighborhood">
              <input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                maxLength={80}
                placeholder="e.g. Neukölln"
                className="w-full rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm outline-none focus:border-coral"
              />
            </Field>

            <Field label="Default location">
              <input
                value={defaultLocation}
                onChange={(e) => setDefaultLocation(e.target.value)}
                maxLength={120}
                placeholder="e.g. Berlin"
                className="w-full rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm outline-none focus:border-coral"
              />
            </Field>

            <Field label="Instagram" hint="username or link">
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                maxLength={100}
                placeholder="@yourhandle"
                className="w-full rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm outline-none focus:border-coral"
              />
            </Field>

            <Field label="Facebook" hint="username or link">
              <input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                maxLength={200}
                placeholder="facebook.com/you"
                className="w-full rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm outline-none focus:border-coral"
              />
            </Field>

            <label className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-3 py-2.5">
              <span className="text-sm font-semibold">Show my phone to attendees</span>
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(e) => setShowPhone(e.target.checked)}
                className="h-4 w-4 accent-coral"
              />
            </label>

            <Field label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                rows={3}
                placeholder="A short bio…"
                className="w-full rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm outline-none focus:border-coral"
              />
            </Field>

            <Field label="Status">
              <div className="flex flex-wrap gap-1.5">
                {AVAILABILITY_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAvailabilityStatus(s)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                      availabilityStatus === s ? "bg-coral/20 text-coral" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Social mode">
              <div className="flex flex-wrap gap-1.5">
                {SOCIAL_MODE_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSocialMode(m)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                      socialMode === m ? "bg-lake/20 text-lake" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Interests">
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleInterest(i)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                      interests.includes(i) ? "bg-coral/15 text-coral" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Dietary preferences">
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_OPTIONS.map((d) => {
                  const on = dietary.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDiet(d)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        on ? "bg-leaf text-leaf-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="flex gap-2 pt-2">
              <button
                onClick={cancel}
                disabled={saving}
                className="flex-1 rounded-2xl border border-border/60 bg-card px-3 py-2.5 text-sm font-semibold shadow-card disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-coral px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold">
              {profile?.display_name ?? "Friend"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {[profile?.neighborhood, user.email].filter(Boolean).join(" · ")}
            </p>
            {profile?.phone && profile?.show_phone && (
              <p className="mt-1 text-xs text-muted-foreground">📞 {profile.phone}</p>
            )}
            {profile?.default_location && (
              <p className="text-xs text-muted-foreground">📍 {profile.default_location}</p>
            )}
            {(profile?.instagram || profile?.facebook) && (
              <div className="mt-2">
                <SocialLinks instagram={profile?.instagram} facebook={profile?.facebook} />
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile?.availability_status && (
                <Chip tone="coral">{profile.availability_status}</Chip>
              )}
              {profile?.social_mode && (
                <Chip tone="lake">{profile.social_mode}</Chip>
              )}
            </div>
            {profile?.interests && profile.interests.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.interests.map((i) => (
                  <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    {i}
                  </span>
                ))}
              </div>
            )}
            {profile?.dietary && profile.dietary.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.dietary.map((d) => (
                  <Chip key={d} tone="leaf">🌱 {d}</Chip>
                ))}
              </div>
            )}
            {profile?.bio ? (
              <p className="mt-3 rounded-2xl border border-border/60 bg-card p-3 text-sm shadow-card">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-3 rounded-2xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                No bio yet — tap <b>Edit profile</b> to add one.
              </p>
            )}
          </>
        )}
      </div>

      <MyContributions userId={user.id} />


      <Section title="Account">
        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2.5 text-sm font-semibold text-coral shadow-card transition hover:bg-coral/5"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </Section>
    </AppShell>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

type ClaimedItem = BringItemRow & {
  events: { id: string; name: string; starts_at: string | null } | null;
};

function MyContributions({ userId }: { userId: string }) {
  const [items, setItems] = useState<ClaimedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    fetchMyClaimedItems(userId)
      .then((rows) => {
        if (!cancel) setItems(rows as ClaimedItem[]);
      })
      .catch(() => {
        if (!cancel) toast.error("Couldn't load your contributions");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [userId]);

  const now = Date.now();

  return (
    <Section
      title="My contributions"
      subtitle={loading ? "Loading…" : `${items.length} item${items.length === 1 ? "" : "s"} you're bringing`}
    >
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-6 text-center text-xs text-muted-foreground">
          You haven't claimed anything yet — jump into an event and grab an item 🦩
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const start = item.events?.starts_at ? new Date(item.events.starts_at) : null;
            const past = start ? start.getTime() < now : false;
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-coral/10 text-xl">
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {item.name}
                    {item.quantity ? <span className="font-normal text-muted-foreground"> · {item.quantity}</span> : null}
                  </p>
                  {item.events ? (
                    <Link
                      to="/event/$id"
                      params={{ id: item.events.id }}
                      className="truncate text-xs font-semibold text-lake hover:underline"
                    >
                      {item.events.name}
                      {start ? ` · ${start.toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""}
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground">Event removed</p>
                  )}
                </div>
                {past && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    past
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
