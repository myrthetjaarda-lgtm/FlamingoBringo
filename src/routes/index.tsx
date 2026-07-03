import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Chip, Section } from "@/components/AppShell";
import { ArrowRight, Calendar, Loader2, MapPin, Plus, Search, Sun, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type EventRow, fetchAllEvents, fetchBringItemCounts, fetchProfiles, type ProfileLite } from "@/lib/events";
import { fetchAllGroups, type GroupRow } from "@/lib/groups";
import { CreateEventSheet } from "@/components/event/CreateEventSheet";
import { VehicleCard } from "@/components/VehicleCard";

type TimeFilter = "upcoming" | "past" | "all";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlamingoBringo — Plan together. Bring together." },
      { name: "description", content: "Your warm, social home for picnics, BBQs and lake days. RSVP, bring lists and shared costs in one playful app." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { profile, user } = useAuth();
  const firstName = (profile?.display_name ?? "friend").split(" ")[0];
  const [events, setEvents] = useState<EventRow[]>([]);
  const [counts, setCounts] = useState<Map<string, { total: number; claimed: number }>>(new Map());
  const [groups, setGroups] = useState<Map<string, GroupRow>>(new Map());
  const [organizers, setOrganizers] = useState<Map<string, ProfileLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await fetchAllEvents();
      setEvents(rows);
      const ids = rows.map((r) => r.id);
      const [c, g, p] = await Promise.all([
        fetchBringItemCounts(ids),
        fetchAllGroups(),
        fetchProfiles(Array.from(new Set(rows.map((r) => r.organizer_id)))),
      ]);
      setCounts(c);
      const gMap = new Map<string, GroupRow>();
      g.forEach((gr) => gMap.set(gr.id, gr));
      setGroups(gMap);
      setOrganizers(p);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[FlamingoBringo] failed to load events:", msg);
      setLoadError(msg);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Reload when sheet closes
  useEffect(() => {
    if (!creating) void load();
  }, [creating]);

  const pastCount = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => e.starts_at && new Date(e.starts_at).getTime() < now).length;
  }, [events]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      const t = e.starts_at ? new Date(e.starts_at).getTime() : null;
      const isPast = t !== null && t < now;
      if (timeFilter === "upcoming" && isPast) return false;
      if (timeFilter === "past" && !isPast) return false;
      if (q) {
        const hay = `${e.name} ${e.location ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, query, timeFilter]);

  const mine = user ? filtered.filter((e) => e.organizer_id === user.id) : [];
  const others = user ? filtered.filter((e) => e.organizer_id !== user.id) : filtered;

  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => e.starts_at && new Date(e.starts_at).getTime() >= now).length;
  }, [events]);

  const nextEvent = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => e.starts_at && new Date(e.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())[0] ?? null;
  }, [events]);

  const daysUntilNext = nextEvent?.starts_at
    ? Math.ceil((new Date(nextEvent.starts_at).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <AppShell>
      {/* Header */}
      <header className="px-4 pt-8 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">🦩 FlamingoBringo</p>
            <h1 className="mt-1 font-display text-3xl font-semibold leading-tight">
              Hi {firstName} <span className="inline-block animate-wiggle">👋</span>
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {upcomingCount > 0
                ? `${upcomingCount} upcoming ${upcomingCount === 1 ? "event" : "events"}`
                : "No upcoming events yet"}
              {daysUntilNext !== null && daysUntilNext <= 7 && (
                <> · <span className="font-semibold text-coral">next in {daysUntilNext}d</span></>
              )}
            </p>
          </div>
          <Link
            to="/profile"
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral/15 text-2xl shadow-soft"
          >
            {profile?.emoji_avatar ?? "🦩"}
          </Link>
        </div>

        {/* Stats row */}
        {!loading && events.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <StatPill icon="📅" label="Upcoming" value={upcomingCount} />
            <StatPill icon="🎉" label="Hosted" value={user ? events.filter((e) => e.organizer_id === user.id).length : 0} />
            <StatPill icon="🧺" label="Items" value={Array.from(counts.values()).reduce((s, c) => s + c.total, 0)} />
          </div>
        )}
      </header>

      {/* Search + filter */}
      {!loading && events.length > 0 && (
        <div className="px-4 pt-4 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events or places…"
              className="w-full rounded-2xl border border-border/60 bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-coral"
            />
          </div>
          <div className="flex gap-1.5">
            {(["upcoming", "past", "all"] as TimeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  timeFilter === f
                    ? "bg-coral text-primary-foreground shadow-soft"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {f}{f === "past" && pastCount > 0 ? ` (${pastCount})` : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      <VehicleCard />

      {/* Event list */}
      <Section
        title="Events"
        action={
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
          >
            <Plus className="h-3 w-3" /> New
          </button>
        }
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="rounded-3xl border border-dashed border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Failed to load: {loadError}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
            <div className="text-4xl mb-2">☀️</div>
            <p className="font-display text-base font-semibold">No events yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Tap <b>New</b> to plan your first one.</p>
          </div>
        ) : mine.length === 0 && others.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            {query.trim() ? "No events match your search." : "Nothing to show for this filter."}
          </div>
        ) : (
          <div className="space-y-4">
            {mine.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Hosting
                </p>
                <div className="space-y-2">
                  {mine.map((ev) => (
                    <EventCard
                      key={ev.id}
                      ev={ev}
                      mine
                      group={ev.group_id ? groups.get(ev.group_id) : undefined}
                      organizer={organizers.get(ev.organizer_id)}
                      count={counts.get(ev.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Invited
                </p>
                <div className="space-y-2">
                  {others.map((ev) => (
                    <EventCard
                      key={ev.id}
                      ev={ev}
                      group={ev.group_id ? groups.get(ev.group_id) : undefined}
                      organizer={organizers.get(ev.organizer_id)}
                      count={counts.get(ev.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {creating && <CreateEventSheet onClose={() => setCreating(false)} />}

      <button
        aria-label="Create event"
        onClick={() => setCreating(true)}
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-sunset text-primary-foreground shadow-float transition active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <p className="mt-10 px-4 pb-4 text-center text-[11px] text-muted-foreground">
        <Sun className="inline h-3 w-3" /> Made with warmth in Berlin
      </p>
    </AppShell>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card py-3 shadow-card">
      <span className="text-xl leading-none">{icon}</span>
      <span className="mt-1.5 font-display text-lg font-semibold leading-none">{value}</span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

function EventCard({
  ev,
  mine,
  group,
  organizer,
  count,
}: {
  ev: EventRow;
  mine?: boolean;
  group?: GroupRow;
  organizer?: ProfileLite;
  count?: { total: number; claimed: number };
}) {
  const d = ev.starts_at ? new Date(ev.starts_at) : null;
  const isPast = d ? d.getTime() < Date.now() : false;
  const dayNum = d ? d.toLocaleDateString(undefined, { day: "numeric" }) : "—";
  const monthStr = d ? d.toLocaleDateString(undefined, { month: "short" }) : "";
  const timeStr = d ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";
  const total = count?.total ?? 0;
  const claimed = count?.claimed ?? 0;
  const pct = total > 0 ? Math.round((claimed / total) * 100) : 0;

  return (
    <Link
      to="/event/$id"
      params={{ id: ev.id }}
      className="group flex items-stretch gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card transition active:scale-[0.99]"
    >
      {/* Date badge */}
      <div className={`flex w-12 shrink-0 flex-col items-center justify-center rounded-xl py-2 ${isPast ? "bg-muted" : "bg-coral/10"}`}>
        <span className={`font-display text-xl font-bold leading-none ${isPast ? "text-muted-foreground" : "text-coral"}`}>{dayNum}</span>
        <span className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${isPast ? "text-muted-foreground" : "text-coral/80"}`}>{monthStr}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate font-display text-[15px] font-semibold">{ev.name}</p>
          {mine && <Chip tone="leaf">host</Chip>}
          {group && <Chip tone="lake">{group.emoji} {group.name}</Chip>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {timeStr && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {timeStr}
            </span>
          )}
          {ev.location && (
            <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
              <MapPin className="h-3 w-3 shrink-0" /> {ev.location}
            </span>
          )}
          {organizer && !mine && (
            <span className="inline-flex items-center gap-1">
              {organizer.emoji_avatar} {organizer.display_name}
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">{claimed}/{total}</span>
          </div>
        )}
      </div>

      <ArrowRight className="h-4 w-4 self-center text-muted-foreground transition group-hover:translate-x-0.5" />
    </Link>
  );
}
