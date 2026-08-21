import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  Save,
  Send,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Calculator,
  RotateCcw,
  Check,
  Loader2,
  Table as TableIcon,
  Maximize2,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  ClassItem,
  SubjectItem,
  Student,
  ScoreEntry,
  ExamType,
  ResultSubmission,
  Teacher
} from '../types';
import {
  getStudentsBySchool,
  getScoresByQuery,
  saveScoreEntry,
  saveResultSubmission,
  getResultSubmissions
} from '../lib/services';
import { calculateFinalGradeAndRemarks, DEFAULT_SBA_COMPONENTS } from '../lib/academicEngine';

interface Props {
  schoolId: string;
  teacher: Teacher;
  academicYear: string;
  term: string;
  availableClasses: ClassItem[];
  availableSubjects: SubjectItem[];
}

export const TeacherScoreEntryView: React.FC<Props> = ({
  schoolId,
  teacher,
  academicYear,
  term,
  availableClasses,
  availableSubjects
}) => {
  // Selection
  const [selectedClassId, setSelectedClassId] = useState<string>(availableClasses[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(availableSubjects[0]?.id || '');
  const [examType, setExamType] = useState<ExamType>('END_OF_TERM');
  const [mockNumber, setMockNumber] = useState<number>(1);

  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [scoresMap, setScoresMap] = useState<Record<string, ScoreEntry>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>('CARD');
  const [activeStudentIndex, setActiveStudentIndex] = useState<number>(0);

  // Status & Feedback
  const [currentSubmission, setCurrentSubmission] = useState<ResultSubmission | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    if (availableClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(availableClasses[0].id);
    }
  }, [availableClasses]);

  useEffect(() => {
    if (availableSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(availableSubjects[0].id);
    }
  }, [availableSubjects]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      loadClassData();
    }
  }, [schoolId, selectedClassId, selectedSubjectId, academicYear, term, examType, mockNumber]);

  const loadClassData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [sList, existingScores, submissions] = await Promise.all([
        getStudentsBySchool(schoolId, selectedClassId),
        getScoresByQuery({
          schoolId,
          academicYear,
          term,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          examType,
          mockNumber: examType === 'MOCK' ? mockNumber : undefined
        }),
        getResultSubmissions(schoolId, academicYear, term)
      ]);

      const activeStudents = sList.filter((s) => (s.status || 'ACTIVE') !== 'ARCHIVED');
      setStudents(activeStudents);

      const map: Record<string, ScoreEntry> = {};
      activeStudents.forEach((st) => {
        const found = existingScores.find((sc) => sc.studentId === st.id);
        if (found) {
          map[st.id] = found;
        } else {
          // Initialize empty draft
          map[st.id] = {
            id: `sc_${schoolId}_${st.id}_${selectedSubjectId}_${academicYear}_${term}_${examType}`.replace(/[\/\s]/g, '_'),
            schoolId,
            studentId: st.id,
            studentName: st.fullName,
            admissionNo: st.admissionNo,
            academicYear,
            term,
            classId: selectedClassId,
            className: availableClasses.find((c) => c.id === selectedClassId)?.className || '',
            subjectId: selectedSubjectId,
            subjectName: availableSubjects.find((s) => s.id === selectedSubjectId)?.subjectName || '',
            examType,
            mockNumber: examType === 'MOCK' ? mockNumber : undefined,
            projectScore: 0,
            classTestScore: 0,
            groupWorkScore: 0,
            classExerciseScore: 0,
            classScore50: 0,
            examScore50: 0,
            totalScore100: 0,
            grade: '-',
            remarks: '-',
            status: 'DRAFT',
            updatedAt: new Date().toISOString()
          };
        }
      });
      setScoresMap(map);

      // Check current submission status
      const sub = submissions.find(
        (s) =>
          s.classId === selectedClassId &&
          s.subjectId === selectedSubjectId &&
          s.academicYear === academicYear &&
          s.term === term &&
          s.examType === examType &&
          (examType !== 'MOCK' || s.mockNumber === mockNumber)
      );
      setCurrentSubmission(sub || null);
    } catch (err: any) {
      setErrorMessage('Failed to load class scores: ' + err.message);
    } finally {
      setLoading(false);
      setActiveStudentIndex(0);
    }
  };

  const handleScoreChange = (studentId: string, field: keyof ScoreEntry, value: number) => {
    setScoresMap((prev) => {
      const current = prev[studentId] || {};
      const numVal = isNaN(value) ? 0 : Math.max(0, value);

      const updated = {
        ...current,
        [field]: numVal
      };

      if (examType === 'END_OF_TERM') {
        const project = field === 'projectScore' ? numVal : current.projectScore || 0;
        const test = field === 'classTestScore' ? numVal : current.classTestScore || 0;
        const group = field === 'groupWorkScore' ? numVal : current.groupWorkScore || 0;
        const exercise = field === 'classExerciseScore' ? numVal : current.classExerciseScore || 0;
        const exam50 = field === 'examScore50' ? numVal : current.examScore50 || 0;

        const sbaTotal = project + test + group + exercise;
        const final100 = sbaTotal + exam50;
        const { grade, remarks } = calculateFinalGradeAndRemarks(final100);

        updated.classScore50 = sbaTotal;
        updated.examScore50 = exam50;
        updated.totalScore100 = final100;
        updated.grade = grade;
        updated.remarks = remarks;
      } else {
        const exam50 = field === 'examScore50' ? numVal : current.examScore50 || 0;
        const { grade, remarks } = calculateFinalGradeAndRemarks(exam50);
        updated.examScore50 = exam50;
        updated.totalScore100 = exam50;
        updated.grade = grade;
        updated.remarks = remarks;
      }

      updated.updatedAt = new Date().toISOString();
      return { ...prev, [studentId]: updated as ScoreEntry };
    });
  };

  const handleSaveStudentScore = async (studentId: string, advanceNext: boolean = false) => {
    const entry = scoresMap[studentId];
    if (!entry) return;

    setIsSaving(true);
    try {
      await saveScoreEntry(entry);
      setSaveSuccessMsg(`Score saved for ${entry.studentName}`);
      setTimeout(() => setSaveSuccessMsg(null), 2500);

      if (advanceNext && activeStudentIndex < students.length - 1) {
        setActiveStudentIndex((prev) => prev + 1);
      }
    } catch (err: any) {
      setErrorMessage('Error saving score: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllDrafts = async () => {
    setIsSaving(true);
    try {
      for (const st of students) {
        const entry = scoresMap[st.id];
        if (entry) {
          await saveScoreEntry(entry);
        }
      }

      const completedCount = (Object.values(scoresMap) as ScoreEntry[]).filter((s: ScoreEntry) => (s.totalScore100 || 0) > 0).length;

      await saveResultSubmission({
        id: currentSubmission?.id,
        schoolId,
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        classId: selectedClassId,
        className: availableClasses.find((c) => c.id === selectedClassId)?.className || '',
        subjectId: selectedSubjectId,
        subjectName: availableSubjects.find((s) => s.id === selectedSubjectId)?.subjectName || '',
        academicYear,
        term,
        examType,
        mockNumber: examType === 'MOCK' ? mockNumber : undefined,
        totalStudents: students.length,
        completedStudents: completedCount,
        missingStudents: students.length - completedCount,
        status: currentSubmission?.status === 'SUBMITTED' ? 'SUBMITTED' : 'IN_PROGRESS'
      });

      setSaveSuccessMsg(`All ${students.length} draft scores saved successfully.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      await loadClassData();
    } catch (err: any) {
      setErrorMessage('Failed to save draft scores: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitResults = async () => {
    const completedCount = (Object.values(scoresMap) as ScoreEntry[]).filter((s: ScoreEntry) => (s.totalScore100 || 0) > 0).length;
    const missingCount = students.length - completedCount;

    if (missingCount > 0) {
      if (!confirm(`There are ${missingCount} students with 0 or missing scores. Submit anyway?`)) {
        return;
      }
    }

    setIsSaving(true);
    try {
      // 1. Save all entries with status SUBMITTED
      for (const st of students) {
        const entry = scoresMap[st.id];
        if (entry) {
          await saveScoreEntry({ ...entry, status: 'SUBMITTED' });
        }
      }

      // 2. Update Submission state
      await saveResultSubmission({
        id: currentSubmission?.id,
        schoolId,
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        classId: selectedClassId,
        className: availableClasses.find((c) => c.id === selectedClassId)?.className || '',
        subjectId: selectedSubjectId,
        subjectName: availableSubjects.find((s) => s.id === selectedSubjectId)?.subjectName || '',
        academicYear,
        term,
        examType,
        mockNumber: examType === 'MOCK' ? mockNumber : undefined,
        totalStudents: students.length,
        completedStudents: completedCount,
        missingStudents: missingCount,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString()
      });

      setShowSubmitModal(false);
      setSaveSuccessMsg('Results successfully submitted to School Administration for review.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      await loadClassData();
    } catch (err: any) {
      setErrorMessage('Submission failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const currentStudent = students[activeStudentIndex];
  const currentScore = currentStudent ? scoresMap[currentStudent.id] : null;
  const completedCount = useMemo(
    () => (Object.values(scoresMap) as ScoreEntry[]).filter((s: ScoreEntry) => (s.totalScore100 || 0) > 0).length,
    [scoresMap]
  );

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Bar Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              FACULTY EXAM PORTAL
            </span>
            <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase rounded-full tracking-wider font-mono">
              {academicYear} • {term}
            </span>
          </div>
          <h2 className="text-xl font-light text-white serif italic flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Teacher Score Entry & Submission
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-white">{teacher.fullName}</strong>. Input terminal SBA components and exam marks.
          </p>
        </div>

        {/* Status Badge */}
        {currentSubmission && (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                currentSubmission.status === 'SUBMITTED'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : currentSubmission.status === 'APPROVED'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : currentSubmission.status === 'RETURNED'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              Status: {currentSubmission.status}
            </span>
          </div>
        )}
      </div>

      {/* Selector Ribbon */}
      <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Class Assigned</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
          >
            {availableClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className} ({c.level})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
          >
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subjectName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Exam Type</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value as ExamType)}
            className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="END_OF_TERM">End of Term (SBA 50% + Exam 50%)</option>
            <option value="MID_TERM">Mid-Term Assessment</option>
            <option value="MOCK">Mock Examination (BECE/WASSCE)</option>
          </select>
        </div>

        {examType === 'MOCK' ? (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mock Series Number</label>
            <select
              value={mockNumber}
              onChange={(e) => setMockNumber(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value={1}>Mock 1</option>
              <option value={2}>Mock 2</option>
              <option value={3}>Mock 3</option>
              <option value={4}>Mock 4</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Entry Mode</label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode('CARD')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  viewMode === 'CARD'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#161925] text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Single Focus
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  viewMode === 'TABLE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#161925] text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" /> Grid Sheet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {currentSubmission?.returnReason && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Admin Return Note: {currentSubmission.returnReason}</span>
        </div>
      )}

      {/* Main Score Entry Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-xs">Loading class roster and scores...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-[#0f111a] rounded-2xl border border-slate-800 p-12 text-center text-slate-500 text-xs">
          No students found enrolled in this class.
        </div>
      ) : viewMode === 'CARD' && currentStudent && currentScore ? (
        /* SINGLE STUDENT CARD FOCUS MODE */
        <div className="bg-[#0f111a] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Card Header with Progress */}
          <div className="px-6 py-4 border-b border-slate-800 bg-[#161925] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {currentStudent.photoUrl ? (
                <img
                  src={currentStudent.photoUrl}
                  alt={currentStudent.fullName}
                  className="w-11 h-11 rounded-2xl object-cover border border-slate-700"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                  {currentStudent.fullName.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-white">{currentStudent.fullName}</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Adm No: <span className="text-blue-400">{currentStudent.admissionNo}</span> • Student {activeStudentIndex + 1} of {students.length}
                </p>
              </div>
            </div>

            {/* Quick Navigation Slider */}
            <div className="flex items-center gap-2">
              <button
                disabled={activeStudentIndex === 0}
                onClick={() => setActiveStudentIndex((prev) => Math.max(0, prev - 1))}
                className="p-2 bg-[#0f111a] hover:bg-slate-800 disabled:opacity-30 border border-slate-700 rounded-xl text-slate-300 cursor-pointer"
                title="Previous Student"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-400 px-2">
                {activeStudentIndex + 1} / {students.length}
              </span>
              <button
                disabled={activeStudentIndex === students.length - 1}
                onClick={() => setActiveStudentIndex((prev) => Math.min(students.length - 1, prev + 1))}
                className="p-2 bg-[#0f111a] hover:bg-slate-800 disabled:opacity-30 border border-slate-700 rounded-xl text-slate-300 cursor-pointer"
                title="Next Student"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card Body - Score Inputs */}
          <div className="p-6 space-y-6">
            {examType === 'END_OF_TERM' ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    1. SBA / Continuous Assessment Components (Total: 50 Marks)
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Project Work (15 Max)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={currentScore.projectScore || ''}
                      onChange={(e) =>
                        handleScoreChange(currentStudent.id, 'projectScore', parseFloat(e.target.value))
                      }
                      className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Class Test (15 Max)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={currentScore.classTestScore || ''}
                      onChange={(e) =>
                        handleScoreChange(currentStudent.id, 'classTestScore', parseFloat(e.target.value))
                      }
                      className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Group Work (10 Max)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={currentScore.groupWorkScore || ''}
                      onChange={(e) =>
                        handleScoreChange(currentStudent.id, 'groupWorkScore', parseFloat(e.target.value))
                      }
                      className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Class Exercise (10 Max)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={currentScore.classExerciseScore || ''}
                      onChange={(e) =>
                        handleScoreChange(currentStudent.id, 'classExerciseScore', parseFloat(e.target.value))
                      }
                      className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="border-b border-slate-800 pt-3 pb-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    2. Terminal Examination Score (50 Marks)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      End of Term Exam Score (Max 50)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={currentScore.examScore50 || ''}
                      onChange={(e) =>
                        handleScoreChange(currentStudent.id, 'examScore50', parseFloat(e.target.value))
                      }
                      className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="bg-[#161925] p-4 rounded-2xl border border-slate-800 flex items-center justify-around text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">SBA Total (50)</span>
                      <span className="text-sm font-bold text-white font-mono">
                        {currentScore.classScore50 || 0}
                      </span>
                    </div>
                    <div className="text-slate-600 font-bold">+</div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Exam (50)</span>
                      <span className="text-sm font-bold text-white font-mono">
                        {currentScore.examScore50 || 0}
                      </span>
                    </div>
                    <div className="text-slate-600 font-bold">=</div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Total (100)</span>
                      <span className="text-base font-extrabold text-blue-400 font-mono">
                        {currentScore.totalScore100 || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Grade</span>
                      <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold rounded-lg text-xs">
                        {currentScore.grade || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Single Exam Score (Mid-term / Mock) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Exam Score (Max 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={currentScore.examScore50 || ''}
                    onChange={(e) =>
                      handleScoreChange(currentStudent.id, 'examScore50', parseFloat(e.target.value))
                    }
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="bg-[#161925] p-4 rounded-2xl border border-slate-800 flex items-center justify-around text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Total Score</span>
                    <span className="text-lg font-bold text-blue-400 font-mono">
                      {currentScore.totalScore100 || 0} / 100
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Grade</span>
                    <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold rounded-lg text-xs">
                      {currentScore.grade || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Remarks</span>
                    <span className="text-xs text-slate-300 font-medium">
                      {currentScore.remarks || '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-800 bg-[#161925] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Completed: <strong className="text-emerald-400">{completedCount}</strong> of {students.length} students
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveStudentScore(currentStudent.id, false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Record
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveStudentScore(currentStudent.id, true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Save & Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* GRID TABLE SHEET ENTRY MODE */
        <div className="bg-[#0f111a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161925] text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3.5">#</th>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Adm No</th>
                  {examType === 'END_OF_TERM' && (
                    <>
                      <th className="px-3 py-3.5 text-center">Project (15)</th>
                      <th className="px-3 py-3.5 text-center">Test (15)</th>
                      <th className="px-3 py-3.5 text-center">Group (10)</th>
                      <th className="px-3 py-3.5 text-center">Exercise (10)</th>
                      <th className="px-3 py-3.5 text-center">SBA (50)</th>
                    </>
                  )}
                  <th className="px-3 py-3.5 text-center">
                    {examType === 'END_OF_TERM' ? 'Exam (50)' : 'Exam (100)'}
                  </th>
                  <th className="px-4 py-3.5 text-center">Total</th>
                  <th className="px-4 py-3.5 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {students.map((st, idx) => {
                  const sc = scoresMap[st.id] || ({} as ScoreEntry);
                  return (
                    <tr key={st.id} className="hover:bg-[#161925]/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-sans">{idx + 1}</td>
                      <td className="px-4 py-3 font-sans font-semibold text-white">
                        {st.fullName}
                      </td>
                      <td className="px-4 py-3 text-blue-400">{st.admissionNo}</td>
                      {examType === 'END_OF_TERM' && (
                        <>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="15"
                              value={sc.projectScore || ''}
                              onChange={(e) =>
                                handleScoreChange(st.id, 'projectScore', parseFloat(e.target.value))
                              }
                              className="w-14 px-2 py-1 bg-[#161925] border border-slate-700 rounded text-center text-white focus:border-blue-500"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="15"
                              value={sc.classTestScore || ''}
                              onChange={(e) =>
                                handleScoreChange(st.id, 'classTestScore', parseFloat(e.target.value))
                              }
                              className="w-14 px-2 py-1 bg-[#161925] border border-slate-700 rounded text-center text-white focus:border-blue-500"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={sc.groupWorkScore || ''}
                              onChange={(e) =>
                                handleScoreChange(st.id, 'groupWorkScore', parseFloat(e.target.value))
                              }
                              className="w-14 px-2 py-1 bg-[#161925] border border-slate-700 rounded text-center text-white focus:border-blue-500"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={sc.classExerciseScore || ''}
                              onChange={(e) =>
                                handleScoreChange(st.id, 'classExerciseScore', parseFloat(e.target.value))
                              }
                              className="w-14 px-2 py-1 bg-[#161925] border border-slate-700 rounded text-center text-white focus:border-blue-500"
                            />
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-300">
                            {sc.classScore50 || 0}
                          </td>
                        </>
                      )}
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max={examType === 'END_OF_TERM' ? 50 : 100}
                          value={sc.examScore50 || ''}
                          onChange={(e) =>
                            handleScoreChange(st.id, 'examScore50', parseFloat(e.target.value))
                          }
                          className="w-16 px-2 py-1 bg-[#161925] border border-slate-700 rounded text-center text-white focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-400">
                        {sc.totalScore100 || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded font-bold">
                          {sc.grade || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Bottom Submission Bar */}
      <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">
            Total Students: <strong className="text-white">{students.length}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            Completed Marks: <strong className="text-emerald-400">{completedCount}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            Missing: <strong className="text-amber-400">{students.length - completedCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAllDrafts}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Save All as Draft
          </button>

          <button
            type="button"
            disabled={isSaving || students.length === 0}
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/20 flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider"
          >
            <Send className="w-3.5 h-3.5" /> Submit to Administration
          </button>
        </div>
      </div>

      {/* Submission Review Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f111a] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-[#161925] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" /> Confirm Terminal Submission
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-300">
                You are about to submit the final examination marks for:
              </p>

              <div className="bg-[#161925] p-3.5 rounded-xl border border-slate-800 space-y-1.5 font-medium text-slate-300">
                <div>
                  Class:{' '}
                  <strong className="text-white">
                    {availableClasses.find((c) => c.id === selectedClassId)?.className}
                  </strong>
                </div>
                <div>
                  Subject:{' '}
                  <strong className="text-white">
                    {availableSubjects.find((s) => s.id === selectedSubjectId)?.subjectName}
                  </strong>
                </div>
                <div>
                  Academic Session:{' '}
                  <strong className="text-white">
                    {academicYear} • {term} ({examType})
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <span className="text-[10px] text-slate-400 block uppercase">Total</span>
                  <span className="font-bold text-sm text-blue-400">{students.length}</span>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <span className="text-[10px] text-slate-400 block uppercase">Completed</span>
                  <span className="font-bold text-sm text-emerald-400">{completedCount}</span>
                </div>
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <span className="text-[10px] text-slate-400 block uppercase">Missing</span>
                  <span className="font-bold text-sm text-amber-400">
                    {students.length - completedCount}
                  </span>
                </div>
              </div>

              {students.length - completedCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Warning: Some students do not have complete scores recorded.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSubmitResults}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
