import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Chip, Section } from "@/components/AppShell";
import { ArrowRight, Calendar, Loader2, MapPin, Plus, Search, Sun, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type EventRow, fetchAllEvents, fetchBringItemCounts, fetchProfiles, type ProfileLite } from "@/lib/events";
import { fetchAllGroups, type GroupRow } from "@/lib/groups";
import { CreateEventSheet } from "@/components/event/CreateEventSheet";

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

  return (
    <AppShell>

      <header className="flex items-start justify-between px-4 pt-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            🦩 FlamingoBringo
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-balance">
            Hi {firstName} <span className="inline-block animate-wiggle">👋</span>
            <br />
            <span className="text-coral">Sunnier days</span> are coming.
          </h1>
        </div>
        <Link to="/profile" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/15 text-xl shadow-soft">
          {profile?.emoji_avatar ?? "🦩"}
        </Link>
      </header>

      <Section
        title="Your events"
        subtitle={loading ? "Loading…" : `${events.length} total`}
        action={
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
          >
            <Plus className="h-3 w-3" /> New event
          </button>
        }
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="rounded-3xl border border-dashed border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Failed to load events: {loadError}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No events yet ☀️
            <br />
            Tap <b>New event</b> to plan your first one.
          </div>
        ) : (
          <div className="space-y-3">
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
                  {f}
                  {f === "past" && pastCount > 0 ? ` (${pastCount})` : ""}
                </button>
              ))}
            </div>

            {mine.length === 0 && others.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
                {query.trim()
                  ? "No events match your search."
                  : timeFilter === "upcoming"
                    ? "No upcoming events — switch to Past or All to see more."
                    : timeFilter === "past"
                      ? "No past events yet."
                      : "No events to show."}
              </div>
            ) : (
              <>
                {mine.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      You're hosting
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
                    <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
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
              </>
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

      <p className="mt-8 px-4 text-center text-[11px] text-muted-foreground">
        <Sun className="inline h-3 w-3" /> Made with warmth in Berlin
      </p>
    </AppShell>
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
  const dateStr = d
    ? d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
    : "Date TBD";
  const timeStr = d ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";
  const total = count?.total ?? 0;
  const claimed = count?.claimed ?? 0;
  const pct = total > 0 ? Math.round((claimed / total) * 100) : 0;

  return (
    <Link
      to="/event/$id"
      params={{ id: ev.id }}
      className="group block rounded-2xl border border-border/60 bg-card p-3 shadow-card transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-display text-base font-semibold">{ev.name}</p>
            {mine && <Chip tone="leaf">host</Chip>}
            {group && (
              <Chip tone="lake">
                <Users className="h-3 w-3" /> {group.emoji} {group.name}
              </Chip>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {dateStr} {timeStr && `· ${timeStr}`}
            </span>
            {ev.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {ev.location}
              </span>
            )}
            {organizer && (
              <span className="inline-flex items-center gap-1">
                👤 {organizer.display_name}
              </span>
            )}
          </div>

          {total > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Bring list</span>
                <span>{claimed} / {total}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-coral transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
