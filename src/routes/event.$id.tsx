import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Chip, Section } from "@/components/AppShell";
import heroImg from "@/assets/lake-hero.jpg";
import {
  ArrowLeft, MapPin, Calendar, Clock, Share2, Loader2, User, Users, Pencil, Mail, Check, Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  type EventRow,
  type ProfileFull,
  fetchEvent,
  fetchProfilesFull,
  updateEvent,
  deleteEvent,
} from "@/lib/events";
import { SocialLinks } from "@/components/SocialLinks";
import { BringStatusBar } from "@/components/event/BringStatusBar";
import { BringMaster } from "@/components/event/BringMaster";
import { EveryoneBrings } from "@/components/event/EveryoneBrings";
import { RsvpSection } from "@/components/event/RsvpSection";
import { ContributionTable } from "@/components/event/ContributionTable";
import { FindADate } from "@/components/event/FindADate";
import { InviteSheet } from "@/components/event/InviteSheet";
import { AttendeesSheet } from "@/components/event/AttendeesSheet";
import { ChatThread } from "@/components/chat/ChatThread";
import { toast } from "sonner";

export const Route = createFileRoute("/event/$id")({
  head: () => ({
    meta: [
      { title: "Event · FlamingoBringo" },
      { name: "description", content: "Plan together, bring together." },
    ],
  }),
  component: EventPage,
});

function EventPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [organizer, setOrganizer] = useState<ProfileFull | null>(null);
  const [organizerEmail, setOrganizerEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [attendeesOpen, setAttendeesOpen] = useState(false);


  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setNotFound(false);
    fetchEvent(id)
      .then(async (ev) => {
        if (cancel) return;
        if (!ev) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setEvent(ev);
        const profiles = await fetchProfilesFull([ev.organizer_id]);
        if (cancel) return;
        setOrganizer(profiles.get(ev.organizer_id) ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancel) {
          setNotFound(true);
          setLoading(false);
        }
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  useEffect(() => {
    if (event && user && event.organizer_id === user.id) {
      setOrganizerEmail(user.email ?? null);
    } else {
      setOrganizerEmail(null);
    }
  }, [event, user]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (notFound || !event) {
    return (
      <AppShell>
        <div className="px-4 pt-10 text-center">
          <p className="text-4xl">🦩</p>
          <h1 className="mt-3 font-display text-xl font-semibold">Event not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This event was deleted or the link is broken.
          </p>
          <div className="mt-5 flex flex-col items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft"
            >
              <ArrowLeft className="h-3 w-3" /> Back home
            </Link>
            <Link to="/groups" className="text-xs font-semibold text-lake">
              Browse my groups
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const isOrganizer = !!user && user.id === event.organizer_id;
  const start = event.starts_at ? new Date(event.starts_at) : null;
  const dateStr = start
    ? start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
    : "Date TBD";
  const timeStr = start
    ? start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "Time TBD";

  return (
    <AppShell>
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden">
        <img src={heroImg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-3">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card/85 shadow-soft backdrop-blur-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAttendeesOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-full bg-card/85 px-4 text-sm font-semibold shadow-soft backdrop-blur-xl"
            >
              <Users className="h-4 w-4" /> People
            </button>
            <button
              onClick={() => setInviteOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-full bg-coral px-4 text-sm font-semibold text-primary-foreground shadow-float"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

        </div>
      </div>

      {/* Card 1 — Event Info */}
      <div className="space-y-3 px-4 pt-4">
        {editingMeta && isOrganizer ? (
          <EditEventCard
            event={event}
            onCancel={() => setEditingMeta(false)}
            onSaved={(next) => {
              setEvent(next);
              setEditingMeta(false);
            }}
            onDeleted={() => {
              toast.success("Event deleted");
              void navigate({ to: "/" });
            }}
          />
        ) : (
          <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-coral">
                  Event info
                </p>
                <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">
                  {event.name}
                </h1>
              </div>
              {isOrganizer && (
                <button
                  onClick={() => setEditingMeta(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-coral" /> <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-coral" /> <span>{timeStr}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-coral" />
                <span>{event.location ?? "Location TBD"}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <User className="h-4 w-4 text-coral" />
                <span>
                  Organized by{" "}
                  <span className="font-semibold">
                    {organizer ? `${organizer.emoji_avatar} ${organizer.display_name}` : "—"}
                  </span>
                  {isOrganizer && <Chip tone="leaf">that's you</Chip>}
                </span>
              </div>
              {organizerEmail && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Mail className="h-4 w-4 text-coral" />
                  <span className="truncate">{organizerEmail}</span>
                </div>
              )}
            </div>

            {organizer && (organizer.instagram || organizer.facebook) && (
              <div className="mt-3">
                <SocialLinks instagram={organizer.instagram} facebook={organizer.facebook} />
              </div>
            )}

            {event.description && (
              <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-muted/40 p-3 text-sm leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
        )}

        {/* Card 2 — Bring Status */}
        <BringStatusBar eventId={event.id} />
      </div>

      <RsvpSection eventId={event.id} />

      <FindADate eventId={event.id} isOrganizer={isOrganizer} />

      <EveryoneBrings eventId={event.id} />
      <BringMaster eventId={event.id} isOrganizer={isOrganizer} />


      <ContributionTable eventId={event.id} />

      <Section title="Conversation" subtitle="Everyone in one live thread">
        <ChatThread
          threadType="event"
          threadId={event.id}
          title="Event chat"
          isOrganizer={isOrganizer}
          emptyHint="Start the convo — say hi, ask who's bringing what 🍉"
        />
      </Section>

      <AttendeesSheet
        open={attendeesOpen}
        onClose={() => setAttendeesOpen(false)}
        eventId={event.id}
      />

      <InviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        eventName={event.name}
        shareUrl={typeof window !== "undefined" ? window.location.href : ""}
        when={start ? `${dateStr} · ${timeStr}` : undefined}
      />
    </AppShell>

  );
}

function EditEventCard({
  event,
  onCancel,
  onSaved,
  onDeleted,
}: {
  event: EventRow;
  onCancel: () => void;
  onSaved: (next: EventRow) => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(event.name);
  const [startsAt, setStartsAt] = useState(
    event.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : "",
  );
  const [location, setLocation] = useState(event.location ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      onDeleted();
    } catch {
      toast.error("Couldn't delete event");
      setDeleting(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const patch = {
        name: name.trim(),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        location: location.trim() || null,
        description: description.trim() || null,
      };
      await updateEvent(event.id, patch);
      onSaved({ ...event, ...patch });
      toast.success("Event updated");
    } catch {
      toast.error("Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-coral">Edit event</p>
      <div className="mt-3 space-y-2">
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
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={remove}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground shadow-soft disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              Confirm delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
            >
              Keep
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
