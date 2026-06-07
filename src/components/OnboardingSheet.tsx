import { useState } from "react";
import { X, MapPin, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const BERLIN_NEIGHBORHOODS = [
  "Mitte", "Prenzlauer Berg", "Friedrichshain", "Kreuzberg", "Neukölln",
  "Tempelhof", "Schöneberg", "Charlottenburg", "Wilmersdorf", "Zehlendorf",
  "Steglitz", "Wedding", "Pankow", "Weißensee", "Lichtenberg",
  "Treptow", "Köpenick", "Spandau", "Marzahn", "Reinickendorf",
];

const INTEREST_OPTIONS = [
  "BBQs", "Lakes", "Open-air cinema", "Beer gardens", "Picnics",
  "Clubs", "Festivals", "Markets", "Hiking", "Board games",
  "Sports", "Volleyball", "Swimming", "Dancing", "Cycling",
  "Museums", "Karaoke", "Food markets", "Tech meetups", "Cinema",
];

const EMOJI_POOL = ["🦩", "🍉", "🌻", "🥖", "🍑", "🌮", "🥑", "🧁", "🐝", "🐙", "🦊", "🌈", "🦋", "🌴", "🍓", "🦜"];

export function OnboardingSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<"neighborhood" | "interests" | "emoji">("neighborhood");
  const [neighborhood, setNeighborhood] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [emoji, setEmoji] = useState("🦩");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const toggleInterest = (i: string) =>
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ neighborhood, interests, emoji_avatar: emoji }).eq("id", user.id);
    await refreshProfile();
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-border/60 bg-card shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-1 mt-3 h-1.5 w-10 rounded-full bg-muted" />

        <div className="flex items-center justify-between px-5 pt-2 pb-1">
          <div>
            <h2 className="font-display text-xl font-semibold">Welcome to FlamingoBringo 🦩</h2>
            <p className="text-[12px] text-muted-foreground">Quick setup · 30 seconds</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1.5 px-5 pb-3">
          {(["neighborhood", "interests", "emoji"] as const).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition ${
                step === s ? "bg-coral" : i < ["neighborhood","interests","emoji"].indexOf(step) ? "bg-coral/40" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="overflow-y-auto px-5 pb-6" style={{ maxHeight: "65vh" }}>
          {step === "neighborhood" && (
            <>
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-coral" />
                <p className="font-semibold">Which kiez do you live in?</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {BERLIN_NEIGHBORHOODS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNeighborhood(n)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                      neighborhood === n
                        ? "border-coral bg-coral/15 text-coral"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                disabled={!neighborhood}
                onClick={() => setStep("interests")}
                className="mt-5 w-full rounded-2xl bg-coral py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Next →
              </button>
            </>
          )}

          {step === "interests" && (
            <>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-coral" />
                <p className="font-semibold">What are you into?</p>
              </div>
              <p className="mb-3 text-[11px] text-muted-foreground">Pick at least 3 so friends can find you for plans.</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((i) => (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                      interests.includes(i)
                        ? "border-coral bg-coral/15 text-coral"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setStep("neighborhood")}
                  className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground"
                >
                  ←
                </button>
                <button
                  disabled={interests.length < 1}
                  onClick={() => setStep("emoji")}
                  className="flex-1 rounded-2xl bg-coral py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </>
          )}

          {step === "emoji" && (
            <>
              <p className="mb-4 font-semibold">Pick your avatar</p>
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_POOL.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`flex aspect-square items-center justify-center rounded-2xl text-xl transition ${
                      emoji === e ? "bg-coral/20 ring-2 ring-coral" : "bg-muted hover:bg-muted/60"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setStep("interests")}
                  className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground"
                >
                  ←
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-coral py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Done — let's go! 🦩"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
