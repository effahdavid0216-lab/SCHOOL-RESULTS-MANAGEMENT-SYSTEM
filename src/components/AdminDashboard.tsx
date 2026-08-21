import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  School as SchoolIcon,
  Users,
  UserCheck,
  BookOpen,
  Settings,
  ShieldCheck,
  LogOut,
  Calendar,
  Award,
  Layers,
  GraduationCap,
  Sparkles,
  Loader2,
  FileSpreadsheet,
  FileText,
  BarChart2,
  Sliders,
  CheckSquare,
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  TrendingUp,
  HardDrive
} from 'lucide-react';
import { School, SchoolSettings, License } from '../types';
import {
  getSchoolDetails,
  getSchoolSettings,
  getTeachersBySchool,
  getStudentsBySchool,
  getClassesBySchool,
  getSubjectsBySchool,
  getSchoolLicense
} from '../lib/services';
import { TeacherManagement } from './TeacherManagement';
import { StudentManagement } from './StudentManagement';
import { SubjectManagement } from './SubjectManagement';
import { ClassManagement } from './ClassManagement';
import { SchoolSettingsView } from './SchoolSettingsView';
import { ExamSetupView } from './ExamSetupView';
import { TeacherScoreEntryView } from './TeacherScoreEntryView';
import { ResultManagementView } from './ResultManagementView';
import { ClassBroadsheetView } from './ClassBroadsheetView';
import { StudentReportCardView } from './StudentReportCardView';
import { BulkReportGenerator } from './BulkReportGenerator';
import { ReportGenerationModule } from './ReportGenerationModule';
import { MockAnalysisDashboard } from './MockAnalysisDashboard';
import { AttendanceManagementView } from './AttendanceManagementView';
import { TermAttendanceSummaryView } from './TermAttendanceSummaryView';
import { TimetableManagementView } from './TimetableManagementView';
import { AssignmentManagementView } from './AssignmentManagementView';
import { FeesManagementView } from './FeesManagementView';
import { ExpenseManagementView } from './ExpenseManagementView';
import { AnnouncementsNotificationsView } from './AnnouncementsNotificationsView';
import { SchoolCalendarView } from './SchoolCalendarView';
import { PromotionModuleView } from './PromotionModuleView';
import { HouseManagementView } from './HouseManagementView';
import { TeacherSubjectAssignmentView } from './TeacherSubjectAssignmentView';
import { TeacherSubmissionMonitorView } from './TeacherSubmissionMonitorView';
import { DocumentAndIDCardView } from './DocumentAndIDCardView';
import { ExamsResultsAnalyzerView } from './ExamsResultsAnalyzerView';
import { StorageSettingsView } from './StorageSettingsView';
import { StorageSettings } from './StorageSettings';
import { DataImportExportView } from './DataImportExportView';
import { AuditLogView } from './AuditLogView';
import { ActivityStream } from './ActivityStream';
import { GlobalSearchModal } from './GlobalSearchModal';
import { OfflineAndPWAHeader } from './OfflineAndPWAHeader';
import { AccessControlProvider, Protect, UserRoleType } from './AccessControlManager';
import {
  Button,
  StatCard,
  Badge,
  PageHeader,
  Modal
} from './ui';

interface Props {
  schoolId: string;
  userRole?: UserRoleType;
  onLogout: () => void;
  onOpenSuperAdmin?: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  schoolId,
  userRole = 'ADMIN',
  onLogout,
  onOpenSuperAdmin
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'OVERVIEW'
    | 'TEACHERS'
    | 'STUDENTS'
    | 'SUBJECTS'
    | 'CLASSES'
    | 'HOUSES'
    | 'TEACHER_SUBJECT_ASSIGNMENTS'
    | 'EXAM_SETUP'
    | 'SCORE_ENTRY'
    | 'SUBMISSION_MONITOR'
    | 'RESULT_MGMT'
    | 'BROADSHEET'
    | 'REPORT_CARDS'
    | 'BULK_REPORTS'
    | 'EXAMS_ANALYZER'
    | 'MOCK_ANALYSIS'
    | 'ATTENDANCE'
    | 'TERM_ATTENDANCE'
    | 'TIMETABLE'
    | 'ASSIGNMENTS'
    | 'FEES'
    | 'EXPENSES'
    | 'ANNOUNCEMENTS'
    | 'CALENDAR'
    | 'PROMOTION'
    | 'DOCUMENTS'
    | 'DATA_IMPORT_EXPORT'
    | 'AUDIT_LOGS'
    | 'ACTIVITY_STREAM'
    | 'STORAGE_SETTINGS'
    | 'SETTINGS'
  >('OVERVIEW');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0, subjects: 0 });
  const [loading, setLoading] = useState(true);

  // Close mobile navigation drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileNavOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navCategories = [
    {
      id: 'core',
      title: 'Core Setup',
      items: [
        { id: 'OVERVIEW', label: 'Overview', icon: GraduationCap, color: 'text-blue-400' },
        { id: 'TEACHERS', label: `Teachers (${stats.teachers})`, icon: UserCheck, color: 'text-cyan-400' },
        { id: 'STUDENTS', label: `Students (${stats.students})`, icon: Users, color: 'text-indigo-400' },
        { id: 'SUBJECTS', label: `Subjects (${stats.subjects})`, icon: BookOpen, color: 'text-emerald-400' },
        { id: 'CLASSES', label: `Classes (${stats.classes})`, icon: SchoolIcon, color: 'text-purple-400' },
        { id: 'HOUSES', label: 'School Houses', icon: Layers, color: 'text-amber-400' },
        { id: 'TEACHER_SUBJECT_ASSIGNMENTS', label: 'Faculty Subject Allocations', icon: UserCheck, color: 'text-blue-400' }
      ]
    },
    {
      id: 'academic',
      title: 'Academic Engine',
      items: [
        { id: 'EXAM_SETUP', label: 'SBA & Exam Setup', icon: Sliders, color: 'text-amber-400' },
        { id: 'SCORE_ENTRY', label: 'Score Entry Worksheet', icon: CheckSquare, color: 'text-blue-400' },
        { id: 'SUBMISSION_MONITOR', label: 'Submission Verification', icon: ShieldCheck, color: 'text-cyan-400' },
        { id: 'RESULT_MGMT', label: 'Result Approval & Audit', icon: ShieldCheck, color: 'text-emerald-400' }
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      items: [
        { id: 'BROADSHEET', label: 'Class Broadsheet & Control', icon: FileSpreadsheet, color: 'text-blue-400' },
        { id: 'REPORT_CARDS', label: 'Student Report Cards', icon: FileText, color: 'text-indigo-400' },
        { id: 'BULK_REPORTS', label: 'Bulk Report Print', icon: Layers, color: 'text-purple-400' },
        { id: 'EXAMS_ANALYZER', label: 'Exams Results Analyzer', icon: TrendingUp, color: 'text-cyan-400' },
        { id: 'MOCK_ANALYSIS', label: 'Mock Exam Analytics', icon: BarChart2, color: 'text-emerald-400' }
      ]
    },
    {
      id: 'operations',
      title: 'Operations & Finance',
      items: [
        { id: 'ATTENDANCE', label: 'Daily Roll Call', icon: UserCheck, color: 'text-emerald-400' },
        { id: 'TERM_ATTENDANCE', label: 'Term Attendance Summary', icon: CheckSquare, color: 'text-cyan-400' },
        { id: 'TIMETABLE', label: 'Academic Timetable', icon: Calendar, color: 'text-amber-400' },
        { id: 'ASSIGNMENTS', label: 'Homework & Tasks', icon: BookOpen, color: 'text-indigo-400' },
        { id: 'FEES', label: 'School Fees & Receipts', icon: BarChart2, color: 'text-emerald-400' },
        { id: 'EXPENSES', label: 'Expense Ledger', icon: FileSpreadsheet, color: 'text-rose-400' },
        { id: 'ANNOUNCEMENTS', label: 'Noticeboard Broadcast', icon: Sparkles, color: 'text-yellow-400' },
        { id: 'CALENDAR', label: 'School Calendar', icon: Calendar, color: 'text-blue-400' },
        { id: 'PROMOTION', label: 'Student Promotion', icon: GraduationCap, color: 'text-purple-400' },
        { id: 'DOCUMENTS', label: 'Student ID Cards & Certificates', icon: FileText, color: 'text-cyan-400' },
        { id: 'DATA_IMPORT_EXPORT', label: 'Batch CSV Import & Export', icon: Layers, color: 'text-emerald-400' },
        { id: 'AUDIT_LOGS', label: 'Security Audit Trail', icon: ShieldCheck, color: 'text-indigo-400' },
        { id: 'ACTIVITY_STREAM', label: 'Live Activity Stream', icon: Sparkles, color: 'text-emerald-400' }
      ]
    },
    {
      id: 'settings',
      title: 'Settings & Cloud Storage',
      items: [
        { id: 'STORAGE_SETTINGS', label: 'Storage & Google Drive', icon: HardDrive, color: 'text-cyan-400' },
        { id: 'SETTINGS', label: 'School Settings', icon: Settings, color: 'text-slate-300' }
      ]
    }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [schoolId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sch, setts, tList, stList, cList, subList, lic] = await Promise.all([
        getSchoolDetails(schoolId),
        getSchoolSettings(schoolId),
        getTeachersBySchool(schoolId),
        getStudentsBySchool(schoolId),
        getClassesBySchool(schoolId),
        getSubjectsBySchool(schoolId),
        getSchoolLicense(schoolId)
      ]);

      setSchool(sch);
      setSettings(setts);
      setLicense(lic);
      setStats({
        teachers: tList.length,
        students: stList.length,
        classes: cList.length,
        subjects: subList.length
      });
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const isLicenseExpired =
    school?.status === 'SUSPENDED' ||
    license?.status === 'EXPIRED' ||
    (license?.expiresAt && new Date(license.expiresAt) < new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-slate-900 dark:text-slate-100 font-sans">
        <div className="text-center text-slate-500 dark:text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
          <p className="text-xs font-semibold tracking-wider uppercase">Loading School Administration Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AccessControlProvider schoolId={schoolId} userRole={userRole}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        {/* Top Navigation */}
      <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile / Tablet Drawer Toggle Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
              aria-label="Toggle navigation menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Menu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            </motion.button>

            {school?.logoUrl ? (
              <img src={school.logoUrl} alt="Logo" className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 object-cover bg-slate-100 dark:bg-slate-800" />
            ) : (
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold shadow-xs">
                <SchoolIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white block leading-tight truncate">
                {school?.name || 'School Dashboard'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest block truncate">
                ID: {schoolId} • {settings?.currentAcademicYear || '2026/2027'} ({settings?.currentTerm || 'Term 1'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <OfflineAndPWAHeader />

            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl transition-colors hidden md:flex items-center gap-1.5 cursor-pointer"
            >
              Search... (Ctrl+K)
            </button>

            {isLicenseExpired ? (
              <Badge variant="overdue" label="License Expired" />
            ) : (
              <Badge variant="published" label="License Active" />
            )}

            <Button
              variant="danger"
              size="sm"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              onClick={onLogout}
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Active Tab Sub-header Bar */}
      <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Active:</span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-lg">
            {navCategories.flatMap(c => c.items).find(i => i.id === activeTab)?.label || activeTab}
          </span>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Switch Tab
        </button>
      </div>

      {/* Mobile / Tablet Responsive Drawer Navigation Menu */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-out Drawer Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-4/5 max-w-sm bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-full flex flex-col shadow-2xl z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">
                    <SchoolIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]">{school?.name || 'School Menu'}</h3>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400">Navigation Hub</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Links */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {navCategories.map(category => (
                  <div key={category.id} className="space-y-1">
                    <button
                      onClick={() => toggleSection(category.id)}
                      className="w-full flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest px-2 py-1 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      <span>{category.title}</span>
                      {collapsedSections[category.id] ? (
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {!collapsedSections[category.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden space-y-1"
                        >
                          {category.items.map(item => {
                            const IconComponent = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(item.id as any);
                                  setIsMobileNavOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer relative ${
                                  isActive
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                                <span className="truncate flex-1">{item.label}</span>
                                {isActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-2">
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onLogout();
                  }}
                >
                  Logout Session
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Body Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Desktop Sidebar Navigation */}
        <aside className="lg:col-span-1 space-y-2 hidden lg:block print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs space-y-3 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            {navCategories.map(category => (
              <div key={category.id} className="space-y-1">
                <button
                  onClick={() => toggleSection(category.id)}
                  className="w-full flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest px-2.5 pt-1 pb-1 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  <span>{category.title}</span>
                  {collapsedSections[category.id] ? (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {!collapsedSections[category.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden space-y-0.5"
                    >
                      {category.items.map(item => {
                        const IconComponent = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            id={`admin-nav-${item.id.toLowerCase()}`}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 cursor-pointer relative ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="adminDesktopActiveNavPill"
                                className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs -z-0"
                                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                              />
                            )}
                            <span className="relative z-10 flex items-center gap-2.5 w-full">
                              <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                              <span className="truncate">{item.label}</span>
                            </span>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </aside>

        {/* Dynamic Tab Content Area with Smooth Motion Transitions */}
        <section className="lg:col-span-4 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-6"
            >
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Top Banner Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 z-10">
                  <Badge variant="active" label="Administration Command Center" icon={<Sparkles className="w-3 h-3" />} />
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {school?.name || 'School Dashboard'}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {school?.motto || 'Excellence in Education'} • {school?.district || 'District'}, {school?.region || 'Region'}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    onClick={() => setActiveTab('BROADSHEET')}
                  >
                    Broadsheet
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckSquare className="w-4 h-4" />}
                    onClick={() => setActiveTab('SCORE_ENTRY')}
                  >
                    Score Entry
                  </Button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Students"
                  value={stats.students}
                  icon={<Users className="w-6 h-6" />}
                  description="Enrolled student directory"
                  colorScheme="indigo"
                />
                <StatCard
                  title="Teaching Staff"
                  value={stats.teachers}
                  icon={<UserCheck className="w-6 h-6" />}
                  description="Registered academic tutors"
                  colorScheme="emerald"
                />
                <StatCard
                  title="Active Classes"
                  value={stats.classes}
                  icon={<GraduationCap className="w-6 h-6" />}
                  description="Grade levels & streams"
                  colorScheme="purple"
                />
                <StatCard
                  title="Curriculum Subjects"
                  value={stats.subjects}
                  icon={<BookOpen className="w-6 h-6" />}
                  description="Active syllabus courses"
                  colorScheme="amber"
                />
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Quick Operations Management
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('TEACHERS')}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 rounded-2xl font-bold text-slate-800 dark:text-slate-100 text-left transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span>Manage Teachers & Staff</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('STUDENTS')}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 rounded-2xl font-bold text-slate-800 dark:text-slate-100 text-left transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>Manage Enrolled Students</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('CLASSES')}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 rounded-2xl font-bold text-slate-800 dark:text-slate-100 text-left transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                        <SchoolIcon className="w-4 h-4" />
                      </div>
                      <span>Classes & Stream Capacity</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('SUBJECTS')}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 rounded-2xl font-bold text-slate-800 dark:text-slate-100 text-left transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span>Curriculum & Subject Filtering</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Live Activity & Audit Stream Component */}
              <ActivityStream schoolId={schoolId} />
            </div>
          )}

          {activeTab === 'TEACHERS' && <Protect permission="teachers.manage" showBadgeIfDenied><TeacherManagement schoolId={schoolId} /></Protect>}
          {activeTab === 'STUDENTS' && <Protect permission="students.edit" showBadgeIfDenied><StudentManagement schoolId={schoolId} /></Protect>}
          {activeTab === 'SUBJECTS' && <SubjectManagement schoolId={schoolId} schoolType={school?.schoolType} />}
          {activeTab === 'CLASSES' && <ClassManagement schoolId={schoolId} />}
          {activeTab === 'HOUSES' && <HouseManagementView schoolId={schoolId} />}
          {activeTab === 'TEACHER_SUBJECT_ASSIGNMENTS' && <TeacherSubjectAssignmentView schoolId={schoolId} academicYear="2026/2027" />}
          {activeTab === 'EXAM_SETUP' && <ExamSetupView schoolId={schoolId} />}
          {activeTab === 'SCORE_ENTRY' && <Protect permission="results.edit" showBadgeIfDenied><TeacherScoreEntryView schoolId={schoolId} isSchoolAdmin={true} /></Protect>}
          {activeTab === 'SUBMISSION_MONITOR' && <TeacherSubmissionMonitorView schoolId={schoolId} academicYear="2026/2027" term="Term 1" />}
          {activeTab === 'RESULT_MGMT' && <Protect permission="results.approve" showBadgeIfDenied><ResultManagementView schoolId={schoolId} /></Protect>}
          {activeTab === 'BROADSHEET' && <ClassBroadsheetView schoolId={schoolId} />}
          {activeTab === 'REPORT_CARDS' && <StudentReportCardView schoolId={schoolId} />}
          {activeTab === 'BULK_REPORTS' && <ReportGenerationModule schoolId={schoolId} />}
          {activeTab === 'EXAMS_ANALYZER' && <ExamsResultsAnalyzerView schoolId={schoolId} userRole={userRole} />}
          {activeTab === 'MOCK_ANALYSIS' && <MockAnalysisDashboard schoolId={schoolId} />}
          {activeTab === 'ATTENDANCE' && <Protect permission="attendance.mark" showBadgeIfDenied><AttendanceManagementView schoolId={schoolId} /></Protect>}
          {activeTab === 'TERM_ATTENDANCE' && <Protect permission="attendance.mark" showBadgeIfDenied><TermAttendanceSummaryView schoolId={schoolId} userRole={userRole} /></Protect>}
          {activeTab === 'TIMETABLE' && <TimetableManagementView schoolId={schoolId} />}
          {activeTab === 'ASSIGNMENTS' && <Protect permission="assignments.manage" showBadgeIfDenied><AssignmentManagementView schoolId={schoolId} /></Protect>}
          {activeTab === 'FEES' && <Protect permission="fees.manage" showBadgeIfDenied><FeesManagementView schoolId={schoolId} /></Protect>}
          {activeTab === 'EXPENSES' && <Protect permission="expenses.manage" showBadgeIfDenied><ExpenseManagementView schoolId={schoolId} /></Protect>}
          {activeTab === 'ANNOUNCEMENTS' && <AnnouncementsNotificationsView schoolId={schoolId} />}
          {activeTab === 'CALENDAR' && <SchoolCalendarView schoolId={schoolId} />}
          {activeTab === 'PROMOTION' && <Protect permission="students.promote" showBadgeIfDenied><PromotionModuleView schoolId={schoolId} /></Protect>}
          {activeTab === 'DOCUMENTS' && <DocumentAndIDCardView schoolId={schoolId} />}
          {activeTab === 'DATA_IMPORT_EXPORT' && <DataImportExportView schoolId={schoolId} />}
          {activeTab === 'AUDIT_LOGS' && <Protect permission="audit.view" showBadgeIfDenied><AuditLogView schoolId={schoolId} /></Protect>}
          {activeTab === 'ACTIVITY_STREAM' && <ActivityStream schoolId={schoolId} />}
          {activeTab === 'STORAGE_SETTINGS' && <Protect permission="settings.edit" showBadgeIfDenied><StorageSettings schoolId={schoolId} /></Protect>}
          {activeTab === 'SETTINGS' && <Protect permission="settings.edit" showBadgeIfDenied><SchoolSettingsView schoolId={schoolId} /></Protect>}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      <GlobalSearchModal
        schoolId={schoolId}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={tab => setActiveTab(tab as any)}
      />
    </div>
    </AccessControlProvider>
  );
};
