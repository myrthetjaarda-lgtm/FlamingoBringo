import { useState } from "react";
import { Bike, Bus, Car, Footprints, MapPin, Clock, Users } from "lucide-react";
import { attendees, meetupSuggestions } from "@/data/sample";
import { Section } from "@/components/AppShell";

type Mode = "walking" | "bike" | "public" | "car";

const modes: { k: Mode; label: string; minutes: number; icon: React.ReactNode }[] = [
  { k: "walking", label: "Walk", minutes: 95, icon: <Footprints className="h-4 w-4" /> },
  { k: "bike", label: "Bike", minutes: 28, icon: <Bike className="h-4 w-4" /> },
  { k: "public", label: "Public", minutes: 45, icon: <Bus className="h-4 w-4" /> },
  { k: "car", label: "Car", minutes: 18, icon: <Car className="h-4 w-4" /> },
];

export function TravelMeetup() {
  const [mode, setMode] = useState<Mode>("public");
  const selected = modes.find((m) => m.k === mode)!;
  const eventStart = 14 * 60;
  const depart = eventStart - selected.minutes - 10; // 10 min buffer
  const hh = Math.floor(depart / 60).toString().padStart(2, "0");
  const mm = (depart % 60).toString().padStart(2, "0");

  const neighborhoods = attendees
    .filter((a) => a.rsvp === "coming" && a.neighborhood)
    .reduce<Record<string, number>>((acc, a) => {
      acc[a.neighborhood!] = (acc[a.neighborhood!] || 0) + 1;
      return acc;
    }, {});

  return (
    <Section title="Travel & meetup" subtitle="Approximate area only — privacy-first">
      <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-coral/15 text-coral">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">Weissensee · Falkenbergerstr.</p>
            <p className="text-xs text-muted-foreground">Exact pin shared with confirmed attendees only.</p>
          </div>
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          How will you get there?
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {modes.map((m) => {
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
            <p className="font-display text-lg font-semibold">{hh}:{mm}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Nearby attendees</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(neighborhoods).map(([n, c]) => (
            <span key={n} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
              <Users className="h-3 w-3" /> {c} from <b className="ml-1">{n}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Suggested meetups</p>
        <ul className="space-y-2">
          {meetupSuggestions.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-leaf/15 text-leaf">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{m.place}</p>
                <p className="text-[11px] text-muted-foreground">{m.neighborhood} · {m.count} people</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-coral/15 px-2 py-1 text-[11px] font-semibold text-coral">
                <Clock className="h-3 w-3" /> {m.time}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
