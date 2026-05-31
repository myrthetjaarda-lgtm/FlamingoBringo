import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The PASSWORD_RECOVERY event may have already fired before this component
    // mounted (AuthBoundary waits for session), so also check the existing session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => navigate({ to: "/" }), 2000);
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
          <h1 className="font-display text-2xl font-semibold">Set new password</h1>
        </div>

        {done ? (
          <p className="rounded-xl bg-green-50 px-3 py-2 text-center text-sm text-green-700">
            Password updated! Redirecting…
          </p>
        ) : !ready ? (
          <p className="text-center text-sm text-muted-foreground">Verifying reset link…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              required
              autoComplete="new-password"
              className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-coral"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              required
              autoComplete="new-password"
              className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-coral"
            />
            {error && (
              <p className="rounded-xl bg-coral/10 px-3 py-2 text-xs text-coral">{error}</p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-coral px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
