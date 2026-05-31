import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  displayName: z.string().trim().min(1).max(60).optional(),
});

type Mode = "signin" | "signup" | "forgot";

export function AuthGate() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [emojiAvatar, setEmojiAvatar] = useState("🦩");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signInWithGoogle = async () => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (err) setError(err.message);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "forgot") {
      const parsed = z.string().trim().email("Enter a valid email").safeParse(email);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid email");
        return;
      }
      setBusy(true);
      try {
        const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setInfo("Check your inbox — we sent a reset link.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setBusy(false);
      }
      return;
    }

    const parsed = schema.safeParse({
      email,
      password,
      displayName: mode === "signup" ? displayName : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: parsed.data.displayName,
              emoji_avatar: emojiAvatar,
            },
          },
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (err) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-sunset px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card p-6 shadow-float">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 text-5xl">🦩</div>
          <h1 className="font-display text-2xl font-semibold">FlamingoBringo</h1>
          <p className="text-xs text-muted-foreground">Plan together. Bring together.</p>
        </div>

        {mode !== "forgot" && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); setInfo(null); }}
              className={`rounded-full py-1.5 transition ${mode === "signin" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
              className={`rounded-full py-1.5 transition ${mode === "signup" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
            >
              Create account
            </button>
          </div>
        )}

        {mode === "forgot" && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); setInfo(null); }}
              className="mb-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              ← Back to sign in
            </button>
            <p className="text-sm font-semibold">Reset your password</p>
            <p className="mt-0.5 text-xs text-muted-foreground">We'll send a reset link to your email.</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const pool = ["🦩", "🍉", "🌻", "🥖", "🍑", "🌮", "🥑", "🧁", "🐝", "🐙", "🦊", "🌈"];
                  setEmojiAvatar(pool[Math.floor(Math.random() * pool.length)]);
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background text-2xl shadow-card"
                aria-label="Shuffle avatar emoji"
              >
                {emojiAvatar}
              </button>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
                required
                className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-coral"
              />
            </div>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-coral"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-coral"
            />
          )}

          {error && (
            <p className="rounded-xl bg-coral/10 px-3 py-2 text-xs text-coral">{error}</p>
          )}
          {info && (
            <p className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">{info}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-coral px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "…" : mode === "signup" ? "Join the flock" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="my-3 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border/60" />
              or
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2.5 text-sm font-semibold shadow-card transition hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => { setMode("forgot"); setError(null); setInfo(null); }}
            className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground transition"
          >
            Forgot your password?
          </button>
        )}

        {mode !== "forgot" && (
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            By continuing you agree to be kind to your friends 🫶
          </p>
        )}
      </div>
    </div>
  );
}
