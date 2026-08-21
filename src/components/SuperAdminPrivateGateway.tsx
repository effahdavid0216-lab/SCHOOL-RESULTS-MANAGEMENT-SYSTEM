import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Terminal,
  Server,
  Activity,
  Cpu
} from 'lucide-react';
import { authenticatePortalUser, getSuperAdminConfig } from '../lib/services';
import { validateSuperAdminSessionWithSupabase } from '../lib/authService';
import { LanguageToggle } from './LanguageToggle';

interface Props {
  onLoginSuccess: (email: string) => void;
  onOpenSetup: () => void;
  onBackToPublicSite: () => void;
  onRunDiagnostic?: () => Promise<any>;
}

export const SuperAdminPrivateGateway: React.FC<Props> = ({
  onLoginSuccess,
  onOpenSetup,
  onBackToPublicSite,
  onRunDiagnostic
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    setIsCheckingSetup(true);
    try {
      const cfg = await getSuperAdminConfig();
      const initialized = !!(cfg && (cfg.superAdminInitialized || cfg.isInitialSetupDone));
      setIsInitialized(initialized);

      // Pre-check if already authenticated
      const session = await validateSuperAdminSessionWithSupabase();
      if (session.isValid && session.email) {
        onLoginSuccess(session.email);
      }
    } catch (err) {
      console.error('Error checking super admin status:', err);
      setIsInitialized(true);
    } finally {
      setIsCheckingSetup(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsVerifying(true);

    try {
      const cleanIdentifier = identifier.trim();
      const cleanPassword = password.trim();

      if (!cleanIdentifier || !cleanPassword) {
        setErrorMessage('Please enter both your master username/email and password.');
        setIsVerifying(false);
        return;
      }

      const res = await authenticatePortalUser(
        'HQ_GLOBAL',
        'SUPER_ADMIN',
        cleanIdentifier,
        cleanPassword
      );

      if (res.success) {
        setSuccessMessage(res.message || 'Developer credentials verified. Launching Super Admin portal...');
        setTimeout(() => {
          onLoginSuccess(res.userIdentifier || cleanIdentifier);
        }, 300);
      } else {
        setErrorMessage(res.message || 'Invalid Super Admin credentials. Access denied.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication service error.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen bg-[#06070b] text-slate-200 flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-lg shadow-cyan-900/30">
            <ShieldCheck className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <p className="text-xs text-cyan-300 font-semibold tracking-wider uppercase">
            Verifying Private Owner Gateway...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06070b] text-slate-200 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:28px_28px]"></div>

      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <LanguageToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Back Link to Standard Public Site */}
        <button
          onClick={onBackToPublicSite}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Public Portal
        </button>

        {/* Private Gateway Badge */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-cyan-950/60 border border-cyan-400/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="text-center space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] uppercase font-mono tracking-widest font-bold">
            <Terminal className="w-3 h-3 text-cyan-400" /> Private Owner Gateway
          </div>
          <h2 className="text-2xl sm:text-3xl font-light text-white serif italic">
            Super Administrator
          </h2>
          <p className="text-xs text-slate-400">
            Confidential System Management & Multi-Tenant Oversight
          </p>
        </div>

        {/* Uninitialized Notice */}
        {isInitialized === false && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl text-amber-200 text-xs space-y-3 shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Initial Setup Required</p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  The primary Super Admin account has not been configured yet. Initialize the master credentials to secure this platform.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenSetup}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <KeyRound className="w-4 h-4" /> Initialize Master Account
            </button>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-300">Verification Successful</p>
              <p className="text-[11px] text-emerald-200/90">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-950/50 border border-rose-500/40 rounded-2xl text-rose-200 text-xs flex items-start gap-2.5 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-rose-200">Access Denied</p>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Login Form Container */}
        <div className="bg-[#0b0d16] border border-cyan-900/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/30 relative">
          <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold mb-1.5">
                Master Identifier (Username / Developer Email)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. effahdavid45@gmail.com or superadmin"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#121524] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold">
                  Master Password / Recovery PIN
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#121524] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/30"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Verifying Master Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-cyan-200" />
                  <span>Authorize Super Admin Session</span>
                </>
              )}
            </button>
          </form>

          {/* Diagnostics Quick Link */}
          {onRunDiagnostic && (
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-slate-500">
                <Server className="w-3.5 h-3.5 text-cyan-400" /> Multi-Tenant Cloud
              </span>
              <button
                type="button"
                onClick={onRunDiagnostic}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                Run Diagnostics
              </button>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-[10px] text-slate-500 font-mono leading-relaxed">
          CONFIDENTIAL SYSTEM • ACCESS RESTRICTED TO AUTHORIZED PLATFORM OWNERS ONLY
        </div>
      </div>
    </div>
  );
};
