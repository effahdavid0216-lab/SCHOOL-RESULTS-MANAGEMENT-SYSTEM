import React, { useState, useEffect } from 'react';
import {
  Printer,
  Users,
  RefreshCw,
  CheckCircle,
  FileText,
  Sparkles,
  School as SchoolIcon
} from 'lucide-react';
import {
  ClassItem,
  Student,
  ScoreEntry,
  School,
  SchoolSettings,
  ExamType,
  TermAttendanceSummary
} from '../types';
import {
  getClassesBySchool,
  getStudentsBySchool,
  getScoresByQuery,
  getSchoolDetails,
  getSchoolSettings,
  getTermAttendanceSummary
} from '../lib/services';
import { calculateRankings, formatOrdinalRank } from '../lib/academicEngine';
import { printBulkReportCards } from '../lib/printService';
import { PageHeader, Badge, Button, Select, Input } from './ui';

interface Props {
  schoolId: string;
}

export const BulkReportGenerator: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('Term 1');
  const [examContextType, setExamContextType] = useState<string>('END_OF_TERM');

  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [termAttendance, setTermAttendance] = useState<TermAttendanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedClassId) {
      loadBatchScores();
    }
  }, [selectedClassId, academicYear, term, examContextType]);

  const loadData = async () => {
    setLoading(true);
    const [cList, stList, sch, setts] = await Promise.all([
      getClassesBySchool(schoolId),
      getStudentsBySchool(schoolId),
      getSchoolDetails(schoolId),
      getSchoolSettings(schoolId)
    ]);

    setClasses(cList);
    setStudents(stList);
    setSchool(sch);
    setSettings(setts);

    if (setts?.currentAcademicYear) setAcademicYear(setts.currentAcademicYear);
    if (setts?.currentTerm) setTerm(setts.currentTerm);
    if (cList.length > 0) setSelectedClassId(cList[0].id);
    setLoading(false);
  };

  const loadBatchScores = async () => {
    let resolvedExamType: ExamType = 'END_OF_TERM';
    let resolvedMockNumber: number | undefined = undefined;

    if (examContextType === 'MID_TERM') {
      resolvedExamType = 'MID_TERM';
    } else if (examContextType.startsWith('MOCK_')) {
      resolvedExamType = 'MOCK';
      resolvedMockNumber = parseInt(examContextType.replace('MOCK_', ''), 10) || 1;
    } else {
      resolvedExamType = 'END_OF_TERM';
    }

    const [fetched, termAtt] = await Promise.all([
      getScoresByQuery({
        schoolId,
        classId: selectedClassId,
        academicYear,
        term,
        examType: resolvedExamType,
        mockNumber: resolvedMockNumber
      }),
      getTermAttendanceSummary(schoolId, academicYear, term, selectedClassId)
    ]);
    setScores(fetched);
    setTermAttendance(termAtt);
  };

  const classStudents = students.filter((s) => s.classId === selectedClassId);
  const currentClass = classes.find((c) => c.id === selectedClassId);

  // Rankings
  interface StudentTotal {
    studentId: string;
    tot: number;
    avg: number;
  }

  const studentTotalsMap: StudentTotal[] = classStudents.map((st) => {
    const stScores = scores.filter((sc) => sc.studentId === st.id);
    const tot = stScores.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
    const avg = stScores.length > 0 ? tot / stScores.length : 0;
    return { studentId: st.id, tot, avg };
  });

  const rankedStudents = calculateRankings<StudentTotal>(studentTotalsMap, (s) => s.tot);

  const handleBulkPrint = () => {
    printBulkReportCards(
      currentClass?.className || 'Class',
      term,
      academicYear
    );
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-xs uppercase font-bold tracking-wider">Generating Class Batch Reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Top Banner Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Badge variant="active" label="Batch Report Print Engine" icon={<Sparkles className="w-3 h-3" />} />
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Bulk Class Terminal Report Cards</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate and print official terminal report cards for all enrolled students in a class with automatic page-breaks.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleBulkPrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Bulk Print All Reports ({classStudents.length})
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div>
            <Select
              label="1. Target Class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              label="2. Academic Year"
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </div>

          <div>
            <Select
              label="3. Term / Period"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </Select>
          </div>

          <div>
            <Select
              label="4. Exam Report Type"
              value={examContextType}
              onChange={(e) => setExamContextType(e.target.value)}
            >
              <option value="END_OF_TERM">End-of-Term Examination</option>
              <option value="MID_TERM">Mid-Term Assessment</option>
              <option value="MOCK_1">Mock 1 Examination</option>
              <option value="MOCK_2">Mock 2 Examination</option>
              <option value="MOCK_3">Mock 3 Examination</option>
              <option value="MOCK_4">Mock 4 Examination</option>
              <option value="MOCK_5">Mock 5 Examination</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Batch Cards Stack */}
      <div className="space-y-12">
        {classStudents.map((st) => {
          const stScores = scores.filter((sc) => sc.studentId === st.id);
          const stRank = rankedStudents.find((r) => r.studentId === st.id);
          const totalScore = stScores.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
          const averageScore = stScores.length > 0 ? totalScore / stScores.length : 0;

          return (
            <div
              key={st.id}
              className="bg-white dark:bg-slate-900 print:bg-white print:text-black p-8 sm:p-10 print:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 print:border-none shadow-xs max-w-4xl mx-auto space-y-6 print:space-y-3 text-xs font-sans page-break-after one-page-report"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-indigo-600 print:border-black pb-4">
                <div className="flex items-center gap-3">
                  {school?.logoUrl ? (
                    <img
                      src={school.logoUrl}
                      alt="Logo"
                      className="w-12 h-12 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 print:border-black/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                      <SchoolIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
                      {school?.name || 'ACHIMOTA ACADEMY'}
                    </h1>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black/70 italic">
                      {school?.address} • {school?.district}, {school?.region}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-bold rounded text-[9px] uppercase tracking-wider">
                    {examContextType.replace('_', ' ')} REPORT
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black font-mono mt-1">
                    YEAR: {academicYear} • {term}
                  </p>
                </div>
              </div>

              {/* Student Summary */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 print:bg-gray-100 p-3 rounded-xl border border-slate-200 dark:border-slate-700 print:border-black/20">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 print:text-black/70">
                    STUDENT NAME: <strong className="text-slate-900 dark:text-white print:text-black">{st.fullName}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black/70">
                    Admission No: <strong className="text-slate-900 dark:text-white print:text-black font-mono">{st.admissionNo}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 print:text-black/70">
                    CLASS: <strong className="text-slate-900 dark:text-white print:text-black">{currentClass?.className}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black/70">
                    POSITION: <strong className="text-indigo-600 dark:text-indigo-400 print:text-black font-bold font-mono">{stRank ? formatOrdinalRank(stRank.rank) : '-'}</strong> out of <strong>{classStudents.length}</strong>
                  </p>
                </div>
              </div>

              {/* Results Table */}
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 print:border-black/30 text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 print:bg-gray-200 text-slate-700 dark:text-slate-300 print:text-black uppercase text-[10px] border-b border-slate-200 dark:border-slate-800 print:border-black/30">
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20">Subject</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center">SBA /50</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center">Exam /50</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-bold">Total /100</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-bold">Grade</th>
                    <th className="p-2 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black/20">
                  {stScores.map((sc) => (
                    <tr key={sc.id}>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 font-semibold text-slate-900 dark:text-white print:text-black">
                        {sc.subjectName}
                      </td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-mono">
                        {sc.sbaScaledScore.toFixed(1)}
                      </td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-mono">
                        {sc.examScaledScore.toFixed(1)}
                      </td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 print:text-black">
                        {sc.finalScore.toFixed(1)}
                      </td>
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-bold font-mono text-slate-900 dark:text-white print:text-black">
                        {sc.grade}
                      </td>
                      <td className="p-2 text-slate-600 dark:text-slate-400 print:text-black">{sc.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Attendance & Conduct Block */}
              {(() => {
                const stAtt = termAttendance?.students?.find((a) => a.studentId === st.id);
                const daysPresent = stAtt ? stAtt.studentTotalAttendanceDays : 0;
                const totalDays = stAtt ? stAtt.totalSchoolAttendanceDays : termAttendance?.defaultTotalSchoolDays || 60;
                const pct = totalDays > 0 ? ((daysPresent / totalDays) * 100).toFixed(1) : '0.0';
                return (
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 print:bg-gray-100 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 print:border-black/20 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black/70 block uppercase font-bold">
                        Total School Days
                      </span>
                      <strong className="text-slate-900 dark:text-white print:text-black font-mono">{totalDays} Days</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black/70 block uppercase font-bold">
                        Days Attended
                      </span>
                      <strong className="text-slate-900 dark:text-white print:text-black font-mono">{daysPresent} Days</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black/70 block uppercase font-bold">
                        Attendance Rate
                      </span>
                      <strong className="text-emerald-600 dark:text-emerald-400 print:text-black font-mono font-bold">{pct}%</strong>
                    </div>
                  </div>
                );
              })()}

              {/* Footer Remarks */}
              <div className="pt-4 grid grid-cols-2 gap-8 text-xs border-t border-slate-200 dark:border-slate-800 print:border-black/20">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 print:text-black/70">Class Teacher Signature:</p>
                  <div className="border-b border-dashed border-slate-300 dark:border-slate-700 print:border-black/40 w-36 mt-4"></div>
                  <p className="font-semibold text-slate-900 dark:text-white print:text-black mt-1">
                    {currentClass?.classTeacherName || 'Class Teacher'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 dark:text-slate-400 print:text-black/70">Headmaster Signature:</p>
                  <div className="border-b border-dashed border-slate-300 dark:border-slate-700 print:border-black/40 w-36 ml-auto mt-4"></div>
                  <p className="font-semibold text-slate-900 dark:text-white print:text-black mt-1">
                    {settings?.headmasterName || 'Headmaster'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
