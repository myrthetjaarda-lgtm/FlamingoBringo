import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Section, Chip } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { getAdminUsers } from "@/lib/admin.functions";
import { Loader2, Mail, MapPin, Calendar } from "lucide-react";

const ADMIN_EMAIL = "myrthetjaarda@gmail.com";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — FlamingoBringo" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const fetchUsers = useServerFn(getAdminUsers);
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
    enabled: isAdmin,
  });

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
        subtitle={isLoading ? "Loading…" : `${users?.length ?? 0} registered users`}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {error instanceof Error ? error.message : "Failed to load users"}
          </div>
        ) : !users?.length ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No users yet.
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl border border-border/60 bg-card p-3 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/15 text-xl">
                    {u.emoji_avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{u.display_name}</p>
                      <Chip tone={u.provider === "google" ? "coral" : "lake"}>
                        {u.provider === "google" ? "Google" : "Email"}
                      </Chip>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {u.email}
                      </span>
                      {u.neighborhood && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {u.neighborhood}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> joined{" "}
                        {new Date(u.created_at).toLocaleDateString(undefined, {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                      {u.last_sign_in_at && (
                        <span className="text-muted-foreground/70">
                          last seen{" "}
                          {new Date(u.last_sign_in_at).toLocaleDateString(undefined, {
                            day: "numeric", month: "short",
                          })}
                        </span>
                      )}
                    </div>
                    {(u.driving_license || u.owns_car || u.bike_scooter_provider ||
                      u.transit_passes.length > 0 || u.rideshare_provider) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {u.driving_license && <Chip tone="lake">🪪 License</Chip>}
                        {u.owns_car && <Chip tone="lake">🚗 Car</Chip>}
                        {u.bike_scooter_provider && <Chip tone="leaf">🚲 {u.bike_scooter_provider}</Chip>}
                        {u.transit_passes.map((p: string) => (
                          <Chip key={p} tone="coral">🚇 {p}</Chip>
                        ))}
                        {u.rideshare_provider && <Chip tone="sun">🚕 {u.rideshare_provider}</Chip>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </AppShell>
  );
}
