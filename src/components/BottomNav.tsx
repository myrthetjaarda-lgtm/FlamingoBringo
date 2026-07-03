import { Link, useLocation } from "@tanstack/react-router";
import { Home, Map, Users, Compass, MapPin, User } from "lucide-react";

const tabs = [
  { to: "/" as const, label: "Home", icon: Home },
  { to: "/berlin" as const, label: "Berlin", icon: Map },
  { to: "/spots" as const, label: "Spots", icon: MapPin },
  { to: "/friends" as const, label: "Friends", icon: Users },
  { to: "/discover" as const, label: "Discover", icon: Compass },
  { to: "/profile" as const, label: "Me", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="flex items-center justify-around rounded-3xl border border-border/60 bg-card/90 px-1 py-2 shadow-float backdrop-blur-xl">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1 text-[10px] font-medium transition ${
                active ? "text-coral" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                  active ? "bg-coral/15 text-coral" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
