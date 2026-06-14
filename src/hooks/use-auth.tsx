import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  emoji_avatar: string;
  neighborhood: string | null;
  bio: string | null;
  interests: string[];
  phone: string | null;
  default_location: string | null;
  avatar_url: string | null;
  dietary: string[];
  instagram: string | null;
  facebook: string | null;
  show_phone: boolean;
  availability_status: string;
  social_mode: string;
  paypal: string | null;
  iban: string | null;
  payment_note: string | null;
};

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, display_name, emoji_avatar, neighborhood, bio, interests, phone, default_location, avatar_url, dietary, instagram, facebook, show_phone, availability_status, social_mode, paypal, iban, payment_note",
      )
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      return;
    }

    // No profile yet — create one (e.g. Google OAuth first sign-in)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const displayName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "Flamingo";
    const emojiAvatar = user?.user_metadata?.emoji_avatar || "🦩";

    const { data: created } = await supabase
      .from("profiles")
      .upsert(
        { id: userId, display_name: displayName, emoji_avatar: emojiAvatar },
        { onConflict: "id" },
      )
      .select(
        "id, display_name, emoji_avatar, neighborhood, bio, interests, phone, default_location, avatar_url, dietary, instagram, facebook, show_phone, availability_status, social_mode, paypal, iban, payment_note",
      )
      .maybeSingle();

    setProfile((created as Profile | null) ?? null);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // defer to avoid deadlock in callback
        setTimeout(() => {
          void loadProfile(s.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadProfile(data.session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    refreshProfile: async () => {
      if (session?.user) await loadProfile(session.user.id);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
