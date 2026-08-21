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
  User,
  Archive,
  RotateCcw,
  Home,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Printer,
  CreditCard,
  History,
  ShieldCheck,
  X
} from 'lucide-react';
import { Student, ClassItem, House, StudentEnrollment, StudentStatusHistory } from '../types';
import {
  getStudentsBySchool,
  getClassesBySchool,
  getHousesBySchool,
  archiveStudent,
  restoreStudent,
  getEnrollmentHistoryByStudent,
  getStudentStatusHistory
} from '../lib/services';
import { RecordManagementModal, RecordModalMode } from './RecordManagementModal';
import {
  Button,
  IconButton,
  Badge,
  PageHeader,
  Input,
  Select,
  Modal,
  EmptyState,
  LoadingSkeleton
} from './ui';

interface Props {
  schoolId: string;
}

export const StudentManagement: React.FC<Props> = ({ schoolId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [tab, setTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterHouse, setFilterHouse] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  // Profile View Modal State
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
  const [studentLogs, setStudentLogs] = useState<StudentStatusHistory[]>([]);
  const [profileTab, setProfileTab] = useState<'PROFILE' | 'IDCARD' | 'ENROLLMENTS' | 'HISTORY'>('PROFILE');

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stList, clList, hList] = await Promise.all([
        getStudentsBySchool(schoolId),
        getClassesBySchool(schoolId),
        getHousesBySchool(schoolId)
      ]);
      setStudents(stList);
      setClasses(clList);
      setHouses(hList);
    } catch (err) {
      console.error('Error loading student records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setModalConfig({
      isOpen: true,
      mode: 'CREATE',
      record: null
    });
  };

  const handleOpenEdit = (student: Student) => {
    setModalConfig({
      isOpen: true,
      mode: 'EDIT',
      record: student
    });
  };

  const handleOpenDelete = (student: Student) => {
    setModalConfig({
      isOpen: true,
      mode: 'DELETE',
      record: student
    });
  };

  const handleCloseModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleOpenView = async (student: Student) => {
    setProfileStudent(student);
    setProfileTab('PROFILE');
    try {
      const [enrollments, history] = await Promise.all([
        getEnrollmentHistoryByStudent(schoolId, student.id),
        getStudentStatusHistory(schoolId, student.id)
      ]);
      setStudentEnrollments(enrollments);
      setStudentLogs(history);
    } catch (err) {
      console.error('Error loading student profile history:', err);
    }
  };

  const handleArchiveStudent = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to archive "${student.fullName}"?`)) return;
    try {
      await archiveStudent(schoolId, student.id);
      await loadData();
    } catch (err) {
      console.error('Failed to archive student:', err);
    }
  };

  const handleRestoreStudent = async (student: Student) => {
    try {
      await restoreStudent(schoolId, student.id);
      await loadData();
    } catch (err) {
      console.error('Failed to restore student:', err);
    }
  };

  // Filter Pipeline
  const filteredStudents = students.filter((s) => {
    // Tab Filter
    if (tab === 'ACTIVE' && s.status === 'ARCHIVED') return false;
    if (tab === 'ARCHIVED' && s.status !== 'ARCHIVED') return false;

    // Dropdown filters
    if (filterClass !== 'ALL' && s.className !== filterClass) return false;
    if (filterHouse !== 'ALL' && s.house !== filterHouse) return false;
    if (filterGender !== 'ALL' && s.gender !== filterGender) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.fullName.toLowerCase().includes(q);
      const matchAdm = s.admissionNo.toLowerCase().includes(q);
      const matchPhone = s.parentPhone?.toLowerCase().includes(q);
      const matchParent = s.parentName?.toLowerCase().includes(q);
      if (!matchName && !matchAdm && !matchPhone && !matchParent) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeader
        badge="STUDENT DIRECTORY"
        title="Student Admission & Enrollment Management"
        description="Enrolled student profiles, academic placement across classes & houses, guardian records, and student portal credentials."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Register New Student
          </Button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search student by name, student ID, admission no, parent phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={tab === 'ACTIVE' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setTab('ACTIVE');
                setCurrentPage(1);
              }}
            >
              Active ({students.filter((s) => s.status !== 'ARCHIVED').length})
            </Button>

            <Button
              variant={tab === 'ARCHIVED' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setTab('ARCHIVED');
                setCurrentPage(1);
              }}
            >
              Archived ({students.filter((s) => s.status === 'ARCHIVED').length})
            </Button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Select
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: `All Classes (${classes.length})` },
              ...classes.map((c) => ({ value: c.className, label: c.className }))
            ]}
          />

          <Select
            value={filterHouse}
            onChange={(e) => {
              setFilterHouse(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: `All Houses (${houses.length})` },
              ...houses.map((h) => ({ value: h.houseName, label: h.houseName }))
            ]}
          />

          <Select
            value={filterGender}
            onChange={(e) => {
              setFilterGender(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Genders' },
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' }
            ]}
          />
        </div>
      </div>

      {/* Responsive Mobile Cards Fallback */}
      <div className="block lg:hidden space-y-3">
        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : paginatedStudents.length === 0 ? (
          <EmptyState
            title="No student records found"
            description="No student records match the search and filter criteria. Register a student to populate the directory."
            actionLabel="Register New Student"
            onAction={handleOpenAdd}
          />
        ) : (
          paginatedStudents.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {s.photoUrl ? (
                      <img
                        src={s.photoUrl}
                        alt={s.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{s.fullName}</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                      ADM: {s.admissionNo}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={s.status === 'ARCHIVED' ? 'inactive' : 'active'}
                  label={s.status || 'ACTIVE'}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Class & House</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {s.className} {s.house ? `• ${s.house}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Parent</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {s.parentName || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenView(s)}
                >
                  Profile
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenEdit(s)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Student Directory Table */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton rows={6} />
          </div>
        ) : paginatedStudents.length === 0 ? (
          <EmptyState
            title="No student records found"
            description="No student records match the search and filter criteria. Register a student to populate the directory."
            actionLabel="Register New Student"
            onAction={handleOpenAdd}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Student Details</th>
                    <th className="px-6 py-3.5">Class & House</th>
                    <th className="px-6 py-3.5">Parent / Guardian</th>
                    <th className="px-6 py-3.5">Portal Pass</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedStudents.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          {s.photoUrl ? (
                            <img
                              src={s.photoUrl}
                              alt={s.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{s.fullName}</p>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                            ADM: {s.admissionNo} • DOB: {s.dateOfBirth}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 dark:text-white block">{s.className}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{s.house || 'No House Assigned'}</span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{s.parentName || 'N/A'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{s.parentPhone || 'No Phone'}</p>
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                        {s.password || s.dateOfBirth}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <Badge
                          variant={s.status === 'ARCHIVED' ? 'inactive' : 'active'}
                          label={s.status || 'ACTIVE'}
                        />
                      </td>

                      <td className="px-6 py-4 text-right space-x-1">
                        <IconButton
                          icon={<Eye className="w-4 h-4" />}
                          ariaLabel="View student profile"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenView(s)}
                        />
                        <IconButton
                          icon={<Edit2 className="w-4 h-4" />}
                          ariaLabel="Edit student"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
                        />
                        {s.status === 'ARCHIVED' ? (
                          <IconButton
                            icon={<RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                            ariaLabel="Restore student"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreStudent(s)}
                          />
                        ) : (
                          <IconButton
                            icon={<Archive className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                            ariaLabel="Archive student"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchiveStudent(s)}
                          />
                        )}
                        <IconButton
                          icon={<Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                          ariaLabel="Delete student"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(s)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredStudents.length)} of{' '}
                {filteredStudents.length} students
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Comprehensive Student Profile & ID Card Modal */}
      {profileStudent && (
        <Modal
          isOpen={!!profileStudent}
          onClose={() => setProfileStudent(null)}
          title={`Student Dossier: ${profileStudent.fullName}`}
          description={`Admission No: ${profileStudent.admissionNo} • Class: ${profileStudent.className}`}
          maxWidth="2xl"
          footer={
            <Button variant="outline" size="sm" onClick={() => setProfileStudent(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            {/* Tab selection */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
              <button
                type="button"
                onClick={() => setProfileTab('PROFILE')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  profileTab === 'PROFILE'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Profile & Bio
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('IDCARD')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  profileTab === 'IDCARD'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Student ID Card
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('HISTORY')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  profileTab === 'HISTORY'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Audit Trail ({studentLogs.length})
              </button>
            </div>

            {/* Tab content */}
            {profileTab === 'PROFILE' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                      Personal Information
                    </p>
                    <p><strong>Full Name:</strong> {profileStudent.fullName}</p>
                    <p><strong>Gender:</strong> {profileStudent.gender}</p>
                    <p><strong>Date of Birth:</strong> {profileStudent.dateOfBirth}</p>
                    <p><strong>Admission No:</strong> <span className="font-mono text-indigo-600 dark:text-indigo-400">{profileStudent.admissionNo}</span></p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                      Parent / Guardian Information
                    </p>
                    <p><strong>Guardian:</strong> {profileStudent.parentName || 'N/A'}</p>
                    <p><strong>Phone:</strong> {profileStudent.parentPhone || 'N/A'}</p>
                    <p><strong>Address:</strong> {profileStudent.parentAddress || 'N/A'}</p>
                    <p><strong>Portal Pass:</strong> <span className="font-mono text-emerald-600 dark:text-emerald-400">{profileStudent.password || profileStudent.dateOfBirth}</span></p>
                  </div>
                </div>
              </div>
            )}

            {profileTab === 'IDCARD' && (
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-80 bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                      STUDENT ID
                    </span>
                    <span className="text-[10px] font-bold text-indigo-200">EduMaster System</span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                      {profileStudent.photoUrl ? (
                        <img src={profileStudent.photoUrl} alt={profileStudent.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-white/60" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm leading-tight">{profileStudent.fullName}</h4>
                      <p className="text-[11px] text-indigo-200 font-mono">ADM: {profileStudent.admissionNo}</p>
                      <p className="text-[10px] text-indigo-300">Class: {profileStudent.className}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-[9px] text-indigo-200">
                    <span>House: {profileStudent.house || 'N/A'}</span>
                    <span>Valid: 2026/2027</span>
                  </div>
                </div>
              </div>
            )}

            {profileTab === 'HISTORY' && (
              <div className="space-y-2">
                {studentLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No status changes recorded for this student.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {studentLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span>{log.previousStatus} → <span className="text-emerald-600 dark:text-emerald-400">{log.newStatus}</span></span>
                          <span className="font-mono text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{log.reason || 'Status updated by administrator'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

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
          setModalConfig((prev) => ({ ...prev, mode: newMode }));
        }}
      />
    </div>
  );
};
