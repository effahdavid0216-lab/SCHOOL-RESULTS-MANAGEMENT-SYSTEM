import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, Database, Key, Server, Building } from 'lucide-react';
import { verifyTenantRLSIsolation } from '../lib/databaseService';
import { getCurrentSupabaseSession } from '../lib/authService';
import { School } from '../types';

interface Props {
  activeSchoolId?: string;
  schools?: School[];
}

export const SupabaseRLSDiagnostic: React.FC<Props> = ({ activeSchoolId, schools = [] }) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    activeSchoolId || (schools.length > 0 ? schools[0].id : 'HQ_GLOBAL')
  );
  const [checking, setChecking] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    isIsolated: boolean;
    activeTenantId: string;
    accessibleSchoolsCount: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (activeSchoolId) {
      setSelectedTenantId(activeSchoolId);
    } else if (schools.length > 0 && !selectedTenantId) {
      setSelectedTenantId(schools[0].id);
    }
  }, [activeSchoolId, schools]);

  const runDiagnostic = async (tenantIdToTest = selectedTenantId) => {
    setChecking(true);
    try {
      const sess = await getCurrentSupabaseSession();
      setSession(sess);
      const res = await verifyTenantRLSIsolation(tenantIdToTest || 'HQ_GLOBAL');
      setDiagnosticResult(res);
    } catch (err) {
      console.warn('RLS diagnostic check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    runDiagnostic(selectedTenantId);
  }, [selectedTenantId]);

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Supabase Tenant RLS Diagnostic</h3>
        </div>
        <div className="flex items-center gap-2">
          {schools.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedTenantId}
                onChange={(e) => {
                  setSelectedTenantId(e.target.value);
                }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="HQ_GLOBAL" className="bg-slate-900 text-slate-200">Global HQ (HQ_GLOBAL)</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => runDiagnostic(selectedTenantId)}
            disabled={checking}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            Run Check
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
            <Key className="w-3.5 h-3.5 text-amber-400" /> Active Session Scope
          </div>
          <p className="text-xs font-mono text-slate-200 truncate">
            {session?.user?.email || 'Authenticated Super Admin Session'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Target School Tenant: <span className="text-cyan-400 font-semibold">{selectedTenantId || 'HQ_GLOBAL'}</span>
          </p>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
            <Server className="w-3.5 h-3.5 text-indigo-400" /> Row-Level Security Status
          </div>
          {diagnosticResult ? (
            <div className="flex items-center gap-2 mt-1">
              {diagnosticResult.isIsolated ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Isolated & Secure
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 bg-sky-950/60 border border-sky-800/80 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Multi-Tenant Admin
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-500">Checking...</span>
          )}
        </div>
      </div>

      {diagnosticResult && (
        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          {diagnosticResult.isIsolated ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium text-slate-200">{diagnosticResult.message}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Accessible database school records: <strong className="text-slate-200">{diagnosticResult.accessibleSchoolsCount}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
