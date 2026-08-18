import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Download, RefreshCw, AlertTriangle, User, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { AuditLogEntry } from '../types';
import { getAuditLogs, logAuditAction, exportToCSV } from '../lib/services';

interface Props {
  schoolId: string;
}

export const AuditLogView: React.FC<Props> = ({ schoolId }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  useEffect(() => {
    loadLogs();
  }, [schoolId]);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getAuditLogs(schoolId);
    
    // Seed initial audit log entries if empty
    if (data.length === 0) {
      const mockInitialLogs: Omit<AuditLogEntry, 'id' | 'timestamp'>[] = [
        {
          schoolId,
          userEmail: 'admin@school.edu',
          role: 'ADMIN',
          action: 'USER_ROLE_CHANGE',
          targetRecord: 'TCH-002 (Mrs. Grace Boateng)',
          details: 'Updated assigned role to Exam Officer with permissions results.approve and results.edit'
        },
        {
          schoolId,
          userEmail: 'accountant@school.edu',
          role: 'ACCOUNTANT',
          action: 'FEE_PAYMENT',
          targetRecord: 'INV-2026-8812 (Kwame Mensah)',
          details: 'Recorded GHS 1,200.00 cash fee payment for Term 1 Tuition Fee'
        },
        {
          schoolId,
          userEmail: 'admin@school.edu',
          role: 'ADMIN',
          action: 'RESULT_ADJUSTMENT',
          targetRecord: 'SCORE-MATH-991',
          details: 'Adjusted SBA score for Ama Osei in Integrated Science from 38 to 44 following remarking request'
        },
        {
          schoolId,
          userEmail: 'admin@school.edu',
          role: 'ADMIN',
          action: 'SCHOOL_SETTINGS_UPDATE',
          targetRecord: 'School Profile Settings',
          details: 'Updated digital signature and academic year configuration to 2026/2027 Term 1'
        }
      ];

      for (const log of mockInitialLogs) {
        await logAuditAction(log);
      }
      const reloaded = await getAuditLogs(schoolId);
      setLogs(reloaded);
    } else {
      setLogs(data);
    }
    setLoading(false);
  };

  const handleExportLogs = () => {
    const formatted = filteredLogs.map(l => ({
      Timestamp: new Date(l.timestamp).toLocaleString(),
      UserEmail: l.userEmail,
      Role: l.role,
      Action: l.action,
      TargetRecord: l.targetRecord || 'N/A',
      Details: l.details || ''
    }));
    exportToCSV(`security_audit_logs_${schoolId}_${new Date().toISOString().split('T')[0]}.csv`, formatted);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.targetRecord && log.targetRecord.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      actionFilter === 'ALL' ||
      (actionFilter === 'ROLE' && log.action.includes('ROLE')) ||
      (actionFilter === 'FEE' && log.action.includes('FEE')) ||
      (actionFilter === 'RESULT' && log.action.includes('RESULT')) ||
      (actionFilter === 'SETTINGS' && log.action.includes('SETTING'));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl text-slate-200">
      {/* Header Banner */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-light text-white serif italic">Security Audit Logs & Compliance Ledger</h2>
            <p className="text-xs text-slate-400">
              Immutable record tracking administrative actions, role modifications, fee transactions, and result edits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="px-3 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleExportLogs}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by actor, target ID, or action..."
            className="w-full pl-9 pr-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {['ALL', 'ROLE', 'FEE', 'RESULT', 'SETTINGS'].map(cat => (
            <button
              key={cat}
              onClick={() => setActionFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                actionFilter === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                  : 'bg-[#161925] text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All Activity' : cat === 'ROLE' ? 'Role Changes' : cat === 'FEE' ? 'Fee Receipts' : cat === 'RESULT' ? 'Score Adjustments' : 'System Settings'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#161925] border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor / Admin</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Target Record</th>
                <th className="px-4 py-3">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    Loading security audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    No matching audit records found for this query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isRole = log.action.includes('ROLE');
                  const isFee = log.action.includes('FEE');
                  const isResult = log.action.includes('RESULT');

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-blue-400">
                            {log.userEmail.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block leading-tight">{log.userEmail}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{log.role}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            isRole
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : isFee
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isResult
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300 font-semibold font-sans">
                        {log.targetRecord || 'N/A'}
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 font-sans max-w-xs text-[11px]">
                        {log.details || 'Action completed successfully.'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
