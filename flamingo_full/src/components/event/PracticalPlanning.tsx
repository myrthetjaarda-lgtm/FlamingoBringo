import { useState } from "react";
import { Section, Chip } from "@/components/AppShell";
import {
  Moon, ShieldAlert, Sparkles, MapPin, Baby, Dog, CheckCircle2, AlertTriangle,
} from "lucide-react";

/* -------------------- shared types & UI -------------------- */

type Status = "ok" | "needs-charging" | "needs-cleaning" | "damaged" | "unavailable";
const STATUS_META: Record<Status, { label: string; tone: "leaf" | "sun" | "coral" | "neutral" }> = {
  "ok": { label: "Ready", tone: "leaf" },
  "needs-charging": { label: "Needs charging", tone: "sun" },
  "needs-cleaning": { label: "Needs cleaning", tone: "sun" },
  "damaged": { label: "Damaged", tone: "coral" },
  "unavailable": { label: "Unavailable", tone: "neutral" },
};

function Row({
  emoji, label, sub, right, claimed,
}: {
  emoji: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  claimed?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border p-3 shadow-card ${
        claimed ? "border-leaf/30 bg-leaf/5" : "border-border/60 bg-card"
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-lg">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{label}</p>
        {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </li>
  );
}

function ClaimBtn({ claimed, onClick }: { claimed?: boolean; onClick?: () => void }) {
  return claimed ? (
    <CheckCircle2 className="h-5 w-5 text-leaf" />
  ) : (
    <button
      onClick={onClick}
      className="rounded-full bg-coral/15 px-3 py-1.5 text-xs font-semibold text-coral"
    >
      I'll bring
    </button>
  );
}

/* -------------------- Smart missing-item detector -------------------- */

const SUGGESTIONS = {
  lake: ["🧴 Sunscreen", "🩴 Swimming shoes", "🪣 Parasol", "💧 Water bottles", "🏖️ Towel"],
  bbq: ["⚫ Charcoal", "🥢 Tongs", "🗑️ Trash bags", "💧 Water for cleanup", "🔥 Lighter", "🪙 Aluminum foil"],
  evening: ["✨ Fairy lights", "🔦 Headlamp", "🔋 Power bank", "🧥 Jacket", "🔊 Speaker"],
  rain: ["☂️ Umbrellas", "🌧️ Rain poncho", "🟦 Waterproof blanket", "🅿️ Plan B venue"],
} as const;

export function SmartMissingDetector({
  tags = ["lake", "bbq", "evening"] as (keyof typeof SUGGESTIONS)[],
  haveTags = ["🩴 Swimming shoes", "💧 Water bottles", "🥢 Tongs"],
}: { tags?: (keyof typeof SUGGESTIONS)[]; haveTags?: string[] }) {
  const labels: Record<string, string> = {
    lake: "Lake day", bbq: "BBQ", evening: "Evening", rain: "Rain risk",
  };
  return (
    <Section
      title="Smart missing detector"
      subtitle="AI checks essentials for this event type"
      action={<Chip tone="coral"><Sparkles className="h-3 w-3" /> AI</Chip>}
    >
      <div className="space-y-3">
        {tags.map((t) => {
          const missing = SUGGESTIONS[t].filter((s) => !haveTags.includes(s));
          return (
            <div key={t} className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{labels[t]}</p>
                <Chip tone={missing.length ? "coral" : "leaf"}>
                  {missing.length ? `${missing.length} missing` : "All set"}
                </Chip>
              </div>
              {missing.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {missing.map((m) => (
                    <button
                      key={m}
                      className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold hover:border-coral hover:text-coral"
                    >
                      + {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* -------------------- Light & Evening Setup -------------------- */

export function LightEveningSetup() {
  const sunset = "21:15";
  const items = [
    { emoji: "✨", name: "Fairy lights", claimedBy: "Inês" },
    { emoji: "🔆", name: "Solar lights", claimedBy: null },
    { emoji: "🏮", name: "Lanterns", claimedBy: null },
    { emoji: "🔦", name: "Headlamps", claimedBy: "Tom" },
    { emoji: "🔋", name: "Power banks", claimedBy: null },
    { emoji: "🕯️", name: "Candles (where allowed)", claimedBy: null },
    { emoji: "🔊", name: "Speaker — battery 64%", claimedBy: "Myrthe" },
  ];
  return (
    <Section title="Light & evening setup" subtitle="For when the sun checks out">
      <div className="mb-3 flex items-start gap-3 rounded-3xl border border-sun/40 bg-sun/15 p-3">
        <Moon className="mt-0.5 h-5 w-5 text-sun-foreground" />
        <div className="text-sm">
          <p className="font-semibold">Sunset at {sunset} 🌇</p>
          <p className="text-xs text-muted-foreground">
            Consider lights, jackets and a charged speaker — it gets chilly by 22:00.
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((i) => (
          <Row
            key={i.name}
            emoji={i.emoji}
            label={i.name}
            sub={i.claimedBy ? `Brought by ${i.claimedBy}` : "Nobody yet"}
            claimed={!!i.claimedBy}
            right={<ClaimBtn claimed={!!i.claimedBy} />}
          />
        ))}
      </ul>
    </Section>
  );
}

/* -------------------- Safety & Comfort -------------------- */

export function SafetyComfort() {
  const items = [
    { emoji: "🩹", name: "First aid kit", claimedBy: "Chandrima" },
    { emoji: "🧴", name: "Sunscreen", claimedBy: "Myrthe" },
    { emoji: "🌿", name: "After-sun lotion", claimedBy: null },
    { emoji: "🦟", name: "Mosquito spray", claimedBy: null },
    { emoji: "🧼", name: "Hand sanitizer", claimedBy: null },
    { emoji: "🧻", name: "Wet wipes & tissues", claimedBy: null },
    { emoji: "🟧", name: "Picnic blanket", claimedBy: "Tom" },
    { emoji: "🧥", name: "Extra hoodie / jacket", claimedBy: null },
    { emoji: "🌧️", name: "Rain poncho", claimedBy: null },
    { emoji: "⛱️", name: "Parasol / shade", claimedBy: null },
    { emoji: "💧", name: "Reusable water bottles", claimedBy: "Hilda" },
  ];
  return (
    <Section title="Safety & comfort" subtitle="Small things that save the day">
      <div className="mb-3 flex items-start gap-3 rounded-3xl border border-coral/30 bg-coral/5 p-3 text-sm">
        <ShieldAlert className="mt-0.5 h-5 w-5 text-coral" />
        <div>
          <p className="font-semibold">Allergy heads-up</p>
          <p className="text-xs text-muted-foreground">
            Ana — nuts 🥜 · Emma — lactose 🥛 · Keep separate bowls.
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((i) => (
          <Row
            key={i.name}
            emoji={i.emoji}
            label={i.name}
            sub={i.claimedBy ? `Bringing: ${i.claimedBy}` : "Open"}
            claimed={!!i.claimedBy}
            right={<ClaimBtn claimed={!!i.claimedBy} />}
          />
        ))}
      </ul>
    </Section>
  );
}

/* -------------------- Cleanup & Sustainability -------------------- */

export function CleanupSustainability() {
  const items = [
    { emoji: "🗑️", name: "Trash bags", claimedBy: null },
    { emoji: "♻️", name: "Recycling bags", claimedBy: null },
    { emoji: "🍾", name: "Bottle-deposit bag (Pfand)", claimedBy: "Miguel" },
    { emoji: "🧻", name: "Paper towels", claimedBy: null },
    { emoji: "🥤", name: "Reusable cups", claimedBy: "Inês" },
    { emoji: "🍽️", name: "Reusable plates", claimedBy: null },
    { emoji: "🍴", name: "Reusable cutlery", claimedBy: null },
    { emoji: "🪣", name: "Ash / grill cleanup kit", claimedBy: null },
  ];
  const noneClaimed = items.every((i) => !i.claimedBy);
  return (
    <Section title="Cleanup & sustainability" subtitle="Leave no trace 🌱">
      {noneClaimed && (
        <div className="mb-3 flex items-start gap-3 rounded-3xl border border-coral/30 bg-coral/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-coral" />
          <p><b>No cleanup items added yet</b> — please claim at least trash & recycling bags.</p>
        </div>
      )}
      <ul className="space-y-2">
        {items.map((i) => (
          <Row
            key={i.name}
            emoji={i.emoji}
            label={i.name}
            sub={i.claimedBy ? `Bringing: ${i.claimedBy}` : "Unclaimed"}
            claimed={!!i.claimedBy}
            right={<ClaimBtn claimed={!!i.claimedBy} />}
          />
        ))}
      </ul>

      <div className="mt-4 rounded-2xl border border-leaf/30 bg-leaf/5 p-3">
        <p className="text-sm font-semibold text-leaf">Leave-no-trace checklist</p>
        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
          {["All trash bagged", "Pfand bottles collected", "Coals fully extinguished & disposed", "Area swept of small litter"].map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded border border-leaf/50" /> {s}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* -------------------- BBQ & Fire Rules -------------------- */

export function BBQFireRules() {
  return (
    <Section title="BBQ & fire safety" subtitle="Grill smart, stay safe">
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-2xl border border-leaf/30 bg-leaf/5 p-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-leaf" />
          <div className="text-sm">
            <p className="font-semibold">BBQ allowed here</p>
            <p className="text-xs text-muted-foreground">
              Weissensee — grilling allowed in designated zones only. No open fires on grass.
            </p>
          </div>
        </div>
        {[
          { e: "🔥", t: "Keep a safe distance from dry grass", s: "Use the metal pads." },
          { e: "🧯", t: "Bring water for extinguishing", s: "Min. 5L next to the grill." },
          { e: "⏱️", t: "Grill cooling time", s: "Let coals cool ~60 minutes after last use." },
          { e: "🪣", t: "Coal disposal", s: "Use the marked metal bins — never the regular trash." },
        ].map((r) => (
          <div key={r.t} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
            <span className="text-xl">{r.e}</span>
            <div className="text-sm">
              <p className="font-semibold">{r.t}</p>
              <p className="text-xs text-muted-foreground">{r.s}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* -------------------- Equipment Status (Nigel, Timmy…) -------------------- */

export function EquipmentStatus() {
  const gear: { emoji: string; name: string; holder: string; status: Status; last: string }[] = [
    { emoji: "🦩", name: "Nigel the flamingo", holder: "Miguel", status: "ok", last: "Müggelsee, 12 May" },
    { emoji: "🛒", name: "Timmy the Bollerwagen", holder: "Inês", status: "needs-cleaning", last: "Tempelhofer Feld, 19 May" },
    { emoji: "🔊", name: "Big speaker", holder: "Myrthe", status: "needs-charging", last: "Weissensee, 5 May" },
    { emoji: "⛱️", name: "Beach parasol", holder: "Tom", status: "damaged", last: "Wannsee, 28 Apr" },
    { emoji: "🧊", name: "Cooler box", holder: "Chandrima", status: "ok", last: "Müggelsee, 12 May" },
  ];
  return (
    <Section title="Crew equipment status" subtitle="Who has what & is it ready?">
      <ul className="space-y-2">
        {gear.map((g) => {
          const s = STATUS_META[g.status];
          return (
            <li key={g.name} className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-xl">{g.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{g.name}</p>
                  <p className="text-[11px] text-muted-foreground">With <b>{g.holder}</b> · last used {g.last}</p>
                </div>
                <Chip tone={s.tone}>{s.label}</Chip>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Available?", "Charged?", "Clean?", "Undamaged?"].map((q) => (
                  <button key={q} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                    {q}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* -------------------- Location rules -------------------- */

export function LocationRules() {
  const rules = [
    { e: "🏊", label: "Swimming", value: "Allowed" },
    { e: "🔥", label: "BBQ", value: "Designated zones" },
    { e: "🐶", label: "Dogs", value: "On leash" },
    { e: "🚻", label: "Toilets", value: "200m east" },
    { e: "🛒", label: "Shops nearby", value: "REWE · 600m" },
    { e: "🚊", label: "Public transport", value: "Tram M12" },
    { e: "🕛", label: "Last tram", value: "00:42" },
    { e: "🔇", label: "Quiet hours", value: "after 22:00" },
    { e: "🍺", label: "Alcohol", value: "OK · no glass" },
  ];
  return (
    <Section title="Location rules & notes" subtitle="Falkenbergerstr. · Weissensee">
      <div className="grid grid-cols-2 gap-2">
        {rules.map((r) => (
          <div key={r.label} className="flex items-start gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
            <span className="text-lg">{r.e}</span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.label}</p>
              <p className="truncate text-sm font-semibold">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-3 inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
        <MapPin className="h-3.5 w-3.5" /> Edit location info
      </button>
    </Section>
  );
}

/* -------------------- Kids & Pets -------------------- */

export function KidsPets() {
  const [kids, setKids] = useState(true);
  const [dogs, setDogs] = useState(false);
  return (
    <Section title="Kids & pets" subtitle="Optional — keeps the crew prepared">
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
          <Baby className="h-5 w-5 text-coral" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Bringing kids?</p>
            <p className="text-[11px] text-muted-foreground">
              {kids ? "Yes — child-friendly items added to bring list" : "No"}
            </p>
          </div>
          <button
            onClick={() => setKids((v) => !v)}
            className={`h-6 w-10 rounded-full transition ${kids ? "bg-coral" : "bg-muted"}`}
            aria-pressed={kids}
          >
            <span className={`block h-5 w-5 rounded-full bg-card shadow transition ${kids ? "translate-x-[18px]" : "translate-x-0.5"}`} />
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
          <Dog className="h-5 w-5 text-leaf" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Bringing dogs / pets?</p>
            <p className="text-[11px] text-muted-foreground">Pets allowed on leash at this location.</p>
          </div>
          <button
            onClick={() => setDogs((v) => !v)}
            className={`h-6 w-10 rounded-full transition ${dogs ? "bg-leaf" : "bg-muted"}`}
            aria-pressed={dogs}
          >
            <span className={`block h-5 w-5 rounded-full bg-card shadow transition ${dogs ? "translate-x-[18px]" : "translate-x-0.5"}`} />
          </button>
        </div>

        {(kids || dogs) && (
          <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested extras</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {kids && ["🧒 Kids snacks", "🩴 Float toys", "🩹 Plasters"].map((x) => (
                <Chip key={x} tone="coral">{x}</Chip>
              ))}
              {dogs && ["🥣 Pet water bowl", "💩 Poop bags", "🦴 Treats"].map((x) => (
                <Chip key={x} tone="leaf">{x}</Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* -------------------- Emergency & Organizer Tools -------------------- */

export function EmergencyTools() {
  return (
    <Section title="Live event tools" subtitle="On the day — one tap">
      <div className="grid grid-cols-2 gap-2">
        {[
          { e: "📞", l: "Contact organizer", tone: "coral" as const },
          { e: "🆘", l: "Emergency contact", tone: "coral" as const },
          { e: "🏃", l: "I'm late", tone: "sun" as const },
          { e: "📍", l: "I arrived", tone: "leaf" as const },
          { e: "🛍️", l: "Help carrying stuff", tone: "lake" as const },
          { e: "👜", l: "Lost & found", tone: "neutral" as const },
        ].map((b) => (
          <button
            key={b.l}
            className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 text-left shadow-card hover:shadow-float"
          >
            <span className="text-xl">{b.e}</span>
            <span className="text-sm font-semibold">{b.l}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-coral/30 bg-coral/5 p-3 text-xs">
        <p className="font-semibold text-coral">Emergency contact on file</p>
        <p className="text-muted-foreground">Miguel · +49 ••• ••• 412 (revealed when you tap 🆘)</p>
      </div>
    </Section>
  );
}

/* -------------------- Post-event cleanup -------------------- */

export function PostEventCleanup() {
  const tookHome = [
    { who: "Miguel", what: "🦩 Nigel · 🧊 Cooler" },
    { who: "Inês", what: "🛒 Timmy · 🥤 Cups" },
    { who: "Myrthe", what: "🥗 Leftover pasta salad" },
    { who: "Tom", what: "🌽 Leftover corn · ⛱️ Parasol (broken)" },
  ];
  const lost = [{ what: "Blue sunglasses", who: "found by Chandrima" }];

  return (
    <Section title="After the event" subtitle="Wrap-up & shared items">
      <div className="rounded-2xl border border-leaf/30 bg-leaf/5 p-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-leaf" />
          <p className="text-sm font-semibold text-leaf">Cleanup completed — leave-no-trace 🌱</p>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Confirmed by Miguel · 22:48</p>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Who took what home</p>
      <ul className="mt-2 space-y-2">
        {tookHome.map((t) => (
          <Row key={t.who} emoji="📦" label={t.who} sub={t.what} right={<Chip tone="neutral">claimed</Chip>} />
        ))}
      </ul>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lost & found</p>
      <ul className="mt-2 space-y-2">
        {lost.map((l) => (
          <Row key={l.what} emoji="🔎" label={l.what} sub={l.who} right={
            <button className="rounded-full bg-coral/15 px-3 py-1.5 text-xs font-semibold text-coral">Claim</button>
          } />
        ))}
      </ul>
    </Section>
  );
}

/* -------------------- Bundle export -------------------- */

export function PracticalPlanning() {
  return (
    <>
      <SmartMissingDetector />
      <LightEveningSetup />
      <SafetyComfort />
      <CleanupSustainability />
      <BBQFireRules />
      <EquipmentStatus />
      <LocationRules />
      <KidsPets />
      <EmergencyTools />
      <PostEventCleanup />
    </>
  );
}
