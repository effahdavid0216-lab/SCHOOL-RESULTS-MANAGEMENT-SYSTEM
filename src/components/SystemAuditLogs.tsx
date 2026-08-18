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
  Plus,
  Eye,
  UserCheck,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  Copy,
  Check,
  Database,
  Globe
} from 'lucide-react';
import { AuditLogEntry, School } from '../types';
import {
  subscribeToGlobalAuditLogs,
  getAllGlobalAuditLogs,
  logAuditAction,
  fetchAllSchools,
  exportToCSV
} from '../lib/services';
import toast from 'react-hot-toast';

export interface SystemAuditLogsProps {
  schools?: School[];
}

export const SystemAuditLogs: React.FC<SystemAuditLogsProps> = ({ schools: propSchools }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [schools, setSchools] = useState<School[]>(propSchools || []);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [showSimulateModal, setShowSimulateModal] = useState<boolean>(false);
  const [simulatedAction, setSimulatedAction] = useState<string>('FAILED_LOGIN_ATTEMPT');
  const [simulatedSchoolId, setSimulatedSchoolId] = useState<string>('SUPER_ADMIN');
  const [simulatedDetails, setSimulatedDetails] = useState<string>('');

  // Initial fallback mock/seed events if Firestore log collection is fresh
  const initialSeedEvents: AuditLogEntry[] = useMemo(() => [
    {
      id: 'AUD-LOG-1001',
      schoolId: 'SYSTEM_SUPERADMIN',
      userEmail: 'superadmin@system.master',
      role: 'SUPER_ADMIN',
      action: 'SUPERADMIN_INITIALIZED',
      targetRecord: 'System Platform Core',
      details: 'Super Admin core system engine verified and tenant isolation RLS policies enforced.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      performedBy: 'David Effah (Super Admin)'
    },
    {
      id: 'AUD-LOG-1002',
      schoolId: 'SCH-GH-000001',
      userEmail: 'admin@achimota.edu.gh',
      role: 'SCHOOL_ADMIN',
      action: 'SCHOOL_CONFIGURATION_UPDATE',
      targetRecord: 'School Settings (Term Calendar)',
      details: 'Updated Academic Calendar for 2026/2027 Term 1 reopening dates.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      performedBy: 'Headmaster / Principal'
    },
    {
      id: 'AUD-LOG-1003',
      schoolId: 'SCH-GH-000002',
      userEmail: 'unknown_attempt@102.176.45.12',
      role: 'UNKNOWN',
      action: 'FAILED_LOGIN_ATTEMPT',
      targetRecord: 'Auth Endpoint',
      details: 'Multiple invalid credentials entered from IP 102.176.45.12 (Locked for 15 minutes).',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      performedBy: 'Security Firewall'
    },
    {
      id: 'AUD-LOG-1004',
      schoolId: 'SCH-GH-000003',
      userEmail: 'superadmin@system.master',
      role: 'SUPER_ADMIN',
      action: 'LICENSE_RENEWAL',
      targetRecord: 'License LIC-GH-2026-33910',
      details: 'Extended annual subscription license duration by 365 days.',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      performedBy: 'David Effah'
    },
    {
      id: 'AUD-LOG-1005',
      schoolId: 'SCH-GH-000004',
      userEmail: 'exam.officer@mfantsipim.edu.gh',
      role: 'EXAM_OFFICER',
      action: 'TERMINAL_RESULTS_PUBLISHED',
      targetRecord: 'Class Basic 9 Terminal Assessment',
      details: 'Approved and finalized terminal report cards for 142 students.',
      timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      performedBy: 'Exam Committee'
    }
  ], []);

  // Fetch Schools for Dropdown if not supplied
  useEffect(() => {
    if (!propSchools || propSchools.length === 0) {
      fetchAllSchools().then((data) => {
        if (data && data.length > 0) setSchools(data);
      }).catch((e) => console.warn('Could not fetch schools list for audit log filter:', e));
    }
  }, [propSchools]);

  // Real-time Firestore Listener / Poller
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
        if (res && res.length > 0) {
          setLogs(res);
        } else {
          setLogs(initialSeedEvents);
        }
      }).catch(() => {
        setIsLoading(false);
        setLogs(initialSeedEvents);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isLive, initialSeedEvents]);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await getAllGlobalAuditLogs();
      if (data && data.length > 0) {
        setLogs(data);
      } else {
        setLogs(initialSeedEvents);
      }
      toast.success('Audit logs refreshed successfully');
    } catch (e: any) {
      toast.error('Failed to refresh audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to categorize an action
  const getActionCategory = (action: string): 'AUTH' | 'CONFIG' | 'LICENSE' | 'ACADEMIC' | 'SECURITY' | 'OTHER' => {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('LOGOUT') || act.includes('SESSION')) return 'AUTH';
    if (act.includes('CONFIG') || act.includes('SETTING') || act.includes('STATUS') || act.includes('UPDATE') || act.includes('EDIT')) return 'CONFIG';
    if (act.includes('LICENSE') || act.includes('TOKEN') || act.includes('ACTIVATION') || act.includes('PLAN')) return 'LICENSE';
    if (act.includes('RESULT') || act.includes('STUDENT') || act.includes('TEACHER') || act.includes('CLASS') || act.includes('ATTENDANCE')) return 'ACADEMIC';
    if (act.includes('BLOCKED') || act.includes('UNAUTHORIZED') || act.includes('ALERT') || act.includes('SECURITY') || act.includes('PIN') || act.includes('DELETED')) return 'SECURITY';
    return 'OTHER';
  };

  // Helper to categorize badge color
  const getActionBadge = (action: string) => {
    const cat = getActionCategory(action);
    switch (cat) {
      case 'SECURITY':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'AUTH':
        if (action.includes('FAILED') || action.includes('UNAUTHORIZED')) {
          return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        }
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'LICENSE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'CONFIG':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ACADEMIC':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const now = new Date().getTime();
    return logs.filter((log) => {
      // 1. School ID Filter
      if (selectedSchoolId !== 'ALL') {
        if (selectedSchoolId === 'SYSTEM_SUPERADMIN') {
          if (log.schoolId !== 'SYSTEM_SUPERADMIN' && log.schoolId !== 'SUPER_ADMIN' && log.schoolId !== 'SYSTEM') {
            return false;
          }
        } else if (log.schoolId !== selectedSchoolId) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL') {
        const cat = getActionCategory(log.action);
        if (cat !== selectedCategory) return false;
      }

      // 3. Role Filter
      if (selectedRole !== 'ALL') {
        if ((log.role || '').toUpperCase() !== selectedRole) return false;
      }

      // 4. Time Range Filter
      if (timeRange !== 'ALL') {
        const logTime = new Date(log.timestamp).getTime();
        const diffHours = (now - logTime) / (1000 * 60 * 60);
        if (timeRange === 'TODAY' && diffHours > 24) return false;
        if (timeRange === '7DAYS' && diffHours > 24 * 7) return false;
        if (timeRange === '30DAYS' && diffHours > 24 * 30) return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAction = (log.action || '').toLowerCase().includes(q);
        const matchEmail = (log.userEmail || '').toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        const matchSchool = (log.schoolId || '').toLowerCase().includes(q);
        const matchTarget = (log.targetRecord || '').toLowerCase().includes(q);
        const matchPerformer = (log.performedBy || '').toLowerCase().includes(q);
        if (!matchAction && !matchEmail && !matchDetails && !matchSchool && !matchTarget && !matchPerformer) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedSchoolId, selectedCategory, selectedRole, timeRange, searchQuery]);

  // Telemetry Metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    let failedLogins = 0;
    let configUpdates = 0;
    const tenantSet = new Set<string>();

    logs.forEach((l) => {
      if (l.schoolId) tenantSet.add(l.schoolId);
      const act = (l.action || '').toUpperCase();
      if (act.includes('FAILED') || act.includes('UNAUTHORIZED')) failedLogins++;
      if (act.includes('CONFIG') || act.includes('SETTING') || act.includes('UPDATE') || act.includes('STATUS') || act.includes('RENEW')) {
        configUpdates++;
      }
    });

    return {
      total,
      failedLogins,
      configUpdates,
      activeTenants: tenantSet.size
    };
  }, [logs]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No audit logs to export.');
      return;
    }
    const exportData = filteredLogs.map((l) => ({
      Timestamp: new Date(l.timestamp).toLocaleString(),
      School_Tenant: l.schoolId,
      Action_Type: l.action,
      Actor_Email: l.userEmail || 'N/A',
      Actor_Role: l.role || 'N/A',
      Performed_By: l.performedBy || 'N/A',
      Target_Record: l.targetRecord || 'N/A',
      Details: l.details || ''
    }));
    exportToCSV(`system_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
    toast.success(`Exported ${filteredLogs.length} audit records to CSV.`);
  };

  // Export formatted JSON
  const handleExportJSON = () => {
    if (filteredLogs.length === 0) {
      toast.error('No audit logs to export.');
      return;
    }
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported audit logs as JSON');
  };

  // Copy Single Log Detail Payload
  const handleCopyLogPayload = (entry: AuditLogEntry) => {
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
    setCopiedPayload(true);
    toast.success('Log payload copied to clipboard');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Trigger Simulated Audit Event
  const handleTriggerSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logAuditAction({
        schoolId: simulatedSchoolId,
        userEmail: 'tester@edumaster.sys',
        role: 'SUPER_ADMIN',
        action: simulatedAction,
        targetRecord: `Tenant ${simulatedSchoolId} Audit Simulation`,
        details: simulatedDetails || `Simulated ${simulatedAction} event triggered from Super Admin audit monitor.`,
        performedBy: 'Super Admin Test Rig'
      });
      toast.success('Simulated audit event dispatched!');
      setShowSimulateModal(false);
      setSimulatedDetails('');
    } catch (err: any) {
      toast.error('Failed to log event: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Real-time Status */}
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-black text-white tracking-tight">System Audit & Oversight Engine</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                      isLive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    <Radio className={`w-3 h-3 ${isLive ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
                    {isLive ? 'REAL-TIME LIVE STREAM' : 'STREAM PAUSED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Global telemetry, authentication attempts, security triggers, and configuration mutations across 30+ school instances.
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                isLive
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              }`}
            >
              {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLive ? 'Pause Stream' : 'Resume Live'}</span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Manual Fetch from Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              <span>Refresh</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export Filtered Logs to CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export Filtered Logs to JSON"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>JSON</span>
              </button>
            </div>

            <button
              onClick={() => setShowSimulateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Event</span>
            </button>
          </div>
        </div>

        {/* Telemetry Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-[#141724] border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">Total Monitored Events</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{metrics.total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Stream buffer size</div>
          </div>

          <div className="bg-[#141724] border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">Failed / Blocked Attempts</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">{metrics.failedLogins}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Security alerts trapped</div>
          </div>

          <div className="bg-[#141724] border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">Config & License Mutations</span>
              <Wrench className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">{metrics.configUpdates}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Settings & license renewals</div>
          </div>

          <div className="bg-[#141724] border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">Active School Tenants</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {Math.max(metrics.activeTenants, schools.length)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Across independent instances</div>
          </div>
        </div>
      </div>

      {/* Multi-Filter & Search Bar */}
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Search Query */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, email, school ID, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* 2. School Tenant Selector */}
          <div>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">🏫 All School Tenants ({schools.length})</option>
              <option value="SYSTEM_SUPERADMIN">🛡️ Platform / Super Admin Core</option>
              {schools.map((sch) => (
                <option key={sch.schoolId} value={sch.schoolId}>
                  {sch.name} ({sch.schoolId})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Event Category Selector */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">📁 All Event Categories</option>
              <option value="AUTH">🔑 Login & Authentication</option>
              <option value="CONFIG">⚙️ Configuration & Settings</option>
              <option value="LICENSE">📜 License & Security Tokens</option>
              <option value="SECURITY">🚨 Security Alerts & Violations</option>
              <option value="ACADEMIC">🎓 Academic & Student Records</option>
              <option value="OTHER">📦 Miscellaneous Events</option>
            </select>
          </div>

          {/* 4. Time Range Selector */}
          <div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">🕒 All Recorded Time</option>
              <option value="TODAY">⏳ Today (Last 24 Hours)</option>
              <option value="7DAYS">📅 Last 7 Days</option>
              <option value="30DAYS">📆 Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-semibold mr-1">Role Filter:</span>
            {['ALL', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'UNKNOWN'].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                  selectedRole === r
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Showing <strong className="text-white font-bold">{filteredLogs.length}</strong> of{' '}
            <span className="text-slate-400">{logs.length}</span> log records
          </div>
        </div>
      </div>

      {/* Log Feed Table & Cards */}
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Real-Time Event Stream</h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Auto-sort: Newest First ({filteredLogs.length} matching)
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Synchronizing real-time audit stream...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No Audit Events Match Selected Filters</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search terms, time range, or school tenant filter to view recorded activities.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredLogs.map((log) => {
              const badgeClass = getActionBadge(log.action);
              const isSecurity = badgeClass.includes('rose');

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSecurity
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}
                    >
                      {isSecurity ? <ShieldAlert className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${badgeClass}`}>
                          {log.action}
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                          {log.schoolId}
                        </span>

                        {log.role && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400">
                            {log.role}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                        {log.details || log.targetRecord || 'System event executed.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                        {log.userEmail && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <UserCheck className="w-3 h-3 text-slate-500" />
                            {log.userEmail}
                          </span>
                        )}
                        {log.performedBy && (
                          <span className="text-slate-400 font-medium">Actor: {log.performedBy}</span>
                        )}
                        {log.targetRecord && (
                          <span className="text-slate-400 truncate max-w-[200px]">
                            Target: <span className="text-slate-300 font-mono">{log.targetRecord}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 text-right">
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f111a] border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Audit Log Inspection</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#141724] border border-slate-800/80 p-3 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Action Type</span>
                  <span className="font-mono text-blue-300 font-bold">{selectedLog.action}</span>
                </div>
                <div className="bg-[#141724] border border-slate-800/80 p-3 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">School Tenant ID</span>
                  <span className="font-mono text-emerald-300 font-bold">{selectedLog.schoolId}</span>
                </div>
              </div>

              <div className="bg-[#141724] border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Actor Email</span>
                  <span className="text-slate-200 font-mono font-semibold">{selectedLog.userEmail || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Actor Role</span>
                  <span className="text-slate-200 font-bold">{selectedLog.role || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Performed By</span>
                  <span className="text-slate-200">{selectedLog.performedBy || 'System Engine'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Target Record</span>
                  <span className="text-slate-200 font-mono">{selectedLog.targetRecord || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Timestamp</span>
                  <span className="text-slate-200 font-mono">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-[#141724] border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Action Details</span>
                <p className="text-slate-200 leading-relaxed">{selectedLog.details || 'No extended description.'}</p>
              </div>

              {/* Raw JSON Payload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Raw Telemetry JSON</span>
                  <button
                    onClick={() => handleCopyLogPayload(selectedLog)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#090a0f] border border-slate-800 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto max-h-36">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulate Event Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleTriggerSimulate}
            className="bg-[#0f111a] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Simulate Audit Action</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target School Tenant</label>
                <select
                  value={simulatedSchoolId}
                  onChange={(e) => setSimulatedSchoolId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="SUPER_ADMIN">🛡️ Platform Super Admin</option>
                  {schools.map((s) => (
                    <option key={s.schoolId} value={s.schoolId}>
                      {s.name} ({s.schoolId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Action Trigger</label>
                <select
                  value={simulatedAction}
                  onChange={(e) => setSimulatedAction(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="FAILED_LOGIN_ATTEMPT">🚨 FAILED_LOGIN_ATTEMPT</option>
                  <option value="UNAUTHORIZED_ACCESS_BLOCKED">🛑 UNAUTHORIZED_ACCESS_BLOCKED</option>
                  <option value="LICENSE_RENEWAL_COMPLETED">📜 LICENSE_RENEWAL_COMPLETED</option>
                  <option value="SYSTEM_SETTINGS_UPDATED">⚙️ SYSTEM_SETTINGS_UPDATED</option>
                  <option value="STUDENT_ENROLLMENT_BATCH">🎓 STUDENT_ENROLLMENT_BATCH</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Custom Details / Notes</label>
                <textarea
                  rows={3}
                  value={simulatedDetails}
                  onChange={(e) => setSimulatedDetails(e.target.value)}
                  placeholder="Optional custom audit details payload..."
                  className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Dispatch Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
