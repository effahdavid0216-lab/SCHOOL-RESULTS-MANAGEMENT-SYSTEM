import React, { useState, useEffect } from 'react';
import {
  Printer,
  Users,
  RefreshCw,
  CheckCircle,
  FileText
} from 'lucide-react';
import {
  ClassItem,
  Student,
  ScoreEntry,
  School,
  SchoolSettings
} from '../types';
import {
  getClassesBySchool,
  getStudentsBySchool,
  getScoresByQuery,
  getSchoolDetails,
  getSchoolSettings
} from '../lib/services';
import { calculateRankings, formatOrdinalRank } from '../lib/academicEngine';
import { printBulkReportCards } from '../lib/printService';

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

  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedClassId) {
      loadBatchScores();
    }
  }, [selectedClassId, academicYear, term]);

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

    if (cList.length > 0) setSelectedClassId(cList[0].id);
    setLoading(false);
  };

  const loadBatchScores = async () => {
    const fetched = await getScoresByQuery({
      schoolId,
      classId: selectedClassId,
      academicYear,
      term
    });
    setScores(fetched);
  };

  const classStudents = students.filter(s => s.classId === selectedClassId);
  const currentClass = classes.find(c => c.id === selectedClassId);

  // Rankings
  interface StudentTotal {
    studentId: string;
    tot: number;
    avg: number;
  }

  const studentTotalsMap: StudentTotal[] = classStudents.map(st => {
    const stScores = scores.filter(sc => sc.studentId === st.id);
    const tot = stScores.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
    const avg = stScores.length > 0 ? tot / stScores.length : 0;
    return { studentId: st.id, tot, avg };
  });

  const rankedStudents = calculateRankings<StudentTotal>(studentTotalsMap, s => s.tot);

  const handleBulkPrint = () => {
    printBulkReportCards(
      currentClass?.className || 'Class',
      term,
      academicYear
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs uppercase tracking-wider">Generating Class Batch Reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner Controls */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              BATCH REPORT PRINT ENGINE
            </span>
            <h2 className="text-xl font-light text-white serif italic mt-1">Bulk Class Terminal Report Cards</h2>
            <p className="text-xs text-slate-400">
              Generate and print terminal report cards for all enrolled students in a class at once.
            </p>
          </div>

          <button
            onClick={handleBulkPrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Bulk Print All Reports ({classStudents.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
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
        </div>
      </div>

      {/* Batch Cards Stack */}
      <div className="space-y-12">
        {classStudents.map((st, idx) => {
          const stScores = scores.filter(sc => sc.studentId === st.id);
          const stRank = rankedStudents.find(r => r.studentId === st.id);
          const totalScore = stScores.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
          const averageScore = stScores.length > 0 ? totalScore / stScores.length : 0;

          return (
            <div
              key={st.id}
              className="bg-[#0f111a] print:bg-white print:text-black p-8 sm:p-10 print:p-4 rounded-2xl border border-slate-800 print:border-none shadow-2xl max-w-4xl mx-auto space-y-6 print:space-y-3 text-xs font-sans page-break-after one-page-report"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-blue-600 print:border-black pb-4">
                <div>
                  <h1 className="text-xl font-bold uppercase tracking-tight text-white print:text-black">
                    {school?.name || 'ACHIMOTA ACADEMY'}
                  </h1>
                  <p className="text-[10px] text-slate-400 print:text-black/70 italic">
                    {school?.address} • {school?.district}, {school?.region}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 bg-blue-600 text-white font-bold rounded text-[9px] uppercase tracking-wider">
                    TERMINAL REPORT
                  </span>
                  <p className="text-[10px] text-slate-400 print:text-black font-mono mt-1">
                    YEAR: {academicYear} • {term}
                  </p>
                </div>
              </div>

              {/* Student Summary */}
              <div className="grid grid-cols-2 gap-4 bg-[#161925] print:bg-gray-100 p-3 rounded-xl border border-slate-800 print:border-black/20">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 print:text-black/70">STUDENT NAME: <strong className="text-white print:text-black">{st.fullName}</strong></p>
                  <p className="text-[10px] text-slate-400 print:text-black/70">Admission No: <strong className="text-white print:text-black font-mono">{st.admissionNo}</strong></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 print:text-black/70">CLASS: <strong className="text-white print:text-black">{currentClass?.className}</strong></p>
                  <p className="text-[10px] text-slate-400 print:text-black/70">POSITION: <strong className="text-blue-400 print:text-black font-bold font-mono">{stRank ? formatOrdinalRank(stRank.rank) : '-'}</strong> out of <strong>{classStudents.length}</strong></p>
                </div>
              </div>

              {/* Results Table */}
              <table className="w-full text-left border-collapse border border-slate-800 print:border-black/30 text-xs">
                <thead>
                  <tr className="bg-[#161925] print:bg-gray-200 text-slate-300 print:text-black uppercase text-[10px] border-b border-slate-800 print:border-black/30">
                    <th className="p-2 border-r border-slate-800 print:border-black/20">Subject</th>
                    <th className="p-2 border-r border-slate-800 print:border-black/20 text-center">SBA /50</th>
                    <th className="p-2 border-r border-slate-800 print:border-black/20 text-center">Exam /50</th>
                    <th className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold">Total /100</th>
                    <th className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold">Grade</th>
                    <th className="p-2 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black/20">
                  {stScores.map(sc => (
                    <tr key={sc.id}>
                      <td className="p-2 border-r border-slate-800 print:border-black/20 font-semibold text-white print:text-black">{sc.subjectName}</td>
                      <td className="p-2 border-r border-slate-800 print:border-black/20 text-center font-mono">{sc.sbaScaledScore.toFixed(1)}</td>
                      <td className="p-2 border-r border-slate-800 print:border-black/20 text-center font-mono">{sc.examScaledScore.toFixed(1)}</td>
                      <td className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold font-mono text-emerald-400 print:text-black">{sc.finalScore.toFixed(1)}</td>
                      <td className="p-2 border-r border-slate-800 print:border-black/20 text-center font-bold font-mono text-white print:text-black">{sc.grade}</td>
                      <td className="p-2 text-slate-300 print:text-black">{sc.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Remarks */}
              <div className="pt-4 grid grid-cols-2 gap-8 text-xs border-t border-slate-800 print:border-black/20">
                <div>
                  <p className="text-slate-400 print:text-black/70">Class Teacher Signature:</p>
                  <div className="border-b border-dashed border-slate-700 print:border-black/40 w-36 mt-4"></div>
                  <p className="font-semibold text-white print:text-black mt-1">{currentClass?.classTeacherName || 'Class Teacher'}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 print:text-black/70">Headmaster Signature:</p>
                  <div className="border-b border-dashed border-slate-700 print:border-black/40 w-36 ml-auto mt-4"></div>
                  <p className="font-semibold text-white print:text-black mt-1">{settings?.headmasterName || 'Headmaster'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
