import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getSupabaseUserProfile } from '../lib/authService';
import { User } from '../types';

export interface SupabaseAuthState {
  user: User | null;
  supabaseUser: any | null;
  role: string | null;
  schoolId: string | null;
  loading: boolean;
  authenticated: boolean;
}

export function useSupabaseAuth(initialUser: User | null = null): SupabaseAuthState {
  const [authState, setAuthState] = useState<SupabaseAuthState>({
    user: initialUser,
    supabaseUser: null,
    role: initialUser?.role || null,
    schoolId: initialUser?.schoolId || null,
    loading: true,
    authenticated: !!initialUser
  });

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          const profile = await getSupabaseUserProfile(session.user.id);
          const meta = session.user.user_metadata || {};
          const resolvedRole = profile?.role || meta.role || 'SUPER_ADMIN';
          const resolvedSchoolId = profile?.schoolId || meta.schoolId || 'HQ_GLOBAL';

          setAuthState({
            user: profile || {
              uid: session.user.id,
              email: session.user.email || '',
              role: resolvedRole as any,
              schoolId: resolvedSchoolId,
              fullName: meta.fullName || session.user.email?.split('@')[0] || 'User',
              status: 'ACTIVE',
              isFirstLogin: false,
              createdAt: session.user.created_at || new Date().toISOString()
            },
            supabaseUser: session.user,
            role: resolvedRole,
            schoolId: resolvedSchoolId,
            loading: false,
            authenticated: true
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            supabaseUser: null,
            loading: false
          }));
        }
      } catch (err) {
        if (isMounted) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const profile = await getSupabaseUserProfile(session.user.id);
        const meta = session.user.user_metadata || {};
        const resolvedRole = profile?.role || meta.role || 'SUPER_ADMIN';
        const resolvedSchoolId = profile?.schoolId || meta.schoolId || 'HQ_GLOBAL';

        setAuthState({
          user: profile || {
            uid: session.user.id,
            email: session.user.email || '',
            role: resolvedRole as any,
            schoolId: resolvedSchoolId,
            fullName: meta.fullName || session.user.email?.split('@')[0] || 'User',
            status: 'ACTIVE',
            isFirstLogin: false,
            createdAt: session.user.created_at || new Date().toISOString()
          },
          supabaseUser: session.user,
          role: resolvedRole,
          schoolId: resolvedSchoolId,
          loading: false,
          authenticated: true
        });
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          supabaseUser: null,
          role: null,
          schoolId: null,
          loading: false,
          authenticated: false
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}

export default useSupabaseAuth;
