import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Eye,
  BookOpen,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import { Teacher, ClassItem, SubjectItem } from '../types';
import {
  getTeachersBySchool,
  getClassesBySchool,
  getSubjectsBySchool
} from '../lib/services';
import { RecordManagementModal, RecordModalMode } from './RecordManagementModal';
import {
  Button,
  IconButton,
  Input,
  Select,
  Badge,
  PageHeader,
  StatCard,
  EmptyState,
  LoadingSkeleton
} from './ui';

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
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.phone && t.phone.includes(searchQuery));
    const matchesClass =
      !selectedClassFilter ||
      t.classTeacherOfId === selectedClassFilter ||
      (t.assignedClassIds && t.assignedClassIds.includes(selectedClassFilter));
    return matchesSearch && matchesClass;
  });

  const activeTeachersCount = teachers.filter((t) => t.accountStatus === 'ACTIVE').length;
  const classTeachersCount = teachers.filter((t) => t.isClassTeacher).length;

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <PageHeader
        title="Teacher & Staff Directory"
        description="Manage faculty profiles, assign class masters, allocate subjects, and configure credentials."
        icon={<UserCheck className="w-6 h-6" />}
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add New Teacher
          </Button>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Faculty"
          value={teachers.length}
          icon={<UserCheck className="w-5 h-5" />}
          description="Registered staff members"
          colorScheme="indigo"
        />
        <StatCard
          title="Active Status"
          value={activeTeachersCount}
          icon={<BookOpen className="w-5 h-5" />}
          description="Active teaching faculty"
          colorScheme="emerald"
        />
        <StatCard
          title="Class Masters"
          value={classTeachersCount}
          icon={<GraduationCap className="w-5 h-5" />}
          description="Assigned form masters"
          colorScheme="purple"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by teacher name, staff ID, or phone number..."
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            <option value="">All Classes Filter</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : filteredTeachers.length === 0 ? (
        <EmptyState
          title="No teacher records found"
          description={
            searchQuery || selectedClassFilter
              ? 'Try clearing your search query or class filter.'
              : 'Click "Add New Teacher" to register faculty members.'
          }
          icon={<UserCheck className="w-12 h-12" />}
          action={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAdd}
            >
              Add New Teacher
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile & Tablet Card Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {filteredTeachers.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {t.photoUrl ? (
                      <img
                        src={t.photoUrl}
                        alt={t.fullName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm shrink-0">
                        {t.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t.fullName}</h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                        {t.staffId}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.qualification}</p>
                    </div>
                  </div>
                  <Badge
                    variant={t.accountStatus === 'ACTIVE' ? 'active' : 'inactive'}
                    label={t.accountStatus}
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 text-xs border border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                    <span>Role:</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {t.isClassTeacher ? `Class Teacher (${t.classTeacherOfName || 'Class'})` : 'Subject Teacher'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                    <span>Phone:</span>
                    <span className="text-slate-900 dark:text-white font-mono">{t.phone || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                    <span>Email:</span>
                    <span className="text-slate-900 dark:text-white truncate max-w-[180px]">{t.email || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenView(t)}
                  >
                    View
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenEdit(t)}
                  >
                    Edit
                  </Button>
                  <IconButton
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenDelete(t)}
                    aria-label="Delete teacher"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0">
                  <th className="py-3.5 px-4">Teacher & Staff ID</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Qualification</th>
                  <th className="py-3.5 px-4">Class Master Role</th>
                  <th className="py-3.5 px-4">Periods/Wk</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredTeachers.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {t.photoUrl ? (
                          <img
                            src={t.photoUrl}
                            alt={t.fullName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                            {t.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{t.fullName}</p>
                          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                            {t.staffId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-900 dark:text-slate-200 font-mono">{t.phone || '-'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.email || '-'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {t.qualification}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.isClassTeacher ? (
                        <Badge
                          variant="published"
                          label={t.classTeacherOfName || 'Class Master'}
                        />
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] uppercase">
                          Subject Teacher
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {t.periodsCount}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={t.accountStatus === 'ACTIVE' ? 'active' : 'inactive'}
                        label={t.accountStatus}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                          onClick={() => handleOpenView(t)}
                          aria-label="View Full Profile"
                        />
                        <IconButton
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
                          onClick={() => handleOpenEdit(t)}
                          aria-label="Edit Teacher"
                        />
                        <IconButton
                          variant="danger"
                          size="sm"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenDelete(t)}
                          aria-label="Delete Teacher"
                        />
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
          setModalConfig((prev) => ({ ...prev, mode: newMode }));
        }}
      />
    </div>
  );
};

export default TeacherManagement;
