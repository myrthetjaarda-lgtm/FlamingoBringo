import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CalendarDays, ExternalLink } from "lucide-react";
import { Chip } from "@/components/AppShell";
import { fetchFestivals } from "@/lib/festivals";
import type { RecommendationRegion } from "@/lib/spots";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtRange(startsOn: string | null, endsOn: string | null) {
  if (!startsOn) return "Date TBA";
  const start = new Date(startsOn);
  const startLabel = `${start.getDate()} ${MONTH_NAMES[start.getMonth()]}`;
  if (!endsOn || endsOn === startsOn) return startLabel;
  const end = new Date(endsOn);
  const endLabel = `${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`;
  return `${startLabel} – ${endLabel}`;
}

export function FestivalCalendar() {
  const [region, setRegion] = useState<RecommendationRegion | "All">("All");

  const {
    data: festivals,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["festivals"],
    queryFn: fetchFestivals,
    staleTime: 60 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    const list = festivals ?? [];
    const today = new Date().toISOString().slice(0, 10);
    return list
      .filter((f) => region === "All" || f.region === region)
      .filter((f) => !f.ends_on || f.ends_on >= today);
  }, [festivals, region]);

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        {(["All", "Netherlands", "Berlin"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
              region === r
                ? "border-coral bg-coral/15 text-coral"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-4 text-center text-xs text-red-700">
          Couldn't load festivals.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-card/50 p-4 text-xs text-muted-foreground">
          <CalendarDays className="h-4 w-4" /> No upcoming festivals cached yet.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => (
            <div key={f.id} className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {fmtRange(f.starts_on, f.ends_on)} · {f.city ? `${f.city}, ` : ""}
                    {f.region}
                  </p>
                </div>
                <Chip tone={f.region === "Berlin" ? "lake" : "leaf"}>{f.region}</Chip>
              </div>
              {f.url && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-lake/10 px-3 py-1 text-[10px] font-semibold text-lake"
                >
                  <ExternalLink className="h-3 w-3" /> More info
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
