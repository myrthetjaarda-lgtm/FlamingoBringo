import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Chip, Section } from "@/components/AppShell";
import { Loader2, Lock, Globe2, Mail, EyeOff, Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  type GroupRow,
  type GroupPrivacyDB,
  createGroup,
  fetchAllGroups,
  fetchMyGroupIds,
} from "@/lib/groups";
import { toast } from "sonner";

export const Route = createFileRoute("/groups")({
  head: () => ({ meta: [{ title: "Groups · FlamingoBringo" }] }),
  component: GroupsPage,
});

const PRIVACY: { key: GroupPrivacyDB; label: string; emoji: string; description: string }[] = [
  { key: "public", label: "Public", emoji: "🌍", description: "Anyone can find & join" },
  { key: "private", label: "Private", emoji: "🔒", description: "Visible, request to join" },
  { key: "invite", label: "Invite-only", emoji: "✉️", description: "Members invite friends" },
  { key: "hidden", label: "Hidden", emoji: "🫥", description: "Secret — link only" },
];

const FILTERS: { key: "all" | "mine" | GroupPrivacyDB; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mine", label: "My groups" },
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
  { key: "invite", label: "Invite-only" },
  { key: "hidden", label: "Hidden" },
];

const PrivacyIcon = ({ privacy }: { privacy: GroupPrivacyDB }) => {
  const cls = "h-3.5 w-3.5";
  if (privacy === "public") return <Globe2 className={cls} />;
  if (privacy === "private") return <Lock className={cls} />;
  if (privacy === "invite") return <Mail className={cls} />;
  return <EyeOff className={cls} />;
};

function GroupsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "mine" | GroupPrivacyDB>("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, mine] = await Promise.all([
        fetchAllGroups(),
        user ? fetchMyGroupIds(user.id) : Promise.resolve(new Set<string>()),
      ]);
      setGroups(rows);
      setMyIds(mine);
    } catch {
      toast.error("Couldn't load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const visible = useMemo(() => {
    return groups.filter((g) => {
      if (filter === "mine" && !myIds.has(g.id)) return false;
      if (filter !== "all" && filter !== "mine" && g.privacy !== filter) return false;
      if (query && !g.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [groups, myIds, filter, query]);

  return (
    <AppShell>
      <header className="px-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">Your groups</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Private crews, closed circles & festival friends.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 rounded-full bg-coral px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-card">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groups…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      <Section
        title="Groups"
        subtitle={loading ? "Loading…" : `${visible.length} group${visible.length === 1 ? "" : "s"}`}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No groups yet ☀️ — tap <b>New</b> to start one.
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((g) => {
              const meta = PRIVACY.find((p) => p.key === g.privacy)!;
              const mine = myIds.has(g.id);
              return (
                <li key={g.id}>
                  <Link
                    to="/groups/$id"
                    params={{ id: g.id }}
                    className="block rounded-3xl border border-border/60 bg-card p-4 shadow-card transition hover:shadow-float"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-2xl">
                        {g.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-display text-base font-semibold">{g.name}</p>
                          <Chip tone="lake">
                            <PrivacyIcon privacy={g.privacy} />
                            {meta.label}
                          </Chip>
                          {mine && <Chip tone="leaf">member</Chip>}
                        </div>
                        {g.tagline && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{g.tagline}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {creating && (
        <NewGroupSheet
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void load();
          }}
        />
      )}
    </AppShell>
  );
}

function NewGroupSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [privacy, setPrivacy] = useState<GroupPrivacyDB>("private");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🌟");
  const [tagline, setTagline] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      await createGroup({
        owner_id: user.id,
        name: name.trim().slice(0, 60),
        emoji: emoji.trim() || "🌟",
        tagline: tagline.trim() || null,
        privacy,
      });
      toast.success("Group created");
      onCreated();
    } catch {
      toast.error("Couldn't create group");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 px-3 pb-3"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-5 shadow-float"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <h3 className="font-display text-xl font-semibold">New group</h3>
        <p className="text-xs text-muted-foreground">
          Make a private crew for events, lists & shared plans.
        </p>

        <div className="mt-4 flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={4}
            aria-label="Group emoji"
            className="w-14 rounded-2xl border border-border bg-background px-2 py-2.5 text-center text-xl outline-none focus:border-coral"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name (e.g. Lake Crew)"
            maxLength={60}
            className="flex-1 rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-coral"
          />
        </div>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="One-liner (optional)"
          maxLength={120}
          className="mt-2 w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-coral"
        />

        <p className="mt-4 text-xs font-semibold text-muted-foreground">Privacy</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PRIVACY.map((p) => {
            const active = privacy === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPrivacy(p.key)}
                className={`rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-coral bg-coral/10"
                    : "border-border/60 bg-background hover:border-border"
                }`}
              >
                <div className="text-lg">{p.emoji}</div>
                <p className="mt-1 text-sm font-semibold">{p.label}</p>
                <p className="text-[11px] text-muted-foreground">{p.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !name.trim()}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-coral px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
