import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Section } from "@/components/AppShell";
import {
  ChevronDown, ChevronUp, Loader2, Plus, Trash2, CheckCircle2, Hand, Pencil, Check, ShoppingCart, PackageCheck, Star, Sparkles, Minus, AlertCircle,
} from "lucide-react";

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
  isStaple,
  removeMyClaim,
  setClaimHasThis,
  updateBringItem,
  upsertMyClaim,
} from "@/lib/events";
import { toast } from "sonner";

export const CATEGORIES = [
  { id: "food", label: "Food", emoji: "🍽️" },
  { id: "drinks", label: "Drinks", emoji: "🥤" },
  { id: "dessert", label: "Dessert", emoji: "🍰" },
  { id: "games", label: "Games", emoji: "🎲" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "lights", label: "Lights", emoji: "💡" },
  { id: "supplies", label: "Supplies", emoji: "🧺" },
  { id: "other", label: "Other", emoji: "✨" },
] as const;


export function BringMaster({
  eventId,
  isOrganizer,
}: {
  eventId: string;
  isOrganizer: boolean;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<BringItemRow[]>([]);
  const [claims, setClaims] = useState<BringClaimRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [activeCat, setActiveCat] = useState<string>("all");

  const load = async () => {
    try {
      const [rows, claimRows] = await Promise.all([
        fetchBringItems(eventId),
        fetchBringClaims(eventId),
      ]);
      setItems(rows);
      setClaims(claimRows);
      const ids = Array.from(
        new Set(
          [
            ...rows.map((r) => r.created_by),
            ...claimRows.map((c) => c.user_id),
          ].filter(Boolean) as string[],
        ),
      );
      setProfiles(await fetchProfiles(ids));
    } catch {
      toast.error("Couldn't load bring list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`bring:${eventId}`)
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

  // ---- claim helpers ----
  const claimsByItem = useMemo(() => {
    const m = new Map<string, BringClaimRow[]>();
    for (const c of claims) {
      const arr = m.get(c.item_id) ?? [];
      arr.push(c);
      m.set(c.item_id, arr);
    }
    return m;
  }, [claims]);

  const itemClaims = (id: string) => claimsByItem.get(id) ?? [];
  const claimedQty = (item: BringItemRow) =>
    itemClaims(item.id).reduce((s, c) => s + c.qty, 0);
  const isCovered = (item: BringItemRow) =>
    claimedQty(item) >= Math.max(1, item.qty_needed);
  const myClaim = (item: BringItemRow) =>
    user ? itemClaims(item.id).find((c) => c.user_id === user.id) ?? null : null;

  const handleClaim = async (item: BringItemRow, qty: number) => {
    if (!user) return;
    setBusyId(item.id);
    try {
      const existing = myClaim(item);
      await upsertMyClaim({
        item_id: item.id,
        event_id: eventId,
        user_id: user.id,
        qty,
        has_this: existing?.has_this ?? isStaple(item.name),
      });
      toast.success(`You're bringing ${item.name} 🎉`);
    } catch {
      toast.error("Couldn't update your claim");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnclaim = async (item: BringItemRow) => {
    if (!user) return;
    setBusyId(item.id);
    try {
      await removeMyClaim(item.id, user.id);
      toast(`Unclaimed ${item.name}`);
    } catch {
      toast.error("Couldn't unclaim");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: BringItemRow) => {
    if (!confirm(`Remove "${item.name}" from the list?`)) return;
    try {
      await deleteBringItem(item.id);
      toast(`Removed ${item.name}`);
    } catch {
      toast.error("Couldn't remove item");
    }
  };

  const handleToggleHave = async (item: BringItemRow) => {
    if (!user) return;
    const mine = myClaim(item);
    if (!mine) return;
    setBusyId(item.id);
    try {
      await setClaimHasThis(item.id, user.id, !mine.has_this);
      toast(mine.has_this ? `Need to grab ${item.name}` : `Got ${item.name} already ✅`);
    } catch {
      toast.error("Couldn't update");
    } finally {
      setBusyId(null);
    }
  };

  const coveredCount = items.filter(isCovered).length;

  // Personal shopping list: things you're bringing but still need to grab.
  const myToBuy = user
    ? items.filter((i) => {
        const c = myClaim(i);
        return c && !c.has_this;
      })
    : [];

  const renderItem = (item: BringItemRow) => {
    const mine = myClaim(item);
    const canEdit =
      !!user && (isOrganizer || item.created_by === user.id || !!mine);
    return (
      <BringRow
        key={item.id}
        item={item}
        claims={itemClaims(item.id)}
        profiles={profiles}
        myClaim={mine}
        claimedQty={claimedQty(item)}
        covered={isCovered(item)}
        canEdit={canEdit}
        canDelete={!!user && (isOrganizer || item.created_by === user.id)}
        busy={busyId === item.id}
        expanded={expandedId === item.id}
        editing={editingId === item.id}
        onToggleExpand={() => setExpandedId((c) => (c === item.id ? null : item.id))}
        onStartEdit={() => {
          setExpandedId(item.id);
          setEditingId(item.id);
        }}
        onCancelEdit={() => setEditingId(null)}
        onSaveEdit={async (patch) => {
          try {
            await updateBringItem(item.id, patch);
            toast.success("Item updated");
            setEditingId(null);
          } catch {
            toast.error("Couldn't update");
          }
        }}
        onClaim={(qty) => handleClaim(item, qty)}
        onUnclaim={() => handleUnclaim(item)}
        onToggleHave={() => handleToggleHave(item)}
        onDelete={() => handleDelete(item)}
      />
    );
  };

  const visible = (list: BringItemRow[]) =>
    activeCat === "all" ? list : list.filter((i) => (i.category || "other") === activeCat);

  const groupByCategory = (list: BringItemRow[]) =>
    CATEGORIES.map((c) => ({
      ...c,
      items: list.filter((i) => (i.category || "other") === c.id),
    })).filter((g) => g.items.length > 0);

  const requiredItems = visible(items.filter((i) => i.required));
  const optionalItems = visible(items.filter((i) => !i.required));

  // categories that actually have items, for the filter chips
  const usedCats = CATEGORIES.filter((c) =>
    items.some((i) => (i.category || "other") === c.id),
  );

  // "Still needed" = required items not yet fully covered
  const stillNeeded = items
    .filter((i) => i.required && !isCovered(i))
    .map((i) => ({
      item: i,
      remaining: Math.max(1, i.qty_needed) - claimedQty(i),
    }));

  return (
    <Section
      title="What to bring"
      subtitle={loading ? "Loading…" : `${coveredCount} of ${items.length} covered`}
      action={
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
        >
          <Plus className="h-3.5 w-3.5" /> Add item
        </button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-xs text-muted-foreground">
          No items yet — tap “Add item” to start the list.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Still needed summary */}
          {stillNeeded.length > 0 && (
            <div className="rounded-2xl border border-sun/40 bg-sun/10 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-sun-foreground">
                <AlertCircle className="h-3.5 w-3.5" /> Still needed
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stillNeeded.map(({ item, remaining }) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveCat("all");
                      setExpandedId(item.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium shadow-soft"
                  >
                    <span>{item.emoji}</span>
                    {item.name}
                    {item.qty_needed > 1 && (
                      <span className="text-muted-foreground">· {remaining} left</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* My shopping list */}
          {myToBuy.length > 0 && (
            <div className="rounded-2xl border border-coral/30 bg-coral/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-coral">
                <ShoppingCart className="h-3.5 w-3.5" /> Your shopping list
              </p>
              <ul className="mt-2 space-y-1 text-[12px]">
                {myToBuy.map((i) => (
                  <li key={i.id} className="flex items-center gap-2">
                    <span>{i.emoji}</span>
                    <span className="font-medium">{i.name}</span>
                    {i.quantity && <span className="text-muted-foreground">· {i.quantity}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Category filter chips */}
          {usedCats.length > 1 && (
            <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
              <FilterChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>
                ✨ All
              </FilterChip>
              {usedCats.map((c) => (
                <FilterChip
                  key={c.id}
                  active={activeCat === c.id}
                  onClick={() => setActiveCat(c.id)}
                >
                  {c.emoji} {c.label}
                </FilterChip>
              ))}
            </div>
          )}

          {requiredItems.length === 0 && optionalItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-xs text-muted-foreground">
              Nothing in this category yet.
            </div>
          )}

          {requiredItems.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 fill-coral text-coral" />
                <h3 className="text-sm font-semibold">What we need</h3>
                <span className="ml-auto text-[10px] text-muted-foreground">⭐ essentials</span>
              </div>
              <div className="space-y-4">
                {groupByCategory(requiredItems).map((g) => (
                  <div key={g.id}>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.emoji} {g.label}
                    </p>
                    <ul className="space-y-2">{g.items.map(renderItem)}</ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {optionalItems.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-lake" />
                <h3 className="text-sm font-semibold">What's nice to have</h3>
                <span className="text-[10px] text-muted-foreground">Great but not essential</span>
              </div>
              <div className="space-y-4">
                {groupByCategory(optionalItems).map((g) => (
                  <div key={g.id}>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.emoji} {g.label}
                    </p>
                    <ul className="space-y-2">{g.items.map(renderItem)}</ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {adding && (
        <AddItemDialog eventId={eventId} onClose={() => setAdding(false)} />
      )}
    </Section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
        active
          ? "bg-lake text-primary-foreground shadow-soft"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

type ItemPatch = Partial<Pick<BringItemRow, "name" | "emoji" | "quantity" | "ingredients" | "required" | "category" | "qty_needed">>;

function BringRow({
  item,
  claims,
  profiles,
  myClaim,
  claimedQty,
  covered,
  canEdit,
  canDelete,
  busy,
  expanded,
  editing,
  onToggleExpand,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onClaim,
  onUnclaim,
  onToggleHave,
  onDelete,
}: {
  item: BringItemRow;
  claims: BringClaimRow[];
  profiles: Map<string, ProfileLite>;
  myClaim: BringClaimRow | null;
  claimedQty: number;
  covered: boolean;
  canEdit: boolean;
  canDelete: boolean;
  busy: boolean;
  expanded: boolean;
  editing: boolean;
  onToggleExpand: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (patch: ItemPatch) => Promise<void> | void;
  onClaim: (qty: number) => void;
  onUnclaim: () => void;
  onToggleHave: () => void;
  onDelete: () => void;
}) {
  const needed = Math.max(1, item.qty_needed);
  const multi = needed > 1;
  const remaining = Math.max(0, needed - claimedQty);
  // qty selectable by me (my current qty counts as available again)
  const maxForMe = remaining + (myClaim?.qty ?? 0);
  const [qty, setQty] = useState(Math.min(Math.max(1, myClaim?.qty ?? 1), Math.max(1, maxForMe)));

  useEffect(() => {
    setQty(Math.min(Math.max(1, myClaim?.qty ?? 1), Math.max(1, remaining + (myClaim?.qty ?? 0))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myClaim?.qty, claimedQty, needed]);

  const pct = Math.min(100, Math.round((claimedQty / needed) * 100));

  const contributors = claims
    .map((c) => {
      const p = profiles.get(c.user_id);
      return `${p?.emoji_avatar ?? "👤"} ${p?.display_name ?? "Someone"}${multi ? ` ×${c.qty}` : ""}`;
    })
    .join(", ");

  return (
    <li className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-start gap-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral/10 text-2xl">
          {item.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{item.name}</p>
            {item.required && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-coral/15 px-1.5 py-0.5 text-[10px] font-semibold text-coral">
                <Star className="h-2.5 w-2.5 fill-coral" /> required
              </span>
            )}
            <span
              className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                covered
                  ? "bg-leaf/15 text-leaf"
                  : claimedQty > 0
                  ? "bg-sun/25 text-sun-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {covered ? <CheckCircle2 className="h-3 w-3" /> : "⏳"}{" "}
              {multi ? `${claimedQty}/${needed}` : covered ? "confirmed" : "pending"}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {item.quantity ? `Qty: ${item.quantity} · ` : ""}
            {claimedQty > 0 ? `Bringing: ${contributors}` : "Nobody yet — be a hero?"}
          </p>
          {multi && (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${covered ? "bg-leaf" : "bg-coral"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="mt-1 h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && !editing && (
        <div className="mt-3 space-y-2 border-t border-border/60 pt-3 text-[12px]">
          {multi && <Detail label="Needed" value={`${needed} units · ${claimedQty} claimed`} />}
          <Detail label="Note" value={item.quantity || "—"} />
          {claims.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Who's bringing it
              </p>
              <ul className="mt-1 space-y-0.5">
                {claims.map((c) => {
                  const p = profiles.get(c.user_id);
                  return (
                    <li key={c.id} className="flex items-center gap-1.5">
                      <span>{p?.emoji_avatar ?? "👤"}</span>
                      <span className="font-medium">{p?.display_name ?? "Someone"}</span>
                      {multi && <span className="text-muted-foreground">×{c.qty}</span>}
                      {c.has_this && <span className="text-leaf">· has it ✅</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {item.ingredients ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ingredients / details
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl bg-muted/50 p-2 leading-relaxed">
                {item.ingredients}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {editing && (
        <EditItemForm item={item} onCancel={onCancelEdit} onSave={onSaveEdit} />
      )}

      {!editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Qty stepper for multi-unit items when claiming / adjusting */}
          {multi && maxForMe > 0 && (
            <div className="inline-flex items-center gap-1 rounded-full border border-border/60 px-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Less"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-xs font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxForMe, q + 1))}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                aria-label="More"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}

          {!myClaim && remaining > 0 && (
            <button
              disabled={busy}
              onClick={() => onClaim(multi ? qty : 1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Hand className="h-3 w-3" />}
              {multi ? `I'll bring ${qty}` : "I'll bring this"}
            </button>
          )}

          {!myClaim && remaining === 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-leaf/15 px-3 py-1.5 text-xs font-semibold text-leaf">
              <CheckCircle2 className="h-3 w-3" /> Fully covered
            </span>
          )}

          {myClaim && multi && (
            <button
              disabled={busy || qty === myClaim.qty}
              onClick={() => onClaim(qty)}
              className="inline-flex items-center gap-1.5 rounded-full bg-leaf/15 px-3 py-1.5 text-xs font-semibold text-leaf disabled:opacity-50"
            >
              <Check className="h-3 w-3" /> Update to {qty}
            </button>
          )}

          {myClaim && (
            <button
              disabled={busy}
              onClick={onUnclaim}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              {multi ? "Drop my claim" : "You're bringing this · Unclaim"}
            </button>
          )}

          {myClaim && (
            <button
              disabled={busy}
              onClick={onToggleHave}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                myClaim.has_this
                  ? "bg-leaf text-leaf-foreground"
                  : "border border-border/60 text-muted-foreground hover:text-leaf"
              }`}
            >
              <PackageCheck className="h-3 w-3" />
              {myClaim.has_this ? "Already have it" : "Mark as have it"}
            </button>
          )}

          {canEdit && (
            <button
              onClick={onStartEdit}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-lake"
              aria-label="Edit item"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className={`inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-coral ${canEdit ? "" : "ml-auto"}`}
              aria-label="Delete item"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}:{" "}
      </span>
      <span className="text-foreground">{value}</span>
    </p>
  );
}

function EditItemForm({
  item,
  onCancel,
  onSave,
}: {
  item: BringItemRow;
  onCancel: () => void;
  onSave: (patch: ItemPatch) => Promise<void> | void;
}) {
  const [name, setName] = useState(item.name);
  const [emoji, setEmoji] = useState(item.emoji);
  const [quantity, setQuantity] = useState(item.quantity ?? "");
  const [ingredients, setIngredients] = useState(item.ingredients ?? "");
  const [required, setRequired] = useState(item.required);
  const [category, setCategory] = useState(item.category || "other");
  const [qtyNeeded, setQtyNeeded] = useState(Math.max(1, item.qty_needed));
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim().slice(0, 80),
      emoji: emoji.trim() || "🧺",
      quantity: quantity.trim() || null,
      ingredients: ingredients.trim() || null,
      required,
      category,
      qty_needed: Math.max(1, qtyNeeded),
    });
    setSaving(false);
  };

  return (
    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
          aria-label="Emoji"
          className="w-14 rounded-xl border border-border/60 bg-background px-2 py-2 text-center text-xl"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
        />
      </div>
      <input
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Note (e.g. enough for 8)"
        maxLength={60}
        className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
      />
      <textarea
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        placeholder="Ingredients / details"
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
      />
      <CategoryPicker value={category} onChange={setCategory} />
      <QtyNeededField value={qtyNeeded} onChange={setQtyNeeded} />
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
        />
        Required (essential for the event)
      </label>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving || !name.trim()}
          className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Save
        </button>
      </div>
    </div>
  );
}

function AddItemDialog({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧺");
  const [quantity, setQuantity] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [required, setRequired] = useState(false);
  const [category, setCategory] = useState("other");
  const [qtyNeeded, setQtyNeeded] = useState(1);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      await addBringItem({
        event_id: eventId,
        created_by: user.id,
        name: name.trim(),
        emoji: emoji.trim() || "🧺",
        quantity: quantity.trim() || null,
        ingredients: ingredients.trim() || null,
        required,
        category,
        qty_needed: Math.max(1, qtyNeeded),
      });
      toast.success("Item added");
      onClose();
    } catch {
      toast.error("Couldn't add item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl bg-background shadow-float">
        <h3 className="shrink-0 px-4 pt-4 font-display text-lg font-semibold">Add a bring item</h3>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pt-3">


          <div className="flex gap-2">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              className="w-14 rounded-xl border border-border/60 bg-card px-2 py-2 text-center text-xl"
              aria-label="Emoji"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name (e.g. Halloumi Skewers)"
              maxLength={80}
              className="flex-1 rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
            />
          </div>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Note (e.g. enough for 8)"
            maxLength={60}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          />
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Ingredients / details (e.g. 200g halloumi, 20 wooden skewers, bell peppers)"
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          />
          <CategoryPicker value={category} onChange={setCategory} />
          <QtyNeededField value={qtyNeeded} onChange={setQtyNeeded} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
            Required (essential for the event)
          </label>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border/60 px-4 py-3">

          <button
            onClick={onClose}
            className="rounded-full bg-muted px-4 py-2 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-1 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function QtyNeededField({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        How many needed (split between friends)
      </p>
      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-2 py-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Less"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          aria-label="More"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <span className="ml-1 text-[11px] text-muted-foreground">
          {value > 1 ? "people can each bring a part" : "single item"}
        </span>
      </div>
    </div>
  );
}

function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Category
      </p>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const on = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                on ? "bg-coral text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
