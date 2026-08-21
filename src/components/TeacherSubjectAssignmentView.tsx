import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Users,
  Layers,
  Calendar,
  CheckCircle2,
  Loader2,
  Filter,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import {
  TeacherSubjectAssignment,
  ClassItem,
  SubjectItem,
  Teacher
} from '../types';
import {
  getTeacherSubjectAssignments,
  saveTeacherSubjectAssignment,
  deleteTeacherSubjectAssignment,
  getClassesBySchool,
  getSubjectsBySchool,
  getTeachersBySchool
} from '../lib/services';

interface Props {
  schoolId: string;
  academicYear: string;
}

export const TeacherSubjectAssignmentView: React.FC<Props> = ({ schoolId, academicYear }) => {
  const [assignments, setAssignments] = useState<TeacherSubjectAssignment[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Assignment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [schoolId, academicYear]);

  const loadData = async () => {
    setLoading(true);
    const [aList, cList, sList, tList] = await Promise.all([
      getTeacherSubjectAssignments(schoolId, academicYear),
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId),
      getTeachersBySchool(schoolId)
    ]);
    setAssignments(aList);
    setClasses(cList.filter((c) => (c.status || 'ACTIVE') === 'ACTIVE'));
    setSubjects(sList.filter((s) => (s.status || 'ACTIVE') === 'ACTIVE'));
    setTeachers(tList.filter((t) => (t.accountStatus || 'ACTIVE') === 'ACTIVE'));
    setLoading(false);
  };

  const handleOpenAssignModal = () => {
    setSelectedClassId(classes[0]?.id || '');
    setSelectedSubjectId(subjects[0]?.id || '');
    setSelectedTeacherId(teachers[0]?.id || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cls = classes.find((c) => c.id === selectedClassId);
    const subj = subjects.find((s) => s.id === selectedSubjectId);
    const tchr = teachers.find((t) => t.id === selectedTeacherId);

    if (!cls || !subj || !tchr) {
      setErrorMessage('Please select a valid class, subject, and teacher.');
      return;
    }

    // Check if duplicate assignment exists
    const duplicate = assignments.find(
      (a) =>
        a.classId === selectedClassId &&
        a.subjectId === selectedSubjectId &&
        a.academicYear === academicYear
    );

    if (duplicate && duplicate.teacherId === selectedTeacherId) {
      setErrorMessage(`${tchr.fullName} is already assigned to ${subj.subjectName} in ${cls.className}.`);
      return;
    }

    setIsSaving(true);
    try {
      await saveTeacherSubjectAssignment({
        id: duplicate?.id,
        schoolId,
        academicYear,
        classId: cls.id,
        className: cls.className,
        subjectId: subj.id,
        subjectName: subj.subjectName,
        teacherId: tchr.id,
        teacherName: tchr.fullName,
        status: 'ACTIVE'
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save assignment.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (assignmentId: string, teacherName: string, subjectName: string, className: string) => {
    if (confirm(`Remove ${teacherName} from teaching ${subjectName} in ${className}?`)) {
      await deleteTeacherSubjectAssignment(schoolId, assignmentId);
      await loadData();
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchClass = selectedClassFilter === 'ALL' || a.classId === selectedClassFilter;
    const matchTeacher = selectedTeacherFilter === 'ALL' || a.teacherId === selectedTeacherFilter;
    const matchSearch =
      a.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchTeacher && matchSearch;
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              FACULTY SCHEDULING
            </span>
            <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              {academicYear}
            </span>
          </div>
          <h2 className="text-xl font-light text-white serif italic flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Teacher Subject & Class Assignments
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Map teachers to specific subjects across classes for accurate score entry authorization and submission tracking.
          </p>
        </div>

        <button
          onClick={handleOpenAssignModal}
          disabled={classes.length === 0 || subjects.length === 0 || teachers.length === 0}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Assign Subject Teacher
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teacher, class, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Classes ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Teachers ({teachers.length})</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} ({t.staffId || 'Faculty'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment Table */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Active Subject Assignments ({filteredAssignments.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Authorized teachers have direct portal access to input terminal exam scores
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading assignment matrix...</span>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No subject assignments found. Click "Assign Subject Teacher" to link faculty to subjects.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161925] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Class</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Assigned Teacher</th>
                  <th className="px-6 py-3.5">Academic Session</th>
                  <th className="px-6 py-3.5 text-center">Authorization Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-[#161925]/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                        {assignment.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-200 font-medium">
                      {assignment.subjectName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {assignment.teacherName.charAt(0)}
                        </div>
                        <span className="font-semibold text-white">{assignment.teacherName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {assignment.academicYear}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase">
                        Authorized
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          handleDelete(
                            assignment.id,
                            assignment.teacherName,
                            assignment.subjectName,
                            assignment.className
                          )
                        }
                        className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Remove Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f111a] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161925]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Assign Teacher to Subject
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Academic Year</label>
                <input
                  type="text"
                  disabled
                  value={academicYear}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Class *</label>
                <select
                  required
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.className} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Subject *</label>
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subjectName} ({s.subjectType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Assign Teacher *</label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} — {t.staffId || 'Staff'} ({t.qualification || 'Teacher'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
