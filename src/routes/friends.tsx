import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/AppShell";

export const Route = createFileRoute("/friends")({
  head: () => ({ meta: [{ title: "Friends · FlamingoBringo" }] }),
  component: FriendsPage,
});

const groups = [
  { name: "Lake Crew 🏖️", color: "lake" as const, emoji: "🦩" },
  { name: "BBQ Group 🔥", color: "coral" as const, emoji: "🥩" },
  { name: "Family ❤️", color: "sun" as const, emoji: "👨‍👩‍👧‍👦" },
  { name: "Work Friends 💼", color: "leaf" as const, emoji: "☕" },
];

function FriendsPage() {
  return (
    <AppShell>
      <header className="px-4 pt-6">
        <h1 className="font-display text-3xl font-semibold">Your people</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Groups & friends — invite a whole crew in one tap.
        </p>
      </header>

      <Section title="Groups">
        <div className="grid grid-cols-2 gap-3">
          {groups.map((g) => (
            <div key={g.name} className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
              <div className="text-2xl">{g.emoji}</div>
              <p className="mt-2 font-display text-base font-semibold">{g.name}</p>
              <p className="text-[11px] text-muted-foreground">0 members</p>
              <button className="mt-3 w-full rounded-full bg-coral/15 px-3 py-1.5 text-xs font-semibold text-coral">
                Invite group
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Friends" subtitle="People you've added show up here">
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/10 text-3xl">
            🫶
          </div>
          <p className="mt-3 font-display text-sm font-semibold">No friends added yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Invite someone to an event and they'll show up here.
          </p>
        </div>
      </Section>
    </AppShell>
  );
}
