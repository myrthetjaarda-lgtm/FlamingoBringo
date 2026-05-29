import { useMemo, useState } from "react";
import {
  Heart, ExternalLink, ThumbsUp, Clock, ChefHat, Plus, Sparkles, ShoppingBasket, Check,
} from "lucide-react";
import { Section, Chip } from "@/components/AppShell";
import { recipes, recipeCategories, type Recipe, type RecipeCategory } from "@/data/recipes";
import { attendees } from "@/data/sample";

const PEOPLE = attendees.filter((a) => a.rsvp === "coming").length;

export function Recipes() {
  const [cat, setCat] = useState<RecipeCategory | "All">("All");
  const [favs, setFavs] = useState<Record<string, boolean>>(
    () => Object.fromEntries(recipes.filter((r) => r.favorite).map((r) => [r.id, true])),
  );
  const [claimed, setClaimed] = useState<Record<string, boolean>>(
    () => Object.fromEntries(recipes.filter((r) => r.claimedBy).map((r) => [r.id, true])),
  );

  const filtered = useMemo(
    () => (cat === "All" ? recipes : recipes.filter((r) => r.category === cat)),
    [cat],
  );
  const top = useMemo(() => [...recipes].sort((a, b) => b.votes - a.votes)[0], []);

  const toggleFav = (id: string) => setFavs((p) => ({ ...p, [id]: !p[id] }));
  const toggleClaim = (id: string) => setClaimed((p) => ({ ...p, [id]: !p[id] }));

  return (
    <Section
      title="Recipes & inspiration"
      subtitle="BBQ, salads, sips — claim what you'll cook"
      action={
        <button className="inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft">
          <Plus className="h-3.5 w-3.5" /> Add link
        </button>
      }
    >
      {/* AI suggestion */}
      <div className="mb-3 flex items-start gap-3 rounded-3xl border border-coral/30 bg-coral/5 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-coral/15 text-coral">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="text-sm">
          <p className="font-semibold">26°C and 3 veggies in the crew 🌶️</p>
          <p className="text-xs text-muted-foreground">
            Try <b>Grilled Watermelon & Feta</b> and <b>Halloumi Skewers</b>. Light, fresh, no-meat friendly.
          </p>
        </div>
      </div>

      {/* Category chips */}
      <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <CatChip active={cat === "All"} onClick={() => setCat("All")} label="All" />
        {recipeCategories.map((c) => (
          <CatChip key={c} active={cat === c} onClick={() => setCat(c)} label={c} />
        ))}
      </div>

      {/* Most popular badge row */}
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-sun/40 bg-sun/15 px-3 py-2 text-xs">
        <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
          Most popular
        </span>
        <p className="flex-1">
          <b>{top.title}</b> · {top.votes} votes from the crew
        </p>
      </div>

      <ul className="space-y-3">
        {filtered.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            isFav={!!favs[r.id]}
            isClaimed={!!claimed[r.id]}
            onFav={() => toggleFav(r.id)}
            onClaim={() => toggleClaim(r.id)}
          />
        ))}
      </ul>
    </Section>
  );
}

function CatChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
        active ? "bg-coral text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function RecipeCard({
  recipe, isFav, isClaimed, onFav, onClaim,
}: {
  recipe: Recipe;
  isFav: boolean;
  isClaimed: boolean;
  onFav: () => void;
  onClaim: () => void;
}) {
  const scale = Math.max(1, Math.ceil(PEOPLE / recipe.servings));
  return (
    <li className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
      <div className="relative h-36 w-full overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          width={768}
          height={512}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-2 top-2 flex gap-1">
          <Chip tone="coral">{recipe.category}</Chip>
        </div>
        <button
          onClick={onFav}
          aria-label={isFav ? "Remove favorite" : "Save favorite"}
          className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition ${
            isFav ? "bg-coral text-primary-foreground" : "bg-card/85 text-foreground"
          }`}
        >
          <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
        </button>
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2 text-primary-foreground">
          <h3 className="font-display text-lg font-semibold drop-shadow-md">
            <span className="mr-1">{recipe.emoji}</span>
            {recipe.title}
          </h3>
        </div>
      </div>

      <div className="p-3">
        <p className="text-xs text-muted-foreground">{recipe.description}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ChefHat className="h-3 w-3" /> {recipe.difficulty}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {recipe.prepMinutes} min
          </span>
          <span>·</span>
          <span>
            base <b>{recipe.servings}</b> → scaled <b className="text-coral">×{scale}</b> for {PEOPLE}
          </span>
        </div>

        {recipe.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.labels.map((l) => (
              <span
                key={l}
                className="rounded-full bg-leaf/10 px-2 py-0.5 text-[10px] font-semibold text-leaf"
              >
                {l}
              </span>
            ))}
          </div>
        )}

        <details className="mt-2 rounded-2xl bg-muted/60 px-3 py-2 text-xs">
          <summary className="cursor-pointer font-semibold">
            Ingredients ({recipe.ingredients.length})
          </summary>
          <ul className="mt-1.5 grid grid-cols-2 gap-y-0.5 text-muted-foreground">
            {recipe.ingredients.map((i) => (
              <li key={i}>· {i}</li>
            ))}
          </ul>
        </details>

        <div className="mt-3 flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1">
            <span>{recipe.addedBy.emoji}</span>
            <span className="font-medium">by {recipe.addedBy.name}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-semibold">
            <ThumbsUp className="h-3 w-3" /> {recipe.votes}
          </span>
          <a
            href={recipe.url}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-lake/15 px-2.5 py-1 font-semibold text-lake"
          >
            Recipe <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={onClaim}
            className={`inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isClaimed
                ? "bg-leaf text-leaf-foreground shadow-soft"
                : "border border-border bg-card text-foreground"
            }`}
          >
            {isClaimed ? <><Check className="h-3.5 w-3.5" /> I'm cooking it</> : "I'll cook it"}
          </button>
          <button className="inline-flex items-center justify-center gap-1 rounded-full bg-coral/15 px-3 py-1.5 text-xs font-semibold text-coral">
            <ShoppingBasket className="h-3.5 w-3.5" /> Add to list
          </button>
        </div>
      </div>
    </li>
  );
}
