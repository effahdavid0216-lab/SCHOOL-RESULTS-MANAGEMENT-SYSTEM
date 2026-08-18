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
  AlertCircle
} from 'lucide-react';
import { Teacher, Student, SubjectItem, ClassItem } from '../types';
import { getTeachersBySchool, getStudentsBySchool, getSubjectsBySchool, getClassesBySchool } from '../lib/services';
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

    const found = tList.find(t => t.email.toLowerCase() === email.toLowerCase()) || tList[0];
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
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  interface SecondaryNavItem {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const secondaryNavItems: SecondaryNavItem[] = [
    { id: 'BROADSHEET', label: 'Broadsheet', icon: FileSpreadsheet },
    { id: 'ATTENDANCE', label: 'Roll Call', icon: UserCheck },
    { id: 'ASSIGNMENTS', label: 'Assignments', icon: BookOpen },
    { id: 'TIMETABLE', label: 'Timetable', icon: Clock },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart2 },
  ];

  const handleNavSelect = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 font-sans flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#0f111a] border-b border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-2 bg-[#161925] border border-slate-700 text-slate-300 rounded-xl cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <span className="font-bold text-sm text-white block leading-tight">Teacher Portal</span>
            <span className="text-[10px] text-blue-400 font-semibold truncate max-w-[160px] block">
              {teacher?.fullName || email}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="p-2 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {isMobileNavOpen && (
        <div
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden print:hidden"
        />
      )}

      {/* Left-Side Vertical Navigation Panel */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#0f111a] border-r border-slate-800 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out print:hidden ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand & User Profile Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base leading-none">EduTrack Pro</h1>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Teacher Portal</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Teacher Profile Card */}
          <div className="bg-[#161925] border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm shrink-0">
              {teacher?.fullName ? teacher.fullName.slice(0, 2).toUpperCase() : 'TC'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-bold text-white text-xs truncate">{teacher?.fullName || 'Educator'}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{teacher?.staffId || email}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Primary Navigation Section */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-2">
              Main Menu
            </span>
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavSelect(item.id as NavTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-[#161925] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Academic Utilities Section */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <span className="px-3 text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-2">
              Academic Tools
            </span>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavSelect(item.id as NavTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white font-bold border border-slate-700'
                      : 'text-slate-400 hover:bg-[#161925] hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Interactive Logout Action */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0c0e15]">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* 1. Dashboard Overview */}
            {activeTab === 'DASHBOARD' && (
              <div className="space-y-6">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-blue-900/30 via-[#0f111a] to-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
                      STAFF DASHBOARD OVERVIEW
                    </span>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Welcome back, {teacher?.fullName || 'Educator'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Staff ID: <span className="font-mono text-slate-300">{teacher?.staffId || 'TCH-001'}</span> • Qualification: {teacher?.qualification || 'Bachelor of Education'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('SCORE_ENTRY')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> Score Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('REPORT_CARDS')}
                      className="px-4 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-blue-400" /> Report Cards
                    </button>
                  </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Enrolled Students</span>
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-white font-mono">{students.length}</p>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" /> Active School Roster
                    </span>
                  </div>

                  <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500">School Classes</span>
                      <GraduationCap className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold text-white font-mono">{classes.length}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Assigned Classrooms</span>
                  </div>

                  <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Curriculum Subjects</span>
                      <BookOpen className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-white font-mono">{subjects.length}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Active Subjects</span>
                  </div>

                  <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Weekly Workload</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold text-white font-mono">{teacher?.periodsCount || 18}</p>
                    <span className="text-[10px] text-amber-400 mt-1 block">Periods / Week</span>
                  </div>
                </div>

                {/* Performance Analytics Embedded Preview */}
                <StudentPerformanceAnalytics schoolId={schoolId} teacherEmail={email} />

                {/* Quick Lists: Recent Classes & Assigned Subjects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-400" /> Classes
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('CLASSES')}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        View All ({classes.length})
                      </button>
                    </div>
                    <div className="space-y-2">
                      {classes.slice(0, 4).map((c) => {
                        const count = students.filter(s => s.classId === c.id).length;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setActiveTab('CLASSES')}
                            className="p-3 bg-[#161925] hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="font-bold text-white">{c.className}</p>
                              <p className="text-[10px] text-slate-400">Class Master: {c.classTeacherName || 'Assigned'}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full font-mono text-[10px] font-bold">
                              {count} Students
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-400" /> Teaching Subjects
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('SUBJECTS')}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        View All ({subjects.length})
                      </button>
                    </div>
                    <div className="space-y-2">
                      {subjects.slice(0, 4).map((s) => (
                        <div
                          key={s.id}
                          onClick={() => setActiveTab('SUBJECTS')}
                          className="p-3 bg-[#161925] hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="font-bold text-white">{s.subjectName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Code: {s.subjectCode || 'GEN'}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full font-mono text-[10px] font-bold">
                            {s.subjectType || 'CORE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Students View */}
            {activeTab === 'STUDENTS' && (
              <TeacherStudentsView schoolId={schoolId} />
            )}

            {/* 3. Classes View */}
            {activeTab === 'CLASSES' && (
              <TeacherClassesView schoolId={schoolId} />
            )}

            {/* 4. Subjects View */}
            {activeTab === 'SUBJECTS' && (
              <TeacherSubjectsView schoolId={schoolId} />
            )}

            {/* 5. Score Entry View */}
            {activeTab === 'SCORE_ENTRY' && (
              <TeacherScoreEntryView schoolId={schoolId} teacherEmail={email} isSchoolAdmin={false} />
            )}

            {/* 6. Published Report Cards View */}
            {activeTab === 'REPORT_CARDS' && (
              <StudentReportCardView schoolId={schoolId} isStudentPortal={false} />
            )}

            {/* 7. Settings View */}
            {activeTab === 'SETTINGS' && (
              <TeacherProfileSettingsView schoolId={schoolId} teacherEmail={email} />
            )}

            {/* Secondary Utilities */}
            {activeTab === 'BROADSHEET' && (
              <ClassBroadsheetView schoolId={schoolId} />
            )}

            {activeTab === 'ATTENDANCE' && (
              <AttendanceManagementView schoolId={schoolId} />
            )}

            {activeTab === 'ASSIGNMENTS' && (
              <AssignmentManagementView schoolId={schoolId} isTeacher={true} />
            )}

            {activeTab === 'TIMETABLE' && (
              <TimetableManagementView schoolId={schoolId} />
            )}

            {activeTab === 'ANALYTICS' && (
              <StudentPerformanceAnalytics schoolId={schoolId} teacherEmail={email} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-white text-base">Sign Out of Teacher Portal?</h3>
              <p className="text-xs text-slate-400">
                You will need to re-authenticate with your staff email to access score entries and student records.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2 px-3 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
