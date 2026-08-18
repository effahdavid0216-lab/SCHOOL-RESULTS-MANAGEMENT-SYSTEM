import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Clock, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isActiveSession: boolean;
  onLogout: (reason?: string) => void;
  inactivityLimitMinutes?: number; // Default 30 minutes
  warningDurationSeconds?: number; // Default 120 seconds (2 minutes)
}

export const AutoLogoutHandler: React.FC<Props> = ({
  isActiveSession,
  onLogout,
  inactivityLimitMinutes = 30,
  warningDurationSeconds = 120
}) => {
  const TOTAL_INACTIVITY_MS = inactivityLimitMinutes * 60 * 1000;
  const WARNING_THRESHOLD_MS = TOTAL_INACTIVITY_MS - warningDurationSeconds * 1000;

  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(warningDurationSeconds);

  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset user inactivity timer on activity
  const resetInactivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    setLastActivityTime(now);
    if (showWarningModal) {
      setShowWarningModal(false);
      toast.success('Session extended successfully!', { id: 'session-extended' });
    }
  }, [showWarningModal]);

  // Set up event listeners for user activity
  useEffect(() => {
    if (!isActiveSession) return;

    let throttleTimer: NodeJS.Timeout | null = null;
    const handleUserActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        const now = Date.now();
        // Only reset if modal is not open (or let clicking "Extend" handle resetting when modal is active)
        if (!showWarningModal) {
          lastActivityRef.current = now;
          setLastActivityTime(now);
        }
      }, 1000);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isActiveSession, showWarningModal]);

  // Inactivity check interval loop
  useEffect(() => {
    if (!isActiveSession) {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      setShowWarningModal(false);
      return;
    }

    checkIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= TOTAL_INACTIVITY_MS) {
        // Inactivity limit reached - perform auto logout
        setShowWarningModal(false);
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        toast.error('Session expired due to 30 minutes of inactivity.', { duration: 6000 });
        onLogout('30_MIN_INACTIVITY');
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        // Show warning modal and update remaining countdown seconds
        const secondsLeft = Math.max(0, Math.ceil((TOTAL_INACTIVITY_MS - elapsed) / 1000));
        setRemainingSeconds(secondsLeft);
        if (!showWarningModal) {
          setShowWarningModal(true);
        }
      } else {
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    }, 1000);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [isActiveSession, TOTAL_INACTIVITY_MS, WARNING_THRESHOLD_MS, showWarningModal, onLogout]);

  if (!isActiveSession || !showWarningModal) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#0f111a] border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 animate-pulse" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
            <Clock className="w-7 h-7 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
              Security Protocol
            </span>
            <h3 className="text-lg font-black text-white leading-tight">Session Inactivity Warning</h3>
          </div>
        </div>

        <div className="bg-[#161925] border border-slate-800 rounded-2xl p-4 text-center space-y-2">
          <p className="text-xs text-slate-300">
            For security, your session will automatically expire after <strong className="text-amber-400">30 minutes</strong> of inactivity.
          </p>
          <div className="text-3xl font-black font-mono text-amber-400 tracking-wider my-2 py-1 bg-slate-900/80 rounded-xl border border-amber-500/30">
            {formatTime(remainingSeconds)}
          </div>
          <p className="text-[11px] text-slate-400">
            Do you want to extend your current session or log out now?
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={resetInactivity}
            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Stay Logged In
          </button>
          <button
            type="button"
            onClick={() => onLogout('USER_MANUAL_LOGOUT')}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
};
