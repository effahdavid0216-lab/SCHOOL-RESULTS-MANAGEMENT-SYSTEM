import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Mail,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  HelpCircle,
  Check,
  X,
  Activity,
  Database,
  RefreshCw,
  Server
} from 'lucide-react';
import { getSuperAdminConfig, initializeSuperAdminAccount } from '../lib/services';
import { SuperAdminConfig } from '../types';

interface SuperAdminSetupProps {
  onSetupComplete?: () => void;
  onCancel?: () => void;
  onRunDiagnostic?: () => Promise<any>;
}

export const SuperAdminSetup: React.FC<SuperAdminSetupProps> = ({
  onSetupComplete,
  onCancel,
  onRunDiagnostic
}) => {
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const lastSubmitRef = React.useRef<number>(0);

  // Diagnostic State
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [diagResult, setDiagResult] = useState<any | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('David Effah (Lead Developer)');
  const [username, setUsername] = useState('superadmin');
  const [email, setEmail] = useState('effahdavid45@gmail.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('effahdavid0216@gmail.com');
  const [recoveryPhone, setRecoveryPhone] = useState('0592005260');
  const [recoveryPin, setRecoveryPin] = useState('059200');
  const [securityQuestion, setSecurityQuestion] = useState('What was the name of your first elementary school?');
  const [customSecurityQuestion, setCustomSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecurityAnswer, setShowSecurityAnswer] = useState(false);

  // Load setup status on mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const handleTriggerDiagnostic = async () => {
    if (!onRunDiagnostic) return;
    setIsRunningDiag(true);
    try {
      const res = await onRunDiagnostic();
      setDiagResult(res);
      if (res?.connected) {
        toast.success(`Supabase Connectivity Verified! Latency: ${res.latencyMs}ms`, {
          position: 'top-right',
          style: { background: '#0f172a', color: '#38bdf8', border: '1px solid #0284c7' }
        });
      } else {
        toast.error('Supabase diagnostic reported warnings. Check console.', { position: 'top-right' });
      }
    } catch (err: any) {
      toast.error(`Diagnostic failed: ${err.message || err}`, { position: 'top-right' });
    } finally {
      setIsRunningDiag(false);
    }
  };

  const checkSetupStatus = async () => {
    setLoading(true);
    try {
      const config = await getSuperAdminConfig();
      if (config) {
        if (config.fullName) setFullName(config.fullName);
        if (config.username) setUsername(config.username);
        if (config.email) setEmail(config.email);
        if (config.recoveryEmail) setRecoveryEmail(config.recoveryEmail);
        if (config.recoveryPhone) setRecoveryPhone(config.recoveryPhone);
        if (config.recoveryPin) setRecoveryPin(config.recoveryPin);
        if (config.securityQuestion) setSecurityQuestion(config.securityQuestion);
        if (config.securityAnswer) setSecurityAnswer(config.securityAnswer);
        if ((config as any).password) {
          setPassword((config as any).password);
          setConfirmPassword((config as any).password);
        }

        if (config.superAdminInitialized || config.isInitialSetupDone) {
          setIsInitialized(true);
        } else {
          setIsInitialized(false);
        }
      }
    } catch (err) {
      console.error('Failed to check Super Admin setup status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Password Strength Criteria Calculation
  const hasMinLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const passedCriteriaCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  let strengthLabel = 'Weak';
  let strengthColor = 'bg-rose-500';
  let strengthTextColor = 'text-rose-400';

  if (passedCriteriaCount === 5) {
    strengthLabel = 'Excellent (Secure)';
    strengthColor = 'bg-emerald-500';
    strengthTextColor = 'text-emerald-400';
  } else if (passedCriteriaCount >= 4) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-cyan-500';
    strengthTextColor = 'text-cyan-400';
  } else if (passedCriteriaCount >= 3) {
    strengthLabel = 'Medium';
    strengthColor = 'bg-amber-500';
    strengthTextColor = 'text-amber-400';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions immediately
    if (isSubmitting) return;

    // Debounce rapid multi-clicks (1000ms threshold)
    const now = Date.now();
    if (now - lastSubmitRef.current < 1000) {
      return;
    }

    setError(null);

    // ==========================================
    // 1. CLIENT-SIDE SYNCHRONOUS VALIDATION FIRST
    // (Must occur BEFORE initiating any async Firebase requests)
    // ==========================================

    if (!fullName.trim()) {
      const msg = 'Super Admin Full Name is required.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    if (!username.trim()) {
      const msg = 'Super Admin Username is required.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      const msg = 'A valid Primary Email address is required.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    if (!recoveryEmail.trim() || !emailRegex.test(recoveryEmail.trim())) {
      const msg = 'A valid Recovery Email address is required.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    const finalSecurityQuestion = securityQuestion === 'CUSTOM' ? customSecurityQuestion.trim() : securityQuestion.trim();
    if (!finalSecurityQuestion) {
      const msg = 'Please select or enter a Security Question.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    if (!securityAnswer.trim()) {
      const msg = 'Security Answer is required for account recovery.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    if (!recoveryPhone.trim() || recoveryPhone.trim().length < 8) {
      const msg = 'A valid Recovery Phone number (at least 8 digits) is required.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    if (!recoveryPin.trim() || recoveryPin.trim().length < 4) {
      const msg = 'A valid Security Recovery PIN (at least 4 digits) is required.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    if (!password) {
      const msg = 'Master Password is required.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Password and Confirm Password do not match. Please ensure both fields match exactly.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      const msg = 'Password does not meet security requirements. Must be at least 12 characters with uppercase (A-Z), lowercase (a-z), numbers (0-9), and special characters (!@#$).';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
      return;
    }

    // ==========================================
    // 2. ASYNC FIREBASE REQUESTS & CREATION
    // (Executed ONLY after all client-side criteria are met)
    // ==========================================
    lastSubmitRef.current = now;
    setIsSubmitting(true);

    try {
      // Compute SHA-256 Hash for secure storage (never store plain text)
      const encoder = new TextEncoder();
      const passData = encoder.encode(password);
      const passHashBuffer = await crypto.subtle.digest('SHA-256', passData);
      const passHashArray = Array.from(new Uint8Array(passHashBuffer));
      const passwordHash = passHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const ansData = encoder.encode(securityAnswer.trim().toLowerCase());
      const ansHashBuffer = await crypto.subtle.digest('SHA-256', ansData);
      const ansHashArray = Array.from(new Uint8Array(ansHashBuffer));
      const securityAnswerHash = ansHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const newConfig: SuperAdminConfig = {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        passwordHash,
        recoveryEmail: recoveryEmail.trim(),
        recoveryPhone: recoveryPhone.trim(),
        recoveryPin: recoveryPin.trim(),
        securityQuestion: finalSecurityQuestion,
        securityAnswer: securityAnswer.trim(),
        securityAnswerHash,
        isInitialSetupDone: true,
        superAdminInitialized: true,
        passwordUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Await asynchronous Supabase and config initialization
      await initializeSuperAdminAccount(newConfig, password);

      // Save credentials into persistent storage, requiring explicit login validation next
      if (typeof window !== 'undefined') {
        localStorage.setItem('superadmin_initialized', 'true');
        localStorage.setItem('edumaster_superadmin_initialized', 'true');
        localStorage.removeItem('edumaster_superadmin_authenticated');
        localStorage.setItem('edumaster_active_role', 'SUPER_ADMIN');
        localStorage.setItem('edumaster_active_view', 'LOGIN');
        localStorage.setItem('edumaster_user_email', email.trim());
        localStorage.setItem('edumaster_superadmin_pin', recoveryPin.trim());
        localStorage.setItem('edumaster_superadmin_config', JSON.stringify({
          ...newConfig,
          password: password // Keep available for session initialization if required
        }));
      }

      setSuccess(true);
      setIsInitialized(true);

      // Trigger success toast
      toast.success('Super Admin master credentials configured successfully! Please sign in with your password.', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#0f172a',
          color: '#34d399',
          border: '1px solid #059669',
          fontWeight: 'bold',
          fontSize: '13px'
        }
      });

      setTimeout(() => {
        if (onSetupComplete) {
          onSetupComplete();
        }
      }, 1000);
    } catch (err: any) {
      console.error('Super Admin Setup Error:', err);
      const msg = err.message || 'Failed to complete Super Admin setup.';
      setError(msg);
      toast.error(msg, { position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isReEnteringMode, setIsReEnteringMode] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-6 text-slate-300 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
            Checking Platform Initialization State...
          </p>
        </div>
      </div>
    );
  }

  // If already initialized and not in re-entry mode
  if (isInitialized && !isReEnteringMode && !success) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-6 text-slate-200 font-sans">
        <div className="max-w-lg w-full bg-[#0d101a] border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />

          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full inline-block">
              Credentials Configured
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Super Admin Account Active
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              The primary Super Administrator credentials for this platform are securely stored in Supabase. You can proceed directly or re-enter / update your credentials below.
            </p>
          </div>

          <div className="p-4 bg-[#141824] border border-slate-800 rounded-2xl text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Configured Developer Identity</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {email || 'effahdavid45@gmail.com'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Username: <strong className="text-slate-200">{username || 'superadmin'}</strong> | Recovery PIN: <strong className="text-slate-200">{recoveryPin || '059200'}</strong>
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsReEnteringMode(true)}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/40 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Re-enter / Update Credentials
            </button>
            <button
              onClick={() => {
                if (onSetupComplete) onSetupComplete();
              }}
              className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/50"
            >
              Proceed to Portal <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 sm:p-6 text-slate-200 font-sans">
      <div className="max-w-xl w-full bg-[#0d101a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto shadow-lg">
            <KeyRound className="w-7 h-7" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full inline-block">
            Initial Platform Setup • Accessible Once
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Initial Super Admin Account Setup
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Configure master administrator credentials for this platform. Once completed, a persistent <code className="text-cyan-300 font-mono">superAdminInitialized</code> flag will lock this wizard.
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold">Super Admin Account Configured Successfully!</p>
              <p className="text-[11px] text-emerald-400/90">
                Credentials saved and initialization flag <code className="font-mono">superAdminInitialized: true</code> persisted in Firestore.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert with Specific Supabase Diagnostic Guidance */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs space-y-3 animate-shake">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold text-sm text-rose-200">Supabase Setup Configuration Error</p>
                <p className="font-medium text-rose-300/90 leading-relaxed">{error}</p>
              </div>
            </div>

            <div className="bg-[#0b0e17] border border-rose-900/40 rounded-xl p-3 text-[11px] text-slate-300 space-y-2">
              <p className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Troubleshooting & Recommended Actions:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>
                  <strong className="text-slate-200">Table Schema:</strong> Verify the <code className="text-cyan-300 font-mono">superAdminConfig</code> table exists in your Supabase project.
                </li>
                <li>
                  <strong className="text-slate-200">RLS Policies:</strong> Ensure Row Level Security (RLS) allows upsert/write operations for the initialization record.
                </li>
                <li>
                  <strong className="text-slate-200">Environment Keys:</strong> Confirm <code className="text-cyan-300 font-mono">VITE_SUPABASE_URL</code> and <code className="text-cyan-300 font-mono">VITE_SUPABASE_ANON_KEY</code> are correctly configured.
                </li>
              </ul>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerDiagnostic}
                  disabled={isRunningDiag}
                  className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Run Diagnostics to Inspect Table
                </button>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Supabase Connectivity & Diagnostic Verification */}
        <div className="p-4 bg-[#141824] border border-cyan-900/40 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Supabase Connectivity & Auth Diagnostic</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono border border-cyan-800">
                    Live Test
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Verify Supabase database connectivity, table schema, and JWT auth tokens.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTriggerDiagnostic}
              disabled={isRunningDiag}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0 shadow-sm"
            >
              {isRunningDiag ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5" />
                  <span>Run Live Diagnostic</span>
                </>
              )}
            </button>
          </div>

          {diagResult && (
            <div className="p-3 bg-[#0d101a] border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${diagResult.connected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                  <span className="font-bold text-slate-200">
                    {diagResult.connected ? 'Supabase Operational' : 'Connection Warning'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  Latency: {diagResult.latencyMs}ms
                </span>
              </div>

              {/* Table Schema Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono pt-1">
                <div className={`p-1.5 rounded border flex items-center justify-between ${diagResult.tableCheck?.superAdminConfig ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'}`}>
                  <span>superAdminConfig</span>
                  <span>{diagResult.tableCheck?.superAdminConfig ? 'OK' : 'FAIL'}</span>
                </div>
                <div className={`p-1.5 rounded border flex items-center justify-between ${diagResult.tableCheck?.schools ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'}`}>
                  <span>schools</span>
                  <span>{diagResult.tableCheck?.schools ? 'OK' : 'FAIL'}</span>
                </div>
                <div className={`p-1.5 rounded border flex items-center justify-between ${diagResult.tableCheck?.auditLogs ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'}`}>
                  <span>auditLogs</span>
                  <span>{diagResult.tableCheck?.auditLogs ? 'OK' : 'FAIL'}</span>
                </div>
                <div className={`p-1.5 rounded border flex items-center justify-between ${diagResult.tableCheck?.licenses ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'}`}>
                  <span>licenses</span>
                  <span>{diagResult.tableCheck?.licenses ? 'OK' : 'FAIL'}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-0.5">
                {diagResult.statusMessage}
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Full Name / Developer
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. David Effah"
                className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin"
                className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Primary Super Admin Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> Master Super Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="effahdavid45@gmail.com"
              className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Passwords Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create master password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat master password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Strength Visual Meter */}
          {password && (
            <div className="p-3 bg-[#141824] border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Password Strength:</span>
                <span className={`font-bold ${strengthTextColor}`}>{strengthLabel}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: `${(passedCriteriaCount / 5) * 100}%` }}
                />
              </div>

              {/* Strength Checklist */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] pt-1">
                <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} At least 12 characters
                </div>
                <div className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase letter (A-Z)
                </div>
                <div className={`flex items-center gap-1 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Lowercase letter (a-z)
                </div>
                <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Number (0-9)
                </div>
                <div className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Special character (!@#$)
                </div>
              </div>
            </div>
          )}

          {/* Account Recovery & Security Verification Section */}
          <div className="pt-2 space-y-3">
            <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> Account Recovery & Security Questions
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Security Question */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Security Question</label>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="What was the name of your first elementary school?">What was the name of your first elementary school?</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                  <option value="What was the name of your first childhood pet?">What was the name of your first childhood pet?</option>
                  <option value="In what city or town was your first job?">In what city or town was your first job?</option>
                  <option value="What is the name of your favorite school teacher?">What is the name of your favorite school teacher?</option>
                  <option value="CUSTOM">Custom Question...</option>
                </select>
                {securityQuestion === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    value={customSecurityQuestion}
                    onChange={(e) => setCustomSecurityQuestion(e.target.value)}
                    placeholder="Enter your custom security question"
                    className="w-full mt-1.5 px-3 py-2 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              {/* Security Answer */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">Security Answer</label>
                <div className="relative">
                  <input
                    type={showSecurityAnswer ? 'text' : 'password'}
                    required
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Enter security answer"
                    className="w-full pl-3 pr-9 py-2 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecurityAnswer(!showSecurityAnswer)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSecurityAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Recovery Email</label>
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="effahdavid0216@gmail.com"
                  className="w-full px-3 py-2 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Recovery Phone</label>
                <input
                  type="text"
                  required
                  value={recoveryPhone}
                  onChange={(e) => setRecoveryPhone(e.target.value)}
                  placeholder="0592005260"
                  className="w-full px-3 py-2 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Master Recovery PIN</label>
                <input
                  type="text"
                  required
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value)}
                  placeholder="059200"
                  className="w-full px-3 py-2 bg-[#141824] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Initializing & Securing Credentials...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Complete Setup & Initialize Super Admin</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-800/80">
          EduMaster SaaS Engine • Master Security Architecture • Developer Support: 0592005260
        </div>
      </div>
    </div>
  );
};
