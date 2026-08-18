import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Filter,
  Eye
} from 'lucide-react';
import { Teacher, ClassItem, SubjectItem } from '../types';
import {
  getTeachersBySchool,
  getClassesBySchool,
  getSubjectsBySchool
} from '../lib/services';
import { RecordManagementModal, RecordModalMode } from './RecordManagementModal';

interface Props {
  schoolId: string;
}

export const TeacherManagement: React.FC<Props> = ({ schoolId }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');

  // Unified Record Management Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    mode: RecordModalMode;
    record: Teacher | null;
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
    const [tList, cList, sList] = await Promise.all([
      getTeachersBySchool(schoolId),
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId)
    ]);
    setTeachers(tList);
    setClasses(cList);
    setSubjects(sList);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setModalConfig({
      isOpen: true,
      mode: 'CREATE',
      record: null
    });
  };

  const handleOpenEdit = (tch: Teacher) => {
    setModalConfig({
      isOpen: true,
      mode: 'EDIT',
      record: tch
    });
  };

  const handleOpenView = (tch: Teacher) => {
    setModalConfig({
      isOpen: true,
      mode: 'VIEW',
      record: tch
    });
  };

  const handleOpenDelete = (tch: Teacher) => {
    setModalConfig({
      isOpen: true,
      mode: 'DELETE',
      record: tch
    });
  };

  const handleCloseModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.phone.includes(searchQuery);
    const matchesClass = !selectedClassFilter ||
                         t.classTeacherOfId === selectedClassFilter ||
                         (t.assignedClassIds && t.assignedClassIds.includes(selectedClassFilter));
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              TEACHING FACULTY & STAFF
            </span>
          </div>
          <h2 className="text-xl font-light text-white serif italic flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            Teacher Staff Directory & Account Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage teacher profiles, assign class masters, configure teaching subjects, and assign secure login credentials.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Teacher
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by teacher name, staff ID, or phone number..."
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
            className="bg-[#161925] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="">All Classes Filter</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.className}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Responsive Grid / Cards on Mobile & Tablet, Table on Large Screens */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-xs uppercase tracking-wider">Loading Teacher Directory...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="p-12 text-center bg-[#0f111a] rounded-2xl border border-slate-800">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">No teacher records found.</p>
          <p className="text-xs text-slate-500 mt-1">Click "Add New Teacher" to register staff.</p>
        </div>
      ) : (
        <>
          {/* Mobile & Tablet Card Layout (hidden on lg screens) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {filteredTeachers.map((t) => (
              <div key={t.id} className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {t.photoUrl ? (
                      <img src={t.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm shrink-0">
                        {t.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-white text-sm">{t.fullName}</h4>
                      <p className="text-[11px] text-blue-400 font-mono font-semibold">{t.staffId}</p>
                      <p className="text-[10px] text-slate-400">{t.qualification}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                    t.accountStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {t.accountStatus}
                  </span>
                </div>

                <div className="p-3 bg-[#161925] rounded-xl space-y-1 text-xs border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Role:</span>
                    <span className="text-white font-medium">
                      {t.isClassTeacher ? `Class Teacher (${t.classTeacherOfName || 'Class'})` : 'Subject Teacher'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Phone:</span>
                    <span className="text-slate-200 font-mono">{t.phone || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Email:</span>
                    <span className="text-slate-200 truncate max-w-[180px]">{t.email || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenView(t)}
                    className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleOpenDelete(t)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs cursor-pointer"
                    title="Delete Teacher"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout (visible on lg screens) */}
          <div className="hidden lg:block bg-[#0f111a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#161925]/60 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Teacher & Staff ID</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Qualification</th>
                  <th className="py-3 px-4">Class Master Role</th>
                  <th className="py-3 px-4">Periods/Wk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-[#161925]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {t.photoUrl ? (
                          <img src={t.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                            {t.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white text-xs">{t.fullName}</p>
                          <p className="text-[10px] text-blue-400 font-mono font-semibold">{t.staffId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-300 font-mono">{t.phone || '-'}</p>
                      <p className="text-[10px] text-slate-400">{t.email || '-'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{t.qualification}</td>
                    <td className="py-3.5 px-4">
                      {t.isClassTeacher ? (
                        <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full font-bold text-[10px] uppercase tracking-wider">
                          {t.classTeacherOfName || 'Class Master'}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px] uppercase">Subject Teacher</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">{t.periodsCount}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        t.accountStatus === 'ACTIVE' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {t.accountStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenView(t)}
                          className="p-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg cursor-pointer transition-colors"
                          title="View Full Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors"
                          title="Edit Teacher"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(t)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg cursor-pointer transition-colors"
                          title="Delete Teacher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Unified RecordManagementModal for Teacher CRUD */}
      <RecordManagementModal
        isOpen={modalConfig.isOpen}
        onClose={handleCloseModal}
        entityType="TEACHER"
        mode={modalConfig.mode}
        record={modalConfig.record}
        schoolId={schoolId}
        classes={classes}
        subjects={subjects}
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
