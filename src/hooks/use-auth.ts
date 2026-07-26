import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUser, signIn, signOut, signUp } from "@/lib/api/auth";

type Profile = Awaited<ReturnType<typeof getCurrentUser>>;

export function useAuth() {
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const current = await getCurrentUser();
    setProfile(current);
    setLoading(false);
  }

  useEffect(() => {
    refresh();

    // Keep in sync with token refresh / sign-out happening in other tabs.
    const supabase = getSupabaseBrowserClient();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    profile,
    loading,
    isCreator: profile?.role === "creator",
    signIn: async (email: string, password: string) => {
      await signIn({ data: { email, password } });
      const current = await getCurrentUser();
      setProfile(current);
      return current;
    },
    signUp: async (email: string, password: string, fullName: string, role: "customer" | "creator") => {
      await signUp({ data: { email, password, fullName, role } });
      await refresh();
    },
    signOut: async () => {
      await signOut();
      setProfile(null);
    },
  };
}
