import { useCallback, useEffect, useState } from "react";
import { X, Clock, Tag, Loader2 } from "lucide-react";
import { Chip } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import {
  type BringItemRow,
  type ProfileLite,
  type RsvpRow,
  type RsvpStatus,
  fetchBringItems,
  fetchProfiles,
  fetchRsvps,
} from "@/lib/events";

const STATUS_META: Record<RsvpStatus, { label: string; emoji: string; tone: "leaf" | "sun" | "neutral" }> = {
  coming: { label: "Coming", emoji: "✅", tone: "leaf" },
  maybe: { label: "Maybe", emoji: "❔", tone: "sun" },
  declined: { label: "Not coming", emoji: "❌", tone: "neutral" },
};

export function AttendeesSheet({
  open,
  onClose,
  eventId,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
}) {
  const { user } = useAuth();
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [profiles, setProfilesMap] = useState<Map<string, ProfileLite>>(new Map());
  const [items, setItems] = useState<BringItemRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rs, it] = await Promise.all([fetchRsvps(eventId), fetchBringItems(eventId)]);
      setRsvps(rs);
      setItems(it);
      const ids = Array.from(new Set(rs.map((r) => r.user_id)));
      setProfilesMap(await fetchProfiles(ids));
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

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

  const broughtBy = new Map<string, string[]>();
  items.forEach((i) => {
    if (!i.claimed_by) return;
    const arr = broughtBy.get(i.claimed_by) ?? [];
    arr.push(`${i.emoji} ${i.name}`);
    broughtBy.set(i.claimed_by, arr);
  });

  const grouped: Record<RsvpStatus, RsvpRow[]> = { coming: [], maybe: [], declined: [] };
  rsvps.forEach((r) => grouped[r.status]?.push(r));

  const coming = grouped.coming.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="All attendees"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto w-full max-w-md rounded-t-3xl border border-border/60 bg-card shadow-float"
        style={{ maxHeight: "85vh" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-border/60 bg-card/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="font-display text-base font-semibold">Attendees</p>
            <p className="text-[11px] text-muted-foreground">
              {loading ? "Loading…" : `${rsvps.length} responded · ${coming} confirmed`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(85vh - 64px)" }}>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rsvps.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No responses yet — share the event link 🦩
            </div>
          ) : (
            (["coming", "maybe", "declined"] as RsvpStatus[]).map((status) => {
              const list = grouped[status];
              if (list.length === 0) return null;
              const m = STATUS_META[status];
              return (
                <section key={status} className="mb-5 last:mb-2">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {m.emoji} {m.label}
                    </h3>
                    <Chip tone={m.tone}>{list.length}</Chip>
                  </div>
                  <ul className="space-y-1.5">
                    {list.map((r) => {
                      const p = profiles.get(r.user_id);
                      const isYou = r.user_id === user?.id;
                      const brings = broughtBy.get(r.user_id) ?? [];
                      return (
                        <li key={r.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-2.5">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/15 text-base">
                            {p?.emoji_avatar ?? "🦩"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-sm font-semibold">{p?.display_name ?? "Friend"}</p>
                              {isYou && (
                                <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] font-semibold text-leaf">you</span>
                              )}
                            </div>
                            {r.relationship_label && (
                              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Tag className="h-3 w-3" /> {r.relationship_label}
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                              {r.arrival_time && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {r.arrival_time}
                                </span>
                              )}
                              {brings.length > 0 && <span>🧺 {brings.slice(0, 2).join(" · ")}</span>}
                            </div>
                            {r.note && (
                              <p className="mt-1.5 rounded-xl bg-muted/40 px-2.5 py-1.5 text-[11px] italic text-foreground">
                                "{r.note}"
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
