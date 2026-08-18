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
  LayoutGrid
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
import { MockAnalysisDashboard } from './MockAnalysisDashboard';
import { AttendanceManagementView } from './AttendanceManagementView';
import { TimetableManagementView } from './TimetableManagementView';
import { AssignmentManagementView } from './AssignmentManagementView';
import { FeesManagementView } from './FeesManagementView';
import { ExpenseManagementView } from './ExpenseManagementView';
import { AnnouncementsNotificationsView } from './AnnouncementsNotificationsView';
import { SchoolCalendarView } from './SchoolCalendarView';
import { PromotionModuleView } from './PromotionModuleView';
import { DocumentAndIDCardView } from './DocumentAndIDCardView';
import { DataImportExportView } from './DataImportExportView';
import { AuditLogView } from './AuditLogView';
import { ActivityStream } from './ActivityStream';
import { GlobalSearchModal } from './GlobalSearchModal';
import { OfflineAndPWAHeader } from './OfflineAndPWAHeader';
import { AccessControlProvider, Protect, UserRoleType } from './AccessControlManager';

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
    | 'EXAM_SETUP'
    | 'SCORE_ENTRY'
    | 'RESULT_MGMT'
    | 'BROADSHEET'
    | 'REPORT_CARDS'
    | 'BULK_REPORTS'
    | 'MOCK_ANALYSIS'
    | 'ATTENDANCE'
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
        { id: 'CLASSES', label: `Classes (${stats.classes})`, icon: SchoolIcon, color: 'text-purple-400' }
      ]
    },
    {
      id: 'academic',
      title: 'Academic Engine',
      items: [
        { id: 'EXAM_SETUP', label: 'SBA & Exam Setup', icon: Sliders, color: 'text-amber-400' },
        { id: 'SCORE_ENTRY', label: 'Score Entry Worksheet', icon: CheckSquare, color: 'text-blue-400' },
        { id: 'RESULT_MGMT', label: 'Result Approval & Audit', icon: ShieldCheck, color: 'text-emerald-400' }
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      items: [
        { id: 'BROADSHEET', label: 'Class Broadsheet', icon: FileSpreadsheet, color: 'text-blue-400' },
        { id: 'REPORT_CARDS', label: 'Student Report Cards', icon: FileText, color: 'text-indigo-400' },
        { id: 'BULK_REPORTS', label: 'Bulk Report Print', icon: Layers, color: 'text-purple-400' },
        { id: 'MOCK_ANALYSIS', label: 'Mock Exam Analytics', icon: BarChart2, color: 'text-emerald-400' }
      ]
    },
    {
      id: 'operations',
      title: 'Operations & Finance',
      items: [
        { id: 'ATTENDANCE', label: 'Attendance Roll Call', icon: UserCheck, color: 'text-emerald-400' },
        { id: 'TIMETABLE', label: 'Academic Timetable', icon: Calendar, color: 'text-amber-400' },
        { id: 'ASSIGNMENTS', label: 'Homework & Tasks', icon: BookOpen, color: 'text-indigo-400' },
        { id: 'FEES', label: 'School Fees & Receipts', icon: BarChart2, color: 'text-emerald-400' },
        { id: 'EXPENSES', label: 'Expense Ledger', icon: FileSpreadsheet, color: 'text-rose-400' },
        { id: 'ANNOUNCEMENTS', label: 'Noticeboard Broadcast', icon: Sparkles, color: 'text-yellow-400' },
        { id: 'CALENDAR', label: 'School Calendar', icon: Calendar, color: 'text-blue-400' },
        { id: 'PROMOTION', label: 'Student Promotion', icon: GraduationCap, color: 'text-purple-400' },
        { id: 'DOCUMENTS', label: 'ID Badges & Testimonials', icon: FileText, color: 'text-cyan-400' },
        { id: 'DATA_IMPORT_EXPORT', label: 'Batch CSV Import & Export', icon: Layers, color: 'text-emerald-400' },
        { id: 'AUDIT_LOGS', label: 'Security Audit Trail', icon: ShieldCheck, color: 'text-indigo-400' },
        { id: 'ACTIVITY_STREAM', label: 'Live Activity Stream', icon: Sparkles, color: 'text-emerald-400' }
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      items: [
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
      <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center p-4 text-slate-200 font-sans">
        <div className="text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-xs font-semibold tracking-wider uppercase">Loading School Administration Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AccessControlProvider schoolId={schoolId} userRole={userRole}>
      <div className="min-h-screen bg-[#0a0b10] text-slate-200 flex flex-col font-sans">
        {/* Top Navigation */}
      <header className="bg-[#0f111a] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile / Tablet Drawer Toggle Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#161925] border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
              aria-label="Toggle navigation menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5 text-blue-400" /> : <Menu className="w-5 h-5 text-blue-400" />}
            </motion.button>

            {school?.logoUrl ? (
              <img src={school.logoUrl} alt="Logo" className="w-9 h-9 rounded-xl border border-slate-700 object-cover bg-[#161925]" />
            ) : (
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold shadow-md">
                <SchoolIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-white serif italic block leading-tight truncate">
                {school?.name || 'School Dashboard'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-blue-400 font-bold uppercase tracking-widest block truncate">
                ID: {schoolId} • {settings?.currentAcademicYear || '2026/2027'} ({settings?.currentTerm || 'Term 1'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <OfflineAndPWAHeader />

            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-3 py-1.5 bg-[#161925] hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl transition-colors hidden md:flex items-center gap-1.5 cursor-pointer"
            >
              Search... (Ctrl+K)
            </button>

            {isLicenseExpired ? (
              <span className="px-2.5 sm:px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold rounded-full uppercase tracking-widest inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span> License Expired
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-widest hidden sm:inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> License Active
              </span>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="px-3 sm:px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 border border-rose-500/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Active Tab Sub-header Bar (Quick View indicator on phone/tablet) */}
      <div className="lg:hidden bg-[#0a0b12] border-b border-slate-800/80 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active:</span>
          <span className="text-xs font-bold text-white truncate bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-lg">
            {navCategories.flatMap(c => c.items).find(i => i.id === activeTab)?.label || activeTab}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsMobileNavOpen(true)}
          className="text-xs text-blue-400 font-semibold flex items-center gap-1 bg-[#161925] px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Switch Tab
        </motion.button>
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
              className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
            />

            {/* Slide-out Drawer Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-4/5 max-w-sm bg-[#0d0e17] border-r border-slate-800 text-slate-200 h-full flex flex-col shadow-2xl z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#11131e]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
                    <SchoolIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white truncate max-w-[170px]">{school?.name || 'School Menu'}</h3>
                    <p className="text-[10px] text-blue-400">Navigation Hub</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-[#161925] border border-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Drawer Scrollable Links */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {navCategories.map(category => (
                  <div key={category.id} className="space-y-1">
                    <button
                      onClick={() => toggleSection(category.id)}
                      className="w-full flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2 py-1 hover:text-slate-300 cursor-pointer"
                    >
                      <span>{category.title}</span>
                      {collapsedSections[category.id] ? (
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-500" />
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
                              <motion.button
                                key={item.id}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                  setActiveTab(item.id as any);
                                  setIsMobileNavOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer relative ${
                                  isActive
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-300 hover:bg-[#161925] hover:text-white'
                                }`}
                              >
                                <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                                <span className="truncate flex-1">{item.label}</span>
                                {isActive && (
                                  <motion.span
                                    layoutId="mobileActiveIndicator"
                                    className="w-1.5 h-1.5 rounded-full bg-white"
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-slate-800 bg-[#11131e] space-y-2">
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Body Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Desktop Sidebar Navigation */}
        <aside className="lg:col-span-1 space-y-2 hidden lg:block print:hidden">
          <div className="bg-[#0f111a] rounded-2xl border border-slate-800 p-3 shadow-xl space-y-3 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            {navCategories.map(category => (
              <div key={category.id} className="space-y-1">
                <button
                  onClick={() => toggleSection(category.id)}
                  className="w-full flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2.5 pt-1 pb-1 hover:text-slate-300 cursor-pointer"
                >
                  <span>{category.title}</span>
                  {collapsedSections[category.id] ? (
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-500" />
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
                                : 'text-slate-400 hover:bg-[#161925] hover:text-slate-200'
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="adminDesktopActiveNavPill"
                                className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-900/20 -z-0"
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
              <div className="bg-[#0f111a] border border-slate-800 text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="max-w-2xl relative z-10 space-y-2">
                  <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                    ADMINISTRATOR DASHBOARD
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-light serif italic text-white">{school?.name}</h1>
                  <p className="text-xs text-slate-400 italic">{school?.motto || 'Excellence in Education'}</p>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Total Students</span>
                  <p className="text-2xl font-light text-white serif italic">{stats.students}</p>
                </div>

                <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Teaching Staff</span>
                  <p className="text-2xl font-light text-white serif italic">{stats.teachers}</p>
                </div>

                <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Active Classes</span>
                  <p className="text-2xl font-light text-white serif italic">{stats.classes}</p>
                </div>

                <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Curriculum Subjects</span>
                  <p className="text-2xl font-light text-white serif italic">{stats.subjects}</p>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <h3 className="font-light text-white serif italic text-base">Quick Operations Management</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <button
                    onClick={() => setActiveTab('TEACHERS')}
                    className="p-4 bg-[#161925] hover:bg-[#1c2030] border border-slate-800 rounded-xl font-semibold text-slate-200 text-left transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Manage Teachers & Signatures</span>
                    <UserCheck className="w-4 h-4 text-blue-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('STUDENTS')}
                    className="p-4 bg-[#161925] hover:bg-[#1c2030] border border-slate-800 rounded-xl font-semibold text-slate-200 text-left transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Manage Enrolled Students</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('SUBJECTS')}
                    className="p-4 bg-[#161925] hover:bg-[#1c2030] border border-slate-800 rounded-xl font-semibold text-slate-200 text-left transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Curriculum & Subject Filtering</span>
                    <BookOpen className="w-4 h-4 text-blue-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('CLASSES')}
                    className="p-4 bg-[#161925] hover:bg-[#1c2030] border border-slate-800 rounded-xl font-semibold text-slate-200 text-left transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Classes & Stream Capacity</span>
                    <SchoolIcon className="w-4 h-4 text-blue-400" />
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
          {activeTab === 'EXAM_SETUP' && <ExamSetupView schoolId={schoolId} />}
          {activeTab === 'SCORE_ENTRY' && <Protect permission="results.edit" showBadgeIfDenied><TeacherScoreEntryView schoolId={schoolId} isSchoolAdmin={true} /></Protect>}
          {activeTab === 'RESULT_MGMT' && <Protect permission="results.approve" showBadgeIfDenied><ResultManagementView schoolId={schoolId} /></Protect>}
          {activeTab === 'BROADSHEET' && <ClassBroadsheetView schoolId={schoolId} />}
          {activeTab === 'REPORT_CARDS' && <StudentReportCardView schoolId={schoolId} />}
          {activeTab === 'BULK_REPORTS' && <BulkReportGenerator schoolId={schoolId} />}
          {activeTab === 'MOCK_ANALYSIS' && <MockAnalysisDashboard schoolId={schoolId} />}
          {activeTab === 'ATTENDANCE' && <Protect permission="attendance.mark" showBadgeIfDenied><AttendanceManagementView schoolId={schoolId} /></Protect>}
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
