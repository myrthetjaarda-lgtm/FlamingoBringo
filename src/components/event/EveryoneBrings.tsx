import { useEffect, useMemo, useState } from "react";
import { Section } from "@/components/AppShell";
import { Backpack, Plus, Loader2, Check, Trash2, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  type BringItemRow,
  type BringClaimRow,
  type ProfileLite,
  addBringItem,
  deleteBringItem,
  fetchBringClaims,
  fetchBringItems,
  fetchProfiles,
  removeMyClaim,
  upsertMyClaim,
} from "@/lib/events";
import { toast } from "sonner";

const SUGGESTIONS = [
  { emoji: "🏖️", name: "Towel" },
  { emoji: "🧴", name: "Sunscreen" },
  { emoji: "🩳", name: "Swimwear" },
  { emoji: "💧", name: "Water bottle" },
  { emoji: "🕶️", name: "Sunglasses" },
  { emoji: "🧢", name: "Hat or cap" },
  { emoji: "🍴", name: "Fork" },
  { emoji: "🔪", name: "Knife" },
  { emoji: "🥄", name: "Spoon" },
  { emoji: "🍽️", name: "Plate" },
  { emoji: "🥤", name: "Cup" },
  { emoji: "🧻", name: "Napkins" },
];

export function EveryoneBrings({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<BringItemRow[]>([]);
  const [claims, setClaims] = useState<BringClaimRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🧺");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [rows, claimRows] = await Promise.all([
        fetchBringItems(eventId),
        fetchBringClaims(eventId),
      ]);
      const byo = rows.filter((r) => r.is_byo);
      setItems(byo);
      setClaims(claimRows);
      const ids = Array.from(
        new Set(
          [...byo.map((r) => r.created_by), ...claimRows.map((c) => c.user_id)].filter(
            Boolean,
          ) as string[],
        ),
      );
      setProfiles(await fetchProfiles(ids));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`byo:${eventId}`)
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

  const claimsByItem = useMemo(() => {
    const m = new Map<string, BringClaimRow[]>();
    for (const c of claims) {
      const arr = m.get(c.item_id) ?? [];
      arr.push(c);
      m.set(c.item_id, arr);
    }
    return m;
  }, [claims]);

  const toggleMine = async (item: BringItemRow) => {
    if (!user) {
      toast.error("Sign in to check items off");
      return;
    }
    const mine = (claimsByItem.get(item.id) ?? []).find((c) => c.user_id === user.id);
    setBusyId(item.id);
    try {
      if (mine) {
        await removeMyClaim(item.id, user.id);
      } else {
        await upsertMyClaim({
          item_id: item.id,
          event_id: eventId,
          user_id: user.id,
          qty: 1,
          has_this: true,
        });
      }
    } catch {
      toast.error("Couldn't update");
    } finally {
      setBusyId(null);
    }
  };

  const addItem = async (name: string, emoji: string) => {
    if (!user) {
      toast.error("Sign in to add items");
      return;
    }
    const clean = name.trim();
    if (!clean) return;
    try {
      await addBringItem({
        event_id: eventId,
        created_by: user.id,
        name: clean,
        emoji,
        is_byo: true,
        category: "supplies",
      });
      setNewName("");
      setNewEmoji("🧺");
      setAdding(false);
    } catch {
      toast.error("Couldn't add item");
    }
  };

  const removeItem = async (item: BringItemRow) => {
    if (!confirm(`Remove "${item.name}"?`)) return;
    try {
      await deleteBringItem(item.id);
    } catch {
      toast.error("Couldn't remove");
    }
  };

  return (
    <Section
      title="Everyone brings their own"
      subtitle="Personal essentials — check off what you're packing"
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full bg-lake px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      }
    >
      <div className="rounded-3xl border border-lake/30 bg-lake/5 p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-lake">
          <Backpack className="h-4 w-4" />
          Pack list
        </div>

        {adding && (
          <div className="mb-3 rounded-2xl border border-border/60 bg-card p-3">
            <div className="flex items-center gap-2">
              <input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value.slice(0, 2) || "🧺")}
                className="w-12 rounded-xl border border-border/60 bg-background px-2 py-2 text-center text-lg"
              />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Fork, Towel, Sunscreen"
                className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
                maxLength={60}
              />
              <button
                onClick={() => addItem(newName, newEmoji)}
                disabled={!newName.trim()}
                className="rounded-full bg-coral px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setAdding(false)}
                className="rounded-full bg-muted px-2 py-2 text-xs"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Quick add
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {SUGGESTIONS.filter(
                (s) => !items.some((i) => i.name.toLowerCase() === s.name.toLowerCase()),
              ).map((s) => (
                <button
                  key={s.name}
                  onClick={() => addItem(s.name, s.emoji)}
                  className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold shadow-soft"
                >
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            Nothing here yet — tap “Add” to start the pack list.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {items.map((i) => {
              const itemClaims = claimsByItem.get(i.id) ?? [];
              const mine = user ? itemClaims.find((c) => c.user_id === user.id) : null;
              const checked = !!mine;
              const canDelete = !!user && i.created_by === user.id;
              return (
                <li
                  key={i.id}
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm shadow-soft transition ${
                    checked
                      ? "border-leaf/50 bg-leaf/10"
                      : "border-border/60 bg-card"
                  }`}
                >
                  <button
                    onClick={() => toggleMine(i)}
                    disabled={busyId === i.id}
                    aria-label={checked ? "Uncheck" : "Check"}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                      checked ? "border-leaf bg-leaf text-leaf-foreground" : "border-border bg-background"
                    }`}
                  >
                    {busyId === i.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : checked ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : null}
                  </button>
                  <span className="text-lg">{i.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.name}</p>
                    {itemClaims.length > 0 && (
                      <p className="truncate text-[10px] text-muted-foreground">
                        {itemClaims
                          .map((c) => {
                            const p = profiles.get(c.user_id);
                            return `${p?.emoji_avatar ?? "👤"} ${p?.display_name ?? "Someone"}`;
                          })
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => removeItem(i)}
                      aria-label="Remove"
                      className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-3 text-[11px] text-muted-foreground">
          Anyone can add. Check the box for the items you'll bring yourself ☀️
        </p>
      </div>
    </Section>
  );
}
