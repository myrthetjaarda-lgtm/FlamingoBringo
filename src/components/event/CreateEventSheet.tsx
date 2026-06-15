import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createEvent, EVENT_TYPES } from "@/lib/events";
import { fetchAllGroups, fetchMyGroupIds, type GroupRow } from "@/lib/groups";
import { toast } from "sonner";

export function CreateEventSheet({
  onClose,
  defaultName = "",
  defaultLocation = "",
}: {
  onClose: () => void;
  defaultName?: string;
  defaultLocation?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(defaultName);
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState(defaultLocation);
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("");
  const [groupId, setGroupId] = useState<string | "">("");
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void Promise.all([fetchAllGroups(), fetchMyGroupIds(user.id)]).then(([all, mine]) => {
      setGroups(all.filter((g) => mine.has(g.id)));
    });
  }, [user]);

  const submit = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      const ev = await createEvent({
        organizer_id: user.id,
        name: name.trim(),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        location: location.trim() || null,
        description: description.trim() || null,
        event_type: eventType || null,
        group_id: groupId || null,
      });
      toast.success("Event created");
      onClose();
      navigate({ to: "/event/$id", params: { id: ev.id } });
    } catch {
      toast.error("Couldn't create event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-background p-4 shadow-float">
        <h3 className="font-display text-lg font-semibold">Create an event</h3>
        <p className="mt-1 text-xs text-muted-foreground">You'll be the organizer.</p>
        <div className="mt-3 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Event name"
            maxLength={80}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            maxLength={120}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          />
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Type (optional)
            </label>
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
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Group (optional)
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
            >
              <option value="">No group — public event</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.emoji} {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full bg-muted px-4 py-2 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-1 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
