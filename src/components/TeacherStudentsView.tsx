import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Phone,
  Mail,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  GraduationCap
} from 'lucide-react';
import { Student, ClassItem } from '../types';
import { getStudentsBySchool, getClassesBySchool } from '../lib/services';

interface Props {
  schoolId: string;
}

export const TeacherStudentsView: React.FC<Props> = ({ schoolId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [stList, cList] = await Promise.all([
      getStudentsBySchool(schoolId),
      getClassesBySchool(schoolId)
    ]);
    setStudents(stList);
    setClasses(cList);
    setLoading(false);
  };

  const filteredStudents = students.filter(st => {
    const matchesSearch =
      st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.parentPhone && st.parentPhone.includes(searchQuery));
    const matchesClass = !selectedClassFilter || st.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              STUDENT ROSTER
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {filteredStudents.length} Students
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Enrolled Students Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            View student profiles, class enrollments, guardian contacts, and academic admission details.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, admission number, or guardian phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="bg-[#161925] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Enrolled Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.className}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Student Cards */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs uppercase tracking-wider">Loading Student Records...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-[#0f111a] rounded-2xl border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">No matching students found.</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or class filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((st) => (
            <div
              key={st.id}
              className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {st.photoUrl ? (
                      <img
                        src={st.photoUrl}
                        alt={st.fullName}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm shrink-0">
                        {st.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white text-sm">{st.fullName}</h4>
                      <p className="text-[11px] text-blue-400 font-mono font-semibold">{st.admissionNo}</p>
                      <p className="text-[10px] text-slate-400">{st.className}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                    st.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {st.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Gender</span>
                    <span className="text-slate-300 font-medium">{st.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Guardian</span>
                    <span className="text-slate-300 font-medium truncate block">{st.parentName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {st.parentPhone ? `Tel: ${st.parentPhone}` : 'No phone logged'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(st)}
                  className="px-3 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center">
                  {selectedStudent.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedStudent.fullName}</h3>
                  <p className="text-xs text-blue-400 font-mono">ADM: {selectedStudent.admissionNo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#161925] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Class</span>
                <span className="font-semibold text-white">{selectedStudent.className}</span>
              </div>
              <div className="bg-[#161925] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Gender</span>
                <span className="font-semibold text-white">{selectedStudent.gender}</span>
              </div>
              <div className="bg-[#161925] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Date of Birth</span>
                <span className="font-semibold text-white">{selectedStudent.dateOfBirth || 'N/A'}</span>
              </div>
              <div className="bg-[#161925] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">House</span>
                <span className="font-semibold text-white">{selectedStudent.house || 'N/A'}</span>
              </div>
              <div className="col-span-2 bg-[#161925] p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Guardian Details</span>
                <p className="font-semibold text-white">{selectedStudent.parentName || 'N/A'} ({selectedStudent.parentRelationship || 'Parent'})</p>
                <p className="text-slate-400 text-[11px]">Phone: {selectedStudent.parentPhone || 'N/A'}</p>
                <p className="text-slate-400 text-[11px]">Address: {selectedStudent.parentAddress || 'N/A'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
