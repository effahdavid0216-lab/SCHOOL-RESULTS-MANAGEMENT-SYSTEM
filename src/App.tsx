/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ActivationScreen } from './components/ActivationScreen';
import { ActivationResultModal } from './components/ActivationResultModal';
import { SuperAdminSetup } from './components/SuperAdminSetup';
import { SuperAdminPortal } from './components/SuperAdminPortal';
import { SchoolSetupWizard } from './components/SchoolSetupWizard';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ParentPortalView } from './components/ParentPortalView';
import { LoginScreen } from './components/LoginScreen';
import { AutoLogoutHandler } from './components/AutoLogoutHandler';
import { ThemeToggle } from './components/ThemeToggle';
import { useLanguage } from './context/LanguageContext';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { School, VerificationResult, UserRole } from './types';
import { ensureSeedData } from './lib/seedData';
import { getSchoolDetails, getGlobalSystemSettings, getSuperAdminConfig } from './lib/services';
import { Shield, Wrench, AlertTriangle, ArrowRight, Lock, UserCheck, RotateCcw, ChevronDown } from 'lucide-react';

export default function App() {
  const { t } = useLanguage();
  const [view, setView] = useState<
    | 'WELCOME'
    | 'ACTIVATION'
    | 'SUPER_ADMIN_SETUP'
    | 'SUPER_ADMIN'
    | 'SETUP_WIZARD'
    | 'ADMIN_DASHBOARD'
    | 'TEACHER_DASHBOARD'
    | 'STUDENT_DASHBOARD'
    | 'PARENT_PORTAL'
    | 'LOGIN'
  >('WELCOME');

  const [activeSchool, setActiveSchool] = useState<School | null>(null);
  const [activeSchoolId, setActiveSchoolId] = useState<string>('SCH-GH-000001');
  const [userEmail, setUserEmail] = useState<string>('admin@school.edu.gh');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [initialLoginRole, setInitialLoginRole] = useState<UserRole>('SCHOOL_ADMIN');
  const [routeGuardNotice, setRouteGuardNotice] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [maintenanceInfo, setMaintenanceInfo] = useState<{ isMaintenance: boolean; notice: string; bypassPin: string } | null>(null);
  const [bypassPinInput, setBypassPinInput] = useState('');
  const [bypassError, setBypassError] = useState('');
  const [isSuperAdminLoading, setIsSuperAdminLoading] = useState(false);

  // Super Admin Role Impersonation Session State
  const [impersonationSession, setImpersonationSession] = useState<{
    isImpersonating: boolean;
    originalRole: 'SUPER_ADMIN';
    impersonatedRole: UserRole;
    schoolId: string;
    schoolName: string;
    userEmail: string;
  } | null>(null);
  const [showRoleSwitcherDropdown, setShowRoleSwitcherDropdown] = useState(false);


  // Supabase Auth session synchronization hook
  const supabaseAuth = useSupabaseAuth();

  useEffect(() => {
    if (supabaseAuth.authenticated && supabaseAuth.user) {
      if (supabaseAuth.role) {
        setCurrentUserRole(supabaseAuth.role as UserRole);
      }
      if (supabaseAuth.schoolId) {
        setActiveSchoolId(supabaseAuth.schoolId);
      }
      if (supabaseAuth.user.email) {
        setUserEmail(supabaseAuth.user.email);
      }
    }
  }, [supabaseAuth.authenticated, supabaseAuth.role, supabaseAuth.schoolId, supabaseAuth.user]);

  // Route Guard check for Super Admin access
  const enforceSuperAdminRouteGuard = async (requestedPath?: string) => {
    try {
      const cfg = await getSuperAdminConfig();
      const isInit = !!(cfg && (cfg.superAdminInitialized || cfg.isInitialSetupDone));

      if (!isInit) {
        // Uninitialized -> redirect to setup view
        setRouteGuardNotice(null);
        setView('SUPER_ADMIN_SETUP');
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/super-admin/setup');
        }
        return;
      }

      const isStoredAuth = typeof window !== 'undefined' && localStorage.getItem('edumaster_superadmin_authenticated') === 'true';

      // Initialized -> verify SUPER_ADMIN authentication
      if (currentUserRole === 'SUPER_ADMIN' || view === 'SUPER_ADMIN' || isStoredAuth) {
        setRouteGuardNotice(null);
        if (currentUserRole !== 'SUPER_ADMIN') {
          setCurrentUserRole('SUPER_ADMIN');
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('edumaster_superadmin_authenticated', 'true');
        }
        setView('SUPER_ADMIN');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/super-admin')) {
          window.history.pushState({}, '', requestedPath || '/super-admin/dashboard');
        }
      } else {
        setRouteGuardNotice("Please sign in with your Super Admin credentials to access the Developer Portal.");
        setInitialLoginRole('SUPER_ADMIN');
        setView('LOGIN');
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/login');
        }
      }
    } catch (err) {
      console.error('Route Guard Error:', err);
      setView('LOGIN');
    }
  };

  const attemptOpenSuperAdmin = async () => {
    setIsSuperAdminLoading(true);
    try {
      await enforceSuperAdminRouteGuard('/super-admin/dashboard');
    } finally {
      setIsSuperAdminLoading(false);
    }
  };

  const handleSuperAdminSetupComplete = () => {
    setRouteGuardNotice("Super Admin setup completed successfully! Please sign in with your newly created Super Admin credentials.");
    setInitialLoginRole('SUPER_ADMIN');
    setView('LOGIN');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/login');
    }
  };

  useEffect(() => {
    // Listen for URL changes and enforce route guard for /super-admin/*
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path.startsWith('/super-admin')) {
        enforceSuperAdminRouteGuard(path);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [currentUserRole]);

  useEffect(() => {
    // Seed default demo credentials in Firestore on initial app mount
    ensureSeedData();
  }, []);

  useEffect(() => {
    // Check global maintenance settings
    getGlobalSystemSettings().then((cfg) => {
      if (cfg && cfg.maintenanceMode) {
        setMaintenanceInfo({
          isMaintenance: true,
          notice: cfg.maintenanceNotice || 'We are currently performing scheduled system maintenance and updates. Please try again later.',
          bypassPin: cfg.maintenanceBypassPin || '059200'
        });
      } else {
        setMaintenanceInfo(null);
      }
    }).catch(() => {
      setMaintenanceInfo(null);
    });
  }, [view]);

  const handleValidationSuccess = (result: VerificationResult) => {
    setVerificationResult(result);
    if (result.school) {
      setActiveSchool(result.school);
      setActiveSchoolId(result.school.schoolId);
    }
  };

  const handleValidationFailure = (result: VerificationResult) => {
    setVerificationResult(result);
  };

  const handleContinueToSetup = () => {
    setVerificationResult(null);
    setView('SETUP_WIZARD');
  };

  const handleLoginSuccess = async (role: UserRole, email: string, schoolIdInput?: string) => {
    const schId = schoolIdInput || 'SCH-GH-000001';
    setActiveSchoolId(schId);
    setUserEmail(email);
    setCurrentUserRole(role);

    const schDetails = await getSchoolDetails(schId);
    if (schDetails) {
      setActiveSchool(schDetails);
    }

    if (role === 'SUPER_ADMIN') {
      setRouteGuardNotice(null);
      setView('SUPER_ADMIN');
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/super-admin/dashboard');
      }
    } else if (role === 'TEACHER') {
      setView('TEACHER_DASHBOARD');
    } else if (role === 'PARENT') {
      setView('PARENT_PORTAL');
    } else if (role === 'STUDENT') {
      setView('STUDENT_DASHBOARD');
    } else {
      setView('ADMIN_DASHBOARD');
    }
  };

  const handleLaunchRoleImpersonation = (
    role: UserRole,
    schoolId: string,
    email: string,
    schoolName: string
  ) => {
    setImpersonationSession({
      isImpersonating: true,
      originalRole: 'SUPER_ADMIN',
      impersonatedRole: role,
      schoolId,
      schoolName,
      userEmail: email
    });
    setActiveSchoolId(schoolId);
    setUserEmail(email);
    setCurrentUserRole(role);

    if (role === 'TEACHER') {
      setView('TEACHER_DASHBOARD');
    } else if (role === 'STUDENT') {
      setView('STUDENT_DASHBOARD');
    } else if (role === 'PARENT') {
      setView('PARENT_PORTAL');
    } else {
      setView('ADMIN_DASHBOARD');
    }
  };

  const handleSwitchImpersonationRole = (newRole: UserRole) => {
    if (!impersonationSession) return;
    const defaultEmails: Record<UserRole, string> = {
      SUPER_ADMIN: 'superadmin@system.master',
      SCHOOL_ADMIN: 'admin@school.edu.gh',
      TEACHER: 'e.osei@school.edu.gh',
      STUDENT: 'STU-2026-001',
      PARENT: 'parent@edu.gh'
    };

    const targetEmail = defaultEmails[newRole] || `${newRole.toLowerCase()}@school.edu.gh`;
    setImpersonationSession({
      ...impersonationSession,
      impersonatedRole: newRole,
      userEmail: targetEmail
    });
    setUserEmail(targetEmail);
    setCurrentUserRole(newRole);
    setShowRoleSwitcherDropdown(false);

    if (newRole === 'TEACHER') {
      setView('TEACHER_DASHBOARD');
    } else if (newRole === 'STUDENT') {
      setView('STUDENT_DASHBOARD');
    } else if (newRole === 'PARENT') {
      setView('PARENT_PORTAL');
    } else if (newRole === 'SUPER_ADMIN') {
      handleExitImpersonation();
    } else {
      setView('ADMIN_DASHBOARD');
    }
  };

  const handleExitImpersonation = () => {
    setImpersonationSession(null);
    setCurrentUserRole('SUPER_ADMIN');
    setView('SUPER_ADMIN');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/super-admin/dashboard');
    }
  };

  const handleAutoLogout = (reason?: string) => {
    setCurrentUserRole(null);
    setUserEmail('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('edumaster_superadmin_authenticated');
    }
    setRouteGuardNotice("Your session was automatically closed due to 30 minutes of user inactivity.");
    setInitialLoginRole('SCHOOL_ADMIN');
    setView('LOGIN');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/login');
    }
  };

  const isActiveLoggedInSession =
    view === 'SUPER_ADMIN' ||
    view === 'ADMIN_DASHBOARD' ||
    view === 'TEACHER_DASHBOARD' ||
    view === 'STUDENT_DASHBOARD' ||
    view === 'PARENT_PORTAL';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      
      {/* PERSISTENT GLOBAL THEME CONTROLS */}
      <aside aria-label="Global preferences" className="fixed top-3 right-3 z-50 flex items-center gap-2 theme-toggle-floating no-print">
        <ThemeToggle showLabel={false} variant="compact" />
      </aside>

      {/* STICKY SUPER ADMIN ROLE IMPERSONATION BANNER */}
      {impersonationSession && view !== 'SUPER_ADMIN' && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-600 via-amber-700 to-cyan-900 text-white shadow-xl border-b border-amber-400/40 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-200 shrink-0">
              <UserCheck className="w-3.5 h-3.5 animate-pulse text-amber-200" />
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold uppercase tracking-wider text-amber-200 text-[11px] bg-black/30 px-2 py-0.5 rounded">
                Super Admin Support Mode
              </span>
              <span className="text-slate-200">
                Viewing as: <strong className="text-white uppercase font-mono">{impersonationSession.impersonatedRole}</strong>
              </span>
              <span className="text-amber-200/90 font-mono text-[11px]">
                • Tenant: <strong>{impersonationSession.schoolName}</strong> ({impersonationSession.schoolId})
              </span>
              <span className="text-slate-300 font-mono text-[11px]">
                • Test ID: {impersonationSession.userEmail}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switch Role Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleSwitcherDropdown(!showRoleSwitcherDropdown)}
                className="px-2.5 py-1 bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-300/40 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>{t('impersonate.switch_role', 'Switch Role')}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showRoleSwitcherDropdown && (
                <div className="absolute right-0 mt-1.5 w-44 bg-[#0f111a] border border-slate-700 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                  <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-800">
                    Switch Test Persona
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwitchImpersonationRole('SCHOOL_ADMIN')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                  >
                    School Administrator
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchImpersonationRole('TEACHER')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Teacher / Instructor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchImpersonationRole('STUDENT')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Student / Learner
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchImpersonationRole('PARENT')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-amber-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Parent / Guardian
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleExitImpersonation}
              className="px-3 py-1 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('impersonate.exit', 'Exit Impersonation')}</span>
            </button>
          </div>
        </div>
      )}

      <AutoLogoutHandler
        isActiveSession={isActiveLoggedInSession}
        onLogout={handleAutoLogout}
        inactivityLimitMinutes={30}
      />

      {/* GLOBAL SYSTEM MAINTENANCE SCREEN OVERRIDE FOR SCHOOL USERS */}
      {maintenanceInfo?.isMaintenance && view !== 'SUPER_ADMIN' ? (
        <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center p-4 font-sans text-slate-200">
          <div className="max-w-md w-full bg-[#0f111a] border border-amber-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mx-auto shadow-lg">
              <Wrench className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full inline-block">
                System Maintenance
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">System Under Maintenance</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {maintenanceInfo.notice}
              </p>
            </div>

            <div className="p-4 bg-[#161925] border border-slate-800 rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Super Admin Developer Bypass</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Authorized Super Administrators can bypass maintenance mode to access the management portal.
              </p>
              <div className="pt-2 space-y-2">
                <input
                  type="password"
                  placeholder="Enter Security Bypass PIN (Default: 059200)"
                  value={bypassPinInput}
                  onChange={(e) => {
                    setBypassPinInput(e.target.value);
                    setBypassError('');
                  }}
                  className="w-full px-3.5 py-2 bg-[#0a0b10] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                {bypassError && (
                  <p className="text-[11px] text-rose-400 font-medium">{bypassError}</p>
                )}
                <button
                  onClick={() => {
                    if (bypassPinInput === maintenanceInfo.bypassPin || bypassPinInput === '059200') {
                      setView('SUPER_ADMIN');
                    } else {
                      setBypassError('Invalid Security Bypass PIN.');
                    }
                  }}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Lock className="w-3.5 h-3.5" /> Authorize Developer Access
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
              EduMaster Multi-Tenant SaaS Engine • Support: 0592005260
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 1. Welcome Screen */}
          {view === 'WELCOME' && (
            <WelcomeScreen
              onGetStarted={() => setView('ACTIVATION')}
              onOpenSuperAdmin={attemptOpenSuperAdmin}
              onOpenLogin={() => setView('LOGIN')}
              isSuperAdminLoading={isSuperAdminLoading}
            />
          )}

          {/* 2. Activation Credentials Verification Screen */}
          {view === 'ACTIVATION' && (
            <ActivationScreen
              onBackToWelcome={() => setView('WELCOME')}
              onValidationSuccess={handleValidationSuccess}
              onValidationFailure={handleValidationFailure}
            />
          )}

          {/* 3. Super Admin Initial Account Setup */}
          {view === 'SUPER_ADMIN_SETUP' && (
            <SuperAdminSetup
              onSetupComplete={handleSuperAdminSetupComplete}
              onCancel={() => setView('WELCOME')}
            />
          )}

          {/* 4. Developer Super Admin Portal */}
          {view === 'SUPER_ADMIN' && (
            <SuperAdminPortal
              onBackToApp={() => setView('WELCOME')}
              onLoginSuccess={(role) => setCurrentUserRole(role)}
              onImpersonateRole={handleLaunchRoleImpersonation}
            />
          )}

          {/* 4. Guided School Setup Wizard */}
          {view === 'SETUP_WIZARD' && activeSchool && (
            <SchoolSetupWizard
              school={activeSchool}
              onSetupCompleted={() => setView('ADMIN_DASHBOARD')}
            />
          )}

          {/* 5. School Admin Dashboard */}
          {view === 'ADMIN_DASHBOARD' && (
            <AdminDashboard
              schoolId={activeSchoolId}
              onLogout={() => {
                setCurrentUserRole(null);
                setView('WELCOME');
              }}
              onOpenSuperAdmin={attemptOpenSuperAdmin}
            />
          )}

          {/* 6. Teacher Portal */}
          {view === 'TEACHER_DASHBOARD' && (
            <TeacherDashboard
              schoolId={activeSchoolId}
              email={userEmail}
              onLogout={() => {
                setCurrentUserRole(null);
                setView('WELCOME');
              }}
            />
          )}

          {/* 7. Student Portal */}
          {view === 'STUDENT_DASHBOARD' && (
            <StudentDashboard
              schoolId={activeSchoolId}
              email={userEmail}
              onLogout={() => {
                setCurrentUserRole(null);
                setView('WELCOME');
              }}
            />
          )}

          {/* 8. Parent Portal */}
          {view === 'PARENT_PORTAL' && (
            <ParentPortalView
              schoolId={activeSchoolId}
              parentEmail={userEmail}
              onLogout={() => {
                setCurrentUserRole(null);
                setView('WELCOME');
              }}
            />
          )}

          {/* 8. Authorized Portal Login */}
          {view === 'LOGIN' && (
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onBackToWelcome={() => setView('WELCOME')}
              onOpenSuperAdmin={attemptOpenSuperAdmin}
              routeGuardNotice={routeGuardNotice}
              initialRole={initialLoginRole}
            />
          )}

          {/* Verification Result Modal */}
          {verificationResult && (
            <ActivationResultModal
              result={verificationResult}
              onTryAgain={() => setVerificationResult(null)}
              onContinueToSetup={handleContinueToSetup}
            />
          )}
        </>
      )}
    </div>
  );
}
