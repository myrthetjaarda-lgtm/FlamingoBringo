import { useState } from "react";
import { Check, Clock, MessageSquare, Plus, Minus } from "lucide-react";

type Status = "coming" | "maybe" | "declined";

export function EnhancedRSVP() {
  const [rsvp, setRsvp] = useState<Status | null>("coming");
  const [arrival, setArrival] = useState("14:00");
  const [guests, setGuests] = useState(0);
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);

  const opts: { k: Status; label: string; emoji: string; tone: string }[] = [
    { k: "coming", label: "Coming", emoji: "✅", tone: "bg-leaf text-leaf-foreground" },
    { k: "maybe", label: "Maybe", emoji: "❔", tone: "bg-sun text-sun-foreground" },
    { k: "declined", label: "Can't make it", emoji: "❌", tone: "bg-muted text-foreground" },
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => {
          const active = rsvp === o.k;
          return (
            <button
              key={o.k}
              onClick={() => {
                setRsvp(o.k);
                if (o.k === "coming") setExpanded(true);
              }}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-xs font-semibold transition active:scale-95 ${
                active ? `${o.tone} border-transparent shadow-soft` : "border-border bg-card text-muted-foreground"
              }`}
            >
              <span className="text-lg">{o.emoji}</span>
              {o.label}
            </button>
          );
        })}
      </div>

      {rsvp === "coming" && (
        <div className="mt-3 animate-fade-in space-y-2">
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full rounded-2xl border border-dashed border-coral/40 bg-coral/5 px-3 py-2 text-[12px] font-semibold text-coral"
            >
              + Add arrival time, plus-ones or a note
            </button>
          )}

          {expanded && (
            <>
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-card">
                <Clock className="h-4 w-4 text-coral" />
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Arriving
                </label>
                <input
                  type="time"
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                  className="ml-auto bg-transparent text-sm font-semibold outline-none"
                />
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-card">
                <span className="text-base">👥</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Plus-ones
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => setGuests((g) => Math.max(0, g - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-foreground"
                    aria-label="Fewer guests"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{guests}</span>
                  <button
                    onClick={() => setGuests((g) => Math.min(5, g + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-coral text-primary-foreground"
                    aria-label="More guests"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-card">
                <MessageSquare className="mt-1 h-4 w-4 text-coral" />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note for the organizer (optional)"
                  maxLength={120}
                  className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-leaf/10 px-3 py-2 text-[11px] text-leaf">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Check className="h-3 w-3" /> RSVP saved
                </span>
                <span className="text-muted-foreground">
                  Counts as {1 + guests} {guests ? "people" : "person"}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
