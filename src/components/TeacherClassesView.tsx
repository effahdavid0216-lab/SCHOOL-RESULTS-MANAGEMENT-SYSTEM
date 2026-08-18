import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Search,
  BookOpen,
  UserCheck,
  Award,
  ChevronRight
} from 'lucide-react';
import { ClassItem, Student, Teacher } from '../types';
import { getClassesBySchool, getStudentsBySchool, getTeachersBySchool } from '../lib/services';

interface Props {
  schoolId: string;
}

export const TeacherClassesView: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [cList, stList, tList] = await Promise.all([
      getClassesBySchool(schoolId),
      getStudentsBySchool(schoolId),
      getTeachersBySchool(schoolId)
    ]);
    setClasses(cList);
    setStudents(stList);
    setTeachers(tList);
    if (cList.length > 0) setSelectedClassId(cList[0].id);
    setLoading(false);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(st => st.classId === selectedClassId);
  const filteredStudents = classStudents.filter(st =>
    st.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    st.admissionNo.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              CLASSROOM DIRECTORY
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {classes.length} Total Classes
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            Class Management & Rosters
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select an academic class to view enrolled students, class size statistics, and class master details.
          </p>
        </div>
      </div>

      {/* Class Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {classes.map((cls) => {
          const count = students.filter(s => s.classId === cls.id).length;
          const isSelected = selectedClassId === cls.id;
          return (
            <button
              key={cls.id}
              type="button"
              onClick={() => setSelectedClassId(cls.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-[#0f111a] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-[#161925]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {cls.level || 'Class'}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {count}
                </span>
              </div>
              <p className="font-bold text-sm truncate">{cls.className}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Class Details */}
      {selectedClass && (
        <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-[#161925]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                {selectedClass.className} Student Roster
              </h3>
              <p className="text-xs text-slate-400">
                Class Master: {selectedClass.classTeacherName || 'Not Assigned'} • Total Enrolled: {classStudents.length} Students
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter class students..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#0a0b10] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d0f18]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No students found in this class.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-[#161925]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{st.admissionNo}</td>
                      <td className="py-3 px-4 font-semibold text-white">{st.fullName}</td>
                      <td className="py-3 px-4 text-slate-300">{st.gender}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {st.parentPhone || 'No contact'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          st.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
