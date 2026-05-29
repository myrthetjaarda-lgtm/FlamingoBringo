import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, User } from "lucide-react";

const tabs = [
  { to: "/" as const, label: "Home", icon: Home, params: undefined },
  { to: "/discover" as const, label: "Discover", icon: Compass, params: undefined },
  { to: "/profile" as const, label: "Me", icon: User, params: undefined },
];



export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="flex items-center justify-around rounded-3xl border border-border/60 bg-card/90 px-2 py-2 shadow-float backdrop-blur-xl">
        {tabs.map(({ to, label, icon: Icon, params }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              params={params as never}
              className={`group flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] font-medium transition ${
                active ? "text-coral" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${
                  active ? "bg-coral/15 text-coral" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
