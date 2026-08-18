import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Filter,
  Eye,
  User
} from 'lucide-react';
import { Student, ClassItem } from '../types';
import {
  getStudentsBySchool,
  getClassesBySchool
} from '../lib/services';
import { RecordManagementModal, RecordModalMode } from './RecordManagementModal';

interface Props {
  schoolId: string;
}

export const StudentManagement: React.FC<Props> = ({ schoolId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');

  // Unified Record Management Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    mode: RecordModalMode;
    record: Student | null;
  }>({
    isOpen: false,
    mode: 'CREATE',
    record: null
  });

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [sList, cList] = await Promise.all([
      getStudentsBySchool(schoolId),
      getClassesBySchool(schoolId)
    ]);
    setStudents(sList);
    setClasses(cList);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setModalConfig({
      isOpen: true,
      mode: 'CREATE',
      record: null
    });
  };

  const handleOpenEdit = (stu: Student) => {
    setModalConfig({
      isOpen: true,
      mode: 'EDIT',
      record: stu
    });
  };

  const handleOpenView = (stu: Student) => {
    setModalConfig({
      isOpen: true,
      mode: 'VIEW',
      record: stu
    });
  };

  const handleOpenDelete = (stu: Student) => {
    setModalConfig({
      isOpen: true,
      mode: 'DELETE',
      record: stu
    });
  };

  const handleCloseModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'ALL' || s.className === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-light text-white serif italic flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Student Enrollment & Management
          </h2>
          <p className="text-xs text-slate-400">
            Enrolled student profiles, academic placement, guardian details, and login credentials.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 cursor-pointer tracking-wider uppercase"
        >
          <Plus className="w-4 h-4" /> Register Student
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search student by name, ID, or admission no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#161925] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 bg-[#161925] border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Classes ({students.length})</option>
              {classes.map(c => (
                <option key={c.id} value={c.className}>{c.className}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading student directory...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No student records found matching the criteria. Click "Register Student" to add one.
          </div>
        ) : (
          <>
            {/* Mobile & Tablet Card Layout */}
            <div className="block lg:hidden divide-y divide-slate-800/60 p-3 space-y-3">
              {filteredStudents.map((s) => (
                <div key={s.id} className="p-4 bg-[#161925] rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                      {s.photoUrl ? (
                        <img src={s.photoUrl} alt={s.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm truncate">{s.fullName}</h4>
                      <p className="text-[11px] text-blue-400 font-mono font-medium">ADM: {s.admissionNo}</p>
                      <p className="text-[10px] text-slate-400">{s.className} • DOB: {s.dateOfBirth}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold text-[9px] uppercase">
                      {s.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-[#0f111a] p-2.5 rounded-lg border border-slate-800 flex justify-between">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Parent / Phone</span>
                      <span className="text-slate-200 font-medium">{s.parentName || 'N/A'} ({s.parentPhone || 'No phone'})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Student Portal Pass</span>
                      <span className="text-cyan-400 font-mono font-bold">{s.password || s.dateOfBirth}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => handleOpenView(s)}
                      className="px-2.5 py-1.5 bg-[#0f111a] hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" /> View
                    </button>
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="px-2.5 py-1.5 bg-[#0f111a] hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" /> Edit
                    </button>
                    <button
                      onClick={() => handleOpenDelete(s)}
                      className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161925] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Student Details</th>
                    <th className="px-6 py-3.5">Class Placement</th>
                    <th className="px-6 py-3.5">Parent / Guardian</th>
                    <th className="px-6 py-3.5">Student Portal Password</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-[#161925]/60 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} alt={s.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{s.fullName}</p>
                          <p className="text-[10px] text-slate-400">ADM: {s.admissionNo} • DOB: {s.dateOfBirth}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-blue-400">{s.className}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-300">{s.parentName}</p>
                        <p className="text-[10px] text-slate-500">{s.parentPhone}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-cyan-300">
                        {s.password || s.dateOfBirth}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold text-[10px] uppercase">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenView(s)}
                          title="View Student Details"
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-[#161925] cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Student Record"
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-[#161925] cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(s)}
                          title="Delete Student"
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#161925] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Unified RecordManagementModal for Student CRUD */}
      <RecordManagementModal
        isOpen={modalConfig.isOpen}
        onClose={handleCloseModal}
        entityType="STUDENT"
        mode={modalConfig.mode}
        record={modalConfig.record}
        schoolId={schoolId}
        classes={classes}
        onSaveSuccess={async () => {
          await loadData();
        }}
        onDeleteSuccess={async () => {
          await loadData();
        }}
        onChangeMode={(newMode) => {
          setModalConfig(prev => ({ ...prev, mode: newMode }));
        }}
      />
    </div>
  );
};
