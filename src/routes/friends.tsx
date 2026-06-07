import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/AppShell";
import { Plus, Loader2, Users } from "lucide-react";
import { fetchAllGroups, type GroupRow } from "@/lib/groups";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/friends")({
  head: () => ({ meta: [{ title: "Friends · FlamingoBringo" }] }),
  component: FriendsPage,
});

function FriendsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllGroups()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const mine = groups.filter((g) => g.owner_id === user?.id);
  const joined = groups.filter((g) => g.owner_id !== user?.id);

  return (
    <AppShell>
      <header className="px-4 pt-6">
        <h1 className="font-display text-3xl font-semibold">Your people</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Groups & friends — invite a whole crew in one tap.
        </p>
      </header>

      <Section
        title="Groups"
        subtitle={loading ? "Loading…" : `${groups.length} group${groups.length === 1 ? "" : "s"}`}
        action={
          <Link
            to="/groups"
            className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-white shadow-soft"
          >
            <Plus className="h-3 w-3" /> New group
          </Link>
        }
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral/10 text-3xl">
              🦩
            </div>
            <p className="mt-3 font-display text-sm font-semibold">No groups yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Create a group to invite your crew to events in one tap.
            </p>
            <Link
              to="/groups"
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white shadow-soft"
            >
              <Plus className="h-3 w-3" /> Create first group
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mine.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  You manage
                </p>
                <GroupGrid groups={mine} />
              </div>
            )}
            {joined.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Member of
                </p>
                <GroupGrid groups={joined} />
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title="Friends" subtitle="People you've shared events with">
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lake/10 text-3xl">
            <Users className="h-7 w-7 text-lake" />
          </div>
          <p className="mt-3 font-display text-sm font-semibold">Invite someone to an event</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Share an event link — friends who join will appear here.
          </p>
        </div>
      </Section>
    </AppShell>
  );
}

function GroupGrid({ groups }: { groups: GroupRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {groups.map((g) => (
        <Link
          key={g.id}
          to="/groups/$id"
          params={{ id: g.id }}
          className="rounded-3xl border border-border/60 bg-card p-4 shadow-card transition hover:border-coral/50"
        >
          <div className="text-2xl">{g.emoji}</div>
          <p className="mt-2 font-display text-base font-semibold leading-tight">{g.name}</p>
          {g.tagline && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{g.tagline}</p>
          )}
          <p className="mt-2 text-[10px] font-semibold text-coral">Open group →</p>
        </Link>
      ))}
    </div>
  );
}
