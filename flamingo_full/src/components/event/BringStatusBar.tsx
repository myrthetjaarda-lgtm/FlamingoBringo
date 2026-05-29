import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchBringItems, type BringItemRow } from "@/lib/events";
import { Users, Star, Loader2 } from "lucide-react";

export function BringStatusBar({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<BringItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setItems(await fetchBringItems(eventId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`bring_status:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bring_items", filter: `event_id=eq.${eventId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const total = items.length;
  const claimed = items.filter((i) => i.claimed_by).length;
  const reqItems = items.filter((i) => i.required);
  const reqClaimed = reqItems.filter((i) => i.claimed_by).length;
  const reqOpen = reqItems.filter((i) => !i.claimed_by);
  const pct = total > 0 ? Math.round((claimed / total) * 100) : 0;
  const attendeeCount = new Set(items.map((i) => i.claimed_by).filter(Boolean)).size;

  // status colour: red = required gaps, orange = optional gaps, green = all covered
  const tone =
    reqItems.length > 0 && reqClaimed < reqItems.length
      ? "red"
      : claimed < total
        ? "orange"
        : "green";
  const barColor =
    tone === "red" ? "bg-coral" : tone === "orange" ? "bg-sun" : "bg-leaf";
  const headline =
    tone === "red"
      ? "Required items still need a hero"
      : tone === "orange"
        ? "A few gaps to fill"
        : total === 0
          ? "Nothing on the list yet"
          : "All covered — nice! 🎉";

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-coral">
          Bring status
        </p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> {attendeeCount} attending
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm font-semibold">{headline}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>{claimed} of {total} items claimed</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          {reqItems.length > 0 && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-coral/10 px-2.5 py-1 text-[11px] font-semibold text-coral">
              <Star className="h-3 w-3 fill-coral" /> Required: {reqItems.length} items, {reqClaimed} claimed
            </p>
          )}
          {reqOpen.length > 0 && (
            <div className="mt-2 rounded-2xl border border-coral/20 bg-coral/5 p-2.5">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-coral">
                Still needs a hero
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {reqOpen.map((i) => (
                  <li
                    key={i.id}
                    className="inline-flex items-center gap-1 rounded-full border border-coral/30 bg-card px-2 py-0.5 text-[11px] font-semibold"
                  >
                    <span aria-hidden>{i.emoji}</span>
                    <span>{i.name}</span>
                    {i.quantity && (
                      <span className="text-[10px] font-normal text-muted-foreground">{i.quantity}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </>
      )}
    </div>
  );
}
