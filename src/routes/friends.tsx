import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/AppShell";
import { Plus, Loader2, Users } from "lucide-react";
import { fetchAllGroups, type GroupRow } from "@/lib/groups";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfiles, type ProfileLite } from "@/lib/events";

export const Route = createFileRoute("/friends")({
  head: () => ({ meta: [{ title: "Friends · FlamingoBringo" }] }),
  component: FriendsPage,
});

type FriendEntry = ProfileLite & { sharedEvents: number };

function FriendsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  useEffect(() => {
    fetchAllGroups()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setGroupsLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setFriendsLoading(false); return; }

    const load = async () => {
      // Get all events the current user has RSVPd to
      const { data: myRsvps } = await supabase
        .from("rsvps")
        .select("event_id")
        .eq("user_id", user.id);

      const myEventIds = (myRsvps ?? []).map((r: { event_id: string }) => r.event_id);
      if (myEventIds.length === 0) { setFriendsLoading(false); return; }

      // Get all other RSVPs on those events
      const { data: otherRsvps } = await supabase
        .from("rsvps")
        .select("user_id, event_id")
        .in("event_id", myEventIds)
        .neq("user_id", user.id);

      if (!otherRsvps || otherRsvps.length === 0) { setFriendsLoading(false); return; }

      // Count shared events per person
      const countMap = new Map<string, number>();
      (otherRsvps as { user_id: string; event_id: string }[]).forEach((r) => {
        countMap.set(r.user_id, (countMap.get(r.user_id) ?? 0) + 1);
      });

      const userIds = Array.from(countMap.keys());
      const profiles = await fetchProfiles(userIds);

      const result: FriendEntry[] = userIds
        .map((id) => {
          const p = profiles.get(id);
          if (!p) return null;
          return { ...p, sharedEvents: countMap.get(id) ?? 1 };
        })
        .filter((f): f is FriendEntry => f !== null)
        .sort((a, b) => b.sharedEvents - a.sharedEvents);

      setFriends(result);
      setFriendsLoading(false);
    };

    void load();
  }, [user]);

  const mine = groups.filter((g) => g.owner_id === user?.id);
  const joined = groups.filter((g) => g.owner_id !== user?.id);
  const loading = groupsLoading;

  return (
    <AppShell>
      <header className="px-4 pt-8 pb-2">
        <h1 className="font-display text-3xl font-semibold">Your people</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Groups & friends — invite a whole crew in one tap.
        </p>
        {(!groupsLoading || !friendsLoading) && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-card text-center">
              <p className="font-display text-2xl font-bold">{groups.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Groups</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-card text-center">
              <p className="font-display text-2xl font-bold">{friends.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Friends</p>
            </div>
          </div>
        )}
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

      <Section
        title="Friends"
        subtitle={
          friendsLoading
            ? "Loading…"
            : friends.length > 0
              ? `${friends.length} people from shared events`
              : "People you've shared events with"
        }
      >
        {friendsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : friends.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lake/10 text-3xl">
              <Users className="h-7 w-7 text-lake" />
            </div>
            <p className="mt-3 font-display text-sm font-semibold">Invite someone to an event</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Share an event link — friends who join will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral/20 to-lake/20 text-xl">
                  {f.emoji_avatar}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">{f.display_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    🎉 {f.sharedEvents} shared event{f.sharedEvents === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Hey ${f.display_name}! 👋 Let's plan something on FlamingoBringo 🦩`
                    );
                    window.open(`https://wa.me/?text=${text}`, "_blank");
                  }}
                  className="shrink-0 rounded-full bg-[#25D366]/15 px-3 py-1.5 text-[11px] font-semibold text-[#128c4a]"
                >
                  💬 Ping
                </button>
              </li>
            ))}
          </ul>
        )}
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
