import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import supabase from "../supabase/SupabaseClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Standalone profile fetcher with safe error handling
  const fetchProfile = useCallback(async (userId, userObj) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const metaRole = userObj?.user_metadata?.role || "CASHIER";
    const metaBizId = userObj?.user_metadata?.business_id || null;
    const fallback = {
      id: userId,
      email: userObj?.email,
      role: metaRole,
      business_id: metaBizId,
    };

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data && !error) {
        setProfile(data);
        return data;
      }

      setProfile(fallback);
      return fallback;
    } catch (err) {
      console.error("Profile exception:", err);
      setProfile(fallback);
      return fallback;
    }
  }, []);

  // Single Auth State Sync Listener
  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Hydration from LocalStorage
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;

      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchProfile(currentUser.id, currentUser).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // 2. Realtime Auth State Changes (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchProfile(currentUser.id, currentUser).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(() => {
    if (user?.id) {
      return fetchProfile(user.id, user);
    }
  }, [user, fetchProfile]);

  const role = profile?.role || user?.user_metadata?.role || "CASHIER";
  const businessId = profile?.business_id || user?.user_metadata?.business_id || null;

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      role,
      businessId,
      loading,
      isOwner: role === "OWNER",
      isManager: role === "MANAGER",
      isCashier: role === "CASHIER",
      refreshProfile,
    }),
    [session, user, profile, role, businessId, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}