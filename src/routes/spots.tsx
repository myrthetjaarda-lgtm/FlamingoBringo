import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Chip, Section } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchMyRecommendations,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  type RecommendationRow,
  type RecommendationCategory,
  type RecommendationRegion,
} from "@/lib/spots";
import { SpotsMap } from "@/components/spots/SpotsMap";
import {
  RecommendationForm,
  type RecommendationFormValues,
} from "@/components/spots/RecommendationForm";
import { ShareManagerSheet } from "@/components/spots/ShareManagerSheet";
import { FestivalCalendar } from "@/components/spots/FestivalCalendar";
import { toast } from "sonner";
import {
  Compass,
  Map as MapIcon,
  CalendarDays,
  Plus,
  Star,
  Trash2,
  Pencil,
  Share2,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/spots")({
  head: () => ({
    meta: [
      { title: "Spots · FlamingoBringo" },
      {
        name: "description",
        content: "Your food & activity recommendations across the Netherlands and Berlin.",
      },
    ],
  }),
  component: SpotsPage,
});

type Tab = "list" | "map" | "festivals";

const CATEGORIES: { value: RecommendationCategory | "All"; label: string; emoji: string }[] = [
  { value: "All", label: "All", emoji: "✨" },
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "café", label: "Café", emoji: "☕" },
  { value: "bar", label: "Bar", emoji: "🍸" },
  { value: "activity", label: "Activity", emoji: "🎯" },
  { value: "sight", label: "Sight", emoji: "📸" },
  { value: "other", label: "Other", emoji: "🤷" },
];

function SpotsPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("list");
  const [region, setRegion] = useState<RecommendationRegion | "All">("All");
  const [category, setCategory] = useState<RecommendationCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecommendationRow | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: spots, isLoading } = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: () => fetchMyRecommendations(user!.id),
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (spots ?? []).filter((s) => {
      if (region !== "All" && s.region !== region) return false;
      if (category !== "All" && s.category !== category) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
    });
  }, [spots, region, category, query]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["recommendations", user?.id] });

  const handleCreate = async (values: RecommendationFormValues) => {
    if (!user) return;
    await createRecommendation({
      owner_id: user.id,
      added_by_user_id: user.id,
      added_by: profile?.display_name ?? "Me",
      name: values.name,
      category: values.category,
      region: values.region,
      city: values.city,
      address: values.address,
      notes: values.notes || null,
      rating: values.rating,
      lat: values.lat,
      lng: values.lng,
    });
    await invalidate();
    setFormOpen(false);
    toast.success("Spot added");
  };

  const handleEdit = async (values: RecommendationFormValues) => {
    if (!editing) return;
    await updateRecommendation(editing.id, {
      name: values.name,
      category: values.category,
      region: values.region,
      city: values.city,
      address: values.address,
      notes: values.notes || null,
      rating: values.rating,
      lat: values.lat,
      lng: values.lng,
    });
    await invalidate();
    setEditing(null);
    toast.success("Spot updated");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecommendation(id);
      await invalidate();
      toast.success("Spot removed");
    } catch {
      toast.error("Couldn't remove spot");
    }
  };

  return (
    <>
      <AppShell>
        <header className="px-4 pt-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <Chip tone="coral">Recommendations</Chip>
              <h1 className="mt-2 font-display text-3xl font-semibold">Spots & hotspots</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your food & activity picks across the Netherlands and Berlin.
              </p>
            </div>
            {user && (
              <button
                onClick={() => setShareOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card shadow-card"
                aria-label="Share list"
              >
                <Share2 className="h-4 w-4 text-lake" />
              </button>
            )}
          </div>
        </header>

        <div className="sticky top-0 z-20 mt-5 bg-background/85 px-4 pb-2 pt-2 backdrop-blur-md">
          <div className="flex gap-1 rounded-full border border-border/60 bg-card p-1 shadow-card">
            {(
              [
                { k: "list", label: "List", icon: Compass },
                { k: "map", label: "Map", icon: MapIcon },
                { k: "festivals", label: "Festivals", icon: CalendarDays },
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

        {tab !== "festivals" && (
          <Section
            title={tab === "list" ? "Find a spot" : "Map view"}
            subtitle="Filter by region or category"
          >
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-card">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or city…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-[11px] font-semibold text-muted-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mb-2 flex gap-1.5">
              {(["All", "Netherlands", "Berlin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`flex-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    region === r
                      ? "border-coral bg-coral/15 text-coral"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto pb-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    category === c.value
                      ? "border-coral bg-coral/15 text-coral"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <span className="mr-1">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {tab === "map" ? (
              <SpotsMap
                spots={filtered}
                highlightId={highlightId}
                onSelect={(s) => setHighlightId(s.id)}
              />
            ) : isLoading ? (
              <div className="flex justify-center py-8 text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-4 text-center text-xs text-muted-foreground">
                No spots yet — tap the + button to add your first one.
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((s) => (
                  <SpotRow
                    key={s.id}
                    spot={s}
                    onEdit={() => setEditing(s)}
                    onDelete={() => handleDelete(s.id)}
                  />
                ))}
              </ul>
            )}
          </Section>
        )}

        {tab === "festivals" && (
          <Section
            title="Festival calendar"
            subtitle="Upcoming events across NL & Berlin, refreshed automatically"
          >
            <FestivalCalendar />
          </Section>
        )}
      </AppShell>

      {user && (
        <button
          onClick={() => setFormOpen(true)}
          className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-coral text-white shadow-float"
          aria-label="Add a spot"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {formOpen && (
        <RecommendationForm
          title="Add a spot"
          onCancel={() => setFormOpen(false)}
          onSubmit={handleCreate}
        />
      )}
      {editing && (
        <RecommendationForm
          title="Edit spot"
          initial={editing}
          onCancel={() => setEditing(null)}
          onSubmit={handleEdit}
        />
      )}
      {user && (
        <ShareManagerSheet open={shareOpen} onClose={() => setShareOpen(false)} ownerId={user.id} />
      )}
    </>
  );
}

function SpotRow({
  spot,
  onEdit,
  onDelete,
}: {
  spot: RecommendationRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="rounded-2xl border border-border/60 bg-card p-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold">{spot.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {spot.category} · {spot.city}, {spot.region}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onEdit}
            aria-label="Edit"
            className="rounded-full p-1.5 text-muted-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete"
            className="rounded-full p-1.5 text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {spot.notes && (
        <p className="mt-1.5 line-clamp-2 text-[12px] text-muted-foreground">{spot.notes}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {spot.rating != null && (
          <Chip tone="sun">
            <Star className="h-3 w-3" /> {spot.rating}
          </Chip>
        )}
        <Chip tone="neutral">Added by {spot.added_by}</Chip>
      </div>
    </li>
  );
}
