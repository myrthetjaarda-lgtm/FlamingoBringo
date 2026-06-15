import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, Chip, Section } from "@/components/AppShell";
import { BerlinMap } from "@/components/berlin/BerlinMap";
import { getBerlinForecast } from "@/lib/weather.functions";
import {
  SPOTS, NEIGHBORHOODS, LOCAL_EVENTS, BERLIN_FESTIVALS, WEEK_FORECAST, WEATHER_LABEL,
  type Spot, type SpotCategory, type FestivalEvent,
} from "@/data/berlin";
import {
  MapPin, Sparkles, Sun, CloudRain, Compass, Users, Clock, Star,
  Heart, Plus, Search, Sunset, Filter, CalendarPlus,
} from "lucide-react";
import { CreateEventSheet } from "@/components/event/CreateEventSheet";


export const Route = createFileRoute("/berlin")({
  head: () => ({
    meta: [
      { title: "Berlin · FlamingoBringo" },
      { name: "description", content: "Lakes, parks, beer gardens & open-air cinemas — the friendly local layer for Berlin." },
    ],
  }),
  component: BerlinPage,
});

type Tab = "spots" | "tonight" | "weekend" | "festivals" | "kieze";

const CATEGORIES: { key: SpotCategory | "All"; label: string; emoji: string }[] = [
  { key: "All", label: "All", emoji: "✨" },
  { key: "Lake", label: "Lakes", emoji: "🏊" },
  { key: "Park", label: "Parks", emoji: "🌳" },
  { key: "Beer garden", label: "Beer", emoji: "🍺" },
  { key: "Open-air cinema", label: "Cinema", emoji: "🎬" },
  { key: "Food market", label: "Food", emoji: "🥟" },
  { key: "Rooftop", label: "Rooftop", emoji: "🌇" },
  { key: "Viewpoint", label: "Views", emoji: "⛰️" },
  { key: "Flea market", label: "Flohmarkt", emoji: "🛍️" },
  { key: "Sports", label: "Sports", emoji: "🏐" },
  { key: "Picnic spot", label: "Picnic", emoji: "🧺" },
  { key: "Club", label: "Club", emoji: "🕺" },
  { key: "Landmark", label: "Landmarks", emoji: "🧠" },
];

function BerlinPage() {
  const [tab, setTab] = useState<Tab>("spots");
  const [festCat, setFestCat] = useState<FestivalEvent["category"] | "All">("All");
  const [cat, setCat] = useState<SpotCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set(["tempelhof", "klunkerkranich"]));
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<{ name?: string; location?: string }>({});

  const fetchForecast = useServerFn(getBerlinForecast);

  const { data: forecastData } = useQuery({
    queryKey: ["berlin-forecast"],
    queryFn: () => fetchForecast(),
    staleTime: 30 * 60 * 1000,
    placeholderData: { forecast: WEEK_FORECAST, source: "fallback" },
  });
  const week = forecastData?.forecast ?? WEEK_FORECAST;
  const today = week[0];
  const liveWeather = forecastData?.source === "google";



  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SPOTS.filter((s) => {
      if (cat !== "All" && s.category !== cat) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.neighborhood.toLowerCase().includes(q) ||
        s.vibe.some((v) => v.toLowerCase().includes(q))
      );
    });
  }, [cat, query]);

  const weatherPicks = useMemo(
    () =>
      SPOTS.filter((s) => s.bestFor.includes(today.condition))
        .slice()
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4),
    [today.condition],
  );

  const sunsetPicks = useMemo(
    () => SPOTS.filter((s) => s.bestFor.includes("evening")).slice(0, 4),
    [],
  );

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
    <AppShell>
      <header className="px-4 pt-6">
        <div className="flex items-center gap-2">
          <Link
            to="/discover"
            className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
          >
            ← Discover
          </Link>
          <Chip tone="coral">Berlin local</Chip>
          <Chip tone="lake">
            {today.emoji} {today.high}° · sunset {today.sunset}
          </Chip>
          {liveWeather && <Chip tone="leaf">● live</Chip>}
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold">What&apos;s on in your kiez?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lakes, parks, beer gardens & rooftops — handpicked for {WEATHER_LABEL[today.condition].toLowerCase()} days.
        </p>

        {/* Weather forecast strip */}
        <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto pb-1">
          {week.map((d) => (
            <div
              key={d.day}
              className="flex min-w-[68px] shrink-0 flex-col items-center rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-card"
            >
              <span className="text-[11px] font-semibold text-muted-foreground">{d.day}</span>
              <span className="text-xl leading-none">{d.emoji}</span>
              <span className="mt-1 text-xs font-semibold">{d.high}°</span>
              <span className="text-[10px] text-muted-foreground">{d.rainChance}%</span>
            </div>
          ))}
        </div>

        {/* Live map */}
        <div className="mt-4">
          <BerlinMap spots={SPOTS} highlightId={highlightId} onSelect={(s) => setHighlightId(s.id)} />
        </div>
      </header>



      {/* Tabs */}
      <div className="sticky top-0 z-20 mt-5 bg-background/85 px-4 pb-2 pt-2 backdrop-blur-md">
        <div className="flex gap-1 rounded-full border border-border/60 bg-card p-1 shadow-card">
          {([
            { k: "spots", label: "Spots", icon: Compass },
            { k: "tonight", label: "Tonight", icon: Sunset },
            { k: "weekend", label: "Weekend", icon: Sparkles },
            { k: "festivals", label: "Festivals", icon: CalendarPlus },
            { k: "kieze", label: "Kieze", icon: MapPin },
          ] as { k: Tab; label: string; icon: typeof Compass }[]).map((t) => {
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

      {tab === "spots" && (
        <>
          <Section
            title="Weather-aware picks"
            subtitle={`Best for a ${WEATHER_LABEL[today.condition].toLowerCase()} day · sunset ${today.sunset}`}
            action={
              <Chip tone="sun">
                <Sun className="h-3 w-3" /> {today.high}°
              </Chip>
            }
          >
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {weatherPicks.map((s) => (
                <WeatherPickCard key={s.id} spot={s} saved={saved.has(s.id)} onSave={() => toggleSave(s.id)} />
              ))}
            </div>
          </Section>

          <Section title="Find a spot" subtitle="Filter by vibe or search by name">
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-card">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lakes, parks, beer gardens…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-[11px] font-semibold text-muted-foreground">
                  Clear
                </button>
              )}
            </div>

            <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto pb-1">
              {CATEGORIES.map((c) => {
                const active = cat === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setCat(c.key)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                      active
                        ? "border-coral bg-coral/15 text-coral"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="mr-1">{c.emoji}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-card/50 p-4 text-xs text-muted-foreground">
                <Filter className="h-4 w-4" /> No spots match. Try another category.
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((s) => (
                  <SpotRow key={s.id} spot={s} saved={saved.has(s.id)} onSave={() => toggleSave(s.id)} />
                ))}
              </ul>
            )}
          </Section>

          {saved.size > 0 && (
            <Section title="Your saved spots" subtitle="Quick to reuse when you plan an event">
              <div className="flex flex-wrap gap-2">
                {Array.from(saved).map((id) => {
                  const spot = SPOTS.find((s) => s.id === id);
                  if (!spot) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-[11px] font-semibold shadow-card"
                    >
                      <span>{spot.emoji}</span>
                      {spot.name}
                    </span>
                  );
                })}
              </div>
            </Section>
          )}
        </>
      )}

      {tab === "tonight" && (
        <>
          <Section title="Tonight in Berlin" subtitle={`Sunset at ${today.sunset} · ${today.rainChance}% rain`}>
            <div className="rounded-3xl bg-gradient-to-r from-coral/90 to-sun/80 p-4 text-white shadow-float">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide opacity-90">
                <Sunset className="h-3.5 w-3.5" /> Golden hour starts 20:30
              </div>
              <p className="mt-1 font-display text-lg font-semibold">3 friends are heading to rooftops</p>
              <p className="text-[12px] text-white/85">Klunkerkranich, Monkey Bar & Viktoriapark sunset.</p>
              <button
                onClick={() => { setCreateDefaults({ name: "Sunset crew 🌇", location: "Klunkerkranich" }); setCreateOpen(true); }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Start a sunset crew
              </button>
            </div>
          </Section>

          <Section title="Open-air & rooftops">
            <ul className="space-y-2">
              {sunsetPicks.map((s) => (
                <SpotRow key={s.id} spot={s} saved={saved.has(s.id)} onSave={() => toggleSave(s.id)} />
              ))}
            </ul>
          </Section>

          <Section title="Happening tonight">
            <ul className="space-y-2">
              {LOCAL_EVENTS.filter((e) => e.when.toLowerCase().includes("tonight") || e.when.toLowerCase().includes("thu") || e.when.toLowerCase().includes("fri")).map((e) => (
                <EventRow key={e.id} event={e} onPlanIt={() => { setCreateDefaults({ name: e.title, location: e.where }); setCreateOpen(true); }} />
              ))}
            </ul>
          </Section>
        </>
      )}

      {tab === "weekend" && (
        <>
          <Section title="Weekend in Berlin" subtitle="Suggestions tuned to friends' availability">
            <ul className="space-y-2">
              {LOCAL_EVENTS.filter((e) => /(sat|sun|fri)/i.test(e.when)).map((e) => (
                <EventRow key={e.id} event={e} onPlanIt={() => { setCreateDefaults({ name: e.title, location: e.where }); setCreateOpen(true); }} />
              ))}
            </ul>
          </Section>

          <Section title="Sunday vibe">
            <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-lake" />
                <p className="text-sm font-semibold">Rain likely Sunday ({WEEK_FORECAST[3].rainChance}%)</p>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Swap the picnic for an indoor plan — Markthalle Neun brunch or a board game café in Friedrichshain.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["markthalle9", "freiluftkino"].map((id) => {
                  const s = SPOTS.find((x) => x.id === id);
                  if (!s) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold">
                      <span>{s.emoji}</span>
                      {s.name}
                    </span>
                  );
                })}
              </div>
            </div>
          </Section>
        </>
      )}

      {tab === "festivals" && (
        <Section title="Berlin Festival Calendar" subtitle={`${BERLIN_FESTIVALS.length} events across the year`}>
          <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {(["All","Music","Film","Art","Queer","Food","Sport","Community","Tech","Club"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFestCat(c)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  festCat === c
                    ? "border-coral bg-coral/15 text-coral"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {BERLIN_FESTIVALS
              .filter((f) => festCat === "All" || f.category === festCat)
              .sort((a, b) => a.month - b.month)
              .map((f) => <FestivalRow key={f.id} festival={f} />)}
          </div>
        </Section>
      )}

      {tab === "kieze" && (
        <Section title="Neighborhoods" subtitle="See who hangs where and what's nearby">
          <ul className="space-y-2">
            {NEIGHBORHOODS.map((n) => (
              <li key={n.id} className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-xl">
                      {n.emoji}
                    </span>
                    <div>
                      <p className="font-display text-sm font-semibold">{n.name}</p>
                      <p className="text-[11px] text-muted-foreground">{n.blurb}</p>
                    </div>
                  </div>
                  <Chip tone="leaf">
                    <Users className="h-3 w-3" /> {n.friendsHere}
                  </Chip>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {n.topSpots.map((sid) => {
                    const s = SPOTS.find((x) => x.id === sid);
                    if (!s) return null;
                    return (
                      <span key={sid} className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {s.emoji} {s.name}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </AppShell>

    {createOpen && (
      <CreateEventSheet
        onClose={() => setCreateOpen(false)}
        defaultName={createDefaults.name}
        defaultLocation={createDefaults.location}
      />
    )}
    </>
  );
}

function WeatherPickCard({
  spot, saved, onSave,
}: {
  spot: Spot; saved: boolean; onSave: () => void;
}) {
  return (
    <div className="flex w-[220px] shrink-0 flex-col rounded-3xl border border-border/60 bg-card p-3 shadow-card">
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sun/40 to-coral/30 text-2xl">
          {spot.emoji}
        </span>
        <button
          onClick={onSave}
          aria-label={saved ? "Unsave" : "Save"}
          className={`rounded-full p-1.5 ${saved ? "text-coral" : "text-muted-foreground"}`}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>
      <p className="mt-2 font-display text-sm font-semibold">{spot.name}</p>
      <p className="text-[11px] text-muted-foreground">{spot.neighborhood}</p>
      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{spot.blurb}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3 text-sun" /> {spot.rating}
        </span>
        {spot.walkMin && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {spot.walkMin} min
          </span>
        )}
      </div>
    </div>
  );
}

function SpotRow({
  spot, saved, onSave,
}: {
  spot: Spot; saved: boolean; onSave: () => void;
}) {
  const crowdTone = spot.crowdedness === "quiet" ? "leaf" : spot.crowdedness === "busy" ? "coral" : "sun";
  return (
    <li className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-2xl">
          {spot.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold">{spot.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {spot.category} · {spot.neighborhood}
                {spot.walkMin ? ` · ${spot.walkMin} min` : ""}
              </p>
            </div>
            <button
              onClick={onSave}
              aria-label={saved ? "Unsave" : "Save"}
              className={`rounded-full p-1.5 ${saved ? "text-coral" : "text-muted-foreground"}`}
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            </button>
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{spot.blurb}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Chip tone="lake">
              <Star className="h-3 w-3" /> {spot.rating}
            </Chip>
            <Chip tone={crowdTone as "leaf" | "coral" | "sun"}>{spot.crowdedness}</Chip>
            {spot.vibe.slice(0, 2).map((v) => (
              <Chip key={v} tone="neutral">{v}</Chip>
            ))}
          </div>
          {spot.tip && (
            <p className="mt-2 rounded-xl bg-secondary/60 p-2 text-[11px] text-muted-foreground">
              💡 {spot.tip}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function FestivalRow({ festival: f }: { festival: FestivalEvent }) {
  const gcalUrl = f.gcalStart
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(f.title)}&dates=${f.gcalStart}/${f.gcalEnd ?? f.gcalStart}&details=${encodeURIComponent(f.blurb)}&location=${encodeURIComponent(f.where + ", Berlin")}`
    : null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-coral/10 text-center">
          <span className="text-xl leading-none">{f.emoji}</span>
          <span className="text-[9px] font-bold text-coral">{MONTH_NAMES[f.month - 1]}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{f.title}</p>
              <p className="text-[11px] text-muted-foreground">{f.dates} · {f.where}</p>
            </div>
            {f.free && <Chip tone="leaf">Free</Chip>}
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{f.blurb}</p>
          {f.suggestion && (
            <p className="mt-1 rounded-xl bg-coral/8 px-2 py-1 text-[10px] text-coral/90">
              💡 {f.suggestion}
            </p>
          )}
          {f.approx && (
            <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-600">
              dates approx.
            </span>
          )}
          {gcalUrl && (
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-lake/10 px-3 py-1 text-[10px] font-semibold text-lake"
            >
              <CalendarPlus className="h-3 w-3" /> Add to Google Calendar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function EventRow({ event, onPlanIt }: { event: typeof LOCAL_EVENTS[number]; onPlanIt?: () => void }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-coral/20 to-lake/20 text-xl">
        {event.emoji}
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold">{event.title}</p>
        <p className="text-[11px] text-muted-foreground">
          {event.when} · {event.where}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Chip tone={event.free ? "leaf" : "neutral"}>{event.free ? "Free" : event.category}</Chip>
        <button onClick={onPlanIt} className="rounded-full bg-coral px-3 py-1 text-[10px] font-semibold text-white">I&apos;m in</button>
      </div>
    </li>
  );
}
