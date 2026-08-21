import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CheckSquare,
  Award,
  Settings,
  LogOut,
  UserCheck,
  Clock,
  FileSpreadsheet,
  BarChart2,
  Menu,
  X,
  School as SchoolIcon,
  ChevronRight,
  TrendingUp,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Teacher, Student, SubjectItem, ClassItem } from '../types';
import {
  getTeachersBySchool,
  getStudentsBySchool,
  getSubjectsBySchool,
  getClassesBySchool
} from '../lib/services';
import { TeacherScoreEntryView } from './TeacherScoreEntryView';
import { StudentReportCardView } from './StudentReportCardView';
import { ClassBroadsheetView } from './ClassBroadsheetView';
import { AttendanceManagementView } from './AttendanceManagementView';
import { AssignmentManagementView } from './AssignmentManagementView';
import { TimetableManagementView } from './TimetableManagementView';
import { StudentPerformanceAnalytics } from './StudentPerformanceAnalytics';
import { TeacherProfileSettingsView } from './TeacherProfileSettingsView';
import { TeacherStudentsView } from './TeacherStudentsView';
import { TeacherClassesView } from './TeacherClassesView';
import { TeacherSubjectsView } from './TeacherSubjectsView';
import { TermAttendanceSummaryView } from './TermAttendanceSummaryView';
import { Button, StatCard, Badge, PageHeader, Modal } from './ui';

interface Props {
  schoolId: string;
  email: string;
  onLogout: () => void;
}

type NavTab =
  | 'DASHBOARD'
  | 'STUDENTS'
  | 'CLASSES'
  | 'SUBJECTS'
  | 'SCORE_ENTRY'
  | 'REPORT_CARDS'
  | 'SETTINGS'
  | 'ATTENDANCE'
  | 'TERM_ATTENDANCE'
  | 'ASSIGNMENTS'
  | 'TIMETABLE'
  | 'BROADSHEET'
  | 'ANALYTICS';

export const TeacherDashboard: React.FC<Props> = ({ schoolId, email, onLogout }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('DASHBOARD');
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadTeacherData();
  }, [schoolId, email]);

  const loadTeacherData = async () => {
    setLoading(true);
    const [tList, stList, subList, cList] = await Promise.all([
      getTeachersBySchool(schoolId),
      getStudentsBySchool(schoolId),
      getSubjectsBySchool(schoolId),
      getClassesBySchool(schoolId)
    ]);

    const found = tList.find((t) => t.email.toLowerCase() === email.toLowerCase()) || tList[0];
    setTeacher(found || null);
    setStudents(stList);
    setSubjects(subList);
    setClasses(cList);
    setLoading(false);
  };

  interface PrimaryNavItem {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const primaryNavItems: PrimaryNavItem[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'STUDENTS', label: 'Students', icon: Users, badge: students.length },
    { id: 'CLASSES', label: 'Classes', icon: GraduationCap, badge: classes.length },
    { id: 'SUBJECTS', label: 'Subjects', icon: BookOpen, badge: subjects.length },
    { id: 'SCORE_ENTRY', label: 'Score Entry', icon: CheckSquare },
    { id: 'REPORT_CARDS', label: 'Published Report Cards', icon: Award },
    { id: 'SETTINGS', label: 'Settings', icon: Settings }
  ];

  interface SecondaryNavItem {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const secondaryNavItems: SecondaryNavItem[] = [
    { id: 'BROADSHEET', label: 'Broadsheet', icon: FileSpreadsheet },
    { id: 'ATTENDANCE', label: 'Daily Roll Call', icon: UserCheck },
    { id: 'TERM_ATTENDANCE', label: 'Term Attendance Summary', icon: CheckSquare },
    { id: 'ASSIGNMENTS', label: 'Assignments', icon: BookOpen },
    { id: 'TIMETABLE', label: 'Timetable', icon: Clock },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart2 }
  ];

  const handleNavSelect = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileNavOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Loading Teacher Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-sm">
              <SchoolIcon className="w-5 h-5" />
            </div>

            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                {teacher?.fullName || 'Educator Portal'}
              </h1>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                Staff ID: {teacher?.staffId || 'TCH-001'} • School ID: {schoolId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              onClick={() => setShowLogoutConfirm(true)}
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-6 shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-1">
              Core Modules
            </span>
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-1">
              Tools & Analytics
            </span>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'DASHBOARD' && (
                <div className="space-y-6">
                  {/* Welcome Card */}
                  <div className="bg-gradient-to-r from-indigo-900/40 via-indigo-950/20 to-transparent bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <Badge variant="active" label="Staff Dashboard" icon={<Sparkles className="w-3 h-3" />} />
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Welcome back, {teacher?.fullName || 'Educator'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Staff ID: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{teacher?.staffId || 'TCH-001'}</span> • Qualification: {teacher?.qualification || 'B.Ed'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<CheckSquare className="w-4 h-4" />}
                        onClick={() => setActiveTab('SCORE_ENTRY')}
                      >
                        Score Entry
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        leftIcon={<Award className="w-4 h-4" />}
                        onClick={() => setActiveTab('REPORT_CARDS')}
                      >
                        Report Cards
                      </Button>
                    </div>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Enrolled Students"
                      value={students.length}
                      icon={<Users className="w-6 h-6" />}
                      description="Active school roster"
                      colorScheme="indigo"
                    />
                    <StatCard
                      title="Assigned Classes"
                      value={classes.length}
                      icon={<GraduationCap className="w-6 h-6" />}
                      description="Grade levels & streams"
                      colorScheme="emerald"
                    />
                    <StatCard
                      title="Curriculum Subjects"
                      value={subjects.length}
                      icon={<BookOpen className="w-6 h-6" />}
                      description="Assigned syllabus items"
                      colorScheme="purple"
                    />
                    <StatCard
                      title="Weekly Workload"
                      value={`${teacher?.periodsCount || 18} Periods`}
                      icon={<Clock className="w-6 h-6" />}
                      description="Scheduled timetable slots"
                      colorScheme="amber"
                    />
                  </div>

                  {/* Student Performance Analytics */}
                  <StudentPerformanceAnalytics schoolId={schoolId} teacherEmail={email} />
                </div>
              )}

              {activeTab === 'STUDENTS' && <TeacherStudentsView schoolId={schoolId} />}
              {activeTab === 'CLASSES' && <TeacherClassesView schoolId={schoolId} />}
              {activeTab === 'SUBJECTS' && <TeacherSubjectsView schoolId={schoolId} />}
              {activeTab === 'SCORE_ENTRY' && (
                <TeacherScoreEntryView
                  schoolId={schoolId}
                  teacherEmail={email}
                  classes={classes}
                  subjects={subjects}
                />
              )}
              {activeTab === 'REPORT_CARDS' && (
                <StudentReportCardView
                  schoolId={schoolId}
                  studentId={students[0]?.id || ''}
                  classes={classes}
                />
              )}
              {activeTab === 'BROADSHEET' && <ClassBroadsheetView schoolId={schoolId} />}
              {activeTab === 'ATTENDANCE' && <AttendanceManagementView schoolId={schoolId} />}
              {activeTab === 'TERM_ATTENDANCE' && <TermAttendanceSummaryView schoolId={schoolId} />}
              {activeTab === 'ASSIGNMENTS' && <AssignmentManagementView schoolId={schoolId} />}
              {activeTab === 'TIMETABLE' && <TimetableManagementView schoolId={schoolId} />}
              {activeTab === 'ANALYTICS' && (
                <StudentPerformanceAnalytics schoolId={schoolId} teacherEmail={email} />
              )}
              {activeTab === 'SETTINGS' && (
                <TeacherProfileSettingsView
                  schoolId={schoolId}
                  teacherEmail={email}
                  onProfileUpdated={loadTeacherData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Confirm Logout"
        description="Are you sure you want to end your teacher session?"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Unsaved changes will be safely discarded. You can log back in at any time with your credentials.
        </p>
      </Modal>
    </div>
  );
};
