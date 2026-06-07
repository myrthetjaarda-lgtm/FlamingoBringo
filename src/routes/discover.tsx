import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, Chip, Section } from "@/components/AppShell";
import {
  INTERESTS, suggestions, heatmap,
  type AvailabilityStatus, type SocialMode,
} from "@/data/discover";
import { fetchDiscoverProfiles } from "@/lib/discover.functions";
import { NeighborhoodMap } from "@/components/berlin/NeighborhoodMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  MapPin, Sparkles, CalendarCheck2, Plane, Compass, Plus,
  Search, Zap, Radar, Lock, CalendarDays, Cloud, Users, Sun, ChevronRight,
} from "lucide-react";


export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover · FlamingoBringo" },
      { name: "description", content: "Who's around, what people want to do, who can join — Berlin's friendly social layer." },
    ],
  }),
  component: DiscoverPage,
});

type Tab = "around" | "suggest" | "interests" | "calendar";

const STATUS_TONE: Record<AvailabilityStatus, "coral" | "lake" | "sun" | "leaf" | "neutral"> = {
  "In Berlin": "leaf",
  "Open for plans": "coral",
  "Free this weekend": "coral",
  "Working remotely": "lake",
  "Traveling": "sun",
  "On holiday": "sun",
  "Busy": "neutral",
};

function DiscoverPage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("around");
  const [query, setQuery] = useState("");
  const [shareLocation, setShareLocation] = useState(true);
  const [syncCal, setSyncCal] = useState(false);

  // My current status (initialise from profile, fallback to default)
  const [myStatus, setMyStatusLocal] = useState<AvailabilityStatus>(
    (profile?.availability_status as AvailabilityStatus) ?? "Open for plans",
  );
  const [myMode, setMyModeLocal] = useState<SocialMode>(
    (profile?.social_mode as SocialMode) ?? "Looking for plans",
  );
  const myInterests: string[] = (profile?.interests as string[]) ?? [];

  // Save presence to Supabase when user changes their status/mode
  const savePresence = useMutation({
    mutationFn: async (patch: { availability_status?: string; social_mode?: string }) => {
      if (!user) return;
      await supabase.from("profiles").update(patch).eq("id", user.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discover-profiles"] }),
  });

  function setMyStatus(s: AvailabilityStatus) {
    setMyStatusLocal(s);
    savePresence.mutate({ availability_status: s });
  }
  function setMyMode(m: SocialMode) {
    setMyModeLocal(m);
    savePresence.mutate({ social_mode: m });
  }

  // Load real profiles
  const loadProfiles = useServerFn(fetchDiscoverProfiles);
  const { data: allProfiles = [] } = useQuery({
    queryKey: ["discover-profiles"],
    queryFn: () => loadProfiles(),
    staleTime: 60_000,
  });

  // Exclude current user from the list
  const otherProfiles = useMemo(
    () => allProfiles.filter((p) => p.id !== user?.id),
    [allProfiles, user?.id],
  );

  const aroundCount = otherProfiles.filter(
    (p) => p.availability_status !== "On holiday" && p.availability_status !== "Traveling",
  ).length;

  const matchedSuggestions = useMemo(
    () => suggestions.slice().sort((a, b) => b.matches - a.matches),
    [],
  );

  // Build heatmap from real neighborhood data
  const realHeatmap = useMemo(() => {
    const counts: Record<string, number> = {};
    otherProfiles.forEach((p) => {
      if (p.neighborhood) counts[p.neighborhood] = (counts[p.neighborhood] ?? 0) + 1;
    });
    const tones = ["coral", "lake", "sun", "leaf"] as const;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([area, count], i) => ({ area, count, tone: tones[i % tones.length] }));
  }, [otherProfiles]);

  // Use real heatmap if populated, else fallback to static
  const displayHeatmap = realHeatmap.length > 0 ? realHeatmap : heatmap;

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    return otherProfiles.filter((p) => {
      if (!q) return true;
      return (
        p.display_name.toLowerCase().includes(q) ||
        (p.neighborhood ?? "").toLowerCase().includes(q) ||
        p.interests.some((i) => i.toLowerCase().includes(q))
      );
    });
  }, [query, otherProfiles]);

  return (
    <AppShell>
      <header className="px-4 pt-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦩</span>
          <Chip tone="coral">Berlin · live</Chip>
          <Chip tone="lake">Sunny 27°</Chip>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold">Who&apos;s around?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A friendly social layer for spontaneous plans, lake days & last-minute meetups.
        </p>

        {/* My presence card */}
        <div className="mt-4 rounded-3xl border border-border/60 bg-card p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral/15 text-xl">
                {profile?.emoji_avatar ?? "🦩"}
              </span>
              <div>
                <p className="text-xs text-muted-foreground">You&apos;re currently</p>
                <p className="font-display text-base font-semibold">
                  {myStatus} · {myMode}
                </p>
              </div>
            </div>
            {profile?.neighborhood && <Chip tone="leaf">{profile.neighborhood}</Chip>}
          </div>

          <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-1">
            {(["Open for plans", "Free this weekend", "In Berlin", "Working remotely", "Busy", "Traveling", "On holiday"] as AvailabilityStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setMyStatus(s)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  myStatus === s
                    ? "border-coral bg-coral/15 text-coral"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto pb-1">
            {(["Looking for plans", "Lake mode ☀️", "Chill only", "Party mode", "Outdoor mode", "Sports mood", "Quiet weekend", "Family time"] as SocialMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMyMode(m)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  myMode === m
                    ? "border-lake bg-lake/15 text-lake"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Spontaneous CTA */}
        <button className="mt-3 flex w-full items-center justify-between rounded-3xl bg-gradient-to-r from-coral to-coral/70 px-4 py-3 text-left text-white shadow-float">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20"><Zap className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-semibold">Spark a spontaneous meetup</p>
              <p className="text-[11px] text-white/85">{aroundCount} {aroundCount === 1 ? "friend" : "friends"} around · post in 10 sec</p>
            </div>
          </div>
          <Plus className="h-5 w-5" />
        </button>

        {/* Berlin local layer entry */}
        <Link
          to="/berlin"
          className="mt-3 flex w-full items-center justify-between rounded-3xl border border-border/60 bg-card px-4 py-3 shadow-card transition hover:border-coral/60"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sun/30 to-coral/30 text-xl">
              🗺️
            </span>
            <div>
              <p className="text-sm font-semibold">Berlin local layer</p>
              <p className="text-[11px] text-muted-foreground">
                <Sun className="-mt-0.5 mr-1 inline h-3 w-3 text-sun" />
                Sunny 26° · lakes, rooftops & open-air ideas
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </header>


      {/* Tabs */}
      <div className="sticky top-0 z-20 mt-5 -mx-0 bg-background/85 px-4 pb-2 pt-2 backdrop-blur-md">
        <div className="flex gap-1 rounded-full border border-border/60 bg-card p-1 shadow-card">
          {([
            { k: "around", label: "Around", icon: Radar },
            { k: "suggest", label: "Suggest", icon: Sparkles },
            { k: "interests", label: "Interests", icon: Compass },
            { k: "calendar", label: "Calendar", icon: CalendarCheck2 },
          ] as { k: Tab; label: string; icon: typeof Radar }[]).map((t) => {
            const active = tab === t.k;
            const Icon = t.icon;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-semibold transition ${
                  active ? "bg-coral text-white shadow-card" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "around" && (
        <>


          {/* Neighborhood map */}
          <Section title="Berlin neighborhood map" subtitle="Where your people are">
            <NeighborhoodMap
              counts={Object.fromEntries(realHeatmap.map((h) => [h.area, h.count]))}
              myNeighborhood={profile?.neighborhood}
              onSelect={(name) => setQuery(name)}
            />
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              Tap a neighborhood to filter the list below · only kiez-level, never exact location
            </p>
          </Section>

          {/* People */}
          <Section title="Friends around" subtitle={`${aroundCount} in Berlin`}>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, area or interest"
                className="w-full rounded-2xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm shadow-card outline-none focus:border-coral"
              />
            </div>

            {filteredPeople.length === 0 && (
              <p className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No friends here yet — invite people to join FlamingoBringo!
              </p>
            )}
            <ul className="space-y-2">
              {filteredPeople.map((p) => {
                const overlap = p.interests.filter((i) => myInterests.includes(i));
                const isAway = p.availability_status === "Traveling" || p.availability_status === "On holiday";
                const statusTone = STATUS_TONE[p.availability_status as AvailabilityStatus] ?? "neutral";
                return (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-border/60 bg-card p-3 shadow-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-lg">
                        {p.emoji_avatar}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                            isAway ? "bg-sun" : "bg-leaf"
                          }`}
                        />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{p.display_name}</p>
                          <Chip tone={statusTone}>{p.availability_status}</Chip>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {isAway ? (
                            <><Plane className="-mt-0.5 mr-1 inline h-3 w-3" />{p.availability_status}</>
                          ) : (
                            <><MapPin className="-mt-0.5 mr-1 inline h-3 w-3" />{p.neighborhood ?? "Berlin"}</>
                          )}
                        </p>
                      </div>
                      <button
                        disabled={isAway}
                        onClick={() => {
                          if (isAway) return;
                          const text = encodeURIComponent(
                            `Hey ${p.display_name}! 👋 Spotted you on FlamingoBringo — want to hang out in Berlin?`
                          );
                          window.open(`https://wa.me/?text=${text}`, "_blank");
                        }}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                          isAway ? "bg-muted text-muted-foreground" : "bg-coral/15 text-coral"
                        }`}
                      >
                        {isAway ? "Away" : "Ping"}
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Chip tone="lake">{p.social_mode}</Chip>
                      {p.interests.slice(0, 3).map((i) => (
                        <span
                          key={i}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            overlap.includes(i)
                              ? "bg-coral/15 text-coral"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i}
                        </span>
                      ))}
                      {overlap.length > 0 && (
                        <span className="ml-auto text-[10px] font-semibold text-coral">
                          {overlap.length} shared
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>
        </>
      )}

      {tab === "suggest" && (
        <>
          <Section title="Smart suggestions" subtitle="Based on weather, friends & time of day">
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 text-[11px] text-muted-foreground shadow-card">
              <Cloud className="h-4 w-4 text-lake" />
              Berlin · 27°C sunny · sunset 21:18 · light westerly
            </div>
            <ul className="space-y-2">
              {matchedSuggestions.map((s) => (
                <li key={s.id} className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-xl">{s.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground">{s.where} · {s.when}</p>
                    </div>
                    <Chip tone={s.tone}>{s.matches} match</Chip>
                  </div>
                  <p className="mt-2 flex items-start gap-2 rounded-xl bg-secondary/60 p-2 text-[11px] text-muted-foreground">
                    <Sparkles className="mt-0.5 h-3 w-3 text-coral" />
                    {s.why}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button className="flex-1 rounded-full bg-coral px-3 py-1.5 text-[11px] font-semibold text-white">
                      Plan it
                    </button>
                    <button className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                      Invite friends
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Group activity matching" subtitle="AI spotted these overlaps">
            <ul className="space-y-2">
              {[
                { emoji: "🏐", text: "4 people near Kreuzberg like volleyball" },
                { emoji: "🥩", text: "5 attendees enjoy BBQ + lakes" },
                { emoji: "🎬", text: "Tonight's weather is ideal for open-air cinema" },
                { emoji: "🚴", text: "3 Lake Crew members are in cycling mode Sunday" },
              ].map((m, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
                  <span className="text-xl">{m.emoji}</span>
                  <p className="flex-1 text-sm">{m.text}</p>
                  <button className="rounded-full bg-coral/15 px-3 py-1.5 text-[11px] font-semibold text-coral">Suggest</button>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {tab === "interests" && (
        <>
          <Section title="Your interests" subtitle="Tap to toggle · pick 'always interested' for instant invites">
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => {
                const on = myInterests.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() =>
                      setMyInterests((prev) =>
                        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                      on
                        ? "border-coral bg-coral/15 text-coral"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {i}
                  </button>
                );
              })}
              <button className="rounded-full border border-dashed border-border px-3 py-1.5 text-[12px] font-semibold text-muted-foreground">
                + Custom
              </button>
            </div>
          </Section>

          <Section title="Invite preference" subtitle="How often should friends ping you?">
            <div className="grid grid-cols-3 gap-2">
              {["Always interested", "Sometimes", "Only ask"].map((l, i) => (
                <button
                  key={l}
                  className={`rounded-2xl border px-3 py-3 text-[12px] font-semibold ${
                    i === 0 ? "border-coral bg-coral/15 text-coral" : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Privacy & visibility">
            <div className="space-y-2">
              {[
                { label: "Share approximate location", on: shareLocation, set: setShareLocation, hint: "Only neighborhood — never live tracking." },
                { label: "Show availability to friends", on: true, hint: "Busy / Free / Away — no calendar details." },
                { label: "Appear on the social heatmap", on: true, hint: "Aggregated counts only." },
              ].map((row, i) => (
                <div key={i} className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
                  <div>
                    <p className="text-sm font-semibold">{row.label}</p>
                    <p className="text-[11px] text-muted-foreground">{row.hint}</p>
                  </div>
                  <button
                    onClick={() => row.set?.(!row.on)}
                    className={`relative h-6 w-11 rounded-full transition ${row.on ? "bg-coral" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${row.on ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {tab === "calendar" && (
        <>
          <Section title="Google Calendar" subtitle="Sync free/busy only — never event details">
            <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lake/15 text-xl">📅</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{syncCal ? "Synced" : "Not synced"}</p>
                  <p className="text-[11px] text-muted-foreground">myrthe@gmail.com</p>
                </div>
                <button
                  onClick={() => setSyncCal((v) => !v)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                    syncCal ? "bg-leaf/15 text-leaf" : "bg-coral text-white"
                  }`}
                >
                  {syncCal ? "Connected" : "Connect"}
                </button>
              </div>
              <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                <li className="flex items-center gap-2"><Lock className="h-3 w-3" /> Friends never see event titles</li>
                <li className="flex items-center gap-2"><Lock className="h-3 w-3" /> Only Busy / Free / Away is shared</li>
              </ul>
            </div>
          </Section>

          <Section title="Best times to meet" subtitle="Detected from synced friends">
            <ul className="space-y-2">
              {[
                { day: "Sat afternoon", free: 0, total: 0, note: "Sync your calendar to see this" },
                { day: "Sun morning", free: 0, total: 0 },
                { day: "Fri evening", free: 0, total: 0 },
                { day: "Thu after 20:00", free: 0, total: 0 },
              ].map((s, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
                  <CalendarDays className="h-5 w-5 text-coral" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{s.day}</p>
                    <p className="text-[11px] text-muted-foreground">{s.free}/{s.total} friends free{s.note ? ` · ${s.note}` : ""}</p>
                  </div>
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-coral" style={{ width: `${(s.free / s.total) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Travel & holidays" subtitle="From manual status">
            <ul className="space-y-2">
              {otherProfiles.filter((p) => p.availability_status === "Traveling" || p.availability_status === "On holiday").map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-base">{p.emoji_avatar}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.display_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      <Plane className="-mt-0.5 mr-1 inline h-3 w-3" />
                      {p.availability_status}
                    </p>
                  </div>
                  <Chip tone="sun">{p.availability_status}</Chip>
                </li>
              ))}
              <li className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-3 text-[11px] text-muted-foreground">
                <Users className="h-4 w-4" />
                Marko already has another event on Sat — auto-detected.
              </li>
            </ul>
          </Section>
        </>
      )}
    </AppShell>
  );
}
