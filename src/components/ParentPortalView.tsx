import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, GraduationCap, FileText, CheckCircle2, Calendar, DollarSign, BookOpen, Clock, AlertCircle, LogOut } from 'lucide-react';
import { Student } from '../types';
import { getStudentsBySchool } from '../lib/services';
import { StudentReportCardView } from './StudentReportCardView';

interface Props {
  schoolId: string;
  parentEmail?: string;
  onLogout: () => void;
}

export const ParentPortalView: React.FC<Props> = ({ schoolId, parentEmail, onLogout }) => {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'REPORT' | 'FEES' | 'ATTENDANCE'>('REPORT');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, [schoolId]);

  const loadChildren = async () => {
    setLoading(true);
    const allStudents = await getStudentsBySchool(schoolId);
    // Filter or demo select first 2 students
    setChildren(allStudents);
    if (allStudents.length > 0) {
      setSelectedChildId(allStudents[0].id);
    }
    setLoading(false);
  };

  const currentChild = children.find(c => c.id === selectedChildId);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading Parent & Guardian Portal...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 font-sans flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#0f111a] border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm sm:text-base text-white serif italic block leading-none">Parent & Guardian Portal</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest truncate max-w-[150px] sm:max-w-xs block">
                {parentEmail || 'parent@school.edu.gh'}
              </span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl transition-colors border border-rose-500/20 cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </motion.button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6 flex-1">
        {/* Linked Wards Selector */}
        <div className="bg-[#0f111a] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Linked Student Ward</span>
            <span className="text-xs sm:text-sm font-semibold text-white">Select ward to access academic terminal report & fee status:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {children.map(child => {
              const isSelected = selectedChildId === child.id;
              return (
                <motion.button
                  key={child.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer relative whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'text-white'
                      : 'bg-[#161925] text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="parentActiveWardPill"
                      className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 -z-0"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    {child.fullName} ({child.className})
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Child Terminal Report with Motion Transition */}
        <AnimatePresence mode="wait">
          {currentChild && (
            <motion.div
              key={currentChild.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <StudentReportCardView schoolId={schoolId} studentId={currentChild.id} isStudentPortal={true} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
