import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export const OfflineAndPWAHeader: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    } else {
      alert('School Management System PWA is ready for offline app installation. Add to Home Screen in browser menu.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Design System Services Pills */}
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 border border-indigo-500/30 rounded-full text-[10px] font-medium text-slate-300 shadow-inner">
        <span className="flex items-center gap-1 text-pink-400 font-semibold" title="Lovable Design System Active">
          <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" /> Lovable
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 text-indigo-400 font-semibold" title="Kesa Security Suite Active">
          <ShieldCheck className="w-3 h-3 text-indigo-400" /> Kesa
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 text-cyan-400 font-semibold" title="AntiGravity Execution Engine Active">
          <Zap className="w-3 h-3 text-cyan-400" /> AntiGravity
        </span>
      </div>

      {/* Network Badge */}
      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border transition-all ${
        isOnline
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }`}>
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Online • Cloud Synchronized</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span>Offline Mode • Local Queue</span>
          </>
        )}
      </div>

      {/* PWA Install Button */}
      <button
        onClick={handleInstallPWA}
        className="px-2.5 py-1 bg-[#161925] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        title="Install Offline App"
      >
        <Download className="w-3 h-3 text-blue-400" />
        <span className="hidden md:inline">Install PWA App</span>
      </button>
    </div>
  );
};

