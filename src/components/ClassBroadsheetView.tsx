import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Award,
  BookOpen,
  Filter,
  School as SchoolIcon
} from 'lucide-react';
import {
  ClassItem,
  SubjectItem,
  Student,
  ScoreEntry,
  School,
  SchoolSettings
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

  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedClassId) {
      loadBroadsheetScores();
    }
  }, [selectedClassId, academicYear, term]);

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
    const fetched = await getScoresByQuery({
      schoolId,
      classId: selectedClassId,
      academicYear,
      term
    });
    setScores(fetched);
  };

  const currentClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(st => st.classId === selectedClassId);
  const classSubjects = subjects.filter(sub => !sub.classIds || sub.classIds.length === 0 || sub.classIds.includes(selectedClassId));

  // Build Broadsheet Data Rows with Ranking
  const rawStudentRows = classStudents.map(st => {
    const studentScores = scores.filter(sc => sc.studentId === st.id);
    let totalScore = 0;
    let count = 0;

    const subjectMap: { [subjectId: string]: ScoreEntry } = {};
    studentScores.forEach(sc => {
      subjectMap[sc.subjectId] = sc;
      totalScore += sc.finalScore || 0;
      count += 1;
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

  // Rank students descending by totalScore
  interface BroadsheetRow {
    student: Student;
    subjectMap: { [subjectId: string]: ScoreEntry };
    totalScore: number;
    averageScore: number;
    subjectsCount: number;
  }

  const rankedRows = calculateRankings<BroadsheetRow>(rawStudentRows, r => r.totalScore);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = `BROADSHEET - ${school?.name || 'School'},Class: ${currentClass?.className},Year: ${academicYear},Term: ${term}\n\n`;
    csv += `Rank,Admission No,Student Name,` + classSubjects.map(s => s.subjectName).join(',') + `,Total Score,Average Score\n`;

    rankedRows.forEach(row => {
      const line = [
        formatOrdinalRank(row.rank),
        `"${row.student.admissionNo}"`,
        `"${row.student.fullName}"`,
        ...classSubjects.map(s => {
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
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs uppercase tracking-wider">Generating Academic Broadsheet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              CLASS MASTERS MATRIX
            </span>
            <h2 className="text-xl font-light text-white serif italic mt-1">Class Broadsheet & Performance Ledger</h2>
            <p className="text-xs text-slate-400">
              Complete A4 landscape broadsheet view with rank sorting, subject totals, averages, and instant CSV export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Export PDF
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Target Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable A4 Landscape Broadsheet Canvas */}
      <div className="bg-[#0f111a] print:bg-white print:text-black p-8 rounded-2xl border border-slate-800 print:border-none shadow-2xl space-y-6">
        {/* Broadsheet Header */}
        <div className="text-center border-b border-slate-800 print:border-black/20 pb-6 space-y-1">
          <h1 className="text-xl font-bold uppercase tracking-wide text-white print:text-black">
            {school?.name || 'ACHIMOTA ACADEMY'}
          </h1>
          <p className="text-xs text-slate-400 print:text-black/70 italic">
            {school?.address} • {school?.district}, {school?.region}
          </p>
          <div className="pt-2 flex items-center justify-center gap-6 text-xs font-semibold text-blue-400 print:text-black">
            <span>CLASS BROADSHEET: <strong>{currentClass?.className}</strong></span>
            <span>ACADEMIC YEAR: <strong>{academicYear}</strong></span>
            <span>PERIOD: <strong>{term}</strong></span>
            <span>ENROLMENT: <strong>{classStudents.length} Students</strong></span>
          </div>
        </div>

        {/* Broadsheet Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-800 print:border-black/30">
            <thead>
              <tr className="bg-[#161925] print:bg-gray-100 text-slate-300 print:text-black uppercase text-[10px] tracking-wider border-b border-slate-800 print:border-black/30">
                <th className="p-2 border-r border-slate-800 print:border-black/20 text-center w-12">Pos</th>
                <th className="p-2 border-r border-slate-800 print:border-black/20 w-28">Admission No</th>
                <th className="p-2 border-r border-slate-800 print:border-black/20 min-w-[150px]">Student Name</th>

                {classSubjects.map(sub => (
                  <th key={sub.id} className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold min-w-[80px]">
                    {sub.subjectName}
                  </th>
                ))}

                <th className="p-2 border-r border-slate-800 print:border-black/20 text-center bg-blue-900/20 print:bg-gray-200 font-bold min-w-[80px]">Total</th>
                <th className="p-2 text-center bg-emerald-900/20 print:bg-gray-200 font-bold min-w-[80px]">Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-black/20">
              {rankedRows.map((row) => (
                <tr key={row.student.id} className="hover:bg-[#161925]/50 print:hover:bg-transparent">
                  <td className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold text-blue-400 print:text-black font-mono">
                    {formatOrdinalRank(row.rank)}
                  </td>
                  <td className="p-2 border-r border-slate-800 print:border-black/20 font-mono text-slate-400 print:text-black">
                    {row.student.admissionNo}
                  </td>
                  <td className="p-2 border-r border-slate-800 print:border-black/20 font-semibold text-white print:text-black">
                    {row.student.fullName}
                  </td>

                  {classSubjects.map(sub => {
                    const sc = row.subjectMap[sub.id];
                    return (
                      <td key={sub.id} className="p-2 border-r border-slate-800 print:border-black/20 text-center font-mono">
                        {sc ? (
                          <div>
                            <span className="font-bold text-white print:text-black">{sc.finalScore.toFixed(1)}</span>
                            <span className="text-[9px] text-slate-400 print:text-black/60 block">{sc.grade}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 print:text-black/30">-</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold font-mono text-blue-300 print:text-black bg-blue-950/20 print:bg-transparent">
                    {row.totalScore.toFixed(1)}
                  </td>
                  <td className="p-2 text-center font-bold font-mono text-emerald-400 print:text-black bg-emerald-950/20 print:bg-transparent">
                    {row.averageScore.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Broadsheet Footer Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-12 text-xs border-t border-slate-800 print:border-black/20">
          <div className="space-y-6">
            <p className="text-slate-400 print:text-black/70">Class Teacher Signature & Date:</p>
            <div className="border-b border-dashed border-slate-700 print:border-black/40 w-48"></div>
            <p className="font-semibold text-white print:text-black">{currentClass?.classTeacherName || 'Class Teacher'}</p>
          </div>

          <div className="space-y-6 text-right">
            <p className="text-slate-400 print:text-black/70">Headmaster Signature & Stamp:</p>
            <div className="border-b border-dashed border-slate-700 print:border-black/40 w-48 ml-auto"></div>
            <p className="font-semibold text-white print:text-black">{settings?.headmasterName || 'Headmaster'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
