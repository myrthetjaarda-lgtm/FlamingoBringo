import { useEffect, useMemo, useState } from "react";
import { Section } from "@/components/AppShell";
import { Gift, Plus, Loader2, Check, Trash2, X, ExternalLink, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfiles, type ProfileLite } from "@/lib/events";
import {
  type GiftItemRow,
  type GiftContributionRow,
  addGiftItem,
  deleteGiftItem,
  fetchGiftItems,
  fetchGiftContributions,
  removeMyGiftContribution,
  upsertMyGiftContribution,
} from "@/lib/gifts";
import { toast } from "sonner";

const SUGGESTIONS = [
  { emoji: "🎁", name: "Surprise gift" },
  { emoji: "📚", name: "Book" },
  { emoji: "🪴", name: "Plant" },
  { emoji: "🍫", name: "Chocolates" },
  { emoji: "🎟️", name: "Concert tickets" },
  { emoji: "🍾", name: "Bottle of bubbles" },
  { emoji: "💐", name: "Flowers" },
  { emoji: "🎮", name: "Game" },
];

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function GiftWishlist({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<GiftItemRow[]>([]);
  const [contribs, setContribs] = useState<GiftContributionRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎁");
  const [newPrice, setNewPrice] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [chipFor, setChipFor] = useState<string | null>(null);
  const [chipAmount, setChipAmount] = useState("");

  const load = async () => {
    try {
      const [rows, contribRows] = await Promise.all([
        fetchGiftItems(eventId),
        fetchGiftContributions(eventId),
      ]);
      setItems(rows);
      setContribs(contribRows);
      const ids = Array.from(
        new Set(
          [...rows.map((r) => r.created_by), ...contribRows.map((c) => c.user_id)].filter(
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
      .channel(`gifts:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gift_items", filter: `event_id=eq.${eventId}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gift_contributions",
          filter: `event_id=eq.${eventId}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const contribsByGift = useMemo(() => {
    const m = new Map<string, GiftContributionRow[]>();
    for (const c of contribs) {
      const arr = m.get(c.gift_id) ?? [];
      arr.push(c);
      m.set(c.gift_id, arr);
    }
    return m;
  }, [contribs]);

  const addItem = async () => {
    if (!user) {
      toast.error("Sign in to add a gift idea");
      return;
    }
    const clean = newName.trim();
    if (!clean) return;
    const priceNum = newPrice.trim() ? Number(newPrice.replace(",", ".")) : null;
    try {
      await addGiftItem({
        event_id: eventId,
        created_by: user.id,
        name: clean,
        emoji: newEmoji,
        url: newUrl.trim() || null,
        price: priceNum != null && !Number.isNaN(priceNum) ? priceNum : null,
      });
      setNewName("");
      setNewEmoji("🎁");
      setNewPrice("");
      setNewUrl("");
      setAdding(false);
    } catch {
      toast.error("Couldn't add gift");
    }
  };

  const quickAdd = async (name: string, emoji: string) => {
    if (!user) {
      toast.error("Sign in to add a gift idea");
      return;
    }
    try {
      await addGiftItem({ event_id: eventId, created_by: user.id, name, emoji });
    } catch {
      toast.error("Couldn't add gift");
    }
  };

  const removeItem = async (item: GiftItemRow) => {
    if (!confirm(`Remove "${item.name}" from the wishlist?`)) return;
    try {
      await deleteGiftItem(item.id);
    } catch {
      toast.error("Couldn't remove");
    }
  };

  const toggleBuyer = async (item: GiftItemRow, mine: GiftContributionRow | undefined) => {
    if (!user) {
      toast.error("Sign in to claim a gift");
      return;
    }
    setBusyId(item.id);
    try {
      if (mine?.is_buyer) {
        // Stepping back from buying — drop the pledge entirely unless they chipped in.
        if (mine.amount > 0) {
          await upsertMyGiftContribution({
            gift_id: item.id,
            event_id: eventId,
            user_id: user.id,
            amount: mine.amount,
            is_buyer: false,
          });
        } else {
          await removeMyGiftContribution(item.id, user.id);
        }
      } else {
        await upsertMyGiftContribution({
          gift_id: item.id,
          event_id: eventId,
          user_id: user.id,
          amount: mine?.amount ?? 0,
          is_buyer: true,
        });
      }
    } catch {
      toast.error("Couldn't update");
    } finally {
      setBusyId(null);
    }
  };

  const saveChip = async (item: GiftItemRow, mine: GiftContributionRow | undefined) => {
    if (!user) {
      toast.error("Sign in to chip in");
      return;
    }
    const amount = Number(chipAmount.replace(",", "."));
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    setBusyId(item.id);
    try {
      await upsertMyGiftContribution({
        gift_id: item.id,
        event_id: eventId,
        user_id: user.id,
        amount,
        is_buyer: mine?.is_buyer ?? false,
      });
      setChipFor(null);
      setChipAmount("");
    } catch {
      toast.error("Couldn't save");
    } finally {
      setBusyId(null);
    }
  };

  const removeMine = async (item: GiftItemRow) => {
    if (!user) return;
    setBusyId(item.id);
    try {
      await removeMyGiftContribution(item.id, user.id);
    } catch {
      toast.error("Couldn't update");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Section
      title="Birthday wishlist"
      subtitle="Present ideas — and who buys or chips in"
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
        >
          <Plus className="h-3.5 w-3.5" /> Add gift
        </button>
      }
    >
      <div className="rounded-3xl border border-coral/30 bg-coral/5 p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4 text-coral" />
          <p className="text-xs font-semibold text-coral">
            Pick a present, then say you'll buy it or chip in
          </p>
        </div>

        {adding && (
          <div className="mb-3 rounded-2xl border border-border/60 bg-card p-3">
            <div className="flex items-center gap-2">
              <input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value.slice(0, 2) || "🎁")}
                className="w-12 rounded-xl border border-border/60 bg-background px-2 py-2 text-center text-lg"
              />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Polaroid camera"
                className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
                maxLength={80}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-border/60 bg-background px-3">
                <span className="text-sm text-muted-foreground">€</span>
                <input
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Price"
                  inputMode="decimal"
                  className="w-20 bg-transparent py-2 pl-1 text-sm outline-none"
                  maxLength={9}
                />
              </div>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Link (optional)"
                className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
                maxLength={300}
              />
              <button
                onClick={addItem}
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
                  onClick={() => quickAdd(s.name, s.emoji)}
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
            No present ideas yet — tap “Add gift” to start the wishlist. 🎂
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              const itemContribs = contribsByGift.get(item.id) ?? [];
              const mine = user ? itemContribs.find((c) => c.user_id === user.id) : undefined;
              const buyers = itemContribs.filter((c) => c.is_buyer);
              const collected = itemContribs.reduce((s, c) => s + Number(c.amount), 0);
              const pct =
                item.price && item.price > 0
                  ? Math.min(100, Math.round((collected / item.price) * 100))
                  : 0;
              const canDelete = !!user && item.created_by === user.id;
              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-border/60 bg-card px-3 py-2.5 shadow-soft"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-tight">{item.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="font-medium">{item.name}</p>
                        {item.price != null && (
                          <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            €{fmt(item.price)}
                          </span>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-lake hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> Link
                          </a>
                        )}
                      </div>

                      {/* Contributors */}
                      {itemContribs.length > 0 && (
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {itemContribs
                            .map((c) => {
                              const p = profiles.get(c.user_id);
                              const who = `${p?.emoji_avatar ?? "👤"} ${p?.display_name ?? "Someone"}`;
                              const tag = c.is_buyer
                                ? Number(c.amount) > 0
                                  ? ` (buys · €${fmt(c.amount)})`
                                  : " (buys)"
                                : ` (€${fmt(c.amount)})`;
                              return who + tag;
                            })
                            .join(", ")}
                        </p>
                      )}

                      {/* Progress toward price (only when a price is set) */}
                      {item.price != null && item.price > 0 && (
                        <div className="mt-1.5">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${pct >= 100 ? "bg-leaf" : "bg-coral"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            €{fmt(collected)} of €{fmt(item.price)} collected
                            {pct >= 100 ? " · fully covered 🎉" : ""}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {chipFor === item.id ? (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center rounded-xl border border-border/60 bg-background px-3">
                            <span className="text-sm text-muted-foreground">€</span>
                            <input
                              autoFocus
                              value={chipAmount}
                              onChange={(e) => setChipAmount(e.target.value)}
                              placeholder="Amount"
                              inputMode="decimal"
                              className="w-20 bg-transparent py-1.5 pl-1 text-sm outline-none"
                              maxLength={9}
                            />
                          </div>
                          <button
                            onClick={() => saveChip(item, mine)}
                            disabled={busyId === item.id}
                            className="rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
                          >
                            {busyId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setChipFor(null);
                              setChipAmount("");
                            }}
                            className="rounded-full bg-muted px-2 py-1.5 text-xs"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => toggleBuyer(item, mine)}
                            disabled={busyId === item.id}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-soft transition disabled:opacity-50 ${
                              mine?.is_buyer
                                ? "bg-leaf text-leaf-foreground"
                                : "bg-background text-foreground"
                            }`}
                          >
                            {busyId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Gift className="h-3 w-3" />
                            )}
                            {mine?.is_buyer ? "I'm buying it" : "I'll buy it"}
                          </button>
                          <button
                            onClick={() => {
                              setChipFor(item.id);
                              setChipAmount(mine && mine.amount > 0 ? String(mine.amount) : "");
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold shadow-soft"
                          >
                            <Wallet className="h-3 w-3" />
                            {mine && mine.amount > 0 ? `Chipping €${fmt(mine.amount)}` : "Chip in"}
                          </button>
                          {mine && (
                            <button
                              onClick={() => removeMine(item)}
                              disabled={busyId === item.id}
                              className="rounded-full px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-destructive disabled:opacity-50"
                            >
                              Remove me
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => removeItem(item)}
                        aria-label="Remove gift"
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {buyers.length === 0 && itemContribs.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      💡 People are chipping in — someone still needs to tap “I'll buy it”.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-3 text-[11px] text-muted-foreground">
          🎁 Add ideas, claim the one you'll buy, or split the cost — wie betaalt wat, all in one
          place.
        </p>
      </div>
    </Section>
  );
}
