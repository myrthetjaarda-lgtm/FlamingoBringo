import { supabase } from "@/integrations/supabase/client";

// A shared cost / receipt for an event. One person (paid_by) fronted the money;
// the bill is then split across the group via expense_shares (Splitser style).
export type ExpenseRow = {
  id: string;
  event_id: string;
  created_by: string | null;
  paid_by: string;
  title: string;
  emoji: string;
  amount: number;
  receipt_path: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

// One person's slice of an expense — what they owe and whether they've settled up.
// One row per person per expense.
export type ExpenseShareRow = {
  id: string;
  expense_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  settled: boolean;
  created_at: string;
  updated_at: string;
};

const RECEIPTS_BUCKET = "receipts";

export async function fetchExpenses(eventId: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ExpenseRow[]) ?? [];
}

export async function fetchExpenseShares(eventId: string) {
  const { data, error } = await supabase
    .from("expense_shares")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ExpenseShareRow[]) ?? [];
}

export async function addExpense(input: {
  event_id: string;
  created_by: string;
  paid_by: string;
  title: string;
  emoji?: string;
  amount: number;
  receipt_path?: string | null;
  note?: string | null;
}) {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      event_id: input.event_id,
      created_by: input.created_by,
      paid_by: input.paid_by,
      title: input.title,
      emoji: input.emoji ?? "🧾",
      amount: Math.max(0, input.amount),
      receipt_path: input.receipt_path ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ExpenseRow;
}

export async function updateExpense(
  id: string,
  patch: Partial<
    Pick<ExpenseRow, "title" | "emoji" | "amount" | "paid_by" | "receipt_path" | "note">
  >,
) {
  const { error } = await supabase.from("expenses").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

// Add or update one person's share of an expense (one row per person per expense).
export async function upsertExpenseShare(input: {
  expense_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  settled: boolean;
}) {
  const { error } = await supabase.from("expense_shares").upsert(
    {
      expense_id: input.expense_id,
      event_id: input.event_id,
      user_id: input.user_id,
      amount: Math.max(0, input.amount),
      settled: input.settled,
    },
    { onConflict: "expense_id,user_id" },
  );
  if (error) throw error;
}

export async function removeExpenseShare(expenseId: string, userId: string) {
  const { error } = await supabase
    .from("expense_shares")
    .delete()
    .eq("expense_id", expenseId)
    .eq("user_id", userId);
  if (error) throw error;
}

// Replace all shares for an expense with an even split across the given users.
// Used when the payer taps "Split equally".
export async function splitExpenseEqually(
  expense: ExpenseRow,
  userIds: string[],
  existing: ExpenseShareRow[],
) {
  if (userIds.length === 0) return;
  const per = Math.round((expense.amount / userIds.length) * 100) / 100;
  // Put any rounding remainder on the first share so the slices sum to the total.
  const remainder = Math.round((expense.amount - per * userIds.length) * 100) / 100;
  const settledByUser = new Map(existing.map((s) => [s.user_id, s.settled]));

  const rows = userIds.map((uid, i) => ({
    expense_id: expense.id,
    event_id: expense.event_id,
    user_id: uid,
    amount: i === 0 ? Math.round((per + remainder) * 100) / 100 : per,
    // Keep someone's "settled" flag if they already had one; the payer is settled by default.
    settled: uid === expense.paid_by ? true : (settledByUser.get(uid) ?? false),
  }));

  const { error } = await supabase
    .from("expense_shares")
    .upsert(rows, { onConflict: "expense_id,user_id" });
  if (error) throw error;
}

// ---------------- Receipt uploads (Supabase Storage) ----------------

export async function uploadReceipt(file: File, eventId: string, userId: string) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${eventId}/${userId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

export function receiptUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from(RECEIPTS_BUCKET).getPublicUrl(path).data.publicUrl;
}
