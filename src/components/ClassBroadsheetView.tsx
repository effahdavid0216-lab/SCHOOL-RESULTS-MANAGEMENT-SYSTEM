import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Award,
  BookOpen,
  Filter,
  School as SchoolIcon,
  Search,
  ChevronDown,
  User,
  Sparkles
} from 'lucide-react';
import {
  ClassItem,
  SubjectItem,
  Student,
  ScoreEntry,
  School,
  SchoolSettings,
  ExamType
} from '../types';
import {
  getClassesBySchool,
  getSubjectsBySchool,
  getStudentsBySchool,
  getScoresByQuery,
  getSchoolDetails,
  getSchoolSettings
} from '../lib/services';
import { calculateRankings, formatOrdinalRank } from '../lib/academicEngine';
import { Button, Badge, Input, Select, PageHeader } from './ui';

interface Props {
  schoolId: string;
}

export const ClassBroadsheetView: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('Term 1');
  const [examContextType, setExamContextType] = useState<string>('END_OF_TERM'); // 'END_OF_TERM', 'MID_TERM', 'MOCK_1', 'MOCK_2', 'MOCK_3', 'MOCK_4', 'MOCK_5'

  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedClassId) {
      loadBroadsheetScores();
    }
  }, [selectedClassId, academicYear, term, examContextType]);

  const loadData = async () => {
    setLoading(true);
    const [cList, subList, stList, sch, setts] = await Promise.all([
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId),
      getStudentsBySchool(schoolId),
      getSchoolDetails(schoolId),
      getSchoolSettings(schoolId)
    ]);

    setClasses(cList);
    setSubjects(subList);
    setStudents(stList);
    setSchool(sch);
    setSettings(setts);

    if (cList.length > 0) setSelectedClassId(cList[0].id);
    setLoading(false);
  };

  const loadBroadsheetScores = async () => {
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

    const fetched = await getScoresByQuery({
      schoolId,
      classId: selectedClassId,
      academicYear,
      term: resolvedExamType === 'MOCK' ? undefined : term,
      examType: resolvedExamType,
      mockNumber: resolvedMockNumber
    });
    setScores(fetched);
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const classStudents = students.filter((st) => st.classId === selectedClassId);
  const classSubjects = subjects.filter(
    (sub) => !sub.classIds || sub.classIds.length === 0 || sub.classIds.includes(selectedClassId)
  );

  // Build Broadsheet Data Rows with Ranking
  const rawStudentRows = classStudents.map((st) => {
    const studentScores = scores.filter((sc) => sc.studentId === st.id);
    let totalScore = 0;
    let count = 0;

    const subjectMap: { [subjectId: string]: ScoreEntry } = {};
    studentScores.forEach((sc) => {
      subjectMap[sc.subjectId] = sc;
      if (typeof sc.finalScore === 'number' && !isNaN(sc.finalScore)) {
        totalScore += sc.finalScore;
        count++;
      }
    });

    const averageScore = count > 0 ? totalScore / count : 0;

    return {
      student: st,
      subjectMap,
      totalScore,
      averageScore,
      subjectsCount: count
    };
  });

  interface BroadsheetRow {
    student: Student;
    subjectMap: { [subjectId: string]: ScoreEntry };
    totalScore: number;
    averageScore: number;
    subjectsCount: number;
  }

  const rankedRows = calculateRankings<BroadsheetRow>(rawStudentRows, (r) => r.totalScore);

  const filteredRankedRows = rankedRows.filter(
    (row) =>
      row.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = `BROADSHEET - ${school?.name || 'School'},Class: ${currentClass?.className},Year: ${academicYear},Term: ${term}\n\n`;
    csv +=
      `Rank,Admission No,Student Name,` +
      classSubjects.map((s) => s.subjectName).join(',') +
      `,Total Score,Average Score\n`;

    rankedRows.forEach((row) => {
      const line = [
        formatOrdinalRank(row.rank),
        `"${row.student.admissionNo}"`,
        `"${row.student.fullName}"`,
        ...classSubjects.map((s) => {
          const sc = row.subjectMap[s.id];
          return sc ? sc.finalScore.toFixed(1) : '-';
        }),
        row.totalScore.toFixed(2),
        row.averageScore.toFixed(2)
      ].join(',');
      csv += line + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Broadsheet_${currentClass?.className}_${academicYear}_${term}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold tracking-wide">Compiling Academic Broadsheet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="print:hidden space-y-4">
        <PageHeader
          title="Results Broadsheet"
          subtitle="Master academic performance ledger with rank sorting, subject totals, averages, and instant CSV export."
          badge={<Badge variant="active" label="Verified Ledger" icon={<Sparkles className="w-3 h-3" />} />}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
              >
                Print / Export PDF
              </Button>
            </>
          }
        />

        {/* Filter Toolbar / Results Control Center */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          <div>
            <Input
              label="1. Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2026/2027"
            />
          </div>

          <div>
            <Select
              label="2. Academic Term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              disabled={examContextType.startsWith('MOCK_')}
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </Select>
          </div>

          <div>
            <Select
              label="3. Examination Type"
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

          <div>
            <Select
              label="4. Target Class"
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
              label="Search Student"
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name or ID..."
            />
          </div>
        </div>
      </div>

      {/* Responsive Mobile Cards Fallback (shown on small screens) */}
      <div className="block md:hidden space-y-3.5 print:hidden">
        {filteredRankedRows.map((row) => (
          <div
            key={row.student.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-xs">
                  {formatOrdinalRank(row.rank)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {row.student.fullName}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">{row.student.admissionNo}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {row.averageScore.toFixed(1)}%
                </span>
                <span className="block text-[10px] text-slate-400 uppercase">Avg</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {classSubjects.map((sub) => {
                const sc = row.subjectMap[sub.id];
                return (
                  <div key={sub.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-[10px] font-semibold text-slate-500 truncate">{sub.subjectName}</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {sc ? `${sc.finalScore.toFixed(0)} (${sc.grade})` : '-'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Main Desktop & Printable Landscape Broadsheet Matrix */}
      <div className="hidden md:block bg-white dark:bg-slate-900 print:bg-white print:text-black p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 print:border-none shadow-sm space-y-6">
        {/* Letterhead */}
        <div className="text-center border-b border-slate-200 dark:border-slate-800 print:border-black/20 pb-5 space-y-1">
          <h2 className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white print:text-black">
            {school?.name || 'ACHIMOTA ACADEMY'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 print:text-black/70">
            {school?.address} • {school?.district}, {school?.region}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 print:text-black">
            <span>CLASS: <strong>{currentClass?.className}</strong></span>
            <span>•</span>
            <span>YEAR: <strong>{academicYear}</strong></span>
            <span>•</span>
            <span>PERIOD: <strong>{term}</strong></span>
            <span>•</span>
            <span>TOTAL ENROLLED: <strong>{classStudents.length} Students</strong></span>
          </div>
        </div>

        {/* Clean Borderless Table with Sticky Header & Row Hover */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-center w-12">Pos</th>
                <th className="px-4 py-3 w-32">Admission No</th>
                <th className="px-4 py-3 min-w-[160px]">Student Name</th>

                {classSubjects.map((sub) => (
                  <th key={sub.id} className="px-3 py-3 text-center font-bold min-w-[85px]">
                    {sub.subjectName}
                  </th>
                ))}

                <th className="px-4 py-3 text-center bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold min-w-[80px]">
                  Total
                </th>
                <th className="px-4 py-3 text-center bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold min-w-[80px]">
                  Average
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRankedRows.map((row) => (
                <tr
                  key={row.student.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatOrdinalRank(row.rank)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">
                    {row.student.admissionNo}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {row.student.fullName}
                  </td>

                  {classSubjects.map((sub) => {
                    const sc = row.subjectMap[sub.id];
                    return (
                      <td key={sub.id} className="px-3 py-3 text-center font-mono">
                        {sc ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {sc.finalScore.toFixed(1)}
                            </span>
                            <span className="text-[9px] text-slate-400 font-sans block font-semibold">
                              {sc.grade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-4 py-3 text-center font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20">
                    {row.totalScore.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                    {row.averageScore.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="pt-6 grid grid-cols-2 gap-12 text-xs border-t border-slate-200 dark:border-slate-800 print:border-black/20">
          <div className="space-y-4">
            <p className="text-slate-500 dark:text-slate-400">Class Teacher Signature & Date:</p>
            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-48"></div>
            <p className="font-bold text-slate-900 dark:text-white">
              {currentClass?.classTeacherName || 'Class Teacher'}
            </p>
          </div>

          <div className="space-y-4 text-right">
            <p className="text-slate-500 dark:text-slate-400">Headmaster Signature & Stamp:</p>
            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-48 ml-auto"></div>
            <p className="font-bold text-slate-900 dark:text-white">
              {settings?.headmasterName || 'Headmaster'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
