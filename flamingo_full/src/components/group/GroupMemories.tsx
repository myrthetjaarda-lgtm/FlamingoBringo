import { useState, useMemo } from "react";
import { Section, Chip } from "@/components/AppShell";
import {
  Heart, Flame, Smile, PartyPopper, Camera, Plus, MessageCircle,
  Sparkles, Filter, ChevronRight,
} from "lucide-react";

type Memory = {
  id: string;
  emoji: string;
  caption: string;
  by: string;
  byEmoji: string;
  when: string;
  album: string;
  reactions: { heart: number; fire: number; smile: number; party: number };
  yourReaction?: ReactionKey | null;
  comments: number;
};

type ReactionKey = "heart" | "fire" | "smile" | "party";

const REACTIONS: { key: ReactionKey; icon: typeof Heart; label: string; tone: string }[] = [
  { key: "heart", icon: Heart, label: "Love", tone: "text-coral" },
  { key: "fire", icon: Flame, label: "Fire", tone: "text-sun-foreground" },
  { key: "smile", icon: Smile, label: "Smile", tone: "text-leaf" },
  { key: "party", icon: PartyPopper, label: "Party", tone: "text-lake" },
];

// Generate richer memories from the slim group.memories list
function expandMemories(
  base: { id: string; emoji: string; caption: string }[],
  groupId: string,
): Memory[] {
  if (base.length === 0) return [];
  const authors = [{ name: "Member", emoji: "🦩" }];
  const albums = ["Lake day · July", "Sunset crew", "Backyard BBQ", "Festival '25"];
  return base.map((m, i) => {
    const author = authors[i % authors.length];
    return {
      id: `${groupId}-${m.id}`,
      emoji: m.emoji,
      caption: m.caption,
      by: author.name,
      byEmoji: author.emoji,
      when: ["just now", "2h", "1d", "3d", "1w"][i % 5],
      album: albums[i % albums.length],
      reactions: {
        heart: 3 + ((i * 2) % 6),
        fire: 1 + (i % 4),
        smile: 2 + (i % 3),
        party: i % 3,
      },
      yourReaction: i === 1 ? "heart" : null,
      comments: (i * 3) % 5,
    };
  });
}

export function GroupMemories({
  groupId,
  groupName,
  memories: rawMemories,
}: {
  groupId: string;
  groupName: string;
  memories: { id: string; emoji: string; caption: string }[];
}) {
  const initial = useMemo(() => expandMemories(rawMemories, groupId), [groupId, rawMemories]);
  const [memories, setMemories] = useState<Memory[]>(initial);
  const [view, setView] = useState<"grid" | "feed">("grid");
  const [filter, setFilter] = useState<string>("all");

  const albums = useMemo(() => {
    const set = new Map<string, number>();
    memories.forEach((m) => set.set(m.album, (set.get(m.album) ?? 0) + 1));
    return Array.from(set.entries()).map(([name, count]) => ({ name, count }));
  }, [memories]);

  const filtered = useMemo(
    () => (filter === "all" ? memories : memories.filter((m) => m.album === filter)),
    [memories, filter],
  );

  const topMemory = useMemo(() => {
    if (memories.length === 0) return null;
    return memories
      .slice()
      .sort(
        (a, b) =>
          b.reactions.heart + b.reactions.fire - (a.reactions.heart + a.reactions.fire),
      )[0];
  }, [memories]);

  function react(id: string, key: ReactionKey) {
    setMemories((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const nextReactions = { ...m.reactions };
        // toggle off if same
        if (m.yourReaction === key) {
          nextReactions[key] = Math.max(0, nextReactions[key] - 1);
          return { ...m, reactions: nextReactions, yourReaction: null };
        }
        // remove previous reaction
        if (m.yourReaction) {
          nextReactions[m.yourReaction] = Math.max(0, nextReactions[m.yourReaction] - 1);
        }
        nextReactions[key] = nextReactions[key] + 1;
        return { ...m, reactions: nextReactions, yourReaction: key };
      }),
    );
  }

  if (memories.length === 0) {
    return (
      <Section title="Shared memories" subtitle="Photos only group members can see">
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-coral/20 to-lake/20 text-3xl">
            📸
          </div>
          <p className="mt-3 font-display text-sm font-semibold">No memories yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Drop the first photo from your next {groupName} hang.
          </p>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-coral-foreground">
            <Plus className="h-3.5 w-3.5" /> Add the first photo
          </button>
        </div>
      </Section>
    );
  }

  return (
    <>
      {/* Highlight banner */}
      {topMemory && (
        <Section title="Most loved" subtitle="What this crew reacted to the most">
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-coral/15 via-sun/15 to-lake/15 p-4 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card text-4xl shadow-soft">
                {topMemory.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-coral">
                  <Sparkles className="-mt-0.5 mr-1 inline h-3 w-3" /> Top memory
                </p>
                <p className="truncate font-display text-sm font-semibold">{topMemory.caption}</p>
                <p className="text-[11px] text-muted-foreground">
                  {topMemory.byEmoji} {topMemory.by} · {topMemory.album}
                </p>
              </div>
              <Chip tone="coral">
                ❤️ {topMemory.reactions.heart + topMemory.reactions.fire}
              </Chip>
            </div>
          </div>
        </Section>
      )}

      <Section
        title="Shared memories"
        subtitle={`${memories.length} photos · ${albums.length} albums`}
        action={
          <div className="flex gap-1 rounded-full border border-border/60 bg-card p-0.5">
            <button
              onClick={() => setView("grid")}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                view === "grid" ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setView("feed")}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                view === "feed" ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              Feed
            </button>
          </div>
        }
      >
        {/* Album filter */}
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
              filter === "all"
                ? "border-coral bg-coral/15 text-coral"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            <Filter className="-mt-0.5 mr-1 inline h-3 w-3" /> All
          </button>
          {albums.map((a) => (
            <button
              key={a.name}
              onClick={() => setFilter(a.name)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                filter === a.name
                  ? "border-coral bg-coral/15 text-coral"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              {a.name} · {a.count}
            </button>
          ))}
        </div>

        {view === "grid" ? (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((m) => {
              const total =
                m.reactions.heart + m.reactions.fire + m.reactions.smile + m.reactions.party;
              return (
                <div
                  key={m.id}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-coral/20 via-sun/20 to-lake/20 p-3">
                    <span className="absolute right-2 top-2 rounded-full bg-card/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground backdrop-blur">
                      {m.when}
                    </span>
                    <div className="flex h-full flex-col justify-between">
                      <span className="text-4xl">{m.emoji}</span>
                      <p className="text-[11px] font-semibold text-foreground/80 line-clamp-2">
                        {m.caption}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px]">
                    <span className="text-muted-foreground">
                      {m.byEmoji} {m.by}
                    </span>
                    <span className="font-semibold text-coral">❤️ {total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((m) => (
              <li
                key={m.id}
                className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card"
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-lg">{m.byEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{m.by}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {m.album} · {m.when}
                    </p>
                  </div>
                </div>
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-coral/20 via-sun/20 to-lake/20">
                  <span className="text-7xl">{m.emoji}</span>
                </div>
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold">{m.caption}</p>
                  <div className="mt-2 flex items-center gap-1">
                    {REACTIONS.map((r) => {
                      const Icon = r.icon;
                      const active = m.yourReaction === r.key;
                      const count = m.reactions[r.key];
                      return (
                        <button
                          key={r.key}
                          onClick={() => react(m.id, r.key)}
                          aria-pressed={active}
                          className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
                            active
                              ? "border-coral bg-coral/15 text-coral"
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          <Icon className={`h-3 w-3 ${active ? "" : r.tone}`} />
                          {count}
                        </button>
                      );
                    })}
                    <button className="ml-auto flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                      <MessageCircle className="h-3 w-3" /> {m.comments}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-card/60 px-3 py-3 text-xs font-semibold text-muted-foreground">
            <Plus className="h-3.5 w-3.5" /> Add photos
          </button>
          <button className="flex items-center justify-center gap-1.5 rounded-2xl bg-coral px-3 py-3 text-xs font-semibold text-coral-foreground shadow-soft">
            <Camera className="h-3.5 w-3.5" /> Capture moment
          </button>
        </div>
      </Section>

      <Section title="Albums" subtitle="Group memories by event or trip">
        <ul className="space-y-2">
          {albums.map((a) => (
            <li
              key={a.name}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-coral/20 to-lake/20 text-xl">
                📸
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{a.name}</p>
                <p className="text-[11px] text-muted-foreground">{a.count} photo{a.count === 1 ? "" : "s"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
