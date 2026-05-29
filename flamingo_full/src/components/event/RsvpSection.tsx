import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock, Loader2, Pencil, Tag } from "lucide-react";
import { toast } from "sonner";
import { Section } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  type BringItemRow,
  type ProfileLite,
  type RsvpRow,
  type RsvpStatus,
  fetchBringItems,
  fetchProfiles,
  fetchRsvps,
  upsertRsvp,
} from "@/lib/events";

const STATUS_META: Record<
  RsvpStatus,
  { label: string; emoji: string; tone: string; chip: string }
> = {
  coming: {
    label: "Coming",
    emoji: "✅",
    tone: "bg-leaf text-leaf-foreground",
    chip: "bg-leaf/15 text-leaf",
  },
  maybe: {
    label: "Maybe",
    emoji: "❔",
    tone: "bg-sun text-sun-foreground",
    chip: "bg-sun/25 text-sun-foreground",
  },
  declined: {
    label: "Not coming",
    emoji: "❌",
    tone: "bg-muted text-foreground",
    chip: "bg-muted text-muted-foreground",
  },
};

const RELATIONSHIP_PREFIXES = [
  "Friend of",
  "Partner of",
  "Guest of",
  "Daughter of",
  "Son of",
  "Colleague of",
];

export function RsvpSection({ eventId }: { eventId: string }) {
  const { user, profile } = useAuth();
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [profiles, setProfilesMap] = useState<Map<string, ProfileLite>>(new Map());
  const [items, setItems] = useState<BringItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rs, it] = await Promise.all([fetchRsvps(eventId), fetchBringItems(eventId)]);
      setRsvps(rs);
      setItems(it);
      const ids = Array.from(new Set(rs.map((r) => r.user_id)));
      setProfilesMap(await fetchProfiles(ids));
    } catch {
      // keep previous state on error
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: refresh when anyone changes their RSVP
  useEffect(() => {
    const channel = supabase
      .channel(`rsvps-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rsvps", filter: `event_id=eq.${eventId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId, load]);

  const myRsvp = useMemo(
    () => (user ? rsvps.find((r) => r.user_id === user.id) ?? null : null),
    [rsvps, user],
  );

  // Map user_id -> list of claimed item labels
  const broughtBy = useMemo(() => {
    const map = new Map<string, string[]>();
    items.forEach((i) => {
      if (!i.claimed_by) return;
      const arr = map.get(i.claimed_by) ?? [];
      arr.push(`${i.emoji} ${i.name}`);
      map.set(i.claimed_by, arr);
    });
    return map;
  }, [items]);

  const grouped = useMemo(() => {
    const g: Record<RsvpStatus, RsvpRow[]> = { coming: [], maybe: [], declined: [] };
    rsvps.forEach((r) => g[r.status]?.push(r));
    return g;
  }, [rsvps]);

  const setStatus = async (status: RsvpStatus) => {
    if (!user) {
      toast.error("Sign in to RSVP");
      return;
    }
    try {
      await upsertRsvp({
        event_id: eventId,
        user_id: user.id,
        status,
        relationship_label: myRsvp?.relationship_label ?? null,
        arrival_time: myRsvp?.arrival_time ?? null,
        note: myRsvp?.note ?? null,
      });
      if (status !== "declined" && !myRsvp?.relationship_label && !myRsvp?.arrival_time) {
        setEditing(true);
      }
      await load();
    } catch {
      toast.error("Couldn't save your RSVP");
    }
  };

  return (
    <Section
      title="Who's coming"
      subtitle={
        loading
          ? "Loading…"
          : `✅ ${grouped.coming.length} · ❔ ${grouped.maybe.length} · ❌ ${grouped.declined.length}`
      }
    >
      {/* Your RSVP control */}
      <div className="rounded-3xl border border-border/60 bg-card p-3 shadow-card">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-coral">
          Your RSVP
        </p>
        {user ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(STATUS_META) as RsvpStatus[]).map((k) => {
                const active = myRsvp?.status === k;
                const m = STATUS_META[k];
                return (
                  <button
                    key={k}
                    onClick={() => void setStatus(k)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-xs font-semibold transition active:scale-95 ${
                      active
                        ? `${m.tone} border-transparent shadow-soft`
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <span className="text-lg">{m.emoji}</span>
                    {m.label}
                  </button>
                );
              })}
            </div>

            {myRsvp && myRsvp.status !== "declined" && (
              <div className="mt-3">
                {editing ? (
                  <RsvpDetailsForm
                    eventId={eventId}
                    userId={user.id}
                    rsvp={myRsvp}
                    onSaved={async () => {
                      setEditing(false);
                      await load();
                    }}
                    onCancel={() => setEditing(false)}
                  />
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-coral/40 bg-coral/5 px-3 py-2 text-[12px] font-semibold text-coral"
                  >
                    <Pencil className="h-3 w-3" />
                    {myRsvp.relationship_label || myRsvp.arrival_time
                      ? "Edit your label & arrival time"
                      : "Add a relationship label & arrival time"}
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Sign in to RSVP to this event.</p>
        )}
      </div>

      {/* Lists */}
      {!loading && (
        <div className="mt-4 space-y-4">
          {(["coming", "maybe", "declined"] as RsvpStatus[]).map((status) => {
            const list = grouped[status];
            if (list.length === 0) return null;
            const m = STATUS_META[status];
            return (
              <div key={status}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.emoji} {m.label} · {list.length}
                </p>
                <div className="space-y-2">
                  {list.map((r) => (
                    <AttendeeCard
                      key={r.id}
                      rsvp={r}
                      profile={profiles.get(r.user_id)}
                      brings={broughtBy.get(r.user_id) ?? []}
                      isYou={r.user_id === user?.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {rsvps.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              No responses yet — be the first to RSVP ☀️
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

function AttendeeCard({
  rsvp,
  profile,
  brings,
  isYou,
}: {
  rsvp: RsvpRow;
  profile?: ProfileLite;
  brings: string[];
  isYou: boolean;
}) {
  const name = profile?.display_name ?? "Friend";
  const emoji = profile?.emoji_avatar ?? "🦩";
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/15 text-lg">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{name}</p>
          {isYou && (
            <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] font-semibold text-leaf">
              you
            </span>
          )}
        </div>
        {rsvp.relationship_label && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Tag className="h-3 w-3" /> {rsvp.relationship_label}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {rsvp.arrival_time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {rsvp.arrival_time}
            </span>
          )}
          {brings.length > 0 && <span>🧺 {brings.join(" · ")}</span>}
        </div>
        {rsvp.note && (
          <p className="mt-1.5 rounded-xl bg-muted/40 px-2.5 py-1.5 text-[11px] italic text-foreground">
            “{rsvp.note}”
          </p>
        )}
      </div>
    </div>
  );
}

function RsvpDetailsForm({
  eventId,
  userId,
  rsvp,
  onSaved,
  onCancel,
}: {
  eventId: string;
  userId: string;
  rsvp: RsvpRow;
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(rsvp.relationship_label ?? "");
  const [arrival, setArrival] = useState(rsvp.arrival_time ?? "");
  const [note, setNote] = useState(rsvp.note ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await upsertRsvp({
        event_id: eventId,
        user_id: userId,
        status: rsvp.status,
        relationship_label: label.trim() || null,
        arrival_time: arrival.trim() || null,
        note: note.trim() || null,
      });
      toast.success("RSVP updated");
      await onSaved();
    } catch {
      toast.error("Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-background p-3">
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Relationship label
        </label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Friend of Myrthe"
          maxLength={60}
          className="mt-1 w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm outline-none focus:border-coral"
        />
        <div className="mt-1.5 flex flex-wrap gap-1">
          {RELATIONSHIP_PREFIXES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setLabel((cur) => (cur.startsWith(p) ? cur : `${p} `))}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Arrival time
        </label>
        <input
          value={arrival}
          onChange={(e) => setArrival(e.target.value)}
          placeholder="e.g. around 14:00"
          maxLength={40}
          className="mt-1 w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm outline-none focus:border-coral"
        />
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Note (optional)
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything to add?"
          maxLength={120}
          className="mt-1 w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm outline-none focus:border-coral"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Save
        </button>
      </div>
    </div>
  );
}
