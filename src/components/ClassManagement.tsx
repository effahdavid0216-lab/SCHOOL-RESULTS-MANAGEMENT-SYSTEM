import React, { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Loader2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Archive,
  RotateCcw,
  BookOpen,
  Eye,
  GraduationCap,
  Sparkles,
  Printer,
  X
} from 'lucide-react';
import { ClassItem, Teacher, SubjectItem, Student, SchoolType } from '../types';
import {
  getClassesBySchool,
  getTeachersBySchool,
  getSubjectsBySchool,
  getStudentsBySchool,
  saveClassItem,
  deleteClassItem,
  archiveClassItem,
  restoreClassItem
} from '../lib/services';
import {
  Button,
  IconButton,
  Badge,
  PageHeader,
  Modal,
  Input,
  Select,
  EmptyState,
  LoadingSkeleton
} from './ui';

interface Props {
  schoolId: string;
}

export const ClassManagement: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Filters
  const [tab, setTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [viewingClassStudents, setViewingClassStudents] = useState<ClassItem | null>(null);

  // Form Fields
  const [className, setClassName] = useState('');
  const [level, setLevel] = useState<SchoolType>('PRIMARY');
  const [stream, setStream] = useState('');
  const [classCode, setClassCode] = useState('');
  const [capacity, setCapacity] = useState<number>(40);
  const [classTeacherId, setClassTeacherId] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [cList, tList, subList, stList] = await Promise.all([
      getClassesBySchool(schoolId),
      getTeachersBySchool(schoolId),
      getSubjectsBySchool(schoolId),
      getStudentsBySchool(schoolId)
    ]);
    setClasses(cList);
    setTeachers(tList);
    setSubjects(subList);
    setStudents(stList);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setClassName('');
    setLevel('PRIMARY');
    setStream('');
    setClassCode('');
    setCapacity(40);
    setClassTeacherId('');
    setDescription('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassName(cls.className);
    setLevel(cls.level || 'PRIMARY');
    setStream(cls.stream || '');
    setClassCode(cls.classCode || '');
    setCapacity(cls.capacity || 40);
    setClassTeacherId(cls.classTeacherId || '');
    setDescription(cls.description || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      setErrorMessage('Class name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const selectedTeacher = teachers.find((t) => t.id === classTeacherId);

    try {
      await saveClassItem({
        id: editingClass ? editingClass.id : undefined,
        schoolId,
        className: className.trim(),
        level,
        stream: stream.trim() || undefined,
        classCode: classCode.trim() || undefined,
        capacity: Number(capacity) || 40,
        classTeacherId: classTeacherId || undefined,
        classTeacherName: selectedTeacher ? selectedTeacher.fullName : undefined,
        description: description.trim() || undefined,
        status: editingClass ? editingClass.status : 'ACTIVE',
        updatedAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save class.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cls: ClassItem) => {
    const enrolled = getEnrolledStudentCount(cls.id);
    if (enrolled > 0) {
      alert(`Cannot delete "${cls.className}" because ${enrolled} student(s) are currently enrolled.`);
      return;
    }

    if (confirm(`Are you sure you want to permanently delete class "${cls.className}"?`)) {
      await deleteClassItem(cls.id);
      await loadData();
    }
  };

  const handleArchive = async (cls: ClassItem) => {
    if (confirm(`Archive class "${cls.className}"? Enrolled students and historical examination results will remain preserved.`)) {
      await archiveClassItem(schoolId, cls.id);
      await loadData();
    }
  };

  const handleRestore = async (cls: ClassItem) => {
    await restoreClassItem(schoolId, cls.id);
    await loadData();
  };

  const filteredClasses = classes.filter((c) => {
    const statusMatch = (c.status || 'ACTIVE') === tab;
    const levelMatch = levelFilter === 'ALL' || c.level === levelFilter;
    const searchMatch =
      c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.classTeacherName && c.classTeacherName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return statusMatch && levelMatch && searchMatch;
  });

  const getEnrolledStudentCount = (classId: string) => {
    return students.filter((s) => s.classId === classId && (s.status || 'ACTIVE') !== 'ARCHIVED').length;
  };

  const enrolledInViewingClass = viewingClassStudents
    ? students.filter((s) => s.classId === viewingClassStudents.id && (s.status || 'ACTIVE') !== 'ARCHIVED')
    : [];

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Class Directory & Levels"
        subtitle="Configure school classes, streams, capacity thresholds, assign class teachers, and inspect enrolled rosters."
        badge={<Badge variant="active" label={`${classes.length} Total Classes`} icon={<Sparkles className="w-3 h-3" />} />}
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add New Class
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search class by name, teacher, description..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Levels</option>
            <option value="KG">KG (Kindergarten)</option>
            <option value="PRIMARY">Primary / Basic</option>
            <option value="JHS">JHS (Junior High)</option>
            <option value="SHS">SHS (Senior High)</option>
          </select>

          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tab === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active ({classes.filter((c) => (c.status || 'ACTIVE') === 'ACTIVE').length})
            </button>
            <button
              type="button"
              onClick={() => setTab('ARCHIVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tab === 'ARCHIVED'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Archived ({classes.filter((c) => c.status === 'ARCHIVED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Mobile Cards Fallback */}
      <div className="block lg:hidden space-y-3">
        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            icon={<School className="w-8 h-8" />}
            title="No Classes Found"
            description="Create class tiers and streams to organize student enrollments and score entries."
            action={
              <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                Add First Class
              </Button>
            }
          />
        ) : (
          filteredClasses.map((c) => {
            const studentCount = getEnrolledStudentCount(c.id);
            const isFull = studentCount >= (c.capacity || 40);
            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-lg border border-indigo-100 dark:border-indigo-900">
                      {c.className}
                    </span>
                    <Badge variant={c.status === 'ARCHIVED' ? 'draft' : 'active'} label={c.status || 'ACTIVE'} />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {c.level || 'PRIMARY'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Class Teacher</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {c.classTeacherName || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Roster</span>
                    <span className={`font-bold ${isFull ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {studentCount} / {c.capacity || 40}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setViewingClassStudents(c)}
                  >
                    View Roster
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenEdit(c)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main Desktop Clean Borderless Table */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton rows={4} />
          </div>
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            icon={<School className="w-8 h-8" />}
            title="No Classes Found"
            description="Create your class grade levels (e.g. JHS 1, Basic 1, KG) to manage enrollments and score entries."
            action={
              <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                Add Class
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Class Details</th>
                  <th className="px-6 py-3.5">Level & Stream</th>
                  <th className="px-6 py-3.5">Enrolled / Capacity</th>
                  <th className="px-6 py-3.5">Class Teacher</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredClasses.map((c) => {
                  const studentCount = getEnrolledStudentCount(c.id);
                  const isFull = studentCount >= (c.capacity || 40);
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                            <School className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {c.className}
                            </span>
                            {c.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                {c.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {c.level || 'PRIMARY'}
                          </span>
                          {c.stream && (
                            <span className="text-[11px] text-slate-500 font-mono block">
                              Stream: {c.stream}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold font-mono text-sm ${
                              isFull ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {studentCount} / {c.capacity || 40}
                          </span>
                          {isFull && <Badge variant="pending" label="Full" />}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.classTeacherName || 'Unassigned'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <Badge
                          variant={c.status === 'ARCHIVED' ? 'draft' : 'active'}
                          label={c.status || 'ACTIVE'}
                        />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <IconButton
                            icon={<Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                            tooltip="View Roster"
                            size="sm"
                            onClick={() => setViewingClassStudents(c)}
                          />
                          <IconButton
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                            tooltip="Edit Class"
                            size="sm"
                            onClick={() => handleOpenEdit(c)}
                          />
                          {tab === 'ACTIVE' ? (
                            <IconButton
                              icon={<Archive className="w-3.5 h-3.5 text-amber-500" />}
                              tooltip="Archive Class"
                              size="sm"
                              onClick={() => handleArchive(c)}
                            />
                          ) : (
                            <IconButton
                              icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-500" />}
                              tooltip="Restore Class"
                              size="sm"
                              onClick={() => handleRestore(c)}
                            />
                          )}
                          <IconButton
                            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                            tooltip="Delete Class"
                            size="sm"
                            onClick={() => handleDelete(c)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Class Modal using Standard Modal Component */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Class Structure' : 'Add New Class'}
        description="Configure class name, category level, stream, capacity, and assign a class teacher."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleSave}
            >
              Save Class
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Input
            label="Class Name"
            required
            placeholder="e.g. JHS 1A, Primary 3 Gold, KG 2"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Level / Category"
              required
              value={level}
              onChange={(e) => setLevel(e.target.value as SchoolType)}
            >
              <option value="KG">KG (Kindergarten)</option>
              <option value="PRIMARY">PRIMARY (Basic 1-6)</option>
              <option value="JHS">JHS (Junior High 1-3)</option>
              <option value="SHS">SHS (Senior High 1-3)</option>
            </Select>

            <Input
              label="Stream / Section"
              placeholder="e.g. Stream A, Gold, Blue"
              value={stream}
              onChange={(e) => setStream(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Class Code (Optional)"
              placeholder="e.g. CLS-JHS1"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
            />

            <Input
              label="Student Capacity"
              type="number"
              min="5"
              max="200"
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </div>

          <Select
            label="Assigned Class Teacher (Form Tutor)"
            value={classTeacherId}
            onChange={(e) => setClassTeacherId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} ({t.staffId || 'Staff'})
              </option>
            ))}
          </Select>

          <Input
            label="Class Description / Notes"
            placeholder="e.g. Science and ICT stream class."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </form>
      </Modal>

      {/* View Class Students Modal */}
      <Modal
        isOpen={!!viewingClassStudents}
        onClose={() => setViewingClassStudents(null)}
        title={`Class Roster: ${viewingClassStudents?.className || ''}`}
        description={`Class Teacher: ${viewingClassStudents?.classTeacherName || 'Unassigned'} • Enrolled: ${enrolledInViewingClass.length} Students`}
        maxWidth="2xl"
        footer={
          <Button variant="outline" size="sm" onClick={() => setViewingClassStudents(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          {enrolledInViewingClass.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No Students Enrolled"
              description="No active students are currently assigned to this class."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Student Name</th>
                    <th className="px-4 py-2.5">Admission No</th>
                    <th className="px-4 py-2.5">Gender</th>
                    <th className="px-4 py-2.5">House</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {enrolledInViewingClass.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {st.photoUrl ? (
                            <img
                              src={st.photoUrl}
                              alt={st.fullName}
                              className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                              {st.fullName.charAt(0)}
                            </div>
                          )}
                          <span>{st.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono">
                        {st.admissionNo}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{st.gender}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{st.house || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="active" label={st.status || 'ACTIVE'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
