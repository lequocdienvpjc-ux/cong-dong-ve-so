import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  const loadProfile = useCallback(async (uid) => {
    if (!uid || !supabase) { setProfile(null); return null; }
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile(data || null);
    return data;
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setTimeout(() => loadProfile(s?.user?.id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = {
    session, user: session?.user || null, profile, loading, recovery, setRecovery,
    refresh: () => loadProfile(session?.user?.id),
    isStaff: ['moderator', 'admin', 'super_admin'].includes(profile?.admin_role) && !profile?.is_locked,
    isAdmin: ['admin', 'super_admin'].includes(profile?.admin_role) && !profile?.is_locked,
    isSuper: profile?.admin_role === 'super_admin',
    signOut: async () => { await supabase.auth.signOut(); setProfile(null); },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
