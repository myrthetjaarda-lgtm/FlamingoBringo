import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin, Star, Plus, Compass, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";
import { getSharedRecommendations } from "@/lib/spots.functions";
import {
  createSharedRecommendation,
  type RecommendationCategory,
  type RecommendationRegion,
} from "@/lib/spots";
import {
  RecommendationForm,
  type RecommendationFormValues,
} from "@/components/spots/RecommendationForm";
import { SpotsMap } from "@/components/spots/SpotsMap";
import { Chip } from "@/components/AppShell";

export const Route = createFileRoute("/share/$token")({
  head: () => ({
    meta: [
      { title: "Shared spots · FlamingoBringo" },
      {
        name: "description",
        content: "Food & activity recommendations, shared via FlamingoBringo.",
      },
    ],
  }),
  component: SharePage,
});

type Tab = "list" | "map";

function SharePage() {
  const { token } = Route.useParams();
  const fetchShared = useServerFn(getSharedRecommendations);
  const [tab, setTab] = useState<Tab>("list");
  const [formOpen, setFormOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["shared-recommendations", token],
    queryFn: () => fetchShared({ data: { token } }),
  });

  const spots = useMemo(() => data?.recommendations ?? [], [data]);

  const handleAdd = async (values: RecommendationFormValues) => {
    if (!data?.share) return;
    await createSharedRecommendation({
      owner_id: data.share.ownerId,
      share_id: data.share.id,
      name: values.name,
      category: values.category as RecommendationCategory,
      region: values.region as RecommendationRegion,
      city: values.city,
      address: values.address,
      notes: values.notes || null,
      rating: values.rating,
      lat: values.lat,
      lng: values.lng,
      added_by: values.added_by,
    });
    await refetch();
    setFormOpen(false);
    toast.success("Added to the list!");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-warm">
        <Loader2 className="h-6 w-6 animate-spin text-coral" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-warm px-4 text-center">
        <div>
          <p className="text-3xl">🦩</p>
          <h1 className="mt-2 font-display text-xl font-semibold">This link isn't available</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been revoked, or the URL is incomplete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-warm">
      <div className="mx-auto min-h-dvh max-w-md bg-background/40 pb-24">
        <header className="px-4 pt-8">
          <Chip tone="coral">Shared with you 🦩</Chip>
          <h1 className="mt-2 font-display text-3xl font-semibold">{data.share.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Food & activity spots across the Netherlands and Berlin. Add your own below — no account
            needed.
          </p>
        </header>

        <div className="sticky top-0 z-20 mt-5 bg-background/85 px-4 pb-2 pt-2 backdrop-blur-md">
          <div className="flex gap-1 rounded-full border border-border/60 bg-card p-1 shadow-card">
            {(
              [
                { k: "list", label: "List", icon: Compass },
                { k: "map", label: "Map", icon: MapIcon },
              ] as { k: Tab; label: string; icon: typeof Compass }[]
            ).map((t) => {
              const active = tab === t.k;
              const Icon = t.icon;
              return (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-semibold transition ${
                    active ? "bg-coral text-white shadow-card" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <section className="px-4 pt-4">
          {spots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-4 text-center text-xs text-muted-foreground">
              Nothing here yet — be the first to add a spot!
            </div>
          ) : tab === "map" ? (
            <SpotsMap
              spots={spots}
              highlightId={highlightId}
              onSelect={(s) => setHighlightId(s.id)}
            />
          ) : (
            <ul className="space-y-2">
              {spots.map((s) => (
                <li
                  key={s.id}
                  className="rounded-2xl border border-border/60 bg-card p-3 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold">{s.name}</p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {s.category} · {s.city}, {s.region}
                      </p>
                    </div>
                    {s.rating != null && (
                      <Chip tone="sun">
                        <Star className="h-3 w-3" /> {s.rating}
                      </Chip>
                    )}
                  </div>
                  {s.notes && (
                    <p className="mt-1.5 line-clamp-2 text-[12px] text-muted-foreground">
                      {s.notes}
                    </p>
                  )}
                  <p className="mt-2 text-[10px] font-semibold text-muted-foreground">
                    Added by {s.added_by}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-6 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-coral text-white shadow-float"
        aria-label="Add a spot"
      >
        <Plus className="h-5 w-5" />
      </button>

      {formOpen && (
        <RecommendationForm
          title="Add your recommendation"
          requireAddedByName
          onCancel={() => setFormOpen(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}
