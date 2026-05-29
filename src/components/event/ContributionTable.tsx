import { useEffect, useState } from "react";
import { Section } from "@/components/AppShell";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  type BringItemRow,
  type BringClaimRow,
  type ProfileFull,
  fetchBringItems,
  fetchBringClaims,
  fetchProfilesFull,
} from "@/lib/events";
import { ProfilePopup } from "@/components/event/ProfilePopup";

type ContribLine = { item: BringItemRow; qty: number; hasThis: boolean };

export function ContributionTable({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<BringItemRow[]>([]);
  const [claims, setClaims] = useState<BringClaimRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileFull>>(new Map());
  const [loading, setLoading] = useState(true);
  const [openProfile, setOpenProfile] = useState<ProfileFull | null>(null);

  const load = async () => {
    const [rows, claimRows] = await Promise.all([
      fetchBringItems(eventId),
      fetchBringClaims(eventId),
    ]);
    setItems(rows);
    setClaims(claimRows);
    const ids = Array.from(new Set(claimRows.map((c) => c.user_id)));
    setProfiles(await fetchProfilesFull(ids));
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`contrib:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bring_items", filter: `event_id=eq.${eventId}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bring_claims", filter: `event_id=eq.${eventId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const itemById = new Map(items.map((i) => [i.id, i]));

  // Group claims per contributor
  const byUser = new Map<string, ContribLine[]>();
  for (const c of claims) {
    const item = itemById.get(c.item_id);
    if (!item) continue;
    const arr = byUser.get(c.user_id) ?? [];
    arr.push({ item, qty: c.qty, hasThis: c.has_this });
    byUser.set(c.user_id, arr);
  }

  return (
    <Section title="Who's bringing what" subtitle="Every contributor, by the item">
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : byUser.size === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-xs text-muted-foreground">
          No one's claimed anything yet ☀️
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Person</th>
                <th className="px-3 py-2">Bringing</th>
                <th className="px-3 py-2 text-right">Items</th>
                <th className="px-3 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(byUser.entries()).map(([userId, lines]) => {
                const p = profiles.get(userId);
                const allConfirmed = lines.every((l) => l.hasThis);
                return (
                  <tr key={userId} className="border-t border-border/60 align-top">
                    <td className="px-3 py-2">
                      {p ? (
                        <button
                          onClick={() => setOpenProfile(p)}
                          className="font-semibold text-lake underline-offset-2 hover:underline"
                        >
                          {p.emoji_avatar} {p.display_name}
                        </button>
                      ) : (
                        <span className="font-semibold">Someone</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <div className="flex flex-wrap gap-1">
                        {lines.map((l) => {
                          const partial = l.qty < l.item.qty_needed;
                          return (
                            <span
                              key={l.item.id}
                              className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5"
                            >
                              <span>
                                {l.item.emoji} {l.item.name}
                              </span>
                              {l.qty > 1 && <span className="font-semibold">×{l.qty}</span>}
                              {partial && (
                                <span className="text-[9px] font-semibold text-coral">
                                  {l.qty}/{l.item.qty_needed}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{lines.length}</td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          allConfirmed ? "bg-leaf/15 text-leaf" : "bg-sun/25 text-sun-foreground"
                        }`}
                      >
                        {allConfirmed ? "✓ got it" : "⏳ to buy"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {openProfile && (
        <ProfilePopup profile={openProfile} onClose={() => setOpenProfile(null)} />
      )}
    </Section>
  );
}
