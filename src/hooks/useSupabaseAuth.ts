import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getSupabaseUserProfile } from '../lib/authService';
import { User, UserRole } from '../types';

export interface SupabaseAuthState {
  user: User | null;
  supabaseUser: any | null;
  role: UserRole | string | null;
  schoolId: string | null;
  loading: boolean;
  authenticated: boolean;
  tokenExpiresAt: number | null;
  // State synchronization methods
  syncPortalSession: (role: UserRole | string, schoolId: string, userProfile?: Partial<User> | null, rawSupabaseUser?: any) => void;
  switchSchool: (newSchoolId: string) => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

export const STORAGE_KEYS = {
  ACTIVE_ROLE: 'edumaster_active_role',
  ACTIVE_SCHOOL: 'edumaster_active_school_id',
  ACTIVE_VIEW: 'edumaster_active_view',
  USER_EMAIL: 'edumaster_user_email',
  USER_PROFILE: 'edumaster_user_profile',
  SUPERADMIN_AUTH: 'edumaster_superadmin_authenticated',
  PORTAL_SESSION: 'edumaster_active_session'
};

export function useSupabaseAuth(initialUser: User | null = null): SupabaseAuthState {
  // Read initial cached state from localStorage for instantaneous hydration
  const getInitialRole = (): UserRole | string | null => {
    if (initialUser?.role) return initialUser.role;
    if (typeof window === 'undefined') return null;
    const isSuperAdmin = localStorage.getItem(STORAGE_KEYS.SUPERADMIN_AUTH) === 'true';
    if (isSuperAdmin) return 'SUPER_ADMIN';
    return (localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) as UserRole) || null;
  };

  const getInitialSchoolId = (): string | null => {
    if (initialUser?.schoolId) return initialUser.schoolId;
    if (typeof window === 'undefined') return 'SCH-GH-000001';
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL) || 'SCH-GH-000001';
  };

  const getInitialUserProfile = (): User | null => {
    if (initialUser) return initialUser;
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (raw) return JSON.parse(raw);
      const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
      const role = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) as UserRole;
      const schoolId = localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL) || 'SCH-GH-000001';
      if (email || role) {
        return {
          uid: `USR-${email || role}`,
          email: email || (role === 'SUPER_ADMIN' ? 'effahdavid45@gmail.com' : 'user@school.edu.gh'),
          role: role || 'SCHOOL_ADMIN',
          schoolId: schoolId,
          fullName: role === 'SUPER_ADMIN' ? 'David Effah (Lead Developer)' : 'Portal User',
          status: 'ACTIVE',
          isFirstLogin: false,
          createdAt: new Date().toISOString()
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(getInitialUserProfile);
  const [supabaseUser, setSupabaseUser] = useState<any | null>(null);
  const [role, setRole] = useState<UserRole | string | null>(getInitialRole);
  const [schoolId, setSchoolId] = useState<string | null>(getInitialSchoolId);
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    if (initialUser) return true;
    if (typeof window === 'undefined') return false;
    return !!(
      localStorage.getItem(STORAGE_KEYS.SUPERADMIN_AUTH) === 'true' ||
      localStorage.getItem(STORAGE_KEYS.PORTAL_SESSION) ||
      localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE)
    );
  });
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize state to LocalStorage
  const persistPortalState = useCallback((
    newRole: UserRole | string | null,
    newSchoolId: string | null,
    userProfile: User | null
  ) => {
    if (typeof window === 'undefined') return;
    try {
      console.log(' [useSupabaseAuth:persistPortalState] Persisting session to localStorage:', {
        role: newRole,
        schoolId: newSchoolId,
        userEmail: userProfile?.email
      });
      if (newRole) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, newRole);
        if (newRole === 'SUPER_ADMIN') {
          localStorage.setItem(STORAGE_KEYS.SUPERADMIN_AUTH, 'true');
        }
      }
      if (newSchoolId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SCHOOL, newSchoolId);
      }
      if (userProfile) {
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
        if (userProfile.email) {
          localStorage.setItem(STORAGE_KEYS.USER_EMAIL, userProfile.email);
        }
      }
      localStorage.setItem(STORAGE_KEYS.PORTAL_SESSION, JSON.stringify({
        role: newRole,
        schoolId: newSchoolId,
        user: userProfile,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn(' [useSupabaseAuth:persistPortalState] Error saving portal state:', err);
    }
  }, []);

  // Helper to sync portal session directly from UI / Login actions
  const syncPortalSession = useCallback((
    newRole: UserRole | string,
    newSchoolId: string,
    userProfile?: Partial<User> | null,
    rawSupabaseUser?: any
  ) => {
    console.group(' [useSupabaseAuth:syncPortalSession] User login session synchronized');
    console.log('Role:', newRole);
    console.log('School ID:', newSchoolId);
    console.log('User Profile:', userProfile);
    console.log('Raw Supabase User:', rawSupabaseUser);
    console.groupEnd();

    const fullUser: User = {
      uid: rawSupabaseUser?.id || (userProfile as any)?.uid || (userProfile as any)?.id || `USR-${Date.now()}`,
      email: userProfile?.email || rawSupabaseUser?.email || '',
      fullName: userProfile?.fullName || 'Portal User',
      role: newRole as UserRole,
      schoolId: newSchoolId,
      status: 'ACTIVE',
      isFirstLogin: false,
      createdAt: userProfile?.createdAt || new Date().toISOString(),
      ...userProfile
    };

    setUser(fullUser);
    if (rawSupabaseUser) setSupabaseUser(rawSupabaseUser);
    setRole(newRole);
    setSchoolId(newSchoolId);
    setAuthenticated(true);
    setLoading(false);

    persistPortalState(newRole, newSchoolId, fullUser);
  }, [persistPortalState]);

  // Switch active school without resetting session (e.g. Super Admin or Multi-Tenant Admin)
  const switchSchool = useCallback((newSchoolId: string) => {
    console.log(' [useSupabaseAuth:switchSchool] Switching active school to:', newSchoolId);
    setSchoolId(newSchoolId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SCHOOL, newSchoolId);
    }
    setUser(prev => prev ? { ...prev, schoolId: newSchoolId } : null);
  }, []);

  // Explicit session refresh method
  const refreshSession = useCallback(async (): Promise<boolean> => {
    console.log(' [useSupabaseAuth:refreshSession] Initiating token refresh check...');
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error || !session) {
        console.warn(' [useSupabaseAuth:refreshSession] refreshSession returned error or null. Checking fallback getSession()...', error?.message);
        const { data: { session: fallbackSession } } = await supabase.auth.getSession();
        if (fallbackSession) {
          console.log(' [useSupabaseAuth:refreshSession] Fallback session retrieved successfully. Expires at:', fallbackSession.expires_at);
          setTokenExpiresAt(fallbackSession.expires_at || null);
          return true;
        }
        return false;
      }

      console.log(' [useSupabaseAuth:refreshSession] Session refreshed successfully. New expires_at:', session.expires_at);
      setTokenExpiresAt(session.expires_at || null);
      if (session.user) {
        setSupabaseUser(session.user);
      }
      return true;
    } catch (err) {
      console.warn(' [useSupabaseAuth:refreshSession] Exception during session refresh:', err);
      return false;
    }
  }, []);

  // Sign out across Supabase and local portals
  const signOut = useCallback(async () => {
    console.group(' [useSupabaseAuth:signOut] Signing out user');
    try {
      await supabase.auth.signOut();
      console.log('Supabase client signOut executed.');
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_VIEW);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      localStorage.removeItem(STORAGE_KEYS.SUPERADMIN_AUTH);
      localStorage.removeItem(STORAGE_KEYS.PORTAL_SESSION);
      console.log('Local portal storage keys removed.');
    }
    console.groupEnd();

    setUser(null);
    setSupabaseUser(null);
    setRole(null);
    setSchoolId('SCH-GH-000001');
    setAuthenticated(false);
    setLoading(false);
    setTokenExpiresAt(null);
  }, []);

  // Initialize and observe session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      console.group(' [useSupabaseAuth:initSession] Initializing session check from Supabase & localStorage');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn(' [useSupabaseAuth:initSession] getSession returned error:', sessionError.message);
        }

        if (!isMounted) {
          console.groupEnd();
          return;
        }

        if (session?.user) {
          console.log(' [useSupabaseAuth:initSession] Active Supabase Auth session detected:', {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: session.expires_at
          });

          const profile = await getSupabaseUserProfile(session.user.id);
          console.log(' [useSupabaseAuth:initSession] Loaded profile from Supabase DB:', profile);

          const meta = session.user.user_metadata || {};
          const isSuperAdminLocal = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.SUPERADMIN_AUTH) === 'true';
          const resolvedRole = (profile?.role || meta.role || (isSuperAdminLocal ? 'SUPER_ADMIN' : localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) || 'SCHOOL_ADMIN')) as UserRole;
          const resolvedSchoolId = profile?.schoolId || meta.schoolId || localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL) || 'SCH-GH-000001';

          const resolvedUser: User = profile || {
            uid: session.user.id,
            email: session.user.email || '',
            role: resolvedRole,
            schoolId: resolvedSchoolId,
            fullName: meta.fullName || session.user.email?.split('@')[0] || 'User',
            status: 'ACTIVE',
            isFirstLogin: false,
            createdAt: session.user.created_at || new Date().toISOString()
          };

          console.log(' [useSupabaseAuth:initSession] Fully resolved auth state:', {
            role: resolvedRole,
            schoolId: resolvedSchoolId,
            email: resolvedUser.email,
            fullName: resolvedUser.fullName
          });

          setUser(resolvedUser);
          setSupabaseUser(session.user);
          setRole(resolvedRole);
          setSchoolId(resolvedSchoolId);
          setAuthenticated(true);
          setTokenExpiresAt(session.expires_at || null);
          persistPortalState(resolvedRole, resolvedSchoolId, resolvedUser);
        } else {
          // Check local portal session fallback
          const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.SUPERADMIN_AUTH) === 'true';
          const cachedRole = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) as UserRole | null) : null;
          const cachedSchool = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL) : null;
          const cachedEmail = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_EMAIL) : null;
          const cachedProfile = getInitialUserProfile();

          console.log(' [useSupabaseAuth:initSession] No active Supabase Auth token found. Checking local portal credentials:', {
            isSuperAdmin,
            cachedRole,
            cachedSchool,
            cachedEmail,
            hasCachedProfile: !!cachedProfile
          });

          if (isSuperAdmin) {
            console.log(' [useSupabaseAuth:initSession] Restoring persistent Super Admin session.');
            const superUser: User = {
              uid: 'superadmin_master',
              email: cachedEmail || 'effahdavid45@gmail.com',
              fullName: 'David Effah (Lead Developer)',
              role: 'SUPER_ADMIN',
              schoolId: cachedSchool || 'HQ_GLOBAL',
              status: 'ACTIVE',
              isFirstLogin: false,
              createdAt: new Date().toISOString()
            };
            setUser(superUser);
            setRole('SUPER_ADMIN');
            setSchoolId(cachedSchool || 'HQ_GLOBAL');
            setAuthenticated(true);
            persistPortalState('SUPER_ADMIN', cachedSchool || 'HQ_GLOBAL', superUser);
          } else if (cachedRole) {
            console.log(` [useSupabaseAuth:initSession] Restoring persistent ${cachedRole} portal session.`);
            const restoredUser: User = cachedProfile || {
              uid: `USR-${cachedEmail || cachedRole}`,
              email: cachedEmail || 'admin@school.edu.gh',
              fullName: 'Portal User',
              role: cachedRole,
              schoolId: cachedSchool || 'SCH-GH-000001',
              status: 'ACTIVE',
              isFirstLogin: false,
              createdAt: new Date().toISOString()
            };
            setUser(restoredUser);
            setRole(cachedRole);
            setSchoolId(cachedSchool || 'SCH-GH-000001');
            setAuthenticated(true);
            persistPortalState(cachedRole, cachedSchool || 'SCH-GH-000001', restoredUser);
          } else {
            console.log(' [useSupabaseAuth:initSession] No stored session found. Awaiting user login.');
          }
        }
      } catch (err) {
        console.warn(' [useSupabaseAuth:initSession] Exception during session initialization:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        console.groupEnd();
      }
    }

    initSession();

    // Listen for Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.group(` [useSupabaseAuth:onAuthStateChange] Event: ${event}`);
      console.log('Session User:', session?.user?.email);
      console.log('Session Expires At:', session?.expires_at);

      if (!isMounted) {
        console.groupEnd();
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const profile = await getSupabaseUserProfile(session.user.id);
          const meta = session.user.user_metadata || {};
          const isSuperAdminLocal = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.SUPERADMIN_AUTH) === 'true';
          const resolvedRole = (profile?.role || meta.role || (isSuperAdminLocal ? 'SUPER_ADMIN' : localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) || 'SCHOOL_ADMIN')) as UserRole;
          const resolvedSchoolId = profile?.schoolId || meta.schoolId || localStorage.getItem(STORAGE_KEYS.ACTIVE_SCHOOL) || 'SCH-GH-000001';

          const resolvedUser: User = profile || {
            uid: session.user.id,
            email: session.user.email || '',
            role: resolvedRole,
            schoolId: resolvedSchoolId,
            fullName: meta.fullName || session.user.email?.split('@')[0] || 'User',
            status: 'ACTIVE',
            isFirstLogin: false,
            createdAt: session.user.created_at || new Date().toISOString()
          };

          console.log(' [useSupabaseAuth:onAuthStateChange] Synced user profile state:', resolvedUser);

          setUser(resolvedUser);
          setSupabaseUser(session.user);
          setRole(resolvedRole);
          setSchoolId(resolvedSchoolId);
          setAuthenticated(true);
          setTokenExpiresAt(session.expires_at || null);
          persistPortalState(resolvedRole, resolvedSchoolId, resolvedUser);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log(' [useSupabaseAuth:onAuthStateChange] SIGNED_OUT event triggered.');
        // Only clear if not in an active super admin session
        const isSuperAdmin = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.SUPERADMIN_AUTH) === 'true';
        if (!isSuperAdmin) {
          setUser(null);
          setSupabaseUser(null);
          setRole(null);
          setAuthenticated(false);
          setTokenExpiresAt(null);
        }
      }
      console.groupEnd();
    });

    // Multi-tab storage sync listener
    const handleStorage = (e: StorageEvent) => {
      console.log(' [useSupabaseAuth:StorageEvent] Multi-tab storage event received:', {
        key: e.key,
        newValue: e.newValue
      });
      if (e.key === STORAGE_KEYS.ACTIVE_ROLE && e.newValue) {
        setRole(e.newValue as UserRole);
      }
      if (e.key === STORAGE_KEYS.ACTIVE_SCHOOL && e.newValue) {
        setSchoolId(e.newValue);
      }
      if (e.key === STORAGE_KEYS.SUPERADMIN_AUTH) {
        if (e.newValue === 'true') {
          setRole('SUPER_ADMIN');
          setAuthenticated(true);
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    // Periodic JWT auto-refresh check (every 4 minutes)
    refreshIntervalRef.current = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const expiresInSeconds = session.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : 3600;
        console.log(` [useSupabaseAuth:PeriodicCheck] JWT expires in ${expiresInSeconds}s.`);
        // If token expires in less than 5 minutes, trigger proactive refresh
        if (expiresInSeconds < 300) {
          console.log(' [useSupabaseAuth:PeriodicCheck] Token expiring soon (< 300s). Triggering proactive refresh...');
          await supabase.auth.refreshSession();
        }
      }
    }, 4 * 60 * 1000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorage);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [persistPortalState]);

  return {
    user,
    supabaseUser,
    role,
    schoolId,
    loading,
    authenticated,
    tokenExpiresAt,
    syncPortalSession,
    switchSchool,
    signOut,
    refreshSession
  };
}

export default useSupabaseAuth;
