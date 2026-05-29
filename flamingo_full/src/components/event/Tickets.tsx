import { Plus, Check, Clock } from "lucide-react";
import { tickets, attendees } from "@/data/sample";
import { Section } from "@/components/AppShell";

export function Tickets() {
  const peopleCount = attendees.filter((a) => a.rsvp === "coming").length;
  const total = tickets.reduce(
    (sum, t) => sum + (t.perPerson ? t.amount * peopleCount : t.amount),
    0,
  );
  const perPerson = total / peopleCount;
  const paidTotal = tickets
    .filter((t) => t.status === "paid")
    .reduce((s, t) => s + (t.perPerson ? t.amount * peopleCount : t.amount), 0);

  return (
    <Section
      title="Tickets & entrance fees"
      subtitle="Boats, parking, entry — all in one place"
      action={
        <button className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft">
          <Plus className="h-3.5 w-3.5" /> Add fee
        </button>
      }
    >
      <div className="rounded-3xl border border-border/60 bg-gradient-sunset p-4 text-primary-foreground shadow-float">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs opacity-85">Total event cost</p>
            <p className="font-display text-3xl font-semibold">€{total.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-85">Per person</p>
            <p className="font-display text-xl font-semibold">€{perPerson.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
          <div className="h-full bg-white" style={{ width: `${(paidTotal / total) * 100}%` }} />
        </div>
        <p className="mt-2 text-xs opacity-90">
          €{paidTotal.toFixed(2)} paid · €{(total - paidTotal).toFixed(2)} pending
        </p>
      </div>

      <ul className="mt-3 space-y-2">
        {tickets.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-lg">{t.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.perPerson && (
                  <span className="rounded-full bg-lake/15 px-1.5 py-0.5 text-[10px] font-semibold text-lake">per person</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t.paidBy ? <>Paid by <b>{t.paidBy}</b> · split {t.splitCount} ways</> : `Awaiting payer · split ${t.splitCount} ways`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-sm font-semibold">{t.currency}{t.amount.toFixed(2)}</p>
              {t.status === "paid" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-leaf">
                  <Check className="h-3 w-3" /> paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-coral">
                  <Clock className="h-3 w-3" /> pending
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
