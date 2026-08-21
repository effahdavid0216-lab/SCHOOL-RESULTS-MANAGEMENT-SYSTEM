import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Award,
  BookOpen,
  Users,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  GraduationCap,
  RefreshCw,
  PieChart as PieIcon,
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Percent,
  Sliders,
  ChevronDown
} from 'lucide-react';
import {
  ClassItem,
  SubjectItem,
  Student,
  ScoreEntry,
  ExamType,
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
import { PageHeader, Badge, Button, Select, Input } from './ui';

interface Props {
  schoolId: string;
  userRole?: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT';
  teacherId?: string;
  teacherAssignedSubjectIds?: string[];
}

const GRADE_PALETTE: Record<string, string> = {
  A1: '#10b981',
  B2: '#3b82f6',
  B3: '#60a5fa',
  C4: '#06b6d4',
  C5: '#0ea5e9',
  C6: '#f59e0b',
  D7: '#f97316',
  E8: '#fb7185',
  F9: '#ef4444',
  A: '#10b981',
  B: '#3b82f6',
  C: '#06b6d4',
  D: '#f59e0b',
  F: '#ef4444'
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'];

export const ExamsResultsAnalyzerView: React.FC<Props> = ({
  schoolId,
  userRole = 'SCHOOL_ADMIN',
  teacherId,
  teacherAssignedSubjectIds
}) => {
  // Navigation Tabs for the 4 sub-modules
  const [activeTab, setActiveTab] = useState<'EXAM_ANALYSIS' | 'CLASS_SUMMARY' | 'SUBJECT_ANALYSIS' | 'MOCK_COMPARISON'>('EXAM_ANALYSIS');

  // Master Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Global Context Filters
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('Term 1');
  const [examTypeContext, setExamTypeContext] = useState<string>('END_OF_TERM'); // 'END_OF_TERM', 'MID_TERM', 'MOCK_1', 'MOCK_2', 'MOCK_3', 'ALL_MOCKS'
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');

  useEffect(() => {
    loadAllData();
  }, [schoolId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cList, subList, stList, scoreList, schData, schSettings] = await Promise.all([
        getClassesBySchool(schoolId),
        getSubjectsBySchool(schoolId),
        getStudentsBySchool(schoolId),
        getScoresByQuery({ schoolId }),
        getSchoolDetails(schoolId),
        getSchoolSettings(schoolId)
      ]);

      setClasses(cList);
      setSubjects(subList);
      setStudents(stList);
      setScores(scoreList);
      setSchool(schData);
      setSettings(schSettings);
    } catch (err) {
      console.error('Error loading analyzer data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Permission filtering: if user is TEACHER, filter available subjects if restricted
  const authorizedSubjects = useMemo(() => {
    if (userRole === 'TEACHER' && teacherAssignedSubjectIds && teacherAssignedSubjectIds.length > 0) {
      return subjects.filter((s) => teacherAssignedSubjectIds.includes(s.id));
    }
    return subjects;
  }, [subjects, userRole, teacherAssignedSubjectIds]);

  // Resolve Current Filtered Scores
  const filteredScores = useMemo(() => {
    let list = scores;

    if (academicYear) {
      list = list.filter((s) => s.academicYear === academicYear);
    }

    if (examTypeContext.startsWith('MOCK_')) {
      const mockNum = parseInt(examTypeContext.replace('MOCK_', ''), 10);
      list = list.filter((s) => s.examType === 'MOCK' && s.mockNumber === mockNum);
    } else if (examTypeContext === 'ALL_MOCKS') {
      list = list.filter((s) => s.examType === 'MOCK');
    } else if (examTypeContext === 'MID_TERM') {
      list = list.filter((s) => s.examType === 'MID_TERM' && (!term || s.term === term));
    } else {
      list = list.filter((s) => s.examType === 'END_OF_TERM' && (!term || s.term === term));
    }

    if (selectedClassId !== 'ALL') {
      list = list.filter((s) => s.classId === selectedClassId);
    }

    if (selectedSubjectId !== 'ALL') {
      list = list.filter((s) => s.subjectId === selectedSubjectId);
    }

    return list;
  }, [scores, academicYear, term, examTypeContext, selectedClassId, selectedSubjectId]);

  // =========================================================================
  // 1. EXAMS RESULTS ANALYZER METRICS
  // =========================================================================
  const examMetrics = useMemo(() => {
    if (filteredScores.length === 0) {
      return {
        studentCount: 0,
        highestScore: 0,
        lowestScore: 0,
        averageScore: 0,
        passCount: 0,
        failCount: 0,
        passRate: 0,
        failRate: 0,
        gradeDistribution: [] as { grade: string; count: number; percentage: number }[],
        scoreRanges: [] as { range: string; count: number }[],
        topPerformers: [] as { studentName: string; score: number; grade: string; admissionNo: string; rank: number }[]
      };
    }

    const validScores = filteredScores
      .map((s) => s.finalScore)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    const highest = validScores.length > 0 ? Math.max(...validScores) : 0;
    const lowest = validScores.length > 0 ? Math.min(...validScores) : 0;
    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    const avg = validScores.length > 0 ? sum / validScores.length : 0;

    const passScores = filteredScores.filter((s) => s.isPass !== false && s.grade !== 'F9' && (s.finalScore || 0) >= 45);
    const passCount = passScores.length;
    const failCount = filteredScores.length - passCount;
    const passRate = (passCount / filteredScores.length) * 100;
    const failRate = 100 - passRate;

    // Grade distribution
    const gradeMap: Record<string, number> = {};
    filteredScores.forEach((s) => {
      const g = s.grade || 'N/A';
      gradeMap[g] = (gradeMap[g] || 0) + 1;
    });

    const gradeDistribution = Object.keys(gradeMap).map((grade) => ({
      grade,
      count: gradeMap[grade],
      percentage: Math.round((gradeMap[grade] / filteredScores.length) * 100)
    })).sort((a, b) => a.grade.localeCompare(b.grade));

    // Score distribution brackets (0-39, 40-49, 50-59, 60-69, 70-79, 80-100)
    const ranges = [
      { range: '80-100% (A1)', count: 0 },
      { range: '70-79% (B2-B3)', count: 0 },
      { range: '60-69% (C4-C5)', count: 0 },
      { range: '50-59% (C6)', count: 0 },
      { range: '40-49% (D7-E8)', count: 0 },
      { range: '0-39% (F9)', count: 0 }
    ];

    validScores.forEach((score) => {
      if (score >= 80) ranges[0].count++;
      else if (score >= 70) ranges[1].count++;
      else if (score >= 60) ranges[2].count++;
      else if (score >= 50) ranges[3].count++;
      else if (score >= 40) ranges[4].count++;
      else ranges[5].count++;
    });

    // Top performers with ranking
    const sortedEntries = [...filteredScores]
      .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
      .slice(0, 10);

    const rankedPerformers = calculateRankings(sortedEntries, (e) => e.finalScore || 0).map((r) => ({
      studentName: r.studentName,
      score: r.finalScore || 0,
      grade: r.grade,
      admissionNo: r.admissionNo,
      rank: r.rank
    }));

    return {
      studentCount: filteredScores.length,
      highestScore: highest,
      lowestScore: lowest,
      averageScore: avg,
      passCount,
      failCount,
      passRate,
      failRate,
      gradeDistribution,
      scoreRanges: ranges,
      topPerformers: rankedPerformers
    };
  }, [filteredScores]);

  // =========================================================================
  // 2. CLASS SUMMARIES METRICS
  // =========================================================================
  const classSummaries = useMemo(() => {
    const targetClasses = selectedClassId === 'ALL' ? classes : classes.filter((c) => c.id === selectedClassId);

    return targetClasses.map((cls) => {
      const clsScores = scores.filter(
        (s) =>
          s.classId === cls.id &&
          s.academicYear === academicYear &&
          (examTypeContext.startsWith('MOCK_')
            ? s.examType === 'MOCK' && s.mockNumber === parseInt(examTypeContext.replace('MOCK_', ''), 10)
            : s.term === term && (examTypeContext === 'MID_TERM' ? s.examType === 'MID_TERM' : s.examType === 'END_OF_TERM'))
      );

      const clsStudents = students.filter((st) => st.classId === cls.id);
      const valid = clsScores.map((s) => s.finalScore).filter((v): v is number => typeof v === 'number' && !isNaN(v));

      const highest = valid.length > 0 ? Math.max(...valid) : 0;
      const lowest = valid.length > 0 ? Math.min(...valid) : 0;
      const avg = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;

      const passes = clsScores.filter((s) => s.isPass !== false && s.grade !== 'F9' && (s.finalScore || 0) >= 45).length;
      const passRate = clsScores.length > 0 ? (passes / clsScores.length) * 100 : 0;

      // Student aggregate rankings in this class
      const studentTotals = clsStudents.map((st) => {
        const sScores = clsScores.filter((s) => s.studentId === st.id);
        const total = sScores.reduce((acc, s) => acc + (s.finalScore || 0), 0);
        const count = sScores.length;
        const studentAvg = count > 0 ? total / count : 0;
        return { student: st, total, average: studentAvg, subjectsCount: count };
      });

      const rankedInClass = calculateRankings(studentTotals, (st: { student: any; total: number; average: number; subjectsCount: number }) => st.total);

      return {
        classId: cls.id,
        className: cls.className,
        totalEnrolled: clsStudents.length,
        totalScoresRecorded: clsScores.length,
        classAverage: avg,
        highestOverallScore: highest,
        lowestOverallScore: lowest,
        passRate,
        failRate: 100 - passRate,
        topStudent: rankedInClass.length > 0 ? rankedInClass[0] : null,
        rankedStudents: rankedInClass
      };
    });
  }, [classes, scores, students, academicYear, term, examTypeContext, selectedClassId]);

  // =========================================================================
  // 3. SUBJECT ANALYSIS METRICS
  // =========================================================================
  const subjectAnalysisList = useMemo(() => {
    const targetSubjects = selectedSubjectId === 'ALL' ? authorizedSubjects : authorizedSubjects.filter((s) => s.id === selectedSubjectId);

    return targetSubjects.map((sub) => {
      let subScores = scores.filter(
        (s) =>
          s.subjectId === sub.id &&
          s.academicYear === academicYear &&
          (examTypeContext.startsWith('MOCK_')
            ? s.examType === 'MOCK' && s.mockNumber === parseInt(examTypeContext.replace('MOCK_', ''), 10)
            : s.term === term && (examTypeContext === 'MID_TERM' ? s.examType === 'MID_TERM' : s.examType === 'END_OF_TERM'))
      );

      if (selectedClassId !== 'ALL') {
        subScores = subScores.filter((s) => s.classId === selectedClassId);
      }

      const valid = subScores.map((s) => s.finalScore).filter((v): v is number => typeof v === 'number' && !isNaN(v));
      const highest = valid.length > 0 ? Math.max(...valid) : 0;
      const lowest = valid.length > 0 ? Math.min(...valid) : 0;
      const avg = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;

      const passes = subScores.filter((s) => s.isPass !== false && s.grade !== 'F9' && (s.finalScore || 0) >= 45).length;
      const passRate = subScores.length > 0 ? (passes / subScores.length) * 100 : 0;

      const gradeCounts: Record<string, number> = {};
      subScores.forEach((s) => {
        const g = s.grade || 'N/A';
        gradeCounts[g] = (gradeCounts[g] || 0) + 1;
      });

      return {
        subjectId: sub.id,
        subjectName: sub.subjectName,
        subjectType: sub.subjectType,
        totalEntries: subScores.length,
        highestScore: highest,
        lowestScore: lowest,
        averageScore: avg,
        passRate,
        failRate: 100 - passRate,
        gradeCounts
      };
    });
  }, [authorizedSubjects, scores, academicYear, term, examTypeContext, selectedClassId, selectedSubjectId]);

  // =========================================================================
  // 4. MOCK COMPARISON METRICS (Mock 1 vs Mock 2 vs Mock 3 vs Mock 4)
  // =========================================================================
  const mockComparisonData = useMemo(() => {
    const mockNumbers = [1, 2, 3, 4, 5];
    const mockMetrics = mockNumbers.map((mockNum) => {
      let mockScores = scores.filter(
        (s) => s.academicYear === academicYear && s.examType === 'MOCK' && s.mockNumber === mockNum
      );

      if (selectedClassId !== 'ALL') {
        mockScores = mockScores.filter((s) => s.classId === selectedClassId);
      }

      const valid = mockScores.map((s) => s.finalScore).filter((v): v is number => typeof v === 'number' && !isNaN(v));
      const avg = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
      const highest = valid.length > 0 ? Math.max(...valid) : 0;
      const lowest = valid.length > 0 ? Math.min(...valid) : 0;
      const passes = mockScores.filter((s) => (s.finalScore || 0) >= 50).length;
      const passRate = mockScores.length > 0 ? (passes / mockScores.length) * 100 : 0;

      return {
        mockLabel: `Mock ${mockNum}`,
        mockNumber: mockNum,
        average: Number(avg.toFixed(1)),
        highest,
        lowest,
        passRate: Number(passRate.toFixed(1)),
        candidatesCount: mockScores.length
      };
    }).filter((m) => m.candidatesCount > 0);

    // Track progression across mocks for individual students
    const targetStudents = selectedClassId === 'ALL' ? students : students.filter((s) => s.classId === selectedClassId);

    const studentProgression = targetStudents.slice(0, 30).map((st) => {
      const stMockScores = scores.filter((s) => s.studentId === st.id && s.academicYear === academicYear && s.examType === 'MOCK');

      const mock1Avg = getAvgForMock(stMockScores, 1);
      const mock2Avg = getAvgForMock(stMockScores, 2);
      const mock3Avg = getAvgForMock(stMockScores, 3);

      let trend: 'IMPROVED' | 'DECLINED' | 'STABLE' = 'STABLE';
      if (mock2Avg > 0 && mock1Avg > 0) {
        if (mock2Avg > mock1Avg + 2) trend = 'IMPROVED';
        else if (mock2Avg < mock1Avg - 2) trend = 'DECLINED';
      }

      return {
        student: st,
        mock1Avg,
        mock2Avg,
        mock3Avg,
        trend,
        diff: Number((mock2Avg - mock1Avg).toFixed(1))
      };
    });

    return {
      mockMetrics,
      studentProgression
    };
  }, [scores, students, academicYear, selectedClassId]);

  function getAvgForMock(allScores: ScoreEntry[], mockNum: number): number {
    const subset = allScores.filter((s) => s.mockNumber === mockNum && typeof s.finalScore === 'number');
    if (subset.length === 0) return 0;
    const sum = subset.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
    return Number((sum / subset.length).toFixed(1));
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    let csv = `ACADEMIC PERFORMANCE ANALYSIS - ${school?.name || 'School'}\n`;
    csv += `Academic Year: ${academicYear}, Context: ${examTypeContext}, Class: ${selectedClassId}, Subject: ${selectedSubjectId}\n\n`;

    if (activeTab === 'EXAM_ANALYSIS') {
      csv += `Metric,Value\n`;
      csv += `Total Candidates Evaluated,${examMetrics.studentCount}\n`;
      csv += `Highest Final Score,${examMetrics.highestScore.toFixed(1)}%\n`;
      csv += `Lowest Final Score,${examMetrics.lowestScore.toFixed(1)}%\n`;
      csv += `Class Average Score,${examMetrics.averageScore.toFixed(1)}%\n`;
      csv += `Pass Rate,${examMetrics.passRate.toFixed(1)}%\n`;
      csv += `Fail Rate,${examMetrics.failRate.toFixed(1)}%\n\n`;

      csv += `Grade,Count,Percentage\n`;
      examMetrics.gradeDistribution.forEach((g) => {
        csv += `${g.grade},${g.count},${g.percentage}%\n`;
      });
    } else if (activeTab === 'CLASS_SUMMARY') {
      csv += `Class,Total Students,Class Average,Highest,Lowest,Pass Rate,Fail Rate\n`;
      classSummaries.forEach((c) => {
        csv += `"${c.className}",${c.totalEnrolled},${c.classAverage.toFixed(1)}%,${c.highestOverallScore.toFixed(1)}%,${c.lowestOverallScore.toFixed(1)}%,${c.passRate.toFixed(1)}%,${c.failRate.toFixed(1)}%\n`;
      });
    } else if (activeTab === 'SUBJECT_ANALYSIS') {
      csv += `Subject,Type,Candidates,Average,Highest,Lowest,Pass Rate\n`;
      subjectAnalysisList.forEach((s) => {
        csv += `"${s.subjectName}",${s.subjectType},${s.totalEntries},${s.averageScore.toFixed(1)}%,${s.highestScore.toFixed(1)}%,${s.lowestScore.toFixed(1)}%,${s.passRate.toFixed(1)}%\n`;
      });
    } else {
      csv += `Mock,Average,Highest,Lowest,Pass Rate,Candidates\n`;
      mockComparisonData.mockMetrics.forEach((m) => {
        csv += `"${m.mockLabel}",${m.average}%,${m.highest}%,${m.lowest}%,${m.passRate}%,${m.candidatesCount}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Academic_Analysis_${academicYear}_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Generating Real-Time Statistical Performance Model...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Top Header & Export Actions */}
      <div className="print:hidden space-y-4">
        <PageHeader
          title="Exams Results & Performance Analyzer"
          subtitle="Multi-dimensional academic analytics, grade distributions, pass/fail metrics, class ranking summaries, and progressive mock exam comparisons."
          badge={<Badge variant="active" label="Statistical Engine Active" icon={<Sparkles className="w-3 h-3" />} />}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
                onClick={handleDownloadCSV}
              >
                Export CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
              >
                Print / PDF Report
              </Button>
            </div>
          }
        />

        {/* Sub-Module Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('EXAM_ANALYSIS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'EXAM_ANALYSIS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> 14. Exams Results Analyzer
          </button>
          <button
            onClick={() => setActiveTab('CLASS_SUMMARY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'CLASS_SUMMARY'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> 15. Class Summaries
          </button>
          <button
            onClick={() => setActiveTab('SUBJECT_ANALYSIS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'SUBJECT_ANALYSIS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" /> 16. Subject Analysis
          </button>
          <button
            onClick={() => setActiveTab('MOCK_COMPARISON')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'MOCK_COMPARISON'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> 17. Mock Results Analysis
          </button>
        </div>

        {/* Global Context Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          <div>
            <Input
              label="Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2026/2027"
            />
          </div>

          <div>
            <Select
              label="Academic Term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              disabled={examTypeContext.startsWith('MOCK_')}
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </Select>
          </div>

          <div>
            <Select
              label="Exam Context"
              value={examTypeContext}
              onChange={(e) => setExamTypeContext(e.target.value)}
            >
              <option value="END_OF_TERM">End-of-Term Examination</option>
              <option value="MID_TERM">Mid-Term Assessment</option>
              <option value="MOCK_1">Mock 1 Examination</option>
              <option value="MOCK_2">Mock 2 Examination</option>
              <option value="MOCK_3">Mock 3 Examination</option>
              <option value="MOCK_4">Mock 4 Examination</option>
              <option value="ALL_MOCKS">All Mocks Aggregate</option>
            </Select>
          </div>

          <div>
            <Select
              label="Class Filter"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="ALL">All Enrolled Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Subject Filter"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              <option value="ALL">All Subjects</option>
              {authorizedSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectName} ({s.subjectType})
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. EXAMS RESULTS ANALYZER (Requirement 14) */}
      {/* ===================================================================== */}
      {activeTab === 'EXAM_ANALYSIS' && (
        <div className="space-y-6">
          {/* Key KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Candidates</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                {examMetrics.studentCount}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Highest Score</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {examMetrics.highestScore.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-rose-500 block">Lowest Score</span>
              <span className="text-xl font-black text-rose-500 mt-1 block">
                {examMetrics.lowestScore.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">Class Average</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
                {examMetrics.averageScore.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Pass Rate</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {examMetrics.passRate.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-500 block">Fail Rate</span>
              <span className="text-xl font-black text-amber-500 mt-1 block">
                {examMetrics.failRate.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Interactive Visual Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Range Distribution Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Score Bracket Distribution</h3>
                  <p className="text-xs text-slate-500">Number of students falling into standard percentage performance bands</p>
                </div>
                <Badge variant="neutral" label="Score Histogram" />
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={examMetrics.scoreRanges}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Candidates" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grade Distribution Breakdown */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Grade Level Distribution</h3>
                  <p className="text-xs text-slate-500">Grading scale representation across BECE / WAEC standard boundaries</p>
                </div>
                <Badge variant="neutral" label="WAEC / BECE Scale" />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={examMetrics.gradeDistribution}
                        dataKey="count"
                        nameKey="grade"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label={({ grade }) => grade}
                      >
                        {examMetrics.gradeDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={GRADE_PALETTE[entry.grade] || CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  {examMetrics.gradeDistribution.map((g) => (
                    <div key={g.grade} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: GRADE_PALETTE[g.grade] || '#64748b' }}
                        />
                        <span className="font-bold">{g.grade}</span>
                      </div>
                      <span className="font-mono text-slate-500">
                        {g.count} ({g.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Rankers / Position Distribution Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Position Distribution & Top Performers</h3>
                <p className="text-xs text-slate-500">Leading student standings with standard tie-handling ranking calculation</p>
              </div>
              <Badge variant="active" label="Ranking Order" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-center w-16">Rank</th>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-center">Grade</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {examMetrics.topPerformers.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-center font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                        {formatOrdinalRank(p.rank)}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.admissionNo}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{p.studentName}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {p.score.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{p.grade}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          PASSED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. CLASS SUMMARIES (Requirement 15) */}
      {/* ===================================================================== */}
      {activeTab === 'CLASS_SUMMARY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classSummaries.map((cs) => (
              <div
                key={cs.classId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{cs.className}</h3>
                    <p className="text-xs text-slate-500">{cs.totalEnrolled} Enrolled • {cs.totalScoresRecorded} Score Records</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {cs.classAverage.toFixed(1)}%
                    </span>
                    <span className="block text-[10px] uppercase text-slate-400">Class Avg</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-600 font-bold block">Highest</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                      {cs.highestOverallScore.toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20">
                    <span className="text-[10px] text-rose-600 font-bold block">Lowest</span>
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-300 mt-0.5 block">
                      {cs.lowestOverallScore.toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-500/20">
                    <span className="text-[10px] text-blue-600 font-bold block">Pass Rate</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-300 mt-0.5 block">
                      {cs.passRate.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {cs.topStudent && (
                  <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Top Student: {cs.topStudent.student.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Score: {cs.topStudent.total.toFixed(1)} pts</p>
                      </div>
                    </div>
                    <Badge variant="active" label="1st" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. SUBJECT ANALYSIS (Requirement 16) */}
      {/* ===================================================================== */}
      {activeTab === 'SUBJECT_ANALYSIS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Subject Mastery & Comparative Analysis</h3>
              <p className="text-xs text-slate-500">Cross-departmental performance metrics, pass rates, and highest/lowest score ranges</p>
            </div>
            <Badge variant="neutral" label="Subject Ledger" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Subject Course</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Candidates</th>
                  <th className="px-4 py-3 text-right">Average</th>
                  <th className="px-4 py-3 text-right">Highest</th>
                  <th className="px-4 py-3 text-right">Lowest</th>
                  <th className="px-4 py-3 text-center">Pass Rate</th>
                  <th className="px-4 py-3 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjectAnalysisList.map((sub) => (
                  <tr key={sub.subjectId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{sub.subjectName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {sub.subjectType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{sub.totalEntries}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {sub.averageScore.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{sub.highestScore.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-500">{sub.lowestScore.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">{sub.passRate.toFixed(0)}%</td>
                    <td className="px-4 py-3 text-center">
                      {sub.passRate >= 75 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          OPTIMAL
                        </span>
                      ) : sub.passRate >= 50 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          AVERAGE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          NEEDS ATTENTION
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. MOCK RESULTS ANALYSIS (Requirement 17) */}
      {/* ===================================================================== */}
      {activeTab === 'MOCK_COMPARISON' && (
        <div className="space-y-6">
          {/* Mock Comparative Progression Line Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">BECE / WAEC Mock Progression Matrix</h3>
                <p className="text-xs text-slate-500">Comparative average and pass rate trends across serial mock examinations</p>
              </div>
              <Badge variant="active" label="Mock 1 → Mock 2 → Mock 3" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockComparisonData.mockMetrics}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="mockLabel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="average" stroke="#4f46e5" strokeWidth={3} name="Average Score (%)" />
                  <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={3} name="Pass Rate (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Student Improvement / Decline Tracker */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Individual Candidate Mock Trajectory</h3>
                <p className="text-xs text-slate-500">Progression and delta changes between serial mock assessments</p>
              </div>
              <Badge variant="neutral" label="Trajectory Audit" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3 text-center">Class</th>
                    <th className="px-4 py-3 text-right">Mock 1 Avg</th>
                    <th className="px-4 py-3 text-right">Mock 2 Avg</th>
                    <th className="px-4 py-3 text-right">Mock 3 Avg</th>
                    <th className="px-4 py-3 text-center">Trajectory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mockComparisonData.studentProgression.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-slate-500">{item.student.admissionNo}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{item.student.fullName}</td>
                      <td className="px-4 py-3 text-center">{item.student.className}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{item.mock1Avg > 0 ? `${item.mock1Avg}%` : '-'}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{item.mock2Avg > 0 ? `${item.mock2Avg}%` : '-'}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{item.mock3Avg > 0 ? `${item.mock3Avg}%` : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        {item.trend === 'IMPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            <ArrowUpRight className="w-3 h-3" /> +{item.diff}% Improved
                          </span>
                        ) : item.trend === 'DECLINED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            <ArrowDownRight className="w-3 h-3" /> {item.diff}% Declined
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Steady
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
