import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Pause,
  Play,
  Download,
  Trash2,
  Lock,
  Wrench,
  Key,
  Building2,
  Terminal,
  Clock,
  Sparkles,
  AlertTriangle,
  Radio,
  Plus
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { subscribeToGlobalAuditLogs, getAllGlobalAuditLogs, logAuditAction, exportToCSV } from '../lib/services';
import toast from 'react-hot-toast';

export interface SystemSecurityEvent {
  id: string;
  action: string;
  category: 'SECURITY' | 'MAINTENANCE' | 'AUTH' | 'LICENSE' | 'SCHOOL' | 'SYSTEM';
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
  schoolId?: string;
  actorEmail?: string;
  actorIp?: string;
  details: string;
  timestamp: string;
}

export const RealTimeActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showSimulateModal, setShowSimulateModal] = useState<boolean>(false);
  const [simulatedAction, setSimulatedAction] = useState<string>('UNAUTHORIZED_SUPERADMIN_LOGIN');

  // Initial seed logs for immediate visual feedback if database is empty
  const initialSeedEvents: AuditLogEntry[] = useMemo(() => [
    {
      id: 'EVT-LOG-901',
      schoolId: 'SUPER_ADMIN',
      action: 'UNAUTHORIZED_LOGIN_ATTEMPT',
      performedBy: 'unknown_root@102.176.45.12',
      details: 'Failed Super Admin authentication from unrecognized IP address (102.176.45.12).',
      timestamp: new Date(Date.now() - 1000 * 45).toISOString()
    },
    {
      id: 'EVT-LOG-902',
      schoolId: 'SYSTEM',
      action: 'MAINTENANCE_MODE_UPDATED',
      performedBy: 'David Effah (Super Admin)',
      details: 'Global system maintenance mode status evaluated and configured with bypass PIN 059200.',
      timestamp: new Date(Date.now() - 1000 * 180).toISOString()
    },
    {
      id: 'EVT-LOG-903',
      schoolId: 'SCH-GH-000001',
      action: 'LICENSE_RENEWED',
      performedBy: 'effahdavid0216@gmail.com',
      details: 'Annual license key LIC-GH-2026-99201 generated and extended for Achimota School.',
      timestamp: new Date(Date.now() - 1000 * 360).toISOString()
    },
    {
      id: 'EVT-LOG-904',
      schoolId: 'SCH-GH-000002',
      action: 'RESTRICTED_ROUTE_BLOCK',
      performedBy: 'staff_temp@prempeh.edu.gh',
      details: 'Blocked unauthorized access request to /super-admin/dashboard/billing.',
      timestamp: new Date(Date.now() - 1000 * 720).toISOString()
    }
  ], []);

  // Fetch or Subscribe
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    if (isLive) {
      unsubscribe = subscribeToGlobalAuditLogs((realtimeLogs) => {
        setIsLoading(false);
        if (realtimeLogs && realtimeLogs.length > 0) {
          setLogs(realtimeLogs);
        } else {
          setLogs(initialSeedEvents);
        }
      });
    } else {
      getAllGlobalAuditLogs().then((res) => {
        setIsLoading(false);
        setLogs(res.length > 0 ? res : initialSeedEvents);
      });
    }

    return () => unsubscribe();
  }, [isLive, initialSeedEvents]);

  // Derive event metadata (Severity & Category)
  const getEventCategoryAndSeverity = (action: string, details: string) => {
    const act = action.toUpperCase();
    const det = details.toUpperCase();

    if (act.includes('UNAUTHORIZED') || act.includes('BLOCK') || det.includes('FAILED') || act.includes('SECURITY')) {
      return { category: 'SECURITY', severity: 'CRITICAL', label: 'CRITICAL SECURITY' };
    }
    if (act.includes('MAINTENANCE') || act.includes('SYSTEM_UPDATE')) {
      return { category: 'MAINTENANCE', severity: 'HIGH', label: 'MAINTENANCE' };
    }
    if (act.includes('LICENSE') || act.includes('ACTIVATION') || act.includes('TOKEN')) {
      return { category: 'LICENSE', severity: 'WARNING', label: 'LICENSING' };
    }
    if (act.includes('SCHOOL') || act.includes('TENANT')) {
      return { category: 'SCHOOL', severity: 'INFO', label: 'SCHOOL TENANT' };
    }
    return { category: 'AUTH', severity: 'INFO', label: 'SYSTEM EVENT' };
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const { category, severity } = getEventCategoryAndSeverity(log.action, log.details);

      if (selectedSeverity !== 'ALL' && severity !== selectedSeverity) return false;
      if (selectedCategory !== 'ALL' && category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesActor = (log.performedBy || '').toLowerCase().includes(q);
        const matchesSchool = (log.schoolId || '').toLowerCase().includes(q);
        return matchesAction || matchesDetails || matchesActor || matchesSchool;
      }

      return true;
    });
  }, [logs, selectedSeverity, selectedCategory, searchQuery]);

  // Trigger simulated system event
  const handleTriggerSimulatedEvent = async () => {
    let newEntry: Omit<AuditLogEntry, 'id' | 'timestamp'>;

    if (simulatedAction === 'UNAUTHORIZED_SUPERADMIN_LOGIN') {
      newEntry = {
        schoolId: 'SUPER_ADMIN',
        userEmail: 'malicious_actor@197.251.10.88',
        role: 'SUPER_ADMIN',
        action: 'UNAUTHORIZED_SUPERADMIN_LOGIN_ATTEMPT',
        performedBy: 'malicious_actor@197.251.10.88',
        details: 'Blocked 3 consecutive invalid password attempts targeting Super Admin portal.'
      };
    } else if (simulatedAction === 'MAINTENANCE_TOGGLE') {
      newEntry = {
        schoolId: 'GLOBAL_SYSTEM',
        userEmail: 'effahdavid0216@gmail.com',
        role: 'SUPER_ADMIN',
        action: 'MAINTENANCE_MODE_TOGGLED',
        performedBy: 'David Effah (Super Admin)',
        details: 'System maintenance mode toggled to ACTIVE with global banner notification.'
      };
    } else if (simulatedAction === 'SUSPICIOUS_LICENSE_VALIDATION') {
      newEntry = {
        schoolId: 'SCH-GH-991023',
        userEmail: 'admin@external-domain.org',
        role: 'SCHOOL_ADMIN',
        action: 'SUSPICIOUS_LICENSE_KEY_VALIDATION',
        performedBy: 'admin@external-domain.org',
        details: 'Attempted activation using expired or tampered master key LIC-GH-2025-EXPIRED.'
      };
    } else {
      newEntry = {
        schoolId: 'SCH-GH-000003',
        userEmail: 'headmaster@school.edu.gh',
        role: 'SCHOOL_ADMIN',
        action: 'NEW_SCHOOL_REGISTERED_REALTIME',
        performedBy: 'Headmaster Osei Kwame',
        details: 'New school profile and default academic year 2026/2027 registered in Super Admin.'
      };
    }

    await logAuditAction(newEntry);
    toast.success(`Triggered real-time event: ${newEntry.action}`);
    setShowSimulateModal(false);
  };

  const handleExportCSV = () => {
    const exportData = filteredLogs.map((l) => {
      const { category, severity } = getEventCategoryAndSeverity(l.action, l.details);
      return {
        LogID: l.id,
        Timestamp: l.timestamp,
        SchoolID: l.schoolId,
        Action: l.action,
        Category: category,
        Severity: severity,
        Actor: l.performedBy || l.userEmail || 'N/A',
        Details: l.details
      };
    });
    exportToCSV(`SuperAdmin_Activity_Log_${Date.now()}.csv`, exportData);
    toast.success('Activity logs exported to CSV.');
  };

  return (
    <div className="bg-[#0f111a] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isLive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Radio className={`w-3 h-3 ${isLive ? 'animate-pulse text-emerald-400' : ''}`} />
              {isLive ? '● REAL-TIME LIVE FEED' : 'PAUSED'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {filteredLogs.length} events logged
            </span>
          </div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Super Admin Real-Time Activity & Security Stream
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor unauthorized login attempts, maintenance mode updates, and critical system events instantly.
          </p>
        </div>

        {/* Real-time controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLive(!isLive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isLive
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLive ? 'Pause Stream' : 'Resume Real-time'}
          </button>

          <button
            type="button"
            onClick={() => setShowSimulateModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Simulate Event
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-[#161925] border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
            title="Export logs to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search action, actor email, IP address, school ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#161925] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#161925] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Severity: All Levels</option>
            <option value="CRITICAL">Critical (Unauthorized / Security)</option>
            <option value="HIGH">High (Maintenance / Config)</option>
            <option value="WARNING">Warning (Licensing / Auth)</option>
            <option value="INFO">Info (General System)</option>
          </select>
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#161925] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Category: All Types</option>
            <option value="SECURITY">Security & Access</option>
            <option value="MAINTENANCE">Maintenance Mode</option>
            <option value="LICENSE">Licensing & Tokens</option>
            <option value="SCHOOL">School Registrations</option>
            <option value="AUTH">Authentication</option>
          </select>
        </div>
      </div>

      {/* Event Stream List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            Subscribing to live system activity logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs bg-[#161925] rounded-2xl border border-slate-800">
            No system events matched your search filters.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const { category, severity, label } = getEventCategoryAndSeverity(log.action, log.details);

            return (
              <div
                key={log.id}
                className={`p-4 rounded-2xl border transition hover:border-slate-700 space-y-2 ${
                  severity === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : severity === 'HIGH'
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : severity === 'WARNING'
                    ? 'bg-purple-950/20 border-purple-500/30'
                    : 'bg-[#161925] border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {severity === 'CRITICAL' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : category === 'MAINTENANCE' ? (
                      <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : category === 'LICENSE' ? (
                      <Key className="w-4 h-4 text-purple-400 shrink-0" />
                    ) : (
                      <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
                    )}

                    <span className="font-extrabold text-white text-xs">{log.action}</span>

                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : severity === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{log.details}</p>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                  <span>Actor / Origin: <strong className="text-slate-200">{log.performedBy || 'System Protocol'}</strong></span>
                  <span>Target Entity: <strong className="text-slate-200">{log.schoolId || 'GLOBAL'}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Trigger Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0f111a] border border-blue-500/40 rounded-3xl p-6 text-slate-100 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Simulate Live System Event
              </h4>
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select a critical security or administrative scenario to push a live event entry into Firestore for real-time monitoring testing.
            </p>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-slate-400">Scenario Event Type</label>
              <select
                value={simulatedAction}
                onChange={(e) => setSimulatedAction(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="UNAUTHORIZED_SUPERADMIN_LOGIN">CRITICAL: Unauthorized Super Admin Login Attempt</option>
                <option value="MAINTENANCE_TOGGLE">HIGH: Global Maintenance Mode State Change</option>
                <option value="SUSPICIOUS_LICENSE_VALIDATION">WARNING: Suspicious License Key Validation Attempt</option>
                <option value="NEW_SCHOOL_REGISTERED">INFO: New School Registration & Provisioning</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTriggerSimulatedEvent}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
              >
                Trigger Event Now
              </button>
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
