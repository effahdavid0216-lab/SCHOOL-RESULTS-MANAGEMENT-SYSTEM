import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { SubjectItem, ClassItem } from '../types';
import { getSubjectsBySchool, getClassesBySchool } from '../lib/services';

interface Props {
  schoolId: string;
}

export const TeacherSubjectsView: React.FC<Props> = ({ schoolId }) => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [subList, cList] = await Promise.all([
      getSubjectsBySchool(schoolId),
      getClassesBySchool(schoolId)
    ]);
    setSubjects(subList);
    setClasses(cList);
    setLoading(false);
  };

  const filteredSubjects = subjects.filter(s =>
    s.subjectName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (s.subjectCode && s.subjectCode.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              CURRICULUM DIRECTORY
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {subjects.length} Total Subjects
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Assigned Teaching Subjects
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            View course curriculum, subject codes, weekly teaching periods, and core/elective classifications.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search subjects or codes..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Subject Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs uppercase tracking-wider">Loading Subjects...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="p-12 text-center bg-[#0f111a] rounded-2xl border border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">No matching subjects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-[#0f111a] border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                    sub.subjectType === 'CORE'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {sub.subjectType || 'CORE'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base">{sub.subjectName}</h3>
                  <p className="text-xs text-blue-400 font-mono font-semibold">
                    Code: {sub.subjectCode || 'GEN-SUB'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="bg-[#161925] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Weekly Periods</span>
                    <span className="font-bold text-white font-mono">{sub.periodsPerWeek || 4} Periods</span>
                  </div>
                  <div className="bg-[#161925] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Status</span>
                    <span className="font-bold text-emerald-400">Active</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> GES Aligned
                </span>
                <span className="text-slate-500 font-mono">100% Mark Weight</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
