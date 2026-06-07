import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Section } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";

const ADMIN_EMAIL = "myrthetjaarda@gmail.com";

type ProfileRow = {
  id: string;
  display_name: string;
  emoji_avatar: string;
  neighborhood: string | null;
  created_at: string;
  email?: string;
};

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — FlamingoBringo" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, emoji_avatar, neighborhood, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setProfiles(data ?? []);
      }
      setLoading(false);
    };
    void load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
          <p className="text-muted-foreground">You don't have access to this page.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Section
        title="Admin — Users"
        subtitle={loading ? "Loading…" : `${profiles.length} users`}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {error}
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No users yet.
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral/15 text-lg">
                  {p.emoji_avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-sm">{p.display_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.neighborhood ?? "No neighborhood"} · joined{" "}
                    {new Date(p.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </Section>
    </AppShell>
  );
}
