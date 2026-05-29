import { useEffect, useMemo, useState } from "react";
import { Check, HelpCircle, X, Trophy, Plus, Loader2, Trash2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Section } from "@/components/AppShell";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchDateOptions,
  fetchDateVotes,
  addDateOption,
  deleteDateOption,
  castDateVote,
  removeDateVote,
  type Availability,
  type DateOptionRow,
  type DateVoteRow,
} from "@/lib/events";

type Tally = { yes: number; maybe: number; no: number };

export function FindADate({ eventId, isOrganizer }: { eventId: string; isOrganizer: boolean }) {
  const { user } = useAuth();
  const [options, setOptions] = useState<DateOptionRow[]>([]);
  const [votes, setVotes] = useState<DateVoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState("");

  const load = async () => {
    try {
      const [opts, vts] = await Promise.all([fetchDateOptions(eventId), fetchDateVotes(eventId)]);
      setOptions(opts);
      setVotes(vts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`date-poll-${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "date_options", filter: `event_id=eq.${eventId}` }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "date_votes", filter: `event_id=eq.${eventId}` }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const tallies = useMemo(() => {
    const map = new Map<string, Tally>();
    for (const o of options) map.set(o.id, { yes: 0, maybe: 0, no: 0 });
    for (const v of votes) {
      const t = map.get(v.option_id);
      if (t) t[v.availability] += 1;
    }
    return map;
  }, [options, votes]);

  const myVotes = useMemo(() => {
    const map = new Map<string, Availability>();
    if (user) for (const v of votes) if (v.user_id === user.id) map.set(v.option_id, v.availability);
    return map;
  }, [votes, user]);

  // Best date: highest yes count, tie-break by fewest no, then maybe.
  const bestId = useMemo(() => {
    let best: { id: string; t: Tally } | null = null;
    for (const o of options) {
      const t = tallies.get(o.id) ?? { yes: 0, maybe: 0, no: 0 };
      if (t.yes === 0 && t.maybe === 0 && t.no === 0) continue;
      if (
        !best ||
        t.yes > best.t.yes ||
        (t.yes === best.t.yes && (t.no < best.t.no || (t.no === best.t.no && t.maybe > best.t.maybe)))
      ) {
        best = { id: o.id, t };
      }
    }
    return best?.id ?? null;
  }, [options, tallies]);

  const best = options.find((o) => o.id === bestId);

  const handleVote = async (optionId: string, availability: Availability) => {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }
    const current = myVotes.get(optionId);
    try {
      if (current === availability) {
        // toggle off
        setVotes((p) => p.filter((v) => !(v.option_id === optionId && v.user_id === user.id)));
        await removeDateVote(optionId, user.id);
      } else {
        // optimistic
        setVotes((p) => {
          const others = p.filter((v) => !(v.option_id === optionId && v.user_id === user.id));
          return [
            ...others,
            {
              id: `tmp-${optionId}`,
              option_id: optionId,
              event_id: eventId,
              user_id: user.id,
              availability,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];
        });
        await castDateVote({ option_id: optionId, event_id: eventId, user_id: user.id, availability });
      }
    } catch (e) {
      console.error(e);
      toast.error("Couldn't save your vote");
      void load();
    }
  };

  const handleAdd = async () => {
    if (!user) {
      toast.error("Sign in to suggest a date");
      return;
    }
    if (!newDate) {
      toast.error("Pick a date first");
      return;
    }
    setAdding(true);
    try {
      await addDateOption({
        event_id: eventId,
        created_by: user.id,
        option_date: format(newDate, "yyyy-MM-dd"),
        time_label: newTime.trim() || null,
      });
      setNewDate(undefined);
      setNewTime("");
      setPickerOpen(false);
      toast.success("Date suggested 🗓️");
      void load();
    } catch (e) {
      console.error(e);
      toast.error("Couldn't add that date");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setOptions((p) => p.filter((o) => o.id !== id));
      await deleteDateOption(id);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't remove that date");
      void load();
    }
  };

  return (
    <Section
      title="Find a date"
      subtitle="Vote your availability — best date wins"
      action={
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft">
              <Plus className="h-3.5 w-3.5" /> Suggest
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={newDate}
              onSelect={setNewDate}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
            <div className="space-y-2 border-t border-border p-3">
              <Input
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="Time (e.g. 14:00 or 13–17)"
                className="h-9 text-sm"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !newDate}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-coral px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
              >
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add this date
              </button>
            </div>
          </PopoverContent>
        </Popover>
      }
    >
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : options.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
          <CalendarDays className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-semibold">No dates suggested yet</p>
          <p className="text-xs text-muted-foreground">
            Tap “Suggest” to propose a date and let everyone vote.
          </p>
        </div>
      ) : (
        <>
          {best && (
            <div className="mb-3 flex items-start gap-3 rounded-3xl border border-leaf/30 bg-leaf/10 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-leaf/20 text-leaf">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <p className="font-semibold">
                  {fmtDate(best.option_date)}
                  {best.time_label ? ` · ${best.time_label}` : ""} works best
                </p>
                <p className="text-xs text-muted-foreground">
                  {(tallies.get(best.id)?.yes ?? 0)} available · {(tallies.get(best.id)?.maybe ?? 0)} maybe ·{" "}
                  {(tallies.get(best.id)?.no ?? 0)} no
                </p>
              </div>
            </div>
          )}

          <ul className="space-y-2">
            {options.map((o) => (
              <DateRow
                key={o.id}
                option={o}
                tally={tallies.get(o.id) ?? { yes: 0, maybe: 0, no: 0 }}
                isBest={o.id === bestId}
                myVote={myVotes.get(o.id)}
                canDelete={isOrganizer || o.created_by === user?.id}
                onVote={(v) => handleVote(o.id, v)}
                onDelete={() => handleDelete(o.id)}
              />
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

function fmtDate(d: string) {
  // d is YYYY-MM-DD; parse as local date to avoid TZ shift
  const [y, m, day] = d.split("-").map(Number);
  return format(new Date(y, m - 1, day), "EEE d MMM");
}

function DateRow({
  option,
  tally,
  isBest,
  myVote,
  canDelete,
  onVote,
  onDelete,
}: {
  option: DateOptionRow;
  tally: Tally;
  isBest: boolean;
  myVote?: Availability;
  canDelete: boolean;
  onVote: (v: Availability) => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={`rounded-2xl border p-3 shadow-card ${
        isBest ? "border-coral/40 bg-coral/5" : "border-border/60 bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-base font-semibold">{fmtDate(option.option_date)}</p>
          {option.time_label && <p className="text-xs text-muted-foreground">{option.time_label}</p>}
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold">
          <span className="rounded-full bg-leaf/15 px-2 py-0.5 text-leaf">✅ {tally.yes}</span>
          <span className="rounded-full bg-sun/30 px-2 py-0.5 text-sun-foreground">❔ {tally.maybe}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">❌ {tally.no}</span>
          {canDelete && (
            <button
              onClick={onDelete}
              aria-label="Remove date"
              className="ml-1 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <VoteBtn icon={<Check className="h-3.5 w-3.5" />} label="Yes" active={myVote === "yes"} onClick={() => onVote("yes")} tone="leaf" />
        <VoteBtn icon={<HelpCircle className="h-3.5 w-3.5" />} label="Maybe" active={myVote === "maybe"} onClick={() => onVote("maybe")} tone="sun" />
        <VoteBtn icon={<X className="h-3.5 w-3.5" />} label="No" active={myVote === "no"} onClick={() => onVote("no")} tone="neutral" />
      </div>
    </li>
  );
}

function VoteBtn({
  icon,
  label,
  active,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  tone: "leaf" | "sun" | "neutral";
}) {
  const toneMap = {
    leaf: "bg-leaf text-leaf-foreground",
    sun: "bg-sun text-sun-foreground",
    neutral: "bg-muted text-foreground",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition ${
        active ? `${toneMap[tone]} shadow-soft` : "border border-border bg-card text-muted-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}
