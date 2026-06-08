import { useState, type ReactNode } from "react";
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
