import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { geocodeAddress } from "@/lib/spots.functions";
import type { RecommendationCategory, RecommendationRegion, RecommendationRow } from "@/lib/spots";

const CATEGORIES: { value: RecommendationCategory; label: string; emoji: string }[] = [
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "café", label: "Café", emoji: "☕" },
  { value: "bar", label: "Bar", emoji: "🍸" },
  { value: "activity", label: "Activity", emoji: "🎯" },
  { value: "sight", label: "Sight", emoji: "📸" },
  { value: "other", label: "Other", emoji: "✨" },
];

const REGIONS: { value: RecommendationRegion; label: string }[] = [
  { value: "Netherlands", label: "Netherlands" },
  { value: "Berlin", label: "Berlin" },
];

export type RecommendationFormValues = {
  name: string;
  category: RecommendationCategory;
  region: RecommendationRegion;
  city: string;
  address: string;
  notes: string;
  rating: number | null;
  lat: number | null;
  lng: number | null;
  added_by: string;
};

export function RecommendationForm({
  initial,
  requireAddedByName = false,
  onCancel,
  onSubmit,
  title = "Add a spot",
}: {
  initial?: Partial<RecommendationRow>;
  requireAddedByName?: boolean;
  onCancel: () => void;
  onSubmit: (values: RecommendationFormValues) => Promise<void>;
  title?: string;
}) {
  const geocode = useServerFn(geocodeAddress);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<RecommendationCategory>(
    initial?.category ?? "restaurant",
  );
  const [region, setRegion] = useState<RecommendationRegion>(initial?.region ?? "Berlin");
  const [city, setCity] = useState(initial?.city ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [addedBy, setAddedBy] = useState(initial?.added_by ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !city.trim() || !address.trim()) return;
    if (requireAddedByName && !addedBy.trim()) return;
    setSaving(true);
    try {
      let lat = initial?.lat ?? null;
      let lng = initial?.lng ?? null;
      const addressChanged = address.trim() !== (initial?.address ?? "");
      if (addressChanged || lat == null || lng == null) {
        const geo = await geocode({ data: { address: address.trim(), city: city.trim(), region } });
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        } else {
          lat = null;
          lng = null;
        }
      }

      await onSubmit({
        name: name.trim(),
        category,
        region,
        city: city.trim(),
        address: address.trim(),
        notes: notes.trim(),
        rating,
        lat,
        lng,
        added_by: addedBy.trim(),
      });

      if (!lat || !lng) {
        toast.message("Saved — couldn't auto-locate that address, you can edit it later.");
      }
    } catch {
      toast.error("Couldn't save this spot");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-background p-4 shadow-float">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            maxLength={100}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          />

          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  category === c.value
                    ? "border-coral bg-coral/15 text-coral"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            {REGIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRegion(r.value)}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  region === r.value
                    ? "border-coral bg-coral/15 text-coral"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            maxLength={80}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
            maxLength={200}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Personal notes (optional)"
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
          />

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(rating === n ? null : n)}
                aria-label={`Rate ${n}`}
              >
                <Star
                  className={`h-5 w-5 ${rating != null && n <= rating ? "fill-sun text-sun" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>

          {requireAddedByName && (
            <input
              value={addedBy}
              onChange={(e) => setAddedBy(e.target.value)}
              placeholder="Your name"
              maxLength={60}
              className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"
            />
          )}

          <button
            onClick={submit}
            disabled={
              saving ||
              !name.trim() ||
              !city.trim() ||
              !address.trim() ||
              (requireAddedByName && !addedBy.trim())
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save spot
          </button>
        </div>
      </div>
    </div>
  );
}
