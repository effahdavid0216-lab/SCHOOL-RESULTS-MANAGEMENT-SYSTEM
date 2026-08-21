import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  User,
  Lock,
  ArrowLeft,
  KeyRound,
  Building2,
  Users,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  ShieldAlert,
  AlertCircle,
  Loader2,
  Key,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserRole } from '../types';
import { sendPasswordResetEmail, verifyRecoveryTokenAndResetPassword } from '../lib/authService';
import { authenticatePortalUser } from '../lib/services';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onLoginSuccess: (role: UserRole, email: string, schoolId?: string) => void;
  onBackToWelcome: () => void;
  onOpenSuperAdmin: () => void;
  onOpenSuperAdminSetup?: () => void;
  routeGuardNotice?: string | null;
  initialRole?: UserRole;
}

export const LoginScreen: React.FC<Props> = ({
  onLoginSuccess,
  onBackToWelcome,
  onOpenSuperAdmin,
  onOpenSuperAdminSetup,
  routeGuardNotice,
  initialRole = 'SCHOOL_ADMIN'
}) => {
  const { t } = useLanguage();
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [schoolId, setSchoolId] = useState('SCH-GH-000001');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Forgot Password Flow State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessNotice, setForgotSuccessNotice] = useState('');
  const [demoTokenDispatched, setDemoTokenDispatched] = useState<string | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsVerifying(true);

    try {
      const cleanSchoolId = schoolId.trim() || 'SCH-GH-000001';
      const cleanIdentifier = email.trim();
      const cleanPassword = password.trim();

      const authResult = await authenticatePortalUser(
        cleanSchoolId,
        activeRole,
        cleanIdentifier,
        cleanPassword
      );

      if (authResult.success) {
        setToastMessage(authResult.message || `Signed in successfully. Redirecting to workspace...`);
        setShowToast(true);
        setTimeout(() => {
          onLoginSuccess(
            authResult.userRole || activeRole,
            authResult.userIdentifier || cleanIdentifier,
            cleanSchoolId
          );
        }, 350);
      } else {
        setLoginError(authResult.error || authResult.message || 'Authentication failed. Please verify your credentials.');
        setIsVerifying(false);
      }
    } catch (err: any) {
      console.warn('Login error:', err);
      setLoginError(err.message || 'An unexpected error occurred during verification.');
      setIsVerifying(false);
    }
  };

  const handleSendRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccessNotice('');
    if (!forgotEmail.trim()) {
      setForgotError('Please provide your registered account email.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await sendPasswordResetEmail(forgotEmail.trim());
      if (res.success) {
        setForgotSuccessNotice(res.message);
        if (res.verificationToken) {
          setDemoTokenDispatched(res.verificationToken);
        }
        setForgotStep(2);
      } else {
        setForgotError(res.error || res.message);
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to dispatch recovery email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccessNotice('');

    if (!recoveryToken.trim()) {
      setForgotError('Please enter the 6-digit recovery token sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('New passwords do not match.');
      return;
    }

    setIsVerifyingToken(true);
    try {
      const res = await verifyRecoveryTokenAndResetPassword(
        forgotEmail.trim(),
        recoveryToken.trim(),
        newPassword
      );

      if (res.success) {
        setForgotSuccessNotice(res.message);
        setPassword(newPassword);
        setEmail(forgotEmail.trim());
        setForgotStep(3);
      } else {
        setForgotError(res.message || 'Invalid or expired token.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Password update failed.');
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setIsForgotPasswordOpen(false);
    setForgotStep(1);
    setForgotError('');
    setForgotSuccessNotice('');
    setDemoTokenDispatched(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* Persistent Global Language Toggle in Header */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <LanguageToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <button
          onClick={onBackToWelcome}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> {t('auth.back_to_welcome', 'Back to Welcome Page')}
        </button>

        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/30">
            <span className="text-white font-bold text-lg italic">E</span>
          </div>
        </div>

        <h2 className="text-center text-3xl font-light text-white serif italic mb-1">
          {t('app.name', 'EduMaster Pro')}
        </h2>
        <p className="text-center text-xs text-slate-400 mb-6">
          {t('auth.portal_signin', 'Authorized Portal Sign-In')}
        </p>

        {/* Success Toast Notice */}
        {showToast && (
          <div className="mb-6 p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs flex items-center gap-3 shadow-xl shadow-emerald-950/40 transition-all duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-bold text-emerald-300">Authentication Successful</p>
              <p className="text-[11px] text-emerald-200/90">{toastMessage}</p>
            </div>
          </div>
        )}

        {/* Route Guard Notice Banner */}
        {routeGuardNotice && (
          <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-200 text-xs flex items-start gap-3 shadow-lg">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-cyan-300">Super Admin Authentication Required</p>
              <p className="text-[11px] text-cyan-200/90 leading-relaxed">{routeGuardNotice}</p>
            </div>
          </div>
        )}

        {/* Role Tabs for Public School Portal Users */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#161925] border border-slate-700/80 rounded-xl mb-6 text-[10px] font-bold uppercase tracking-wider text-center">
          <button
            type="button"
            onClick={() => setActiveRole('SCHOOL_ADMIN')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeRole === 'SCHOOL_ADMIN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('TEACHER')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeRole === 'TEACHER' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('STUDENT')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeRole === 'STUDENT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Student
          </button>
        </div>

        {/* Login Form */}
        <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {!isForgotPasswordOpen ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-rose-200">Sign-In Notice</p>
                    <p className="text-[11px] text-rose-300/90 leading-relaxed">{loginError}</p>
                  </div>
                </div>
              )}

              {/* Student/Teacher Portal Tips */}
              {activeRole === 'STUDENT' && (
                <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-blue-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-300 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Student Login Credentials
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    <strong>Username:</strong> Student Admission Number (e.g., <span className="text-blue-300 font-mono">STU-2026-001</span>)<br />
                    <strong>Password:</strong> Date of Birth (e.g., <span className="text-blue-300 font-mono">2014-06-12</span>) or assigned password.
                  </p>
                </div>
              )}

              {activeRole === 'TEACHER' && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-indigo-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-[11px]">
                    <User className="w-3.5 h-3.5 text-indigo-400" /> Teacher Portal Sign-In
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Enter your <strong>Staff ID</strong> (e.g. <span className="text-indigo-300 font-mono">TCH-001</span>) or <strong>Official Email</strong>, along with your secure password.
                  </p>
                </div>
              )}

              {activeRole !== 'SUPER_ADMIN' ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    {t('auth.school_id', 'Unique School ID')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SCH-GH-000001"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-lg text-white text-xs font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Global Platform Super Admin</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-700/50">SYSTEM_MASTER</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                  {activeRole === 'SUPER_ADMIN' ? 'Super Admin Username / Email' :
                   activeRole === 'STUDENT' ? 'Student Admission No (Username)' :
                   activeRole === 'TEACHER' ? 'Teacher Email or Staff ID' :
                   t('auth.username_email', 'Username / Email / ID')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    activeRole === 'SUPER_ADMIN' ? 'effahdavid45@gmail.com or superadmin' :
                    activeRole === 'SCHOOL_ADMIN' ? 'admin@school.edu.gh' :
                    activeRole === 'TEACHER' ? 'TCH-001 or e.osei@school.edu.gh' :
                    activeRole === 'STUDENT' ? 'STU-2026-001' : 'parent@mail.com'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    {activeRole === 'STUDENT' ? 'Date of Birth (Password)' : t('auth.password', 'Password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email || '');
                      setIsForgotPasswordOpen(true);
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer hover:underline"
                  >
                    {t('auth.forgot_password', 'Forgot Password?')}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={activeRole === 'STUDENT' ? 'YYYY-MM-DD (e.g. 2014-06-12)' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className={`w-full py-3.5 ${
                  activeRole === 'SUPER_ADMIN' ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-blue-600 hover:bg-blue-500'
                } disabled:opacity-60 text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-blue-900/20 transition-all cursor-pointer flex items-center justify-center gap-2`}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
                  </>
                ) : (
                  <>
                    {t('auth.login', 'Log In')} to {activeRole.replace('_', ' ')} Portal
                  </>
                )}
              </button>

              {activeRole === 'SUPER_ADMIN' && (
                <div className="pt-2 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('effahdavid45@gmail.com');
                        setPassword('059200');
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Fill Default Developer Credentials
                    </button>
                  </div>
                  {onOpenSuperAdminSetup && (
                    <div>
                      <button
                        type="button"
                        onClick={onOpenSuperAdminSetup}
                        className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        <KeyRound className="w-3 h-3" />
                        Re-enter / Setup Master Credentials
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          ) : (
            /* FORGOT PASSWORD SUPABASE AUTH WORKFLOW */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>{t('auth.recover_password', 'Password Recovery via Supabase Auth')}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseForgotPassword}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t('action.cancel', 'Cancel')}
                </button>
              </div>

              {forgotError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccessNotice && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{forgotSuccessNotice}</span>
                </div>
              )}

              {/* STEP 1: Enter Email & Request Recovery Code */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendRecoveryEmail} className="space-y-4 pt-1">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('auth.reset_instructions', 'Enter your registered email address to receive secure password recovery verification instructions via Supabase Auth.')}
                  </p>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                      Account Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="user@school.edu.gh"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Recovery Email...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>{t('auth.send_recovery_code', 'Send Recovery Instructions')}</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(2)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      Already have a recovery token? Enter verification code &gt;
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Enter Token & Set New Password */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyAndResetPassword} className="space-y-4 pt-1">
                  {demoTokenDispatched && (
                    <div className="p-3 bg-blue-950/50 border border-blue-800/60 rounded-xl text-blue-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1 text-blue-300">
                          <Sparkles className="w-3.5 h-3.5" /> Demo Recovery Token Dispatched:
                        </span>
                        <code className="bg-blue-900/80 px-2 py-0.5 rounded font-mono font-bold text-amber-300 border border-blue-700">
                          {demoTokenDispatched}
                        </code>
                      </div>
                      <p className="text-[10px] text-blue-300/80">
                        In production, this token is sent to your email inbox via Supabase Auth.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                      {t('auth.verification_token', '6-Digit Verification Token')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 583920 or 059200"
                      value={recoveryToken}
                      onChange={(e) => setRecoveryToken(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-lg text-white text-xs font-mono font-bold tracking-widest focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                      {t('auth.new_password', 'New Password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                      {t('auth.confirm_password', 'Confirm New Password')}
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifyingToken}
                      className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isVerifyingToken ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t('auth.update_password', 'Update Password')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Password Successfully Reset */}
              {forgotStep === 3 && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Password Updated Successfully</h3>
                    <p className="text-xs text-slate-400">
                      Your Supabase Auth account password has been safely updated. You can now log into your portal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseForgotPassword}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{t('auth.back_to_login', 'Proceed to Portal Login')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
