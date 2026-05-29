import { useEffect } from "react";
import { X, MapPin, Bike, Bus, Car, Footprints } from "lucide-react";
import { attendees, type Attendee } from "@/data/sample";
import { Chip } from "@/components/AppShell";

function TransportIcon({ t }: { t?: Attendee["transport"] }) {
  if (t === "bike") return <Bike className="h-3 w-3" />;
  if (t === "public") return <Bus className="h-3 w-3" />;
  if (t === "car") return <Car className="h-3 w-3" />;
  if (t === "walking") return <Footprints className="h-3 w-3" />;
  return null;
}

export function AttendeesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const groups: { key: string; label: string; tone: "leaf" | "sun" | "neutral"; list: Attendee[] }[] = [
    { key: "coming", label: "✅ Coming", tone: "leaf", list: attendees.filter((a) => a.rsvp === "coming") },
    { key: "maybe", label: "❔ Maybe", tone: "sun", list: attendees.filter((a) => a.rsvp === "maybe") },
    { key: "declined", label: "❌ Not coming", tone: "neutral", list: attendees.filter((a) => a.rsvp === "declined") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-label="All attendees"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto w-full max-w-md rounded-t-3xl border border-border/60 bg-card shadow-float animate-slide-up"
        style={{ maxHeight: "85vh" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-border/60 bg-card/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="font-display text-base font-semibold">Attendees</p>
            <p className="text-[11px] text-muted-foreground">{attendees.length} invited · {groups[0].list.length} confirmed</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(85vh - 64px)" }}>
          {groups.map((g) => (
            <section key={g.key} className="mb-5 last:mb-2">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</h3>
                <Chip tone={g.tone}>{g.list.length}</Chip>
              </div>
              {g.list.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-3 py-3 text-[12px] text-muted-foreground">
                  No one in this group yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {g.list.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-2.5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-base">{a.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold">{a.name}</p>
                          {a.relation && (
                            <span className="truncate text-[10px] text-muted-foreground">· {a.relation}</span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                          {a.neighborhood && (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {a.neighborhood}
                            </span>
                          )}
                          {a.transport && (
                            <span className="inline-flex items-center gap-0.5">
                              <TransportIcon t={a.transport} /> {a.transport}
                            </span>
                          )}
                          {a.invitedBy && <span>· invited by {a.invitedBy}</span>}
                        </div>
                      </div>
                      {a.bringing && a.bringing.length > 0 && (
                        <div className="hidden max-w-[40%] flex-wrap justify-end gap-1 xs:flex">
                          {a.bringing.slice(0, 2).map((b) => (
                            <span key={b} className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-semibold text-coral">
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
