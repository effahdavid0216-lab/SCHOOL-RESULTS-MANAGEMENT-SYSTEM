import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, Users, LogOut, CheckCircle, FileText } from 'lucide-react';
import { Student, SubjectItem } from '../types';
import { getStudentsBySchool, getSubjectsBySchool } from '../lib/services';
import { StudentReportCardView } from './StudentReportCardView';

interface Props {
  schoolId: string;
  email: string;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<Props> = ({ schoolId, email, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'REPORT' | 'SUBJECTS'>('REPORT');
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  useEffect(() => {
    loadData();
  }, [schoolId, email]);

  const loadData = async () => {
    const [stList, subList] = await Promise.all([
      getStudentsBySchool(schoolId),
      getSubjectsBySchool(schoolId)
    ]);
    setStudent(stList[0] || null);
    setSubjects(subList);
  };

  const navTabs = [
    { id: 'REPORT', label: 'Terminal Report Card', icon: FileText },
    { id: 'SUBJECTS', label: 'Enrolled Subjects', icon: BookOpen },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 font-sans">
      <header className="bg-[#0f111a] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-bold shadow-md">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sm sm:text-base text-white serif italic block leading-none">Student & Parent Portal</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest truncate max-w-[140px] sm:max-w-xs block">
                {student?.fullName || email}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer relative transition-colors ${
                    isActive ? 'text-white' : 'bg-[#161925] text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="studentActiveNavPill"
                      className="absolute inset-0 bg-blue-600 rounded-xl shadow-md -z-0"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" /> <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  </span>
                </motion.button>
              );
            })}

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onLogout}
              className="px-3 sm:px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl transition-colors border border-rose-500/20 cursor-pointer ml-1 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTab === 'REPORT' && (
              <StudentReportCardView schoolId={schoolId} studentId={student?.id} isStudentPortal={true} />
            )}

            {activeTab === 'SUBJECTS' && (
              <div className="space-y-6">
                <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-2">
                  <h2 className="text-2xl font-light text-white serif italic">Welcome, {student?.fullName || 'Student'}</h2>
                  <p className="text-xs text-slate-400">
                    Student ID: {student?.studentId || 'STU-001'} • Enrolled Class: {student?.className || 'JHS 1A'} • Academic Session: {student?.academicYear || '2026/2027'}
                  </p>
                </div>

                <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
                  <h3 className="font-light text-white serif italic text-base mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" /> Enrolled Curriculum Subjects ({subjects.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {subjects.map((s) => (
                      <div key={s.id} className="p-3.5 bg-[#161925] border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{s.subjectName}</p>
                          <p className="text-[10px] text-slate-500">Code: {s.code}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold rounded-full text-[10px] uppercase">
                          {s.subjectType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
