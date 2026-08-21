import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  Percent,
  Search,
  CheckCheck,
  UserCheck,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { Student, ClassItem, TermStudentAttendance, TermAttendanceSummary } from '../types';
import {
  getClassesBySchool,
  getStudentsBySchool,
  getTermAttendanceSummary,
  saveTermAttendanceSummary,
  getSchoolSettings
} from '../lib/services';
import { triggerPrint } from '../lib/printService';

interface Props {
  schoolId: string;
  userRole?: string;
  userEmail?: string;
}

export const TermAttendanceSummaryView: React.FC<Props> = ({
  schoolId,
  userRole = 'TEACHER',
  userEmail = 'teacher@school.edu.gh'
}) => {
  // Step 1 Selections
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('Term 1');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // Step 2 & 3: Students & Attendance State
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<{ [studentId: string]: TermStudentAttendance }>({});
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Global default school days helper
  const [defaultTotalSchoolDays, setDefaultTotalSchoolDays] = useState<number>(65);

  // UI & Loading States
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadInitialSetup();
  }, [schoolId]);

  const loadInitialSetup = async () => {
    setLoadingClasses(true);
    try {
      const [classList, settings] = await Promise.all([
        getClassesBySchool(schoolId),
        getSchoolSettings(schoolId)
      ]);
      setClasses(classList);

      if (settings?.currentAcademicYear) {
        setAcademicYear(settings.currentAcademicYear);
      }
      if (settings?.currentTerm) {
        setTerm(settings.currentTerm);
      }

      if (classList.length > 0) {
        setSelectedClassId(classList[0].id);
      }
    } catch (err) {
      console.error('Error loading classes for term attendance:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Step 2: Load Class Student List
  const handleLoadClassStudents = async () => {
    if (!selectedClassId) {
      setMsg({ type: 'error', text: 'Please select a class first.' });
      return;
    }

    setLoadingStudents(true);
    setMsg(null);

    try {
      const studentList = await getStudentsBySchool(schoolId, selectedClassId);
      setStudents(studentList);

      // Check if existing term attendance summary is already recorded
      const existingSummary = await getTermAttendanceSummary(schoolId, academicYear, term, selectedClassId);

      const newAttendanceMap: { [studentId: string]: TermStudentAttendance } = {};

      if (existingSummary && existingSummary.students && existingSummary.students.length > 0) {
        setDefaultTotalSchoolDays(existingSummary.defaultTotalSchoolDays || 65);
        
        // Map existing data
        studentList.forEach(st => {
          const found = existingSummary.students.find(s => s.studentId === st.id);
          if (found) {
            newAttendanceMap[st.id] = {
              ...found,
              studentName: st.fullName,
              admissionNo: st.admissionNo,
              gender: st.gender
            };
          } else {
            // New student joined later
            const defaultTotal = existingSummary.defaultTotalSchoolDays || 65;
            const defaultPresent = defaultTotal;
            newAttendanceMap[st.id] = {
              studentId: st.id,
              studentName: st.fullName,
              admissionNo: st.admissionNo,
              gender: st.gender,
              studentTotalAttendanceDays: defaultPresent,
              totalSchoolAttendanceDays: defaultTotal,
              attendancePercentage: 100,
              remark: 'Regular & Punctual'
            };
          }
        });
        setMsg({
          type: 'success',
          text: `Loaded existing saved attendance records for ${studentList.length} students.`
        });
      } else {
        // Initialize default attendance for all class students
        studentList.forEach(st => {
          newAttendanceMap[st.id] = {
            studentId: st.id,
            studentName: st.fullName,
            admissionNo: st.admissionNo,
            gender: st.gender,
            studentTotalAttendanceDays: defaultTotalSchoolDays,
            totalSchoolAttendanceDays: defaultTotalSchoolDays,
            attendancePercentage: 100,
            remark: 'Regular & Punctual'
          };
        });
      }

      setAttendanceData(newAttendanceMap);
      if (studentList.length > 0) {
        setSelectedStudentId(studentList[0].id);
      }
      setIsLoaded(true);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setMsg({ type: 'error', text: 'Failed to load class student list: ' + err.message });
    } finally {
      setLoadingStudents(false);
    }
  };

  // Step 3: Handle real-time attendance day changes with auto-percentage calculation
  const handleDaysChange = (
    studentId: string,
    field: 'studentTotalAttendanceDays' | 'totalSchoolAttendanceDays',
    val: number
  ) => {
    const current = attendanceData[studentId] || {
      studentId,
      studentName: '',
      admissionNo: '',
      studentTotalAttendanceDays: defaultTotalSchoolDays,
      totalSchoolAttendanceDays: defaultTotalSchoolDays,
      attendancePercentage: 100
    };

    const sanitizedVal = Math.max(0, isNaN(val) ? 0 : val);
    const updated = {
      ...current,
      [field]: sanitizedVal
    };

    // Calculate percentage automatically: (studentTotalAttendanceDays / totalSchoolAttendanceDays) * 100
    const studentDays = field === 'studentTotalAttendanceDays' ? sanitizedVal : current.studentTotalAttendanceDays;
    const totalDays = field === 'totalSchoolAttendanceDays' ? sanitizedVal : current.totalSchoolAttendanceDays;

    let percentage = 0;
    if (totalDays > 0) {
      percentage = Math.min(100, Number(((studentDays / totalDays) * 100).toFixed(1)));
    }

    updated.attendancePercentage = percentage;

    // Suggest remark based on percentage
    if (!updated.remark || updated.remark === 'Regular & Punctual' || updated.remark === 'Fair Attendance' || updated.remark === 'Needs Improvement') {
      if (percentage >= 90) updated.remark = 'Regular & Punctual';
      else if (percentage >= 75) updated.remark = 'Fair Attendance';
      else updated.remark = 'Needs Improvement / High Absenteeism';
    }

    setAttendanceData(prev => ({
      ...prev,
      [studentId]: updated
    }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remark
      }
    }));
  };

  // Quick Batch Action: Apply total school days to all students
  const handleApplySchoolDaysToAll = () => {
    const updated = { ...attendanceData };
    students.forEach(st => {
      if (updated[st.id]) {
        const studentDays = Math.min(updated[st.id].studentTotalAttendanceDays, defaultTotalSchoolDays);
        const percentage = defaultTotalSchoolDays > 0
          ? Number(((studentDays / defaultTotalSchoolDays) * 100).toFixed(1))
          : 0;
        updated[st.id] = {
          ...updated[st.id],
          totalSchoolAttendanceDays: defaultTotalSchoolDays,
          studentTotalAttendanceDays: studentDays,
          attendancePercentage: percentage
        };
      }
    });
    setAttendanceData(updated);
    setMsg({
      type: 'success',
      text: `Applied ${defaultTotalSchoolDays} Total School Days across all ${students.length} students.`
    });
  };

  // Quick Batch Action: Mark all present for full term
  const handleMarkAllFullAttendance = () => {
    const updated = { ...attendanceData };
    students.forEach(st => {
      if (updated[st.id]) {
        updated[st.id] = {
          ...updated[st.id],
          studentTotalAttendanceDays: defaultTotalSchoolDays,
          totalSchoolAttendanceDays: defaultTotalSchoolDays,
          attendancePercentage: 100,
          remark: 'Regular & Punctual'
        };
      }
    });
    setAttendanceData(updated);
    setMsg({
      type: 'success',
      text: `Set 100% full attendance for all students.`
    });
  };

  // Save Term Attendance Summary
  const handleSaveSummary = async () => {
    if (!selectedClassId || students.length === 0) {
      setMsg({ type: 'error', text: 'No students loaded to save.' });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const currentClass = classes.find(c => c.id === selectedClassId);
      const studentRecords: TermStudentAttendance[] = students.map(st => {
        const data = attendanceData[st.id];
        return {
          studentId: st.id,
          studentName: st.fullName,
          admissionNo: st.admissionNo,
          gender: st.gender,
          studentTotalAttendanceDays: data ? data.studentTotalAttendanceDays : defaultTotalSchoolDays,
          totalSchoolAttendanceDays: data ? data.totalSchoolAttendanceDays : defaultTotalSchoolDays,
          attendancePercentage: data ? data.attendancePercentage : 100,
          remark: data?.remark || 'Regular & Punctual',
          updatedAt: new Date().toISOString()
        };
      });

      const summaryPayload: TermAttendanceSummary = {
        id: `term_att_${schoolId}_${academicYear.replace(/[\/\\]/g, '_')}_${term.replace(/\s+/g, '_')}_${selectedClassId}`,
        schoolId,
        academicYear,
        term,
        classId: selectedClassId,
        className: currentClass?.className || 'Class',
        defaultTotalSchoolDays,
        recordedBy: userEmail,
        students: studentRecords,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveTermAttendanceSummary(summaryPayload);

      setMsg({
        type: 'success',
        text: `Term Attendance Summary successfully saved and synchronized for ${studentRecords.length} students!`
      });
    } catch (err: any) {
      console.error('Save error:', err);
      setMsg({ type: 'error', text: 'Failed to save summary: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePrintSummary = () => {
    const currentClass = classes.find(c => c.id === selectedClassId);
    triggerPrint({
      documentTitle: `Term_Attendance_Summary_${currentClass?.className || 'Class'}_${term}_${academicYear.replace(/[\/\\]/g, '-')}`
    });
  };

  // Filtered student list
  const filteredStudents = students.filter(st =>
    st.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    st.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedStudentAttendance = selectedStudentId ? attendanceData[selectedStudentId] : null;
  const currentClass = classes.find(c => c.id === selectedClassId);

  // Statistics calculation
  const totalClassStudents = students.length;
  const avgAttendance = totalClassStudents > 0
    ? (students.reduce((acc, st) => acc + (attendanceData[st.id]?.attendancePercentage || 0), 0) / totalClassStudents).toFixed(1)
    : '0.0';
  const perfectCount = students.filter(st => (attendanceData[st.id]?.attendancePercentage || 0) >= 100).length;
  const lowCount = students.filter(st => (attendanceData[st.id]?.attendancePercentage || 0) < 75).length;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Samsung One UI / iPhone 14 Pro Styled Dynamic Header Banner */}
      <div className="relative overflow-hidden bg-[#0c101a] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-500/30 rounded-full text-blue-300 text-[11px] font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Terminal Attendance Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              Term Attendance Summary
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Record total student attendance days and total school days for terminal assessment. Automatically calculates percentages for official report cards and printable broadsheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isLoaded && (
              <>
                <button
                  type="button"
                  onClick={handlePrintSummary}
                  className="px-4 py-2.5 bg-[#161d2d] hover:bg-[#1f293d] border border-slate-700/80 text-slate-200 text-xs font-semibold rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-blue-400" /> Print Summary
                </button>
                <button
                  type="button"
                  onClick={handleSaveSummary}
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save All Records
                </button>
              </>
            )}
          </div>
        </div>

        {/* Real-time Toast/Notice */}
        {msg && (
          <div
            className={`mt-6 p-4 rounded-2xl border text-xs flex items-center gap-3 transition-all ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{msg.text}</span>
          </div>
        )}
      </div>

      {/* STEP 1: Academic Year, Term, Class Selection & Load Button */}
      <div className="bg-[#0f1422] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
          <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
            1
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Step 1: Select Academic Period & Class
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Academic Year */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Academic Year
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2026/2027"
              className="w-full bg-[#161d2d] border border-slate-700/90 rounded-2xl px-4 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Term */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Academic Term
            </label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full bg-[#161d2d] border border-slate-700/90 rounded-2xl px-4 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          {/* Class Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Target Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loadingClasses}
              className="w-full bg-[#161d2d] border border-slate-700/90 rounded-2xl px-4 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {classes.length === 0 && <option value="">No classes found</option>}
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.className} ({cls.level || 'Class'})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Load Class Action */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 invisible">
              Action
            </label>
            <button
              type="button"
              onClick={handleLoadClassStudents}
              disabled={loadingStudents || !selectedClassId}
              className="w-full h-[42px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loadingStudents ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading Students...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" /> Load Class Student List
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* STEP 2 & 3: Loaded Class Roster & Student Attendance Editor */}
      {isLoaded && (
        <div className="space-y-6">
          {/* Quick Analytics Bar (iPhone Dynamic Island inspired metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0f1422] border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Size</p>
                <p className="text-xl font-bold text-white font-mono">{totalClassStudents}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentClass?.className}</p>
              </div>
            </div>

            <div className="bg-[#0f1422] border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Average</p>
                <p className="text-xl font-bold text-emerald-400 font-mono">{avgAttendance}%</p>
                <p className="text-[10px] text-slate-400">Terminal Rate</p>
              </div>
            </div>

            <div className="bg-[#0f1422] border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">100% Punctual</p>
                <p className="text-xl font-bold text-cyan-400 font-mono">{perfectCount}</p>
                <p className="text-[10px] text-slate-400">Perfect Records</p>
              </div>
            </div>

            <div className="bg-[#0f1422] border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attention (&lt;75%)</p>
                <p className="text-xl font-bold text-amber-400 font-mono">{lowCount}</p>
                <p className="text-[10px] text-slate-400">Low Attendance</p>
              </div>
            </div>
          </div>

          {/* Step 3: Interactive Student Attendance Studio */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Student Roster List (7 Cols) */}
            <div className="lg:col-span-7 bg-[#0f1422] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Class Student Roster ({filteredStudents.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">Click any student to edit attendance days</p>
                  </div>
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name/admission..."
                    className="w-full bg-[#161d2d] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Batch Tools Toolbar */}
              <div className="p-3 bg-[#131929] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Default School Days:</span>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={defaultTotalSchoolDays}
                    onChange={(e) => setDefaultTotalSchoolDays(parseInt(e.target.value) || 0)}
                    className="w-16 bg-[#1b2338] border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplySchoolDaysToAll}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Apply to All
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleMarkAllFullAttendance}
                  className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3 text-cyan-400" /> Set All 100%
                </button>
              </div>

              {/* Student Cards List */}
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {filteredStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No students found matching your search.
                  </div>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const att = attendanceData[st.id] || {
                      studentTotalAttendanceDays: defaultTotalSchoolDays,
                      totalSchoolAttendanceDays: defaultTotalSchoolDays,
                      attendancePercentage: 100
                    };
                    const isSelected = st.id === selectedStudentId;

                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500/60 shadow-md ring-1 ring-blue-500/40'
                            : 'bg-[#141a2a] border-slate-800/80 hover:border-slate-700 hover:bg-[#182033]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-white truncate">
                              {st.fullName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Adm: {st.admissionNo} • {st.gender || 'Student'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div className="hidden sm:block">
                            <p className="text-[11px] font-bold text-white font-mono">
                              {att.studentTotalAttendanceDays} / {att.totalSchoolAttendanceDays} Days
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {att.remark || 'Standard'}
                            </p>
                          </div>

                          <div
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold font-mono border ${
                              att.attendancePercentage >= 90
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                : att.attendancePercentage >= 75
                                ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            }`}
                          >
                            {att.attendancePercentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Step 3 Active Student Attendance Editor (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0f1422] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
                <div className="w-6 h-6 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-[10px]">
                  3
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Step 3: Student Attendance Detail
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Input total attended days vs. total school days
                  </p>
                </div>
              </div>

              {selectedStudent ? (
                <div className="space-y-5">
                  {/* Selected Student Card */}
                  <div className="p-4 bg-gradient-to-br from-[#161d2d] to-[#121724] border border-slate-700/80 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold rounded-lg uppercase">
                        Active Selected Student
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {currentClass?.className}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white pt-1">
                      {selectedStudent.fullName}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Admission No: {selectedStudent.admissionNo} • {selectedStudent.gender || 'Student'}
                    </p>
                  </div>

                  {/* The Two Primary Input Fields Required by User Prompt */}
                  <div className="space-y-4">
                    {/* INPUT 1: Student Total Attendance Days for the Term */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                        <span>1. Student Total Attendance Days</span>
                        <span className="text-[10px] text-blue-400 font-normal">Present Days</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={selectedStudentAttendance?.totalSchoolAttendanceDays || 180}
                        value={selectedStudentAttendance?.studentTotalAttendanceDays ?? defaultTotalSchoolDays}
                        onChange={(e) =>
                          handleDaysChange(
                            selectedStudent.id,
                            'studentTotalAttendanceDays',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full bg-[#182133] border border-blue-500/40 rounded-2xl px-4 py-3 text-sm text-white font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        placeholder="e.g. 62"
                      />
                      <p className="text-[10px] text-slate-400">
                        Total number of days this student was present at school during this term.
                      </p>
                    </div>

                    {/* INPUT 2: Total School Attendance Days for that Term */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                        <span>2. Total School Attendance Days</span>
                        <span className="text-[10px] text-cyan-400 font-normal">School Days in Term</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={selectedStudentAttendance?.totalSchoolAttendanceDays ?? defaultTotalSchoolDays}
                        onChange={(e) =>
                          handleDaysChange(
                            selectedStudent.id,
                            'totalSchoolAttendanceDays',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full bg-[#182133] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-bold font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                        placeholder="e.g. 65"
                      />
                      <p className="text-[10px] text-slate-400">
                        Total number of operational school sessions held in this academic term.
                      </p>
                    </div>

                    {/* Automatically Calculated Attendance Percentage Display */}
                    <div className="p-4 bg-[#141b2c] border border-slate-800 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Auto-Calculated Percentage
                        </p>
                        <p className="text-xs text-slate-300">
                          Formula: ({selectedStudentAttendance?.studentTotalAttendanceDays || 0} / {selectedStudentAttendance?.totalSchoolAttendanceDays || 1}) × 100
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-2xl font-bold font-mono ${
                            (selectedStudentAttendance?.attendancePercentage || 0) >= 90
                              ? 'text-emerald-400'
                              : (selectedStudentAttendance?.attendancePercentage || 0) >= 75
                              ? 'text-blue-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {(selectedStudentAttendance?.attendancePercentage || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Teacher Remarks for Attendance */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                        Attendance Remark / Behavioral Note
                      </label>
                      <input
                        type="text"
                        value={selectedStudentAttendance?.remark || ''}
                        onChange={(e) => handleRemarkChange(selectedStudent.id, e.target.value)}
                        placeholder="e.g. Regular & Punctual, Excused medical leave"
                        className="w-full bg-[#182133] border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Navigation between students */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        const idx = filteredStudents.findIndex(s => s.id === selectedStudentId);
                        if (idx > 0) setSelectedStudentId(filteredStudents[idx - 1].id);
                      }}
                      disabled={filteredStudents.findIndex(s => s.id === selectedStudentId) <= 0}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      ← Previous Student
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const idx = filteredStudents.findIndex(s => s.id === selectedStudentId);
                        if (idx < filteredStudents.length - 1) setSelectedStudentId(filteredStudents[idx + 1].id);
                      }}
                      disabled={filteredStudents.findIndex(s => s.id === selectedStudentId) >= filteredStudents.length - 1}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      Next Student <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">Select a student from the left roster to edit their term attendance days.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
