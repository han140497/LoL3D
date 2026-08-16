import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: false,
  configured: false,
  signIn: async () => ({ error: 'Auth not configured' }),
  signUp: async () => ({ error: 'Auth not configured' }),
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        // Claim guest orders so the Account page sees them. Must run OUTSIDE this
        // callback: Supabase holds the auth lock while the callback runs, and any
        // supabase call awaited here would deadlock it (sign-in never resolves).
        setTimeout(() => {
          supabase.rpc('claim_guest_orders').catch(() => {});
        }, 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Profile (name + admin flag) follows the signed-in user.
  useEffect(() => {
    if (!user) return setProfile(null);
    let cancelled = false;
    supabase
      .from('profiles')
      .select('full_name, is_admin')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile(data ?? { full_name: '', is_admin: false });
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, configured: isSupabaseConfigured, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
