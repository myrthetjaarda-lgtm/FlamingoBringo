import { useEffect, useMemo, useRef, useState } from "react";
import { Section } from "@/components/AppShell";
import {
  Receipt,
  Plus,
  Loader2,
  Check,
  Trash2,
  X,
  Upload,
  ImageIcon,
  Copy,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPaymentHandles,
  fetchProfilesFull,
  fetchRsvps,
  type PaymentHandles,
  type ProfileFull,
} from "@/lib/events";
import {
  type ExpenseRow,
  type ExpenseShareRow,
  addExpense,
  deleteExpense,
  fetchExpenses,
  fetchExpenseShares,
  receiptUrl,
  removeExpenseShare,
  splitExpenseEqually,
  uploadReceipt,
  upsertExpenseShare,
} from "@/lib/expenses";
import { toast } from "sonner";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const EMOJIS = ["🧾", "🍕", "🍻", "⚽", "🎟️", "🚗", "🏟️", "🛒", "🏨", "🎂"];

export function EventExpenses({ eventId, isOrganizer }: { eventId: string; isOrganizer: boolean }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [shares, setShares] = useState<ExpenseShareRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileFull>>(new Map());
  const [handles, setHandles] = useState<Map<string, PaymentHandles>>(new Map());
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Add-expense form
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🧾");
  const [amount, setAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  // Inline edit of my own share amount, keyed by expense id.
  const [editAmount, setEditAmount] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const [exp, shr, rsvps] = await Promise.all([
        fetchExpenses(eventId),
        fetchExpenseShares(eventId),
        fetchRsvps(eventId),
      ]);
      setExpenses(exp);
      setShares(shr);
      const coming = rsvps.filter((r) => r.status === "coming").map((r) => r.user_id);
      setAttendeeIds(coming);
      const ids = Array.from(
        new Set(
          [
            ...exp.map((e) => e.paid_by),
            ...exp.map((e) => e.created_by),
            ...shr.map((s) => s.user_id),
            ...coming,
            user?.id,
          ].filter(Boolean) as string[],
        ),
      );
      const [profs, hndls] = await Promise.all([fetchProfilesFull(ids), fetchPaymentHandles(ids)]);
      setProfiles(profs);
      setHandles(hndls);
    } catch {
      // Tables/columns may not exist yet (migration not applied) — degrade to empty.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`expenses:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `event_id=eq.${eventId}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_shares", filter: `event_id=eq.${eventId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const sharesByExpense = useMemo(() => {
    const m = new Map<string, ExpenseShareRow[]>();
    for (const s of shares) {
      const arr = m.get(s.expense_id) ?? [];
      arr.push(s);
      m.set(s.expense_id, arr);
    }
    return m;
  }, [shares]);

  // A small "your balance" summary across all expenses.
  const balance = useMemo(() => {
    if (!user) return { owe: 0, owed: 0 };
    let owe = 0;
    let owed = 0;
    for (const e of expenses) {
      for (const s of sharesByExpense.get(e.id) ?? []) {
        if (s.settled) continue;
        if (s.user_id === user.id && e.paid_by !== user.id) owe += Number(s.amount);
        if (e.paid_by === user.id && s.user_id !== user.id) owed += Number(s.amount);
      }
    }
    return { owe, owed };
  }, [expenses, sharesByExpense, user]);

  const who = (id: string | null) => {
    if (!id) return { name: "Someone", emoji: "👤" };
    const p = profiles.get(id);
    return { name: p?.display_name ?? "Someone", emoji: p?.emoji_avatar ?? "👤" };
  };

  const resetForm = () => {
    setTitle("");
    setEmoji("🧾");
    setAmount("");
    setReceiptFile(null);
    setAdding(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!user) {
      toast.error("Sign in to add a receipt");
      return;
    }
    const clean = title.trim();
    const amt = Number(amount.replace(",", "."));
    if (!clean) return;
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Enter an amount");
      return;
    }
    setSaving(true);
    try {
      let receipt_path: string | null = null;
      if (receiptFile) {
        receipt_path = await uploadReceipt(receiptFile, eventId, user.id);
      }
      await addExpense({
        event_id: eventId,
        created_by: user.id,
        paid_by: user.id,
        title: clean,
        emoji,
        amount: amt,
        receipt_path,
      });
      resetForm();
      toast.success("Receipt added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add receipt");
    } finally {
      setSaving(false);
    }
  };

  const splitTargets = (expense: ExpenseRow) => {
    const set = new Set<string>(attendeeIds);
    set.add(expense.paid_by);
    return Array.from(set);
  };

  const doSplit = async (expense: ExpenseRow) => {
    const targets = splitTargets(expense);
    if (targets.length === 0) {
      toast.error("No attendees to split between yet");
      return;
    }
    setBusyId(expense.id);
    try {
      await splitExpenseEqually(expense, targets, sharesByExpense.get(expense.id) ?? []);
    } catch {
      toast.error("Couldn't split");
    } finally {
      setBusyId(null);
    }
  };

  const claimMine = async (expense: ExpenseRow, existing: ExpenseShareRow[]) => {
    if (!user) {
      toast.error("Sign in to claim your share");
      return;
    }
    setBusyId(expense.id);
    try {
      // Suggest an even slice based on however many people are already on the split.
      const headcount = Math.max(1, existing.length || splitTargets(expense).length);
      const suggested = Math.round((expense.amount / headcount) * 100) / 100;
      await upsertExpenseShare({
        expense_id: expense.id,
        event_id: eventId,
        user_id: user.id,
        amount: suggested,
        settled: expense.paid_by === user.id,
      });
    } catch {
      toast.error("Couldn't claim share");
    } finally {
      setBusyId(null);
    }
  };

  const saveMyAmount = async (expense: ExpenseRow, mine: ExpenseShareRow) => {
    const raw = editAmount[expense.id];
    if (raw == null) return;
    const amt = Number(raw.replace(",", "."));
    if (Number.isNaN(amt) || amt < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusyId(expense.id);
    try {
      await upsertExpenseShare({
        expense_id: expense.id,
        event_id: eventId,
        user_id: mine.user_id,
        amount: amt,
        settled: mine.settled,
      });
      setEditAmount((m) => {
        const next = { ...m };
        delete next[expense.id];
        return next;
      });
    } catch {
      toast.error("Couldn't save");
    } finally {
      setBusyId(null);
    }
  };

  const toggleSettled = async (expense: ExpenseRow, mine: ExpenseShareRow) => {
    setBusyId(expense.id);
    try {
      await upsertExpenseShare({
        expense_id: expense.id,
        event_id: eventId,
        user_id: mine.user_id,
        amount: Number(mine.amount),
        settled: !mine.settled,
      });
    } catch {
      toast.error("Couldn't update");
    } finally {
      setBusyId(null);
    }
  };

  const removeMine = async (expense: ExpenseRow) => {
    if (!user) return;
    setBusyId(expense.id);
    try {
      await removeExpenseShare(expense.id, user.id);
    } catch {
      toast.error("Couldn't update");
    } finally {
      setBusyId(null);
    }
  };

  const removeExpense = async (expense: ExpenseRow) => {
    if (!confirm(`Delete "${expense.title}"?`)) return;
    try {
      await deleteExpense(expense.id);
    } catch {
      toast.error("Couldn't delete");
    }
  };

  const copy = (label: string, value: string) => {
    void navigator.clipboard?.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Couldn't copy"),
    );
  };

  return (
    <Section
      title="Costs & receipts"
      subtitle="Upload receipts, see who paid what, split & settle up"
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
        >
          <Plus className="h-3.5 w-3.5" /> Add receipt
        </button>
      }
    >
      <div className="rounded-3xl border border-coral/30 bg-coral/5 p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-coral" />
          <p className="text-xs font-semibold text-coral">
            Wie betaalt wat — split the bill and settle up
          </p>
        </div>

        {/* Your balance */}
        {user && (balance.owe > 0 || balance.owed > 0) && (
          <div className="mb-3 flex gap-2">
            {balance.owe > 0 && (
              <div className="flex-1 rounded-2xl border border-border/60 bg-card px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  You owe
                </p>
                <p className="text-lg font-bold text-coral">€{fmt(balance.owe)}</p>
              </div>
            )}
            {balance.owed > 0 && (
              <div className="flex-1 rounded-2xl border border-border/60 bg-card px-3 py-2 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  You're owed
                </p>
                <p className="text-lg font-bold text-leaf">€{fmt(balance.owed)}</p>
              </div>
            )}
          </div>
        )}

        {/* Add form */}
        {adding && (
          <div className="mb-3 rounded-2xl border border-border/60 bg-card p-3">
            <div className="flex items-center gap-2">
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 2) || "🧾")}
                className="w-12 rounded-xl border border-border/60 bg-background px-2 py-2 text-center text-lg"
              />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pizzas, pitch rental"
                maxLength={80}
                className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`rounded-lg px-1.5 py-0.5 text-base ${emoji === e ? "bg-coral/20" : ""}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-border/60 bg-background px-3">
                <span className="text-sm text-muted-foreground">€</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Total"
                  inputMode="decimal"
                  maxLength={9}
                  className="w-24 bg-transparent py-2 pl-1 text-sm outline-none"
                />
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-muted-foreground"
              >
                <Upload className="h-3.5 w-3.5" />
                {receiptFile ? "Change photo" : "Receipt photo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {receiptFile && (
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                📎 {receiptFile.name}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={submit}
                disabled={saving || !title.trim()}
                className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Add receipt
              </button>
              <button onClick={resetForm} className="rounded-full bg-muted px-3 py-2 text-xs">
                Cancel
              </button>
              <span className="text-[11px] text-muted-foreground">You paid — split it after.</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            No receipts yet — tap “Add receipt” when someone pays for something 🧾
          </p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((expense) => {
              const expShares = sharesByExpense.get(expense.id) ?? [];
              const mine = user ? expShares.find((s) => s.user_id === user.id) : undefined;
              const settledSum = expShares
                .filter((s) => s.settled)
                .reduce((sum, s) => sum + Number(s.amount), 0);
              const pct =
                expense.amount > 0
                  ? Math.min(100, Math.round((settledSum / expense.amount) * 100))
                  : 0;
              const payer = who(expense.paid_by);
              const payerHandles = handles.get(expense.paid_by);
              const canManage =
                !!user &&
                (expense.created_by === user.id || expense.paid_by === user.id || isOrganizer);
              const url = receiptUrl(expense.receipt_path);
              const owesPayer = !!mine && !mine.settled && expense.paid_by !== user?.id;
              const editing = editAmount[expense.id] != null;

              return (
                <li
                  key={expense.id}
                  className="rounded-2xl border border-border/60 bg-card px-3 py-2.5 shadow-soft"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-tight">{expense.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="font-medium">{expense.title}</p>
                        <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          €{fmt(Number(expense.amount))}
                        </span>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-lake hover:underline"
                          >
                            <ImageIcon className="h-3 w-3" /> Receipt
                          </a>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Paid by {payer.emoji} {payer.name}
                        {expense.paid_by === user?.id ? " (you)" : ""}
                      </p>

                      {/* Pay the payer back */}
                      {owesPayer && payerHandles && (payerHandles.paypal || payerHandles.iban) && (
                        <div className="mt-1.5 rounded-xl border border-leaf/30 bg-leaf/5 px-2.5 py-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-leaf">
                            Pay {payer.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap gap-1.5">
                            {payerHandles.paypal && (
                              <button
                                onClick={() => copy("PayPal", payerHandles.paypal!)}
                                className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold shadow-soft"
                              >
                                <Copy className="h-3 w-3" /> PayPal: {payerHandles.paypal}
                              </button>
                            )}
                            {payerHandles.iban && (
                              <button
                                onClick={() => copy("IBAN", payerHandles.iban!)}
                                className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold shadow-soft"
                              >
                                <Copy className="h-3 w-3" /> IBAN: {payerHandles.iban}
                              </button>
                            )}
                          </div>
                          {payerHandles.payment_note && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {payerHandles.payment_note}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Who owes what */}
                      {expShares.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {expShares.map((s) => {
                            const p = who(s.user_id);
                            return (
                              <li
                                key={s.id}
                                className="flex items-center justify-between text-[11px] text-muted-foreground"
                              >
                                <span className="truncate">
                                  {p.emoji} {p.name}
                                  {s.user_id === user?.id ? " (you)" : ""}
                                </span>
                                <span
                                  className={`ml-2 shrink-0 font-semibold ${s.settled ? "text-leaf" : "text-foreground"}`}
                                >
                                  €{fmt(Number(s.amount))} {s.settled ? "· paid ✓" : ""}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Settle progress */}
                      {expense.amount > 0 && expShares.length > 0 && (
                        <div className="mt-1.5">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${pct >= 100 ? "bg-leaf" : "bg-coral"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            €{fmt(settledSum)} of €{fmt(Number(expense.amount))} settled
                            {pct >= 100 ? " · all square 🎉" : ""}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {canManage && (
                          <button
                            onClick={() => doSplit(expense)}
                            disabled={busyId === expense.id}
                            className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold shadow-soft disabled:opacity-50"
                          >
                            {busyId === expense.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Users className="h-3 w-3" />
                            )}
                            Split equally
                          </button>
                        )}

                        {mine ? (
                          <>
                            {editing ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="flex items-center rounded-xl border border-border/60 bg-background px-2">
                                  <span className="text-xs text-muted-foreground">€</span>
                                  <input
                                    autoFocus
                                    value={editAmount[expense.id]}
                                    onChange={(e) =>
                                      setEditAmount((m) => ({ ...m, [expense.id]: e.target.value }))
                                    }
                                    inputMode="decimal"
                                    maxLength={9}
                                    className="w-16 bg-transparent py-1 pl-1 text-xs outline-none"
                                  />
                                </span>
                                <button
                                  onClick={() => saveMyAmount(expense, mine)}
                                  disabled={busyId === expense.id}
                                  className="rounded-full bg-coral px-2 py-1 text-[11px] font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() =>
                                    setEditAmount((m) => {
                                      const next = { ...m };
                                      delete next[expense.id];
                                      return next;
                                    })
                                  }
                                  className="rounded-full bg-muted px-2 py-1 text-[11px]"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  setEditAmount((m) => ({
                                    ...m,
                                    [expense.id]: String(Number(mine.amount)),
                                  }))
                                }
                                className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold shadow-soft"
                              >
                                <Wallet className="h-3 w-3" /> My share €{fmt(Number(mine.amount))}
                              </button>
                            )}
                            <button
                              onClick={() => toggleSettled(expense, mine)}
                              disabled={busyId === expense.id}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-soft transition disabled:opacity-50 ${
                                mine.settled
                                  ? "bg-leaf text-leaf-foreground"
                                  : "bg-background text-foreground"
                              }`}
                            >
                              <Check className="h-3 w-3" />
                              {mine.settled ? "Paid" : "Mark paid"}
                            </button>
                            <button
                              onClick={() => removeMine(expense)}
                              disabled={busyId === expense.id}
                              className="rounded-full px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-destructive disabled:opacity-50"
                            >
                              Remove me
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => claimMine(expense, expShares)}
                            disabled={busyId === expense.id}
                            className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold shadow-soft disabled:opacity-50"
                          >
                            <Wallet className="h-3 w-3" /> Claim my share
                          </button>
                        )}
                      </div>
                    </div>

                    {canManage && (
                      <button
                        onClick={() => removeExpense(expense)}
                        aria-label="Delete receipt"
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-3 text-[11px] text-muted-foreground">
          🧾 Add a receipt, split it equally or set your own share, then settle up — add your PayPal
          / IBAN on your profile so people can pay you back.
        </p>
      </div>
    </Section>
  );
}
