import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Chip, Section } from "@/components/AppShell";
import heroImg from "@/assets/lake-hero.jpg";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Share2,
  Loader2,
  User,
  Users,
  Pencil,
  Mail,
  Check,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  type EventRow,
  type ProfileFull,
  EVENT_TYPES,
  eventTypeEmoji,
  eventTypeLabel,
  fetchEvent,
  fetchProfilesFull,
  fetchRsvps,
  updateEvent,
  deleteEvent,
} from "@/lib/events";
import { SocialLinks } from "@/components/SocialLinks";
import { BringStatusBar } from "@/components/event/BringStatusBar";
import { BringMaster } from "@/components/event/BringMaster";
import { EveryoneBrings } from "@/components/event/EveryoneBrings";
import { RsvpSection } from "@/components/event/RsvpSection";
import { ContributionTable } from "@/components/event/ContributionTable";
import { GiftWishlist } from "@/components/event/GiftWishlist";
import { EventExpenses } from "@/components/event/EventExpenses";
import { FootballScoreboard } from "@/components/event/FootballScoreboard";
import { FindADate } from "@/components/event/FindADate";
import { InviteSheet } from "@/components/event/InviteSheet";
import { TravelMeetup } from "@/components/event/TravelMeetup";
import { Recipes } from "@/components/event/Recipes";
import { AttendeesSheet } from "@/components/event/AttendeesSheet";
import { CalendarExport } from "@/components/event/CalendarExport";
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
  const [comingCount, setComingCount] = useState(1);

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
        const [profiles, rsvps] = await Promise.all([
          fetchProfilesFull([ev.organizer_id]),
          fetchRsvps(ev.id),
        ]);
        if (cancel) return;
        setOrganizer(profiles.get(ev.organizer_id) ?? null);
        setComingCount(Math.max(1, rsvps.filter((r) => r.status === "coming").length));
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
    <>
      <AppShell>
        {/* Hero — event name + date overlaid */}
        <div className="relative h-56 w-full overflow-hidden">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />

          {/* Top bar */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-3">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAttendeesOpen(true)}
                className="flex h-9 items-center gap-1.5 rounded-full bg-black/30 px-3 text-xs font-semibold text-white backdrop-blur-md"
              >
                <Users className="h-3.5 w-3.5" /> People
              </button>
              <button
                onClick={() => setInviteOpen(true)}
                className="flex h-9 items-center gap-1.5 rounded-full bg-coral px-3 text-xs font-semibold text-white shadow-float"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            </div>
          </div>

          {/* Event name + date at bottom of hero */}
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="font-display text-2xl font-semibold leading-tight text-white drop-shadow">
              {event.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-white/85">
              {start && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {dateStr} · {timeStr}
                </span>
              )}
              {event.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {event.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info card — organizer, description, edit */}
        <div className="space-y-3 px-4 pt-3">
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
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg leading-none">{organizer?.emoji_avatar ?? "🦩"}</span>
                  <span>
                    <span className="text-muted-foreground">By </span>
                    <span className="font-semibold">{organizer?.display_name ?? "—"}</span>
                    {isOrganizer && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-leaf/15 px-2 py-0.5 text-[10px] font-semibold text-leaf">
                        you
                      </span>
                    )}
                  </span>
                </div>
                {isOrganizer && (
                  <button
                    onClick={() => setEditingMeta(true)}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                )}
              </div>

              {eventTypeLabel(event.event_type) && (
                <div className="mt-2">
                  <Chip tone="coral">
                    {eventTypeEmoji(event.event_type)} {eventTypeLabel(event.event_type)}
                  </Chip>
                </div>
              )}

              {organizer && (organizer.instagram || organizer.facebook) && (
                <div className="mt-2">
                  <SocialLinks instagram={organizer.instagram} facebook={organizer.facebook} />
                </div>
              )}

              {event.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              )}
            </div>
          )}

          <BringStatusBar eventId={event.id} />
        </div>

        <CalendarExport event={event} />

        {event.event_type === "football" && <FootballScoreboard event={event} />}

        <RsvpSection eventId={event.id} />

        <FindADate eventId={event.id} isOrganizer={isOrganizer} />

        <EveryoneBrings eventId={event.id} />
        <BringMaster eventId={event.id} isOrganizer={isOrganizer} />

        <ContributionTable eventId={event.id} />

        <GiftWishlist eventId={event.id} />

        <EventExpenses eventId={event.id} isOrganizer={isOrganizer} />

        {event.starts_at && <TravelMeetup event={event} />}

        <Recipes attendeeCount={comingCount} />

        <Section title="Conversation" subtitle="Everyone in one live thread">
          <ChatThread
            threadType="event"
            threadId={event.id}
            title="Event chat"
            isOrganizer={isOrganizer}
            emptyHint="Start the convo — say hi, ask who's bringing what 🍉"
          />
        </Section>

        <div className="h-6" />
      </AppShell>

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
    </>
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
  const [eventType, setEventType] = useState(event.event_type ?? "");
  const [homeTeam, setHomeTeam] = useState(event.home_team ?? "");
  const [awayTeam, setAwayTeam] = useState(event.away_team ?? "");
  const [homeScore, setHomeScore] = useState(
    event.home_score != null ? String(event.home_score) : "",
  );
  const [awayScore, setAwayScore] = useState(
    event.away_score != null ? String(event.away_score) : "",
  );
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
      const isFootball = eventType === "football";
      const toScore = (v: string) => {
        const n = parseInt(v, 10);
        return Number.isNaN(n) ? null : n;
      };
      const patch = {
        name: name.trim(),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        location: location.trim() || null,
        description: description.trim() || null,
        event_type: eventType || null,
        home_team: isFootball ? homeTeam.trim().slice(0, 40) || null : null,
        away_team: isFootball ? awayTeam.trim().slice(0, 40) || null : null,
        home_score: isFootball ? toScore(homeScore) : null,
        away_score: isFootball ? toScore(awayScore) : null,
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

        {/* Event type */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Type
          </p>
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
        </div>

        {/* Football match details */}
        {eventType === "football" && (
          <div className="rounded-2xl border border-leaf/30 bg-leaf/5 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-leaf">
              ⚽ Match details
            </p>
            <div className="flex items-center gap-2">
              <input
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="Home team"
                maxLength={40}
                className="min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
              />
              <input
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                placeholder="0"
                inputMode="numeric"
                className="w-12 rounded-xl border border-border/60 bg-background px-2 py-2 text-center text-sm"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="Away team"
                maxLength={40}
                className="min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
              />
              <input
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                placeholder="0"
                inputMode="numeric"
                className="w-12 rounded-xl border border-border/60 bg-background px-2 py-2 text-center text-sm"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Kickoff uses the event date above. Leave scores blank until full-time.
            </p>
          </div>
        )}

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
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
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
