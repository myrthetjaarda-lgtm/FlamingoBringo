import { CalendarPlus, Download } from "lucide-react";
import { Section } from "@/components/AppShell";

const EVENT = {
  title: "Weissensee Lake Day 🦩",
  start: "20260531T140000",
  end: "20260531T200000",
  location: "Falkenbergerstr. / Berliner Allee M12, Berlin",
  details: [
    "FlamingoBringo invite — Plan A: Weissensee lake day.",
    "Meetup point: Alexanderplatz S-Bahn 13:15 · Hermannplatz U8 13:00.",
    "Backup plan: indoor café in Mitte or evening BBQ at Miguel's.",
    "Bring: towel, swimwear, sunscreen 🌞",
    "Travel buffer: ~45 min by public transport.",
  ].join("\\n"),
};

function googleUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT.title,
    dates: `${EVENT.start}/${EVENT.end}`,
    location: EVENT.location,
    details: EVENT.details.replace(/\\n/g, "\n"),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function outlookUrl() {
  const toIso = (d: string) =>
    `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:00`;
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: EVENT.title,
    startdt: toIso(EVENT.start),
    enddt: toIso(EVENT.end),
    location: EVENT.location,
    body: EVENT.details.replace(/\\n/g, "\n"),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function icsBlob() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FlamingoBringo//EN",
    "BEGIN:VEVENT",
    `UID:weissensee-${EVENT.start}@flamingobringo`,
    `DTSTAMP:${EVENT.start}Z`,
    `DTSTART:${EVENT.start}Z`,
    `DTEND:${EVENT.end}Z`,
    `SUMMARY:${EVENT.title}`,
    `LOCATION:${EVENT.location}`,
    `DESCRIPTION:${EVENT.details}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Blob([ics], { type: "text/calendar" });
}

function downloadIcs() {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(icsBlob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "weissensee-lake-day.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export function CalendarExport() {
  return (
    <Section title="Add to calendar" subtitle="Includes location, backup plan & meetup">
      <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lake/15 text-lake">
            <CalendarPlus className="h-5 w-5" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">Sunday 31 May · 14:00 – 20:00</p>
            <p className="text-xs text-muted-foreground">
              Includes travel buffer (~45 min), meetup point and backup plan.
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a
            href={googleUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card px-2 py-2.5 text-[11px] font-semibold transition active:scale-95"
          >
            <span className="text-lg" aria-hidden>📅</span>
            Google
          </a>
          <button
            onClick={downloadIcs}
            className="flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card px-2 py-2.5 text-[11px] font-semibold transition active:scale-95"
          >
            <Download className="h-4 w-4" />
            Apple / ICS
          </button>
          <a
            href={outlookUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card px-2 py-2.5 text-[11px] font-semibold transition active:scale-95"
          >
            <span className="text-lg" aria-hidden>📨</span>
            Outlook
          </a>
        </div>
      </div>
    </Section>
  );
}
