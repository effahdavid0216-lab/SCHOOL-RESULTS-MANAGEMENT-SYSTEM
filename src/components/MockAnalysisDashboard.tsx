import React, { useState, useEffect } from 'react';
import {
  Award,
  BarChart2,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  BookOpen,
  Users
} from 'lucide-react';
import {
  ClassItem,
  SubjectItem,
  Student,
  ScoreEntry
} from '../types';
import {
  getClassesBySchool,
  getSubjectsBySchool,
  getStudentsBySchool,
  getScoresByQuery
} from '../lib/services';
import { calculateRankings, formatOrdinalRank } from '../lib/academicEngine';

interface Props {
  schoolId: string;
}

export const MockAnalysisDashboard: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('Term 1');

  const [mockScores, setMockScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedClassId) {
      loadMockScores();
    }
  }, [selectedClassId, academicYear, term]);

  const loadData = async () => {
    setLoading(true);
    const [cList, subList, stList] = await Promise.all([
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId),
      getStudentsBySchool(schoolId)
    ]);

    setClasses(cList);
    setSubjects(subList);
    setStudents(stList);

    if (cList.length > 0) setSelectedClassId(cList[0].id);
    setLoading(false);
  };

  const loadMockScores = async () => {
    const fetched = await getScoresByQuery({
      schoolId,
      classId: selectedClassId,
      academicYear,
      term,
      examType: 'MOCK'
    });
    setMockScores(fetched);
  };

  const classStudents = students.filter(s => s.classId === selectedClassId);
  const currentClass = classes.find(c => c.id === selectedClassId);

  // Compute Analytics
  const totalEntries = mockScores.length;
  const overallSum = mockScores.reduce((acc, curr) => acc + curr.finalScore, 0);
  const classAverage = totalEntries > 0 ? overallSum / totalEntries : 0;

  const highestScore = totalEntries > 0 ? Math.max(...mockScores.map(s => s.finalScore)) : 0;
  const lowestScore = totalEntries > 0 ? Math.min(...mockScores.map(s => s.finalScore)) : 0;

  const passes = mockScores.filter(s => s.isPass).length;
  const fails = totalEntries - passes;
  const passRate = totalEntries > 0 ? (passes / totalEntries) * 100 : 0;
  const failRate = totalEntries > 0 ? (fails / totalEntries) * 100 : 0;

  // Grade Distribution
  const gradeCounts: { [grade: string]: number } = {
    'A1': 0, 'B2': 0, 'B3': 0, 'C4': 0, 'C5': 0, 'C6': 0, 'D7': 0, 'E8': 0, 'F9': 0
  };

  mockScores.forEach(sc => {
    if (gradeCounts[sc.grade] !== undefined) {
      gradeCounts[sc.grade] += 1;
    } else {
      gradeCounts[sc.grade] = 1;
    }
  });

  // Student Rankings for Mock
  interface MockStudentRow {
    student: Student;
    scores: ScoreEntry[];
    totalScore: number;
    averageScore: number;
  }

  const studentTotalsMap: MockStudentRow[] = classStudents.map(st => {
    const stScores = mockScores.filter(sc => sc.studentId === st.id);
    const tot = stScores.reduce((acc, curr) => acc + curr.finalScore, 0);
    const avg = stScores.length > 0 ? tot / stScores.length : 0;
    return { student: st, scores: stScores, totalScore: tot, averageScore: avg };
  });

  const rankedStudents = calculateRankings<MockStudentRow>(studentTotalsMap, s => s.averageScore);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs uppercase tracking-wider">Loading Mock Exam Analytics Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner & Selection Bar */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              100% DIRECT SCORE ENGINE
            </span>
            <h2 className="text-xl font-light text-white serif italic mt-1">BECE / WAEC Mock Examination Analytics</h2>
            <p className="text-xs text-slate-400">
              In-depth performance breakdown, grade distribution, subject averages, and candidate rankings for Mock exams.
            </p>
          </div>
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
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Academic Session</label>
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Class Mean Average</span>
          <p className="text-2xl font-light text-white serif italic">{classAverage.toFixed(2)}%</p>
        </div>

        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Highest / Lowest Score</span>
          <p className="text-xl font-light text-emerald-400 serif italic">{highestScore.toFixed(1)}% <span className="text-slate-500 text-xs">/ {lowestScore.toFixed(1)}%</span></p>
        </div>

        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Overall Pass Rate</span>
          <p className="text-2xl font-light text-blue-400 serif italic">{passRate.toFixed(1)}%</p>
        </div>

        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Fail / At-Risk Candidates</span>
          <p className="text-2xl font-light text-rose-400 serif italic">{fails} <span className="text-slate-500 text-xs">({failRate.toFixed(1)}%)</span></p>
        </div>
      </div>

      {/* Grade Distribution Bar Graph Visualizer */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-light text-white serif italic flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-400" /> Grade Distribution Analysis (BECE Scale A1 - F9)
        </h3>

        <div className="grid grid-cols-9 gap-2 pt-4 items-end h-40 border-b border-slate-800 pb-2">
          {Object.entries(gradeCounts).map(([grade, count]) => {
            const maxCount = Math.max(...Object.values(gradeCounts), 1);
            const heightPercent = (count / maxCount) * 100;

            return (
              <div key={grade} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-slate-400 font-bold">{count}</span>
                <div
                  style={{ height: `${Math.max(heightPercent, 8)}%` }}
                  className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                    grade === 'A1' || grade === 'B2' || grade === 'B3'
                      ? 'bg-emerald-500 group-hover:bg-emerald-400'
                      : grade === 'C4' || grade === 'C5' || grade === 'C6'
                      ? 'bg-blue-500 group-hover:bg-blue-400'
                      : 'bg-rose-500 group-hover:bg-rose-400'
                  }`}
                />
                <span className="text-[11px] font-bold text-white font-mono">{grade}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mock Candidate Leaderboard Table */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-[#161925]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-xs text-white">
              Mock Candidate Performance Ranking ({rankedStudents.length} Students)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d0f18]">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Admission No</th>
                <th className="py-3 px-3">Candidate Name</th>
                <th className="py-3 px-3 text-center">Subjects Taken</th>
                <th className="py-3 px-3 text-center">Mean Average %</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rankedStudents.map((row) => (
                <tr key={row.student.id} className="hover:bg-[#161925]/70 transition-colors">
                  <td className="py-3 px-3 font-bold font-mono text-blue-400 text-sm">
                    {formatOrdinalRank(row.rank)}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">{row.student.admissionNo}</td>
                  <td className="py-3 px-3 font-semibold text-white">{row.student.fullName}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-300">{row.scores.length}</td>
                  <td className="py-3 px-3 text-center font-bold font-mono text-emerald-400 text-sm">
                    {row.averageScore.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      row.averageScore >= 50
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {row.averageScore >= 50 ? 'PASS' : 'AT RISK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
