import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Building2,
  Ticket,
  Key,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { DEMO_SCHOOL_CREDENTIALS } from '../lib/seedData';
import { validateSchoolCredentials } from '../lib/services';
import { VerificationResult } from '../types';

interface Props {
  onBackToWelcome: () => void;
  onValidationSuccess: (result: VerificationResult) => void;
  onValidationFailure: (result: VerificationResult) => void;
}

export const ActivationScreen: React.FC<Props> = ({
  onBackToWelcome,
  onValidationSuccess,
  onValidationFailure
}) => {
  const [schoolId, setSchoolId] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [token, setToken] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFillDemo = () => {
    setSchoolId(DEMO_SCHOOL_CREDENTIALS.schoolId);
    setActivationCode(DEMO_SCHOOL_CREDENTIALS.activationCode);
    setToken(DEMO_SCHOOL_CREDENTIALS.token);
    setLicenseKey(DEMO_SCHOOL_CREDENTIALS.licenseKey);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await validateSchoolCredentials(
        schoolId,
        activationCode,
        token,
        licenseKey
      );

      if (result.isValid) {
        onValidationSuccess(result);
      } else {
        onValidationFailure(result);
      }
    } catch (err) {
      onValidationFailure({
        isValid: false,
        message: 'ACTIVATION COULD NOT BE COMPLETED',
        reason: 'An unexpected error occurred during credential verification.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <button
          onClick={onBackToWelcome}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Welcome Page
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/30">
            <KeyRound className="w-6 h-6" />
          </div>
        </div>

        <h2 className="text-center text-4xl font-light text-white serif italic mb-2">
          Activate Your School
        </h2>
        <p className="text-center text-xs text-slate-400 max-w-md mx-auto mb-8">
          Enter the credentials provided by the system administrator to verify your institution and begin setup.
        </p>

        {/* Demo Helper Banner */}
        <div className="bg-[#0d0f17] border border-slate-800 rounded-2xl p-4 mb-8 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold">
                Testing / Evaluator Helper
              </p>
              <p className="text-xs text-slate-400">
                Click to pre-fill default seed school credentials.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            Pre-fill Demo Credentials
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-[#0f111a] border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field 1: Unique School ID */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Unique School ID
              </label>
              <input
                type="text"
                required
                placeholder="SCH-GH-000001"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors text-xs font-mono"
              />
              <p className="text-[10px] text-slate-600 italic">Assigned primary tenant identifier</p>
            </div>

            {/* Field 2: Registration / Activation Code */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-blue-400" />
                Registration / Activation Code
              </label>
              <input
                type="text"
                required
                placeholder="ACT-987654"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors text-xs font-mono"
              />
              <p className="text-[10px] text-slate-600 italic">Found in your activation packet</p>
            </div>

            {/* Field 3: Temporary Token */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                Security Token
              </label>
              <input
                type="text"
                required
                placeholder="TOK-123456"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors text-xs font-mono"
              />
              <p className="text-[10px] text-slate-600 italic">Temporary registration token</p>
            </div>

            {/* Field 4: Licensing Key */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Licensing Key
              </label>
              <input
                type="text"
                required
                placeholder="LIC-GH-2026-X89"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors text-xs font-mono"
              />
              <p className="text-[10px] text-slate-600 italic">Full access enterprise license key</p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>VERIFY & ACTIVATE SYSTEM</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Super Admin Contact Helper */}
          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 space-y-1">
            <p className="font-bold text-slate-300">Don't have an activation packet or license key?</p>
            <p>Contact Developer / Super Admin to register your school:</p>
            <p className="text-blue-400 font-mono">Phone: 0592005260 / 0540712524 • WhatsApp: 0592005260</p>
            <p className="text-slate-400 font-mono">Email: effahdavid45@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
