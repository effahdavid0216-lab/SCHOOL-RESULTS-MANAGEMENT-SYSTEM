import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Users,
  LogOut,
  CheckCircle,
  FileText,
  User,
  Award,
  Calendar,
  Phone,
  MapPin,
  Home,
  ShieldCheck,
  Percent,
  Sparkles
} from 'lucide-react';
import { Student, SubjectItem, ScoreEntry } from '../types';
import { getStudentsBySchool, getSubjectsBySchool, getScoresByQuery } from '../lib/services';
import { StudentReportCardView } from './StudentReportCardView';

interface Props {
  schoolId: string;
  email: string;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<Props> = ({ schoolId, email, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'REPORT' | 'RESULTS' | 'SUBJECTS' | 'PROFILE'>('REPORT');
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [schoolId, email]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stList, subList] = await Promise.all([
        getStudentsBySchool(schoolId),
        getSubjectsBySchool(schoolId)
      ]);

      // Match student by admission number, email, studentId or fallback to first
      const cleanEmail = email.trim().toLowerCase();
      const matched = stList.find(
        (s) =>
          s.admissionNo?.toLowerCase() === cleanEmail ||
          s.studentId?.toLowerCase() === cleanEmail ||
          s.id === email ||
          s.parentEmail?.toLowerCase() === cleanEmail
      ) || stList[0] || null;

      setStudent(matched);
      setSubjects(subList);

      if (matched) {
        const studentScores = await getScoresByQuery({
          schoolId,
          studentId: matched.id
        });
        setScores(studentScores);
      }
    } catch (err) {
      console.error('Error loading student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const navTabs = [
    { id: 'REPORT', label: 'Terminal Report Card', icon: FileText },
    { id: 'RESULTS', label: 'Published Results', icon: Award },
    { id: 'SUBJECTS', label: 'Curriculum & Subjects', icon: BookOpen },
    { id: 'PROFILE', label: 'Student Profile', icon: User }
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
              <span className="font-semibold text-sm sm:text-base text-white serif italic block leading-none">Student Portal</span>
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
                    <Icon className="w-3.5 h-3.5" /> <span className="hidden md:inline">{tab.label}</span>
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
            {/* 1. REPORT CARD */}
            {activeTab === 'REPORT' && (
              <StudentReportCardView schoolId={schoolId} studentId={student?.id} isStudentPortal={true} />
            )}

            {/* 2. PUBLISHED RESULTS */}
            {activeTab === 'RESULTS' && (
              <div className="space-y-6">
                <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
                        OFFICIAL PUBLISHED RESULTS
                      </span>
                      <h2 className="text-xl font-light text-white serif italic mt-1">Academic Scores & Evaluation</h2>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-[#161925] px-3 py-1.5 rounded-xl border border-slate-800">
                      Total Records: {scores.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Official continuous assessments and terminal examination records verified by school administration.
                  </p>
                </div>

                <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#161925] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <th className="p-3.5">Subject</th>
                          <th className="p-3.5 text-center">Session / Term</th>
                          <th className="p-3.5 text-center">Exam Type</th>
                          <th className="p-3.5 text-center">SBA Scaled (/50)</th>
                          <th className="p-3.5 text-center">Exam Scaled (/50)</th>
                          <th className="p-3.5 text-center font-bold">Final (/100)</th>
                          <th className="p-3.5 text-center font-bold">Grade</th>
                          <th className="p-3.5">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {scores.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-500">
                              No published scores found for current student.
                            </td>
                          </tr>
                        ) : (
                          scores.map((sc) => (
                            <tr key={sc.id} className="hover:bg-[#161925]/50 transition-colors">
                              <td className="p-3.5 font-bold text-white">{sc.subjectName}</td>
                              <td className="p-3.5 text-center font-mono text-slate-300">
                                {sc.academicYear} • {sc.term}
                              </td>
                              <td className="p-3.5 text-center">
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full font-mono text-[10px] font-bold">
                                  {sc.examType}
                                </span>
                              </td>
                              <td className="p-3.5 text-center font-mono text-slate-300">
                                {sc.sbaScaledScore?.toFixed(1) ?? (sc.classScore50?.toFixed(1) || '-')}
                              </td>
                              <td className="p-3.5 text-center font-mono text-slate-300">
                                {sc.examScaledScore?.toFixed(1) ?? (sc.examScore50?.toFixed(1) || '-')}
                              </td>
                              <td className="p-3.5 text-center font-bold font-mono text-emerald-400">
                                {sc.finalScore?.toFixed(1) ?? (sc.totalScore100?.toFixed(1) || '-')}
                              </td>
                              <td className="p-3.5 text-center">
                                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-300 rounded font-bold font-mono">
                                  {sc.grade || '-'}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-300 italic">{sc.remark || sc.remarks || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CURRICULUM & SUBJECTS */}
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

            {/* 4. STUDENT PROFILE */}
            {activeTab === 'PROFILE' && (
              <div className="space-y-6">
                <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-[#161925] border border-slate-700 flex items-center justify-center text-blue-400 overflow-hidden shrink-0">
                    {student?.photoUrl ? (
                      <img src={student.photoUrl} alt="Student Photo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-500" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full">
                        ACTIVE ENROLLMENT
                      </span>
                      {student?.house && (
                        <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase rounded-full">
                          {student.house} House
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{student?.fullName || 'Student'}</h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Admission Number: <strong className="text-white">{student?.admissionNo}</strong> • Student ID: <strong className="text-white">{student?.studentId}</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Academic Profile */}
                  <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                      <GraduationCap className="w-4 h-4 text-blue-400" /> Academic & Enrollment Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Class Enrolled:</span>
                        <span className="font-bold text-white">{student?.className || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Academic Session:</span>
                        <span className="font-bold text-white">{student?.academicYear || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Gender:</span>
                        <span className="font-bold text-white">{student?.gender || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Date of Birth:</span>
                        <span className="font-mono font-bold text-white">{student?.dateOfBirth || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Nationality:</span>
                        <span className="font-bold text-white">{student?.nationality || 'Ghanaian'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Date Admitted:</span>
                        <span className="font-mono font-bold text-white">{student?.admissionDate || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Parent & Emergency Contact */}
                  <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Phone className="w-4 h-4 text-emerald-400" /> Parent / Guardian Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Guardian Name:</span>
                        <span className="font-bold text-white">{student?.parentName || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Relationship:</span>
                        <span className="font-bold text-white">{student?.parentRelationship || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Primary Phone:</span>
                        <span className="font-mono font-bold text-emerald-400">{student?.parentPhone || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Guardian Email:</span>
                        <span className="font-bold text-white">{student?.parentEmail || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Emergency Contact:</span>
                        <span className="font-bold text-white">{student?.emergencyName || '-'} ({student?.emergencyPhone || '-'})</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Digital Address / Location:</span>
                        <span className="font-bold text-white">{student?.parentDigitalAddress || student?.parentAddress || '-'}</span>
                      </div>
                    </div>
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
