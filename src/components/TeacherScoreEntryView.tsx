import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Lock,
  RefreshCw,
  Search,
  Filter,
  Check,
  Award,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
  Eye,
  Edit3
} from 'lucide-react';
import {
  ClassItem,
  SubjectItem,
  Student,
  ScoreEntry,
  ExamType,
  Teacher
} from '../types';
import {
  getClassesBySchool,
  getSubjectsBySchool,
  getStudentsBySchool,
  getScoresByQuery,
  saveBatchScores,
  getSchoolSettings,
  getTeachersBySchool
} from '../lib/services';
import {
  computeCompleteScore,
  validateScoreInput,
  DEFAULT_SBA_COMPONENTS
} from '../lib/academicEngine';
import toast from 'react-hot-toast';

interface Props {
  schoolId: string;
  teacherEmail?: string;
  isSchoolAdmin?: boolean;
}

export const TeacherScoreEntryView: React.FC<Props> = ({
  schoolId,
  teacherEmail,
  isSchoolAdmin = false
}) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  // Cascading Filter States
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('Term 1');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [examType, setExamType] = useState<ExamType>('END_OF_TERM');
  const [mockNumber, setMockNumber] = useState<string>('Mock 1');

  // View Mode: 'TABLE' or 'STUDENT_CARD'
  const [entryMode, setEntryMode] = useState<'TABLE' | 'STUDENT_CARD'>('STUDENT_CARD');
  const [studentSearch, setStudentSearch] = useState<string>('');

  const [scoresMap, setScoresMap] = useState<{ [studentId: string]: Partial<ScoreEntry> }>({});
  const [errorsMap, setErrorsMap] = useState<{ [studentId: string]: string }>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
  }, [schoolId, teacherEmail]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      fetchExistingScores();
    }
  }, [selectedClassId, selectedSubjectId, academicYear, term, examType]);

  // When class changes, update selectedStudentId to first enrolled student in class
  useEffect(() => {
    if (selectedClassId) {
      const classStudents = students.filter(s => s.classId === selectedClassId);
      if (classStudents.length > 0 && (!selectedStudentId || !classStudents.some(s => s.id === selectedStudentId))) {
        setSelectedStudentId(classStudents[0].id);
      }
    }
  }, [selectedClassId, students]);

  const loadInitialData = async () => {
    setLoading(true);
    const [cList, sList, stList, setts, tList] = await Promise.all([
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId),
      getStudentsBySchool(schoolId),
      getSchoolSettings(schoolId),
      getTeachersBySchool(schoolId)
    ]);

    setClasses(cList);
    setSubjects(sList);
    setStudents(stList);

    if (setts) {
      setAcademicYear(setts.currentAcademicYear || '2026/2027');
      setTerm(setts.currentTerm || 'Term 1');
    }

    // Filter teacher specific subjects/classes if logged in as teacher
    if (teacherEmail && !isSchoolAdmin) {
      const foundTeacher = tList.find(t => t.email.toLowerCase() === teacherEmail.toLowerCase());
      if (foundTeacher) {
        setTeacher(foundTeacher);
      }
    }

    if (cList.length > 0) {
      setSelectedClassId(cList[0].id);
      const firstClassStudents = stList.filter(s => s.classId === cList[0].id);
      if (firstClassStudents.length > 0) {
        setSelectedStudentId(firstClassStudents[0].id);
      }
    }
    if (sList.length > 0) setSelectedSubjectId(sList[0].id);

    setLoading(false);
  };

  const fetchExistingScores = async () => {
    if (!selectedClassId || !selectedSubjectId) return;

    const existingScores = await getScoresByQuery({
      schoolId,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      academicYear,
      term,
      examType
    });

    const classStudents = students.filter(s => s.classId === selectedClassId);
    const map: { [studentId: string]: Partial<ScoreEntry> } = {};

    let lockedCheck = false;

    classStudents.forEach(st => {
      const found = existingScores.find(sc => sc.studentId === st.id);
      if (found) {
        map[st.id] = { ...found };
        if (found.status === 'LOCKED' || found.status === 'PUBLISHED' || found.status === 'APPROVED') {
          lockedCheck = true;
        }
      } else {
        map[st.id] = {
          studentId: st.id,
          studentName: st.fullName,
          admissionNo: st.admissionNo,
          sbaRawScores: { classTest: 0, classExercise: 0, projectWork: 0, groupWork: 0 },
          examRawScore: 0,
          status: 'DRAFT'
        };
      }
    });

    setScoresMap(map);
    setIsLocked(lockedCheck);
  };

  const handleScoreChange = (
    studentId: string,
    field: 'classTest' | 'classExercise' | 'projectWork' | 'groupWork' | 'examRawScore',
    value: number
  ) => {
    if (isLocked && !isSchoolAdmin) return;

    const current = scoresMap[studentId] || {};
    const sbaScores = { ...(current.sbaRawScores || { classTest: 0, classExercise: 0, projectWork: 0, groupWork: 0 }) };

    let examRawScore = current.examRawScore || 0;

    if (field === 'examRawScore') {
      examRawScore = Math.max(0, value);
    } else {
      sbaScores[field] = Math.max(0, value);
    }

    // Validation checks
    let err = '';
    if (field === 'examRawScore' && value > 100) err = 'Exam score cannot exceed 100';
    if (field !== 'examRawScore' && value > 15) err = `${field} cannot exceed 15 points`;

    setErrorsMap(prev => ({ ...prev, [studentId]: err }));

    // Recompute scores in real time
    const computed = computeCompleteScore({
      examType,
      sbaRawScores: sbaScores,
      examRawScore
    });

    setScoresMap(prev => ({
      ...prev,
      [studentId]: {
        ...current,
        studentId,
        sbaRawScores: sbaScores,
        examRawScore,
        sbaRawTotal: computed.sbaRawTotal,
        sbaRawMaxTotal: computed.sbaRawMaxTotal,
        sbaScaledScore: computed.sbaScaledScore,
        examScaledScore: computed.examScaledScore,
        finalScore: computed.finalScore,
        percentage: computed.percentage,
        grade: computed.grade,
        gradePoint: computed.gradePoint,
        remark: computed.remark,
        isPass: computed.isPass
      }
    }));
  };

  const handleSaveBatch = async (targetStatus: 'DRAFT' | 'SUBMITTED') => {
    // Check errors
    const hasErr = Object.values(errorsMap).some((e: string) => e && e.length > 0);
    if (hasErr) {
      setMsg({ type: 'error', text: 'Please resolve all score validation errors before saving.' });
      toast.error('Please resolve score validation errors.');
      return;
    }

    setSaving(true);
    setMsg(null);

    const targetClass = classes.find(c => c.id === selectedClassId);
    const targetSubject = subjects.find(s => s.id === selectedSubjectId);
    const classStudents = students.filter(s => s.classId === selectedClassId);

    const payload: ScoreEntry[] = classStudents.map(st => {
      const entry = scoresMap[st.id] || {};
      const sbaScores = entry.sbaRawScores || { classTest: 0, classExercise: 0, projectWork: 0, groupWork: 0 };
      const examRawScore = entry.examRawScore || 0;

      const computed = computeCompleteScore({
        examType,
        sbaRawScores: sbaScores,
        examRawScore
      });

      return {
        id: entry.id || `score_${schoolId}_${selectedClassId}_${selectedSubjectId}_${st.id}_${examType}`,
        schoolId,
        academicYear,
        term,
        classId: selectedClassId,
        className: targetClass?.className || 'Class',
        subjectId: selectedSubjectId,
        subjectName: targetSubject?.subjectName || 'Subject',
        studentId: st.id,
        studentName: st.fullName,
        admissionNo: st.admissionNo,
        teacherId: teacher?.id || 'admin',
        teacherName: teacher?.fullName || 'Teacher',
        examType,
        sbaRawScores: sbaScores,
        sbaRawTotal: computed.sbaRawTotal,
        sbaRawMaxTotal: computed.sbaRawMaxTotal,
        sbaScaledScore: computed.sbaScaledScore,
        examRawScore,
        examRawMax: 100,
        examScaledScore: computed.examScaledScore,
        finalScore: computed.finalScore,
        percentage: computed.percentage,
        grade: computed.grade,
        gradePoint: computed.gradePoint,
        remark: computed.remark,
        isPass: computed.isPass,
        status: targetStatus,
        submittedBy: teacher?.fullName || 'Teacher',
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    try {
      await saveBatchScores(payload);
      const successText = targetStatus === 'SUBMITTED'
        ? 'Scores successfully submitted to School Administrator for review & approval!'
        : 'Scores draft saved successfully.';
      setMsg({
        type: 'success',
        text: successText
      });
      toast.success(successText);
      fetchExistingScores();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save scores batch.' });
      toast.error(err.message || 'Failed to save scores batch.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSingleStudent = async (studentIdToSave: string) => {
    const err = errorsMap[studentIdToSave];
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    const targetClass = classes.find(c => c.id === selectedClassId);
    const targetSubject = subjects.find(s => s.id === selectedSubjectId);
    const st = students.find(s => s.id === studentIdToSave);
    const entry = scoresMap[studentIdToSave] || {};
    const sbaScores = entry.sbaRawScores || { classTest: 0, classExercise: 0, projectWork: 0, groupWork: 0 };
    const examRawScore = entry.examRawScore || 0;

    const computed = computeCompleteScore({
      examType,
      sbaRawScores: sbaScores,
      examRawScore
    });

    const singlePayload: ScoreEntry = {
      id: entry.id || `score_${schoolId}_${selectedClassId}_${selectedSubjectId}_${studentIdToSave}_${examType}`,
      schoolId,
      academicYear,
      term,
      classId: selectedClassId,
      className: targetClass?.className || 'Class',
      subjectId: selectedSubjectId,
      subjectName: targetSubject?.subjectName || 'Subject',
      studentId: studentIdToSave,
      studentName: st?.fullName || 'Student',
      admissionNo: st?.admissionNo || '',
      teacherId: teacher?.id || 'admin',
      teacherName: teacher?.fullName || 'Teacher',
      examType,
      sbaRawScores: sbaScores,
      sbaRawTotal: computed.sbaRawTotal,
      sbaRawMaxTotal: computed.sbaRawMaxTotal,
      sbaScaledScore: computed.sbaScaledScore,
      examRawScore,
      examRawMax: 100,
      examScaledScore: computed.examScaledScore,
      finalScore: computed.finalScore,
      percentage: computed.percentage,
      grade: computed.grade,
      gradePoint: computed.gradePoint,
      remark: computed.remark,
      isPass: computed.isPass,
      status: 'DRAFT',
      submittedBy: teacher?.fullName || 'Teacher',
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveBatchScores([singlePayload]);
      toast.success(`Score record for ${st?.fullName} updated successfully.`);
      fetchExistingScores();
    } catch (error: any) {
      toast.error('Failed to update student score: ' + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs uppercase tracking-wider">Loading Score Entry Worksheets...</p>
      </div>
    );
  }

  const classStudents = students.filter(s => s.classId === selectedClassId);
  const currentSelectedStudent = classStudents.find(s => s.id === selectedStudentId) || classStudents[0];
  const currentStudentScore = currentSelectedStudent ? (scoresMap[currentSelectedStudent.id] || {}) : {};
  const currentStudentSba = currentStudentScore.sbaRawScores || { classTest: 0, classExercise: 0, projectWork: 0, groupWork: 0 };
  const currentStudentExam = currentStudentScore.examRawScore || 0;
  const currentStudentFinal = currentStudentScore.finalScore || 0;
  const currentStudentGrade = currentStudentScore.grade || 'F9';
  const currentStudentRemark = currentStudentScore.remark || 'FAIL';

  const currentStudentIndex = classStudents.findIndex(s => s.id === selectedStudentId);

  const goToPrevStudent = () => {
    if (currentStudentIndex > 0) {
      setSelectedStudentId(classStudents[currentStudentIndex - 1].id);
    }
  };

  const goToNextStudent = () => {
    if (currentStudentIndex < classStudents.length - 1) {
      setSelectedStudentId(classStudents[currentStudentIndex + 1].id);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Cascading Filter Selection Controls Card */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
                CASCADING ACADEMIC FILTERS
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {classStudents.length} Students Enrolled
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">Academic Score Entry Engine</h2>
            <p className="text-xs text-slate-400">
              Filter by Academic Year, Term, Class, and Subject to enter & inspect continuous assessments and exam marks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveBatch('DRAFT')}
              disabled={saving || (isLocked && !isSchoolAdmin)}
              className="px-3.5 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save All Drafts
            </button>
            <button
              onClick={() => handleSaveBatch('SUBMITTED')}
              disabled={saving || (isLocked && !isSchoolAdmin)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> {saving ? 'Submitting...' : 'Submit All Results'}
            </button>
          </div>
        </div>

        {/* 5-Step Cascading Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 text-xs">
          {/* Step 1: Academic Year */}
          <div className="bg-[#141724] p-2.5 rounded-xl border border-slate-800 space-y-1">
            <label className="block text-[10px] text-blue-400 font-bold uppercase tracking-wider">1. Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-[#0a0b10] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold text-xs focus:outline-none focus:border-blue-500"
              placeholder="e.g. 2026/2027"
            />
          </div>

          {/* Step 2: Term */}
          <div className="bg-[#141724] p-2.5 rounded-xl border border-slate-800 space-y-1">
            <label className="block text-[10px] text-blue-400 font-bold uppercase tracking-wider">2. Academic Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full bg-[#0a0b10] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-semibold text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          {/* Step 3: Class */}
          <div className="bg-[#141724] p-2.5 rounded-xl border border-slate-800 space-y-1">
            <label className="block text-[10px] text-blue-400 font-bold uppercase tracking-wider">3. Target Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-[#0a0b10] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-semibold text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </select>
          </div>

          {/* Step 4: Subject */}
          <div className="bg-[#141724] p-2.5 rounded-xl border border-slate-800 space-y-1">
            <label className="block text-[10px] text-blue-400 font-bold uppercase tracking-wider">4. Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-[#0a0b10] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-semibold text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subjectName}</option>
              ))}
            </select>
          </div>

          {/* Step 5: Exam Structure */}
          <div className="bg-[#141724] p-2.5 rounded-xl border border-slate-800 space-y-1">
            <label className="block text-[10px] text-blue-400 font-bold uppercase tracking-wider">5. Exam Structure</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
              className="w-full bg-[#0a0b10] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-semibold text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="END_OF_TERM">Term Exam (SBA 50% + Exam 50%)</option>
              <option value="MID_TERM">Mid-Term Exam (100% Score)</option>
              <option value="MOCK">Mock Exam (BECE Prep /100)</option>
            </select>
          </div>
        </div>

        {/* View Mode Switcher & Student Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Entry View:</span>
            <div className="flex items-center bg-[#161925] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setEntryMode('STUDENT_CARD')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  entryMode === 'STUDENT_CARD' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Student Record View
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('TABLE')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  entryMode === 'TABLE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Full Class Marksheet Table
              </button>
            </div>
          </div>

          {/* Enrolled Student Selector Dropdown */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            <label className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" /> Select Student:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setEntryMode('STUDENT_CARD');
              }}
              className="w-full sm:w-64 bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {classStudents.map(st => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.admissionNo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          <span>{msg.text}</span>
        </div>
      )}

      {isLocked && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-center gap-3">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            These results have been <strong>APPROVED / PUBLISHED / LOCKED</strong>. Teachers cannot modify locked marksheets. Contact the School Admin for controlled result corrections.
          </span>
        </div>
      )}

      {/* INDIVIDUAL STUDENT SCORE RECORD INSPECTOR / EDITOR */}
      {entryMode === 'STUDENT_CARD' && currentSelectedStudent && (
        <div className="bg-[#0f111a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-base shrink-0">
                {currentSelectedStudent.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">{currentSelectedStudent.fullName}</h3>
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full font-mono">
                    ADM: {currentSelectedStudent.admissionNo}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Student {currentStudentIndex + 1} of {classStudents.length} • {classes.find(c => c.id === selectedClassId)?.className} • Subject: <span className="text-white font-semibold">{subjects.find(s => s.id === selectedSubjectId)?.subjectName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={goToPrevStudent}
                disabled={currentStudentIndex <= 0}
                className="px-3 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                type="button"
                onClick={goToNextStudent}
                disabled={currentStudentIndex >= classStudents.length - 1}
                className="px-3 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-30 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleSaveSingleStudent(currentSelectedStudent.id)}
                disabled={saving || (isLocked && !isSchoolAdmin)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" /> Save Record
              </button>
            </div>
          </div>

          {/* Student Score Inputs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SBA continuous assessment card */}
            <div className="lg:col-span-2 bg-[#141724] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" /> SBA Continuous Assessment (Raw /60 → Scaled 50%)
                </h4>
                <span className="text-[11px] font-mono font-bold text-blue-400">
                  Raw: {currentStudentScore.sbaRawTotal || 0}/60 ({currentStudentScore.sbaScaledScore?.toFixed(1) || 0}%)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Class Test (/15)</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    disabled={isLocked && !isSchoolAdmin}
                    value={currentStudentSba.classTest ?? ''}
                    onChange={(e) => handleScoreChange(currentSelectedStudent.id, 'classTest', Number(e.target.value))}
                    className="w-full bg-[#0a0b10] border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-white font-bold text-sm outline-none text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Class Exercise (/15)</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    disabled={isLocked && !isSchoolAdmin}
                    value={currentStudentSba.classExercise ?? ''}
                    onChange={(e) => handleScoreChange(currentSelectedStudent.id, 'classExercise', Number(e.target.value))}
                    className="w-full bg-[#0a0b10] border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-white font-bold text-sm outline-none text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Project Work (/15)</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    disabled={isLocked && !isSchoolAdmin}
                    value={currentStudentSba.projectWork ?? ''}
                    onChange={(e) => handleScoreChange(currentSelectedStudent.id, 'projectWork', Number(e.target.value))}
                    className="w-full bg-[#0a0b10] border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-white font-bold text-sm outline-none text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Group Work (/15)</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    disabled={isLocked && !isSchoolAdmin}
                    value={currentStudentSba.groupWork ?? ''}
                    onChange={(e) => handleScoreChange(currentSelectedStudent.id, 'groupWork', Number(e.target.value))}
                    className="w-full bg-[#0a0b10] border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-white font-bold text-sm outline-none text-center"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* End of Term Exam Score */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      {examType === 'MOCK' ? 'Mock Exam Score (Raw /100)' : 'End-of-Term Exam Raw Mark (Raw /100 → Scaled 50%)'}
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Standard exam paper percentage or raw mark out of 100.
                    </p>
                  </div>
                  <div className="w-full sm:w-40">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={isLocked && !isSchoolAdmin}
                      value={currentStudentExam ?? ''}
                      onChange={(e) => handleScoreChange(currentSelectedStudent.id, 'examRawScore', Number(e.target.value))}
                      className="w-full bg-[#0a0b10] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white font-black text-base outline-none text-center"
                      placeholder="0 - 100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary Pill */}
            <div className="bg-[#141724] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" /> Computed Grade & Remark
                </h4>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-[#0a0b10] p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Final Score</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {currentStudentFinal.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-[#0a0b10] p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Letter Grade</span>
                    <span className="text-2xl font-black text-blue-400 font-mono">
                      {currentStudentGrade}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0a0b10] p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">GES Academic Remark</span>
                  <span className="font-bold text-white">{currentStudentRemark}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setEntryMode('TABLE')}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" /> Switch to Full Marksheet Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Score Entry Marksheet Table */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-[#161925]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-xs text-white">
              Class Marksheet ({classStudents.length} Enrolled Students)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {examType === 'MOCK' ? 'Direct Score Mode (Raw /100)' : 'GES Scaling Engine (SBA Raw/60*50 + Exam Raw/100*50)'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d0f18]">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Admission No</th>
                <th className="py-3 px-3">Student Name</th>

                {examType !== 'MOCK' && (
                  <>
                    <th className="py-3 px-2 text-center text-blue-300">Test /15</th>
                    <th className="py-3 px-2 text-center text-blue-300">Ex /15</th>
                    <th className="py-3 px-2 text-center text-blue-300">Proj /15</th>
                    <th className="py-3 px-2 text-center text-blue-300">Grp /15</th>
                    <th className="py-3 px-2 text-center bg-blue-900/20 text-blue-200">SBA Raw /60</th>
                    <th className="py-3 px-2 text-center bg-blue-900/40 text-blue-100 font-bold">SBA Scaled /50</th>
                    <th className="py-3 px-2 text-center text-indigo-300">Exam /100</th>
                    <th className="py-3 px-2 text-center bg-indigo-900/40 text-indigo-100 font-bold">Exam Scaled /50</th>
                  </>
                )}

                {examType === 'MOCK' && (
                  <th className="py-3 px-3 text-center text-indigo-300">Mock Score /100</th>
                )}

                <th className="py-3 px-3 text-center bg-emerald-950/40 text-emerald-300 font-bold">Final %</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-3">Remark</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {classStudents.map((st, idx) => {
                const entry = scoresMap[st.id] || {};
                const sbaScores = entry.sbaRawScores || { classTest: 0, classExercise: 0, projectWork: 0, groupWork: 0 };

                const sbaRawTotal = entry.sbaRawTotal || 0;
                const sbaScaledScore = entry.sbaScaledScore || 0;
                const examRawScore = entry.examRawScore || 0;
                const examScaledScore = entry.examScaledScore || 0;
                const finalScore = entry.finalScore || 0;
                const grade = entry.grade || 'F9';
                const remark = entry.remark || 'FAIL';
                const isSelected = selectedStudentId === st.id;

                return (
                  <tr
                    key={st.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-blue-600/10' : 'hover:bg-[#161925]/70'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{st.admissionNo}</td>
                    <td className="py-3 px-3 font-semibold text-white">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(st.id);
                          setEntryMode('STUDENT_CARD');
                        }}
                        className="hover:text-blue-400 text-left cursor-pointer transition-colors"
                      >
                        {st.fullName}
                      </button>
                    </td>

                    {examType !== 'MOCK' && (
                      <>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min={0}
                            max={15}
                            disabled={isLocked && !isSchoolAdmin}
                            value={sbaScores.classTest ?? ''}
                            onChange={(e) => handleScoreChange(st.id, 'classTest', Number(e.target.value))}
                            className="w-14 bg-[#161925] border border-slate-700 focus:border-blue-500 text-center text-white font-bold rounded-lg py-1 text-xs focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min={0}
                            max={15}
                            disabled={isLocked && !isSchoolAdmin}
                            value={sbaScores.classExercise ?? ''}
                            onChange={(e) => handleScoreChange(st.id, 'classExercise', Number(e.target.value))}
                            className="w-14 bg-[#161925] border border-slate-700 focus:border-blue-500 text-center text-white font-bold rounded-lg py-1 text-xs focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min={0}
                            max={15}
                            disabled={isLocked && !isSchoolAdmin}
                            value={sbaScores.projectWork ?? ''}
                            onChange={(e) => handleScoreChange(st.id, 'projectWork', Number(e.target.value))}
                            className="w-14 bg-[#161925] border border-slate-700 focus:border-blue-500 text-center text-white font-bold rounded-lg py-1 text-xs focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min={0}
                            max={15}
                            disabled={isLocked && !isSchoolAdmin}
                            value={sbaScores.groupWork ?? ''}
                            onChange={(e) => handleScoreChange(st.id, 'groupWork', Number(e.target.value))}
                            className="w-14 bg-[#161925] border border-slate-700 focus:border-blue-500 text-center text-white font-bold rounded-lg py-1 text-xs focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-2 text-center bg-blue-950/20 font-bold font-mono text-slate-300">
                          {sbaRawTotal}
                        </td>
                        <td className="py-3 px-2 text-center bg-blue-900/30 font-bold font-mono text-blue-300">
                          {sbaScaledScore.toFixed(2)}
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            disabled={isLocked && !isSchoolAdmin}
                            value={examRawScore ?? ''}
                            onChange={(e) => handleScoreChange(st.id, 'examRawScore', Number(e.target.value))}
                            className="w-16 bg-[#161925] border border-slate-700 focus:border-indigo-500 text-center text-white font-bold rounded-lg py-1 text-xs focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-2 text-center bg-indigo-900/30 font-bold font-mono text-indigo-300">
                          {examScaledScore.toFixed(2)}
                        </td>
                      </>
                    )}

                    {examType === 'MOCK' && (
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          disabled={isLocked && !isSchoolAdmin}
                          value={examRawScore ?? ''}
                          onChange={(e) => handleScoreChange(st.id, 'examRawScore', Number(e.target.value))}
                          className="w-20 bg-[#161925] border border-slate-700 focus:border-indigo-500 text-center text-white font-bold rounded-lg py-1 text-xs focus:outline-none"
                        />
                      </td>
                    )}

                    <td className="py-3 px-3 text-center bg-emerald-950/30 font-bold font-mono text-emerald-400 text-sm">
                      {finalScore.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] font-mono ${
                        grade.startsWith('A') || grade.startsWith('B')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : grade.startsWith('C') || grade.startsWith('D')
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {grade}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-300 font-semibold text-[11px]">
                      {remark}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(st.id);
                          setEntryMode('STUDENT_CARD');
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
