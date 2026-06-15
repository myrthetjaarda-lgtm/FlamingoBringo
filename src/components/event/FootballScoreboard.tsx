import { Section } from "@/components/AppShell";
import { Clock } from "lucide-react";
import type { EventRow } from "@/lib/events";

// Compact match scoreboard for football events. Read-only — the organizer sets the
// teams and score from the event's Edit card.
export function FootballScoreboard({ event }: { event: EventRow }) {
  const home = event.home_team?.trim() || "Home";
  const away = event.away_team?.trim() || "Away";
  const hasScore = event.home_score != null && event.away_score != null;
  const kickoff = event.starts_at ? new Date(event.starts_at) : null;
  const kickoffStr = kickoff
    ? kickoff.toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Section title="Match" subtitle="Kickoff & score">
      <div className="rounded-3xl border border-leaf/30 bg-gradient-to-r from-leaf/10 to-lake/10 p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <span className="text-3xl">⚽</span>
            <p className="mt-1 truncate text-sm font-semibold">{home}</p>
          </div>

          <div className="flex flex-col items-center px-2">
            {hasScore ? (
              <p className="font-display text-3xl font-bold tabular-nums">
                {event.home_score}
                <span className="mx-1.5 text-muted-foreground">–</span>
                {event.away_score}
              </p>
            ) : (
              <p className="font-display text-2xl font-bold text-muted-foreground">vs</p>
            )}
            {kickoffStr && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                <Clock className="h-3 w-3" /> {kickoffStr}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <span className="text-3xl">🥅</span>
            <p className="mt-1 truncate text-sm font-semibold">{away}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
