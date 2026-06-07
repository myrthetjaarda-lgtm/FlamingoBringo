import { CalendarPlus, Download } from "lucide-react";
import { Section } from "@/components/AppShell";
import type { EventRow } from "@/lib/events";

function toIcsDt(iso: string) {
  return iso.replace(/[-:]/g, "").slice(0, 15).replace("T", "T");
}

function googleUrl(ev: EventRow) {
  if (!ev.starts_at) return null;
  const start = toIcsDt(ev.starts_at);
  // Assume 3-hour default duration
  const endMs = new Date(ev.starts_at).getTime() + 3 * 60 * 60 * 1000;
  const end = toIcsDt(new Date(endMs).toISOString());
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.name,
    dates: `${start}/${end}`,
    ...(ev.location ? { location: ev.location } : {}),
    ...(ev.description ? { details: ev.description } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function outlookUrl(ev: EventRow) {
  if (!ev.starts_at) return null;
  const startdt = new Date(ev.starts_at).toISOString().slice(0, 19);
  const enddt = new Date(new Date(ev.starts_at).getTime() + 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: ev.name,
    startdt,
    enddt,
    ...(ev.location ? { location: ev.location } : {}),
    ...(ev.description ? { body: ev.description } : {}),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function downloadIcs(ev: EventRow) {
  if (typeof window === "undefined" || !ev.starts_at) return;
  const start = toIcsDt(ev.starts_at);
  const endMs = new Date(ev.starts_at).getTime() + 3 * 60 * 60 * 1000;
  const end = toIcsDt(new Date(endMs).toISOString());
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FlamingoBringo//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@flamingobringo`,
    `DTSTAMP:${start}Z`,
    `DTSTART:${start}Z`,
    `DTEND:${end}Z`,
    `SUMMARY:${ev.name}`,
    ev.location ? `LOCATION:${ev.location}` : "",
    ev.description ? `DESCRIPTION:${ev.description.replace(/\n/g, "\\n")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.name.toLowerCase().replace(/\s+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CalendarExport({ event }: { event: EventRow }) {
  if (!event.starts_at) return null;

  const start = new Date(event.starts_at);
  const dateStr = start.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const gUrl = googleUrl(event);
  const oUrl = outlookUrl(event);

  return (
    <Section title="Add to calendar" subtitle="Save the date to your calendar app">
      <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lake/15 text-lake">
            <CalendarPlus className="h-5 w-5" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">{dateStr} · {timeStr}</p>
            {event.location && (
              <p className="text-xs text-muted-foreground">{event.location}</p>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {gUrl && (
            <a
              href={gUrl}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card px-2 py-2.5 text-[11px] font-semibold transition active:scale-95"
            >
              <span className="text-lg" aria-hidden>📅</span>
              Google
            </a>
          )}
          <button
            onClick={() => downloadIcs(event)}
            className="flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card px-2 py-2.5 text-[11px] font-semibold transition active:scale-95"
          >
            <Download className="h-4 w-4" />
            Apple / ICS
          </button>
          {oUrl && (
            <a
              href={oUrl}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card px-2 py-2.5 text-[11px] font-semibold transition active:scale-95"
            >
              <span className="text-lg" aria-hidden>📨</span>
              Outlook
            </a>
          )}
        </div>
      </div>
    </Section>
  );
}
