import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  School as SchoolIcon,
  User,
  BookOpen,
  Award,
  CheckCircle,
  Calendar,
  RefreshCw,
  Search,
  MessageCircle,
  Share2
} from 'lucide-react';
import {
  Student,
  ScoreEntry,
  School,
  SchoolSettings,
  ClassItem,
  ExamType
} from '../types';
import {
  getStudentsBySchool,
  getScoresByQuery,
  getSchoolDetails,
  getSchoolSettings,
  getClassesBySchool,
  getTermAttendanceSummary
} from '../lib/services';
import { calculateRankings, formatOrdinalRank } from '../lib/academicEngine';
import { printStudentReportCard } from '../lib/printService';

interface Props {
  schoolId: string;
  studentId?: string;
  isStudentPortal?: boolean;
}

export const StudentReportCardView: React.FC<Props> = ({
  schoolId,
  studentId,
  isStudentPortal = false
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(studentId || '');
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('Term 1');
  const [examTypeContext, setExamTypeContext] = useState<string>('END_OF_TERM'); // 'END_OF_TERM', 'MID_TERM', 'MOCK_1', 'MOCK_2', 'MOCK_3'

  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Editable comments for preview
  const [conduct, setConduct] = useState<string>('Respectful, diligent, and obeys school regulations.');
  const [teacherComment, setTeacherComment] = useState<string>('An excellent academic performance. Keep up the high standard!');
  const [headmasterComment, setHeadmasterComment] = useState<string>('Promoted with distinction. Excellent effort!');
  const [daysPresent, setDaysPresent] = useState<number>(60);
  const [totalDays, setTotalDays] = useState<number>(62);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedClassId && selectedStudentId) {
      loadReportData();
    }
  }, [selectedClassId, selectedStudentId, academicYear, term]);

  const loadData = async () => {
    setLoading(true);
    const [stList, cList, sch, setts] = await Promise.all([
      getStudentsBySchool(schoolId),
      getClassesBySchool(schoolId),
      getSchoolDetails(schoolId),
      getSchoolSettings(schoolId)
    ]);

    setStudents(stList);
    setClasses(cList);
    setSchool(sch);
    setSettings(setts);

    if (cList.length > 0) setSelectedClassId(cList[0].id);
    if (studentId) {
      setSelectedStudentId(studentId);
    } else if (stList.length > 0) {
      setSelectedStudentId(stList[0].id);
    }

    setLoading(false);
  };

  const loadReportData = async () => {
    let resolvedExamType: ExamType = 'END_OF_TERM';
    let resolvedMockNumber: number | undefined = undefined;

    if (examTypeContext === 'MID_TERM') {
      resolvedExamType = 'MID_TERM';
    } else if (examTypeContext.startsWith('MOCK_')) {
      resolvedExamType = 'MOCK';
      resolvedMockNumber = parseInt(examTypeContext.replace('MOCK_', ''), 10) || 1;
    } else {
      resolvedExamType = 'END_OF_TERM';
    }

    const [fetchedScores, termAtt] = await Promise.all([
      getScoresByQuery({
        schoolId,
        classId: selectedClassId,
        academicYear,
        term: resolvedExamType === 'MOCK' ? undefined : term,
        examType: resolvedExamType,
        mockNumber: resolvedMockNumber
      }),
      getTermAttendanceSummary(schoolId, academicYear, term, selectedClassId)
    ]);
    setScores(fetchedScores);

    if (termAtt && termAtt.students && termAtt.students.length > 0) {
      const studentAtt = termAtt.students.find(s => s.studentId === selectedStudentId);
      if (studentAtt) {
        setDaysPresent(studentAtt.studentTotalAttendanceDays);
        setTotalDays(studentAtt.totalSchoolAttendanceDays);
        if (studentAtt.remark) {
          setConduct(studentAtt.remark);
        }
      } else if (termAtt.defaultTotalSchoolDays) {
        setTotalDays(termAtt.defaultTotalSchoolDays);
      }
    }
  };

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const currentClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => s.classId === selectedClassId);

  // Filter student results
  const studentScores = scores.filter(sc => sc.studentId === selectedStudentId);

  // Compute Overall Position in Class
  interface StudentTotalMap {
    studentId: string;
    tot: number;
    avg: number;
  }

  const studentTotalsMap: StudentTotalMap[] = classStudents.map(st => {
    const stScores = scores.filter(sc => sc.studentId === st.id);
    const tot = stScores.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
    const avg = stScores.length > 0 ? tot / stScores.length : 0;
    return { studentId: st.id, tot, avg };
  });

  const rankedStudents = calculateRankings<StudentTotalMap>(studentTotalsMap, s => s.tot);
  const currentStudentRank = rankedStudents.find(r => r.studentId === selectedStudentId);

  const totalScore = studentScores.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
  const averageScore = studentScores.length > 0 ? totalScore / studentScores.length : 0;

  const handlePrint = () => {
    printStudentReportCard(
      currentStudent?.fullName || 'Student',
      currentClass?.className || 'Class',
      term,
      academicYear
    );
  };

  const handleWhatsAppShare = () => {
    if (!currentStudent) return;
    const studentName = currentStudent.fullName;
    const parentPhone = currentStudent.parentContact || '';
    const cleanPhone = parentPhone.replace(/[^0-9]/g, '');

    const summaryText = `*OFFICIAL TERMINAL REPORT CARD SUMMARY*\n` +
      `School: ${school?.name || 'School'}\n` +
      `Student: ${studentName} (${currentStudent.admissionNo})\n` +
      `Class: ${currentClass?.className || 'Class'}\n` +
      `Academic Year: ${academicYear} - ${term}\n` +
      `Position: ${currentStudentRank ? formatOrdinalRank(currentStudentRank.rank) : '-'}/${classStudents.length}\n` +
      `Average Score: ${averageScore.toFixed(1)}%\n` +
      `Attendance: ${daysPresent}/${totalDays} Days\n\n` +
      `*Subject Performance:*\n` +
      studentScores.map(s => `• ${s.subjectName}: ${s.finalScore.toFixed(1)}% (Grade ${s.grade})`).join('\n') +
      `\n\nHeadmaster Remark: ${headmasterComment}`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(summaryText)}`
      : `https://wa.me/?text=${encodeURIComponent(summaryText)}`;

    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs uppercase tracking-wider">Loading Student Report Card Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Controls Banner (Hidden during Print) */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              ACADEMIC REPORT CARD GENERATOR
            </span>
            <h2 className="text-xl font-light text-white serif italic mt-1">Official Student Terminal Report</h2>
            <p className="text-xs text-slate-400">
              High-precision A4 printable report card with school seal, headmaster signature, subject performance, and conduct comments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Share on WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Cascading Selection Controls: Academic Year -> Term -> Exam Type -> Class -> Student */}
        {!isStudentPortal && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">1. Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">2. Academic Term</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                disabled={examTypeContext.startsWith('MOCK_')}
                className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">3. Report Type</label>
              <select
                value={examTypeContext}
                onChange={(e) => setExamTypeContext(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="END_OF_TERM">End-of-Term Report</option>
                <option value="MID_TERM">Mid-Term Assessment</option>
                <option value="MOCK_1">Mock 1 Examination</option>
                <option value="MOCK_2">Mock 2 Examination</option>
                <option value="MOCK_3">Mock 3 Examination</option>
                <option value="MOCK_4">Mock 4 Examination</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">4. Target Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  const newClassId = e.target.value;
                  setSelectedClassId(newClassId);
                  const matchingStudents = students.filter(s => s.classId === newClassId);
                  if (matchingStudents.length > 0) {
                    setSelectedStudentId(matchingStudents[0].id);
                  } else {
                    setSelectedStudentId('');
                  }
                }}
                className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.className}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                5. Student ({classStudents.length})
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
              >
                {classStudents.length === 0 ? (
                  <option value="">No students in class</option>
                ) : (
                  classStudents.map(st => (
                    <option key={st.id} value={st.id}>{st.fullName} ({st.admissionNo})</option>
                  ))
                )}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Printable Report Card Sheet Canvas */}
      <div className="bg-[#0f111a] print:bg-white print:text-black p-8 sm:p-12 print:p-4 rounded-2xl border border-slate-800 print:border-none shadow-2xl max-w-4xl mx-auto space-y-6 print:space-y-3 text-xs font-sans one-page-report">
        {/* School Header */}
        <div className="flex items-center justify-between border-b-2 border-blue-600 print:border-black pb-6">
          <div className="flex items-center gap-4">
            {school?.logoUrl ? (
              <img src={school.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover bg-[#161925] print:bg-transparent" />
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                <SchoolIcon className="w-8 h-8" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-white print:text-black leading-tight">
                {school?.name || 'ACHIMOTA ACADEMY'}
              </h1>
              <p className="text-xs text-slate-400 print:text-black/70 italic">
                {school?.address} • {school?.district}, {school?.region} • {school?.phone}
              </p>
              <p className="text-[10px] text-blue-400 print:text-black font-semibold uppercase tracking-widest mt-1">
                MOTTO: "{school?.motto || 'EXCELLENCE AND INTEGRITY'}"
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded text-[10px] uppercase tracking-wider block">
              TERMINAL REPORT
            </span>
            <p className="text-[10px] text-slate-400 print:text-black font-mono">
              YEAR: {academicYear} • {term}
            </p>
          </div>
        </div>

        {/* Student & Academic Summary Block */}
        <div className="grid grid-cols-2 gap-4 bg-[#161925] print:bg-gray-100 p-4 rounded-xl border border-slate-800 print:border-black/20">
          <div className="space-y-1">
            <p className="text-slate-400 print:text-black/70 text-[10px] uppercase font-bold">STUDENT FULL NAME:</p>
            <p className="text-sm font-bold text-white print:text-black">{currentStudent?.fullName || 'Student Name'}</p>
            <p className="text-slate-400 print:text-black/70">Admission No: <strong className="text-white print:text-black font-mono">{currentStudent?.admissionNo}</strong></p>
            <p className="text-slate-400 print:text-black/70">Gender: <strong className="text-white print:text-black">{currentStudent?.gender}</strong></p>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-slate-400 print:text-black/70 text-[10px] uppercase font-bold">CLASS PERFORMANCE SUMMARY:</p>
            <p className="text-slate-400 print:text-black/70">Enrolled Class: <strong className="text-white print:text-black">{currentClass?.className}</strong></p>
            <p className="text-slate-400 print:text-black/70">Position in Class: <strong className="text-blue-400 print:text-black font-bold font-mono">{currentStudentRank ? formatOrdinalRank(currentStudentRank.rank) : '-'}</strong> out of <strong>{classStudents.length}</strong></p>
            <p className="text-slate-400 print:text-black/70">Overall Class Average: <strong className="text-emerald-400 print:text-black font-bold font-mono">{averageScore.toFixed(1)}%</strong></p>
          </div>
        </div>

        {/* Subject Results Breakdown Table */}
        <div className="space-y-2">
          <h3 className="font-bold text-white print:text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-400 print:text-black" /> Academic Performance Details
          </h3>

          <table className="w-full text-left border-collapse border border-slate-800 print:border-black/30">
            <thead>
              <tr className="bg-[#161925] print:bg-gray-200 text-slate-300 print:text-black uppercase text-[10px] tracking-wider border-b border-slate-800 print:border-black/30">
                <th className="p-2 border-r border-slate-800 print:border-black/20">Subject Name</th>
                <th className="p-2 border-r border-slate-800 print:border-black/20 text-center">SBA Scaled /50</th>
                <th className="p-2 border-r border-slate-800 print:border-black/20 text-center">Exam Scaled /50</th>
                <th className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold">Total /100</th>
                <th className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold">Grade</th>
                <th className="p-2 text-left">Teacher Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-black/20">
              {studentScores.map((sc) => (
                <tr key={sc.id} className="hover:bg-[#161925]/50 print:hover:bg-transparent">
                  <td className="p-2 border-r border-slate-800 print:border-black/20 font-semibold text-white print:text-black">{sc.subjectName}</td>
                  <td className="p-2 border-r border-slate-800 print:border-black/20 text-center font-mono text-slate-300 print:text-black">{sc.sbaScaledScore.toFixed(1)}</td>
                  <td className="p-2 border-r border-slate-800 print:border-black/20 text-center font-mono text-slate-300 print:text-black">{sc.examScaledScore.toFixed(1)}</td>
                  <td className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold font-mono text-emerald-400 print:text-black">{sc.finalScore.toFixed(1)}</td>
                  <td className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold font-mono text-white print:text-black">{sc.grade}</td>
                  <td className="p-2 text-slate-300 print:text-black">{sc.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Attendance & Assessment Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#161925] print:bg-gray-100 p-3 rounded-xl border border-slate-800 print:border-black/20 text-center">
          <div>
            <span className="text-[9px] text-slate-400 print:text-black/70 font-bold uppercase block">Total School Days</span>
            <span className="font-bold text-white print:text-black font-mono">{totalDays} Days</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 print:text-black/70 font-bold uppercase block">Days Present</span>
            <span className="font-bold text-emerald-400 print:text-black font-mono">{daysPresent} Days</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 print:text-black/70 font-bold uppercase block">Attendance Rate</span>
            <span className="font-bold text-blue-400 print:text-black font-mono">{((daysPresent / totalDays) * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 print:text-black/70 font-bold uppercase block">Next Term Opens</span>
            <span className="font-bold text-white print:text-black font-mono">12 Jan 2027</span>
          </div>
        </div>

        {/* Remarks & Signatures Section */}
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-[#161925] print:bg-gray-100 rounded-xl border border-slate-800 print:border-black/20">
            <p className="font-bold text-[10px] text-slate-400 print:text-black/70 uppercase">CLASS TEACHER'S REMARKS:</p>
            <p className="text-white print:text-black italic">{teacherComment}</p>
          </div>

          <div className="p-3 bg-[#161925] print:bg-gray-100 rounded-xl border border-slate-800 print:border-black/20">
            <p className="font-bold text-[10px] text-slate-400 print:text-black/70 uppercase">HEADMASTER'S REMARKS & PROMOTION STATUS:</p>
            <p className="text-white print:text-black italic">{headmasterComment}</p>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-12 text-xs">
            <div className="space-y-4">
              <p className="text-slate-400 print:text-black/70">Class Teacher Signature:</p>
              <div className="border-b border-dashed border-slate-700 print:border-black/40 w-48"></div>
              <p className="font-semibold text-white print:text-black">{currentClass?.classTeacherName || 'Class Teacher'}</p>
            </div>

            <div className="space-y-4 text-right">
              <p className="text-slate-400 print:text-black/70">Headmaster Signature & School Seal:</p>
              {settings?.headmasterSignatureUrl ? (
                <div className="h-10 flex justify-end items-center">
                  <img src={settings.headmasterSignatureUrl} alt="Signature" className="h-10 object-contain max-w-[150px]" />
                </div>
              ) : (
                <div className="border-b border-dashed border-slate-700 print:border-black/40 w-48 ml-auto"></div>
              )}
              <p className="font-semibold text-white print:text-black">{settings?.headmasterName || 'Rev. Dr. Emmanuel Owusu'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
