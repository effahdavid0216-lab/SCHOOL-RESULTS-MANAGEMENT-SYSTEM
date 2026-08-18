import React from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import { VerificationResult } from '../types';

interface Props {
  result: VerificationResult;
  onTryAgain: () => void;
  onContinueToSetup: () => void;
}

export const ActivationResultModal: React.FC<Props> = ({
  result,
  onTryAgain,
  onContinueToSetup
}) => {
  const [showContactInfo, setShowContactInfo] = React.useState(false);

  if (result.isValid) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#0f111a] border border-slate-800 text-slate-200 rounded-2xl max-w-lg w-full p-8 shadow-2xl text-center transform transition-all animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
            VERIFICATION PASSED
          </span>

          <h2 className="text-3xl font-light text-white serif italic mb-2">
            Activation Successful
          </h2>

          <p className="text-slate-300 text-xs mb-2">
            Your school <span className="font-semibold text-white">{result.school?.name || result.school?.schoolId}</span> has been successfully verified against the Super Admin registry.
          </p>

          <p className="text-slate-500 text-xs mb-8 italic">
            Let's set up your school.
          </p>

          <button
            onClick={onContinueToSetup}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>CONTINUE TO SCHOOL SETUP</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Invalid / Expired / Blocked Credentials
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f111a] border border-slate-800 text-slate-200 rounded-2xl max-w-lg w-full p-8 shadow-2xl text-center transform transition-all animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
          ACCESS BLOCKED
        </span>

        <h2 className="text-2xl font-light text-white serif italic mb-2">
          {result.message}
        </h2>

        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 mb-4 text-left">
          <p className="text-xs text-rose-200 font-medium">
            {result.reason || 'One or more of the credentials entered are invalid, expired, revoked or do not belong to this school.'}
          </p>
        </div>

        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
          Please contact the Super Administrator or Developer to obtain the correct School ID, Activation Code, Token and Licensing Key.
        </p>

        {showContactInfo && (
          <div className="bg-[#161925] border border-slate-700 rounded-xl p-4 text-left text-xs text-slate-300 mb-6 space-y-1 animate-in fade-in">
            <p className="font-bold text-white">Super Administrator Contact:</p>
            <p>Email: admin@edumastersms.com</p>
            <p>Support Hotline: +233 20 000 0000</p>
            <p>Developer Portal: https://edumastersms.com/support</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onTryAgain}
            className="w-full py-3 bg-[#161925] border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            TRY AGAIN
          </button>

          <button
            onClick={() => setShowContactInfo(!showContactInfo)}
            className="w-full py-3 bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 text-blue-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            CONTACT ADMIN
          </button>
        </div>
      </div>
    </div>
  );
};

