import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { OnboardingSheet } from "./OnboardingSheet";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const needsOnboarding = !!user && !!profile && !profile.neighborhood;
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="mx-auto min-h-screen max-w-md bg-background/40 pb-32">
        <IdentityBar />
        {children}
      </div>
      <BottomNav />
      <OnboardingSheet
        open={needsOnboarding && !dismissedOnboarding}
        onClose={() => setDismissedOnboarding(true)}
      />
    </div>
  );
}

function IdentityBar() {
  const { user, profile, signOut } = useAuth();
  if (!user) return null;
  const name = profile?.display_name ?? "Friend";
  const emoji = profile?.emoji_avatar ?? "🦩";
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border/60 bg-card/85 px-3 py-2 backdrop-blur">
      <Link to="/profile" className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral/15 text-base">
          {emoji}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Signed in as</p>
          <p className="truncate text-xs font-semibold">{name}</p>
        </div>
      </Link>
      <button
        onClick={signOut}
        aria-label="Sign out"
        className="flex h-8 items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 text-[11px] font-semibold text-muted-foreground transition hover:text-coral"
      >
        <LogOut className="h-3 w-3" /> Sign out
      </button>
    </div>
  );
}

export function Section({
  title,
  subtitle,
  action,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="px-4 pt-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "coral" | "lake" | "sun" | "leaf";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    coral: "bg-coral/15 text-coral",
    lake: "bg-lake/15 text-lake",
    sun: "bg-sun/25 text-sun-foreground",
    leaf: "bg-leaf/15 text-leaf",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
