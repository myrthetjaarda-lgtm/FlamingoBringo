import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Chip, Section } from "@/components/AppShell";
import {
  ArrowLeft,
  Lock,
  Globe2,
  Mail,
  EyeOff,
  UserPlus,
  Crown,
  Calendar,
  MessageCircle,
  Settings,
  ShieldCheck,
  Loader2,
  Trash2,
  LogOut,
  Pencil,
  Check,
  Copy,
  Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  type GroupRow,
  type GroupMemberRow,
  type GroupPrivacyDB,
  deleteGroup,
  fetchGroup,
  fetchGroupMembers,
  joinGroup,
  leaveGroup,
  removeMember,
  updateGroup,
  updateMemberRole,
} from "@/lib/groups";
import { type EventRow, EVENT_TYPES, fetchAllEvents, createEvent } from "@/lib/events";
import { fetchProfiles, type ProfileLite } from "@/lib/events";
import { ChatThread } from "@/components/chat/ChatThread";
import { GroupMemories } from "@/components/group/GroupMemories";
import { toast } from "sonner";

export const Route = createFileRoute("/groups/$id")({
  head: () => ({ meta: [{ title: "Group · FlamingoBringo" }] }),
  component: GroupDetail,
});

type Tab = "feed" | "events" | "memories" | "members" | "settings";

const PRIVACY_LABELS: Record<GroupPrivacyDB, string> = {
  public: "Public",
  private: "Private",
  invite: "Invite-only",
  hidden: "Hidden",
};

function GroupDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupRow | null>(null);
  const [members, setMembers] = useState<GroupMemberRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("feed");

  const load = async () => {
    setLoading(true);
    try {
      const g = await fetchGroup(id);
      if (!g) {
        setNotFound(true);
        return;
      }
      setGroup(g);
      const [mems, evs] = await Promise.all([fetchGroupMembers(id), fetchAllEvents()]);
      setMembers(mems);
      setEvents(evs.filter((e) => e.group_id === id));
      const userIds = Array.from(new Set([g.owner_id, ...mems.map((m) => m.user_id)]));
      setProfiles(await fetchProfiles(userIds));
    } catch {
      toast.error("Couldn't load group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const myMembership = useMemo(
    () => (user ? (members.find((m) => m.user_id === user.id) ?? null) : null),
    [members, user],
  );
  const isMember = !!myMembership;
  const isAdmin = myMembership?.role === "owner" || myMembership?.role === "admin";
  const isOwner = !!user && group?.owner_id === user.id;

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (notFound || !group) {
    return (
      <AppShell>
        <div className="px-6 pt-16 text-center">
          <p className="text-4xl">🫥</p>
          <h2 className="mt-2 font-display text-xl font-semibold">Group not found</h2>
          <Link to="/groups" className="mt-3 inline-block text-sm font-semibold text-coral">
            Back to groups
          </Link>
        </div>
      </AppShell>
    );
  }

  const handleJoin = async () => {
    if (!user) return;
    try {
      await joinGroup(group.id, user.id);
      toast.success(`Joined ${group.name}`);
      void load();
    } catch {
      toast.error("Couldn't join group");
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    if (isOwner) {
      toast.error("Owners can't leave — delete or transfer first");
      return;
    }
    if (!confirm(`Leave ${group.name}?`)) return;
    try {
      await leaveGroup(group.id, user.id);
      toast(`Left ${group.name}`);
      void load();
    } catch {
      toast.error("Couldn't leave group");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete ${group.name}? This can't be undone.`)) return;
    try {
      await deleteGroup(group.id);
      toast.success("Group deleted");
      navigate({ to: "/groups" });
    } catch {
      toast.error("Couldn't delete group");
    }
  };

  const PrivacyIcon =
    group.privacy === "public"
      ? Globe2
      : group.privacy === "private"
        ? Lock
        : group.privacy === "invite"
          ? Mail
          : EyeOff;

  return (
    <AppShell>
      {/* Hero banner */}
      <div className="relative h-40 w-full bg-gradient-to-br from-lake/60 via-lake/30 to-coral/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60" />
        {/* Back */}
        <div className="absolute left-4 top-3">
          <Link
            to="/groups"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        {/* Group emoji centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-7xl drop-shadow-lg">{group.emoji}</span>
        </div>
      </div>

      <header className="px-4 pt-4">
        {/* Name + meta */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">{group.name}</h1>
            {group.tagline && (
              <p className="mt-0.5 text-sm text-muted-foreground">{group.tagline}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Chip tone="lake">
                <PrivacyIcon className="h-3 w-3" /> {PRIVACY_LABELS[group.privacy]}
              </Chip>
              <Chip tone="neutral">👥 {members.length} members</Chip>
              {events.length > 0 && <Chip tone="coral">📅 {events.length} events</Chip>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {!isMember ? (
            <button
              onClick={handleJoin}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-coral px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft"
            >
              <UserPlus className="h-4 w-4" /> Join group
            </button>
          ) : (
            <button
              onClick={() =>
                void navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => toast.success("Invite link copied"))
              }
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-coral px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft"
            >
              <Copy className="h-4 w-4" /> Copy invite link
            </button>
          )}
          {isMember && (
            <button
              onClick={() => setTab("events")}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-2.5 text-xs font-semibold shadow-card"
            >
              <Calendar className="h-4 w-4 text-lake" /> Events
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-4 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {(
            [
              { key: "feed", label: "Chat", icon: MessageCircle },
              { key: "events", label: "Events", icon: Calendar },
              { key: "memories", label: "Memories", icon: Camera },
              { key: "members", label: "Members", icon: ShieldCheck },
              { key: "settings", label: "Settings", icon: Settings },
            ] as { key: Tab; label: string; icon: typeof MessageCircle }[]
          ).map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-coral text-white shadow-soft" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            );
          })}
        </div>
      </header>

      {tab === "feed" &&
        (isMember ? (
          <Section title="Group chat" subtitle="Live thread — everyone in the group">
            <ChatThread
              threadType="group"
              threadId={group.id}
              title={`${group.emoji} ${group.name}`}
              emptyHint="Kick off the group chat 👋"
            />
          </Section>
        ) : (
          <Section title="Group chat">
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-xs text-muted-foreground">
              Join the group to read & send messages.
            </div>
          </Section>
        ))}

      {tab === "events" && (
        <EventsTab
          group={group}
          events={events}
          isMember={isMember}
          onCreated={() => void load()}
        />
      )}

      {tab === "memories" && (
        <GroupMemories groupId={group.id} groupName={group.name} memories={[]} />
      )}

      {tab === "members" && (
        <MembersTab
          group={group}
          members={members}
          profiles={profiles}
          isAdmin={isAdmin}
          isOwner={isOwner}
          currentUserId={user?.id ?? null}
          onChange={() => void load()}
        />
      )}

      {tab === "settings" && (
        <SettingsTab
          group={group}
          isAdmin={isAdmin}
          isOwner={isOwner}
          isMember={isMember}
          onLeave={handleLeave}
          onDelete={handleDelete}
          onSaved={() => void load()}
        />
      )}
    </AppShell>
  );
}

function EventsTab({
  group,
  events,
  isMember,
  onCreated,
}: {
  group: GroupRow;
  events: EventRow[];
  isMember: boolean;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      const ev = await createEvent({
        organizer_id: user.id,
        name: name.trim(),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        location: location.trim() || null,
        event_type: eventType || null,
        group_id: group.id,
      });
      toast.success("Event created");
      setCreating(false);
      setName("");
      setStartsAt("");
      setLocation("");
      setEventType("");
      onCreated();
      navigate({ to: "/event/$id", params: { id: ev.id } });
    } catch {
      toast.error("Couldn't create event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      title="Group events"
      subtitle={`${events.length} in ${group.name}`}
      action={
        isMember && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
          >
            {creating ? "Cancel" : "New event"}
          </button>
        )
      }
    >
      {creating && (
        <div className="mb-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event name"
              maxLength={80}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              maxLength={120}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEventType(eventType === t.value ? "" : t.value)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    eventType === t.value ? "bg-coral text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={submit}
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Create event
            </button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-xs text-muted-foreground">
          No events yet in this group ☀️
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => {
            const d = e.starts_at ? new Date(e.starts_at) : null;
            return (
              <li key={e.id}>
                <Link
                  to="/event/$id"
                  params={{ id: e.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-coral/15 text-xl">
                    📅
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {d
                        ? d.toLocaleString(undefined, {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Date TBD"}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-coral/15 px-3 py-1 text-xs font-semibold text-coral">
                    Open
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function MembersTab({
  group,
  members,
  profiles,
  isAdmin,
  isOwner,
  currentUserId,
  onChange,
}: {
  group: GroupRow;
  members: GroupMemberRow[];
  profiles: Map<string, ProfileLite>;
  isAdmin: boolean;
  isOwner: boolean;
  currentUserId: string | null;
  onChange: () => void;
}) {
  const ordered = [...members].sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2 } as const;
    return order[a.role] - order[b.role];
  });

  const handleRemove = async (m: GroupMemberRow) => {
    if (!confirm("Remove this member?")) return;
    try {
      await removeMember(group.id, m.user_id);
      toast("Member removed");
      onChange();
    } catch {
      toast.error("Couldn't remove member");
    }
  };

  const handlePromote = async (m: GroupMemberRow, role: "admin" | "member") => {
    try {
      await updateMemberRole(m.id, role);
      toast.success(role === "admin" ? "Promoted to admin" : "Set to member");
      onChange();
    } catch {
      toast.error("Couldn't update role");
    }
  };

  return (
    <Section title={`Members (${members.length})`}>
      <ul className="space-y-2">
        {ordered.map((m) => {
          const p = profiles.get(m.user_id);
          const isMe = m.user_id === currentUserId;
          const isMemberOwner = m.user_id === group.owner_id;
          return (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-base">
                {p?.emoji_avatar ?? "🫶"}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold">
                    {p?.display_name ?? "Member"}
                    {isMe && <span className="ml-1 text-[11px] text-leaf">· you</span>}
                  </p>
                  {isMemberOwner && <Crown className="h-3.5 w-3.5 text-sun" />}
                </div>
                <p className="text-[11px] text-muted-foreground capitalize">{m.role}</p>
              </div>
              {isAdmin && !isMemberOwner && !isMe && (
                <div className="flex gap-1">
                  {isOwner &&
                    (m.role === "admin" ? (
                      <button
                        onClick={() => handlePromote(m, "member")}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold"
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePromote(m, "admin")}
                        className="rounded-full bg-lake/15 px-2.5 py-1 text-[11px] font-semibold text-lake"
                      >
                        Promote
                      </button>
                    ))}
                  <button
                    onClick={() => handleRemove(m)}
                    aria-label="Remove"
                    className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function SettingsTab({
  group,
  isAdmin,
  isOwner,
  isMember,
  onLeave,
  onDelete,
  onSaved,
}: {
  group: GroupRow;
  isAdmin: boolean;
  isOwner: boolean;
  isMember: boolean;
  onLeave: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [emoji, setEmoji] = useState(group.emoji);
  const [tagline, setTagline] = useState(group.tagline ?? "");
  const [privacy, setPrivacy] = useState<GroupPrivacyDB>(group.privacy);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateGroup(group.id, {
        name: name.trim().slice(0, 60) || group.name,
        emoji: emoji.trim() || "🌟",
        tagline: tagline.trim() || null,
        privacy,
      });
      toast.success("Group updated");
      setEditing(false);
      onSaved();
    } catch {
      toast.error("Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Section
        title="Group details"
        action={
          isAdmin &&
          (editing ? (
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          ))
        }
      >
        {editing ? (
          <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
            <div className="flex gap-2">
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className="w-14 rounded-xl border border-border/60 bg-background px-2 py-2 text-center text-xl"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
              />
            </div>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={120}
              placeholder="Tagline"
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PRIVACY_LABELS) as GroupPrivacyDB[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrivacy(p)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold ${
                    privacy === p
                      ? "border-coral bg-coral/10 text-coral"
                      : "border-border/60 bg-background text-muted-foreground"
                  }`}
                >
                  {PRIVACY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card p-3 text-sm shadow-card">
            <p>
              <span className="text-muted-foreground">Name: </span>
              <b>
                {group.emoji} {group.name}
              </b>
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">Privacy: </span>
              <b>{PRIVACY_LABELS[group.privacy]}</b>
            </p>
            {group.tagline && (
              <p className="mt-1">
                <span className="text-muted-foreground">Tagline: </span>
                {group.tagline}
              </p>
            )}
          </div>
        )}
      </Section>

      {(isMember || isOwner) && (
        <Section title="Danger zone">
          <div className="space-y-2">
            {isMember && !isOwner && (
              <button
                onClick={onLeave}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm font-semibold"
              >
                <LogOut className="h-4 w-4" /> Leave group
              </button>
            )}
            {isOwner && (
              <button
                onClick={onDelete}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm font-semibold text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete group
              </button>
            )}
          </div>
        </Section>
      )}
    </>
  );
}
