import { useCallback, useEffect, useState } from "react";
import { Bike, Bus, Car, Footprints, MapPin, Clock, Users } from "lucide-react";
import { Section } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfiles } from "@/lib/events";
import type { EventRow } from "@/lib/events";

type Mode = "walking" | "bike" | "public" | "car";

const MODES: { k: Mode; label: string; minutes: number; icon: React.ReactNode }[] = [
  { k: "walking", label: "Walk", minutes: 95, icon: <Footprints className="h-4 w-4" /> },
  { k: "bike", label: "Bike", minutes: 28, icon: <Bike className="h-4 w-4" /> },
  { k: "public", label: "Public", minutes: 45, icon: <Bus className="h-4 w-4" /> },
  { k: "car", label: "Car", minutes: 18, icon: <Car className="h-4 w-4" /> },
];

export function TravelMeetup({ event }: { event: EventRow }) {
  const [mode, setMode] = useState<Mode>("public");
  const [neighborhoods, setNeighborhoods] = useState<Record<string, number>>({});

  const selected = MODES.find((m) => m.k === mode)!;

  // Depart time from real starts_at
  const startMinutes = (() => {
    if (!event.starts_at) return null;
    const d = new Date(event.starts_at);
    return d.getHours() * 60 + d.getMinutes();
  })();
  const departMinutes = startMinutes !== null ? startMinutes - selected.minutes - 10 : null;
  const departStr =
    departMinutes !== null
      ? `${String(Math.floor(Math.max(0, departMinutes) / 60)).padStart(2, "0")}:${String(Math.max(0, departMinutes) % 60).padStart(2, "0")}`
      : "—";

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("rsvps")
      .select("user_id")
      .eq("event_id", event.id)
      .eq("status", "coming");
    if (!data || data.length === 0) return;
    const ids = (data as { user_id: string }[]).map((r) => r.user_id);
    const profiles = await fetchProfiles(ids);
    const map: Record<string, number> = {};
    // fetchProfiles returns ProfileLite without neighborhood — fetch full for this
    const { data: fullProfiles } = await supabase
      .from("profiles")
      .select("neighborhood")
      .in("id", ids);
    (fullProfiles ?? []).forEach((p: { neighborhood: string | null }) => {
      if (!p.neighborhood) return;
      map[p.neighborhood] = (map[p.neighborhood] ?? 0) + 1;
    });
    setNeighborhoods(map);
    // suppress unused warning
    void profiles;
  }, [event.id]);

  useEffect(() => { void load(); }, [load]);

  const neighborhoodEntries = Object.entries(neighborhoods).sort((a, b) => b[1] - a[1]);

  return (
    <Section title="Travel & meetup" subtitle="Leave-by time based on your transport mode">
      <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
        {event.location && (
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-coral/15 text-coral">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold">{event.location}</p>
              <p className="text-xs text-muted-foreground">Exact pin shared with confirmed attendees.</p>
            </div>
          </div>
        )}

        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          How will you get there?
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {MODES.map((m) => {
            const active = mode === m.k;
            return (
              <button
                key={m.k}
                onClick={() => setMode(m.k)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold transition ${
                  active ? "bg-coral text-primary-foreground shadow-soft" : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-lake/10 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-lake">Travel time</p>
            <p className="font-display text-lg font-semibold">{selected.minutes} min</p>
          </div>
          <div className="rounded-2xl bg-sun/25 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sun-foreground">Leave by</p>
            <p className="font-display text-lg font-semibold">{departStr}</p>
          </div>
        </div>
      </div>

      {neighborhoodEntries.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Who's coming from where
          </p>
          <div className="flex flex-wrap gap-1.5">
            {neighborhoodEntries.map(([n, c]) => (
              <span
                key={n}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs"
              >
                <Users className="h-3 w-3" />
                <b>{c}</b> from {n}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2.5 text-[11px] text-muted-foreground shadow-card">
        <Clock className="h-3.5 w-3.5 shrink-0 text-coral" />
        Travel times are estimates from central Berlin. Adjust based on your starting point.
      </div>
    </Section>
  );
}
