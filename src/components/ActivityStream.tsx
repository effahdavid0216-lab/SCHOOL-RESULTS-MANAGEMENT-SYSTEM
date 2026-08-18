import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  UserCheck,
  Users,
  Award,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  FileSpreadsheet,
  AlertCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Bell,
  X,
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuditLogEntry } from '../types';
import { getAuditLogs, getStudentsBySchool, getScoresByQuery, getAttendanceHistory } from '../lib/services';

interface Props {
  schoolId: string;
}

interface ActivityEvent {
  id: string;
  type: 'ENROLLMENT' | 'ATTENDANCE' | 'GRADE_UPDATE' | 'SECURITY' | 'FINANCE' | 'SYSTEM';
  title: string;
  description: string;
  actor: string;
  role?: string;
  timestamp: string;
  badgeColor: string;
  icon: React.ReactNode;
}

interface ToastNotification {
  id: string;
  type: ActivityEvent['type'];
  title: string;
  description: string;
  actor?: string;
  timestamp: string;
}

type DateRangePreset =
  | 'ALL'
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_30_DAYS'
  | 'TERM_1'
  | 'TERM_2'
  | 'TERM_3'
  | 'CUSTOM';

export const ActivityStream: React.FC<Props> = ({ schoolId }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Date Range Filter State
  const [datePreset, setDatePreset] = useState<DateRangePreset>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Auto-refresh & Live Notification State
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const knownEventIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    loadStreamEvents(true);
  }, [schoolId]);

  // Periodic polling for new events when auto-refresh is active
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadStreamEvents(false);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, schoolId]);

  const addToast = (toast: ToastNotification) => {
    setToasts(prev => [toast, ...prev.slice(0, 4)]); // Keep at most 5 recent toasts
    setTimeout(() => {
      removeToast(toast.id);
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadStreamEvents = async (isFirstLoad: boolean = false) => {
    if (isFirstLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // 1. Fetch Audit Logs, Recent Students (Enrollments), Recent Scores (Grade Updates), Recent Attendance Entries
      const [auditLogs, students, scores, attendanceList] = await Promise.all([
        getAuditLogs(schoolId),
        getStudentsBySchool(schoolId),
        getScoresByQuery({ schoolId }),
        getAttendanceHistory(schoolId)
      ]);

      const streamList: ActivityEvent[] = [];

      // Add audit log items
      auditLogs.forEach(log => {
        let type: ActivityEvent['type'] = 'SYSTEM';
        let badgeColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        let icon = <Activity className="w-3.5 h-3.5" />;

        const act = (log.action || '').toUpperCase();
        if (act.includes('STUDENT') || act.includes('ENROLL')) {
          type = 'ENROLLMENT';
          badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          icon = <Users className="w-3.5 h-3.5 text-emerald-400" />;
        } else if (act.includes('ATTENDANCE') || act.includes('ROLL')) {
          type = 'ATTENDANCE';
          badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          icon = <UserCheck className="w-3.5 h-3.5 text-blue-400" />;
        } else if (act.includes('SCORE') || act.includes('RESULT') || act.includes('GRADE') || act.includes('EXAM')) {
          type = 'GRADE_UPDATE';
          badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
          icon = <Award className="w-3.5 h-3.5 text-purple-400" />;
        } else if (act.includes('FEE') || act.includes('EXPENSE') || act.includes('PAYMENT')) {
          type = 'FINANCE';
          badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
          icon = <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />;
        } else if (act.includes('SECURITY') || act.includes('LOGIN') || act.includes('ROLE') || act.includes('AUTH')) {
          type = 'SECURITY';
          badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
          icon = <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />;
        }

        streamList.push({
          id: `audit_${log.id}`,
          type,
          title: log.action.replace(/_/g, ' '),
          description: log.details || (log.targetRecord ? `Target: ${log.targetRecord}` : 'System operation executed successfully.'),
          actor: log.userEmail || log.performedBy || 'System Admin',
          role: log.role || 'ADMIN',
          timestamp: log.timestamp,
          badgeColor,
          icon
        });
      });

      // Add recent student enrollments
      students.slice(0, 15).forEach(st => {
        streamList.push({
          id: `enroll_${st.id}`,
          type: 'ENROLLMENT',
          title: 'Student Admission & Enrollment',
          description: `Enrolled ${st.fullName} (${st.admissionNo || st.studentId}) into ${st.className || 'General Stream'}.`,
          actor: 'Admissions Office',
          role: 'ADMIN',
          timestamp: st.createdAt || new Date().toISOString(),
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <Users className="w-3.5 h-3.5 text-emerald-400" />
        });
      });

      // Add recent score entries
      scores.slice(0, 15).forEach(sc => {
        streamList.push({
          id: `score_${sc.id}`,
          type: 'GRADE_UPDATE',
          title: `Grade Update: ${sc.subjectName || 'Subject'}`,
          description: `Recorded grade ${sc.grade || 'N/A'} (${sc.finalScore || sc.percentage || 0}%) for ${sc.studentName} (${sc.className || 'Class'}).`,
          actor: sc.teacherName || sc.submittedBy || 'Subject Teacher',
          role: 'TEACHER',
          timestamp: sc.updatedAt || sc.createdAt || new Date().toISOString(),
          badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: <Award className="w-3.5 h-3.5 text-purple-400" />
        });
      });

      // Add recent attendance records
      attendanceList.slice(0, 15).forEach(att => {
        const presentCount = att.students?.filter(s => s.status === 'PRESENT').length || 0;
        const total = att.students?.length || 0;
        streamList.push({
          id: `att_${att.id}`,
          type: 'ATTENDANCE',
          title: `Roll Call Entry: ${att.className}`,
          description: `Daily attendance logged for date ${att.date}: ${presentCount}/${total} students present.`,
          actor: att.recordedBy || 'Class Teacher',
          role: 'TEACHER',
          timestamp: att.createdAt || new Date().toISOString(),
          badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-400" />
        });
      });

      // Sort in reverse chronological order
      streamList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // If empty, generate helpful seed events
      if (streamList.length === 0) {
        const now = new Date();
        const fallbackList: ActivityEvent[] = [
          {
            id: 'init_1',
            type: 'SECURITY',
            title: 'School Tenant Initialization',
            description: `Super Admin authorized and provisioned tenant isolation keys for school ID ${schoolId}.`,
            actor: 'Super Admin',
            role: 'SUPER_ADMIN',
            timestamp: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
            badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          },
          {
            id: 'init_2',
            type: 'ENROLLMENT',
            title: 'Batch Student Roster Verified',
            description: 'Synchronized student enrollment profiles and class stream capacities.',
            actor: 'System Admin',
            role: 'ADMIN',
            timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            icon: <Users className="w-3.5 h-3.5 text-emerald-400" />
          }
        ];
        setEvents(fallbackList);
      } else {
        // Detect newly arrived major events on subsequent refreshes
        if (!isInitialLoadRef.current && knownEventIdsRef.current.size > 0) {
          const newEvents = streamList.filter(e => !knownEventIdsRef.current.has(e.id));
          if (newEvents.length > 0) {
            // Trigger toast notifications for new major events
            newEvents.forEach(newEvent => {
              addToast({
                id: `toast_${newEvent.id}_${Date.now()}`,
                type: newEvent.type,
                title: newEvent.title,
                description: newEvent.description,
                actor: newEvent.actor,
                timestamp: newEvent.timestamp
              });
            });
          }
        }

        // Update known IDs
        streamList.forEach(e => knownEventIdsRef.current.add(e.id));
        isInitialLoadRef.current = false;
        setEvents(streamList);
      }
    } catch (err) {
      console.error('Error loading activity stream events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper to test / simulate a new enrollment event notification
  const handleSimulateNewEvent = () => {
    const randomId = `sim_${Date.now()}`;
    const sampleNames = ['Kofi Mensah', 'Ama Boateng', 'Kwesi Appiah', 'Abena Pokuaa', 'Yaw Antwi'];
    const sampleClasses = ['Primary 6', 'JHS 1A', 'JHS 2B', 'JHS 3 Diamond', 'Nursery 2'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomClass = sampleClasses[Math.floor(Math.random() * sampleClasses.length)];

    const simEvent: ActivityEvent = {
      id: randomId,
      type: 'ENROLLMENT',
      title: 'New Student Enrollment Detected',
      description: `Newly registered learner ${randomName} admitted into ${randomClass}.`,
      actor: 'Admissions Desk',
      role: 'ADMIN',
      timestamp: new Date().toISOString(),
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: <Users className="w-3.5 h-3.5 text-emerald-400" />
    };

    setEvents(prev => [simEvent, ...prev]);
    knownEventIdsRef.current.add(randomId);

    addToast({
      id: `toast_${randomId}`,
      type: 'ENROLLMENT',
      title: 'New Student Enrollment',
      description: `${randomName} has been newly enrolled into ${randomClass}!`,
      actor: 'Admissions Desk',
      timestamp: new Date().toISOString()
    });
  };

  // Date Range Filtering Logic
  const filteredEvents = useMemo(() => {
    const now = new Date();

    return events.filter(e => {
      // 1. Type filter
      if (filterType !== 'ALL' && e.type !== filterType) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches =
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.actor.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // 3. Date Range Filter
      if (datePreset === 'ALL') return true;

      const eventDate = new Date(e.timestamp);
      if (isNaN(eventDate.getTime())) return true;

      if (datePreset === 'TODAY') {
        return eventDate.toDateString() === now.toDateString();
      }

      if (datePreset === 'THIS_WEEK') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return eventDate >= oneWeekAgo && eventDate <= now;
      }

      if (datePreset === 'THIS_MONTH') {
        return (
          eventDate.getMonth() === now.getMonth() &&
          eventDate.getFullYear() === now.getFullYear()
        );
      }

      if (datePreset === 'LAST_30_DAYS') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return eventDate >= thirtyDaysAgo && eventDate <= now;
      }

      // Term 1: Sep 1 to Dec 31
      if (datePreset === 'TERM_1') {
        const currentYear = now.getFullYear();
        const term1Start = new Date(currentYear, 8, 1); // Sept 1
        const term1End = new Date(currentYear, 11, 31, 23, 59, 59); // Dec 31
        return eventDate >= term1Start && eventDate <= term1End;
      }

      // Term 2: Jan 1 to Apr 30
      if (datePreset === 'TERM_2') {
        const currentYear = now.getFullYear();
        const term2Start = new Date(currentYear, 0, 1); // Jan 1
        const term2End = new Date(currentYear, 3, 30, 23, 59, 59); // Apr 30
        return eventDate >= term2Start && eventDate <= term2End;
      }

      // Term 3: May 1 to Jul 31
      if (datePreset === 'TERM_3') {
        const currentYear = now.getFullYear();
        const term3Start = new Date(currentYear, 4, 1); // May 1
        const term3End = new Date(currentYear, 6, 31, 23, 59, 59); // Jul 31
        return eventDate >= term3Start && eventDate <= term3End;
      }

      if (datePreset === 'CUSTOM') {
        if (customStartDate && new Date(customStartDate) > eventDate) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (end < eventDate) return false;
        }
      }

      return true;
    });
  }, [events, filterType, searchQuery, datePreset, customStartDate, customEndDate]);

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div id="activity-stream-widget" className="relative space-y-4">
      {/* Real-time Toast Notifications Overlay */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto bg-[#161925]/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl p-4 text-white overflow-hidden relative group"
            >
              {/* Highlight bar by type */}
              <div
                className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  toast.type === 'ENROLLMENT'
                    ? 'bg-emerald-500'
                    : toast.type === 'GRADE_UPDATE'
                    ? 'bg-purple-500'
                    : toast.type === 'SECURITY'
                    ? 'bg-rose-500'
                    : toast.type === 'ATTENDANCE'
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
              />

              <div className="flex items-start justify-between gap-2 pl-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-slate-800 text-blue-400">
                    <Bell className="w-3.5 h-3.5 animate-bounce" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {toast.type.replace('_', ' ')} EVENT DETECTED
                    </span>
                    <h4 className="text-xs font-semibold text-white">{toast.title}</h4>
                  </div>
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 pl-2 mt-1.5 leading-relaxed">
                {toast.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pl-2 mt-2 pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">{toast.actor || 'System'}</span>
                <span className="font-mono text-slate-400">{formatTimeAgo(toast.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Stream Card */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Header with Title & Action Controls */}
        <div className="p-6 border-b border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shadow-inner">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    Live Audit & Activity Stream
                  </h3>
                  {autoRefresh && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Feed
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time chronological audit trail of student enrollments, attendance entries, and grade updates.
                </p>
              </div>
            </div>

            {/* Top Right Action Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSimulateNewEvent}
                title="Simulate a new incoming student enrollment to test live toast notification"
                className="px-3 py-1.5 bg-[#161925] hover:bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Simulate Major Event
              </button>

              <button
                id="activity-stream-refresh-btn"
                onClick={() => loadStreamEvents(false)}
                disabled={loading || refreshing}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-blue-900/20 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Feed'}
              </button>
            </div>
          </div>

          {/* Filter Bar, Date Range Selector & Search */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Type Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                {[
                  { label: 'All Activities', value: 'ALL' },
                  { label: 'Enrollments', value: 'ENROLLMENT' },
                  { label: 'Attendance', value: 'ATTENDANCE' },
                  { label: 'Grade Updates', value: 'GRADE_UPDATE' },
                  { label: 'Security & Auth', value: 'SECURITY' },
                  { label: 'Finance & Fees', value: 'FINANCE' }
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setFilterType(tab.value)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      filterType === tab.value
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                        : 'bg-[#161925] text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search audit trail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#161925] border border-slate-700 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Date Range Filter Bar Component */}
            <div className="p-3 bg-[#161925]/60 rounded-xl border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Date Range Filter:
                </span>

                <select
                  id="activity-date-range-preset"
                  value={datePreset}
                  onChange={(e) => {
                    const val = e.target.value as DateRangePreset;
                    setDatePreset(val);
                    if (val === 'CUSTOM') setShowDatePicker(true);
                  }}
                  className="bg-[#0f111a] border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="THIS_WEEK">This Week</option>
                  <option value="THIS_MONTH">This Month</option>
                  <option value="LAST_30_DAYS">Last 30 Days</option>
                  <option value="TERM_1">Academic Term 1 (Sept - Dec)</option>
                  <option value="TERM_2">Academic Term 2 (Jan - Apr)</option>
                  <option value="TERM_3">Academic Term 3 (May - Jul)</option>
                  <option value="CUSTOM">Custom Date Range...</option>
                </select>

                {datePreset === 'CUSTOM' && (
                  <div className="flex items-center gap-2 flex-wrap mt-1 sm:mt-0">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-[#0f111a] border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-[#0f111a] border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Event count status */}
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>
                  Showing <strong className="text-white">{filteredEvents.length}</strong> event{filteredEvents.length !== 1 ? 's' : ''}
                </span>
                {(datePreset !== 'ALL' || filterType !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setDatePreset('ALL');
                      setFilterType('ALL');
                      setSearchQuery('');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="text-blue-400 hover:underline text-[10px] cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline List */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs">Loading live activity stream...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs italic space-y-2">
              <Info className="w-6 h-6 mx-auto text-slate-600 mb-1" />
              <p>No system activity logs found matching the selected date range or category filters.</p>
              <button
                onClick={() => {
                  setDatePreset('ALL');
                  setFilterType('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {filteredEvents.map((event) => (
                <div key={event.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-[#0f111a] border-2 border-slate-700 flex items-center justify-center group-hover:border-blue-500 transition-colors shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  </div>

                  {/* Event Card Content */}
                  <div className="p-4 bg-[#161925] hover:bg-[#1b1f2e] border border-slate-800 rounded-2xl transition-all space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border flex items-center gap-1.5 ${event.badgeColor}`}
                        >
                          {event.icon}
                          {event.type.replace('_', ' ')}
                        </span>
                        <h4 className="text-xs font-semibold text-white tracking-wide">
                          {event.title}
                        </h4>
                      </div>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono shrink-0">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatTimeAgo(event.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <span className="text-slate-500">Initiator:</span>
                        <span className="text-slate-300 font-medium">{event.actor}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[9px] font-mono">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                        {event.role && (
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md font-mono uppercase text-[9px]">
                            {event.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

