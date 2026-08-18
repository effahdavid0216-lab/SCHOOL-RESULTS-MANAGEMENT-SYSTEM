import React, { useState, useEffect } from 'react';
import { Search, User, BookOpen, GraduationCap, DollarSign, X, ArrowRight } from 'lucide-react';
import { Student, Teacher, ClassItem, SubjectItem } from '../types';
import { getStudentsBySchool, getTeachersBySchool, getClassesBySchool, getSubjectsBySchool } from '../lib/services';

interface Props {
  schoolId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<Props> = ({ schoolId, isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen, schoolId]);

  const loadAllData = async () => {
    setLoading(true);
    const [st, tch, cls, sub] = await Promise.all([
      getStudentsBySchool(schoolId),
      getTeachersBySchool(schoolId),
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId)
    ]);

    setStudents(st);
    setTeachers(tch);
    setClasses(cls);
    setSubjects(sub);
    setLoading(false);
  };

  if (!isOpen) return null;

  const matchedStudents = query.trim()
    ? students.filter(s => s.fullName.toLowerCase().includes(query.toLowerCase()) || s.admissionNo.toLowerCase().includes(query.toLowerCase()))
    : [];

  const matchedTeachers = query.trim()
    ? teachers.filter(t => t.fullName.toLowerCase().includes(query.toLowerCase()) || t.staffId.toLowerCase().includes(query.toLowerCase()))
    : [];

  const matchedClasses = query.trim()
    ? classes.filter(c => c.className.toLowerCase().includes(query.toLowerCase()))
    : [];

  const matchedSubjects = query.trim()
    ? subjects.filter(s => s.subjectName.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-[#0f111a] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search students, teachers, classes, subjects, fees..."
            className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-500 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4">
          {!query.trim() && (
            <p className="text-xs text-slate-500 text-center py-6">Type to search anything across the entire school management system...</p>
          )}

          {matchedStudents.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Students ({matchedStudents.length})</span>
              <div className="space-y-1.5">
                {matchedStudents.slice(0, 4).map(st => (
                  <div
                    key={st.id}
                    onClick={() => {
                      onNavigate('STUDENTS');
                      onClose();
                    }}
                    className="p-2.5 bg-[#161925] hover:bg-slate-800 rounded-xl flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="font-semibold text-white block">{st.fullName}</span>
                        <span className="text-[10px] text-slate-500">{st.admissionNo} • {st.className}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedTeachers.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Teachers ({matchedTeachers.length})</span>
              <div className="space-y-1.5">
                {matchedTeachers.slice(0, 4).map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onNavigate('TEACHERS');
                      onClose();
                    }}
                    className="p-2.5 bg-[#161925] hover:bg-slate-800 rounded-xl flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-semibold text-white block">{t.fullName}</span>
                        <span className="text-[10px] text-slate-500">{t.staffId} • {t.specialization}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedClasses.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Classes ({matchedClasses.length})</span>
              <div className="space-y-1.5">
                {matchedClasses.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('CLASSES');
                      onClose();
                    }}
                    className="p-2.5 bg-[#161925] hover:bg-slate-800 rounded-xl flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-white">{c.className}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
