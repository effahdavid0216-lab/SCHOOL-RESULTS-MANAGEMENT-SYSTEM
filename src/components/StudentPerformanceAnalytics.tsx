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
import { motion, AnimatePresence } from 'motion/react';
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
  GraduationCap,
  RefreshCw,
  PieChart as PieIcon,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  School as SchoolIcon,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { ClassItem, SubjectItem, Student, ScoreEntry, ExamType, School, SchoolSettings } from '../types';
import {
  getClassesBySchool,
  getSubjectsBySchool,
  getStudentsBySchool,
  getScoresByQuery,
  getSchoolDetails,
  getSchoolSettings
} from '../lib/services';

interface Props {
  schoolId: string;
  teacherEmail?: string;
}

const GRADE_COLORS: Record<string, string> = {
  'A1': '#10b981', // Emerald
  'B2': '#3b82f6', // Blue
  'B3': '#60a5fa', // Light blue
  'C4': '#06b6d4', // Cyan
  'C5': '#0ea5e9', // Sky
  'C6': '#f59e0b', // Amber
  'D7': '#f97316', // Orange
  'E8': '#fb7185', // Rose light
  'F9': '#ef4444'  // Red
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#06b6d4', '#f59e0b', '#f97316', '#ef4444'];

export const StudentPerformanceAnalytics: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allScores, setAllScores] = useState<ScoreEntry[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters: Class, Year, Term, Subject, Exam Type
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026/2027');
  const [selectedTerm, setSelectedTerm] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedExamType, setSelectedExamType] = useState<string>('ALL');

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
      setAllScores(scoreList);
      setSchool(schData);
      setSettings(schSettings);
    } catch (err) {
      console.error('Error loading student performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered scores based on selections
  const filteredScores = useMemo(() => {
    return allScores.filter(s => {
      if (selectedClassId !== 'ALL' && s.classId !== selectedClassId) return false;
      if (selectedAcademicYear && s.academicYear !== selectedAcademicYear) return false;
      if (selectedTerm !== 'ALL' && s.term !== selectedTerm) return false;
      if (selectedSubjectId !== 'ALL' && s.subjectId !== selectedSubjectId) return false;
      if (selectedExamType !== 'ALL' && s.examType !== selectedExamType) return false;
      return true;
    });
  }, [allScores, selectedClassId, selectedAcademicYear, selectedTerm, selectedSubjectId, selectedExamType]);

  // Distinct academic years present in scores or default
  const availableYears = useMemo(() => {
    const years = new Set<string>(['2026/2027', '2025/2026']);
    allScores.forEach(s => {
      if (s.academicYear) years.add(s.academicYear);
    });
    return Array.from(years);
  }, [allScores]);

  // 1. Grade Distribution Calculation
  const gradeDistributionData = useMemo(() => {
    const counts: Record<string, { count: number; remark: string; range: string }> = {
      'A1': { count: 0, remark: 'Excellent', range: '75 - 100' },
      'B2': { count: 0, remark: 'Very Good', range: '70 - 74' },
      'B3': { count: 0, remark: 'Good', range: '65 - 69' },
      'C4': { count: 0, remark: 'Credit', range: '60 - 64' },
      'C5': { count: 0, remark: 'Credit', range: '55 - 59' },
      'C6': { count: 0, remark: 'Credit', range: '50 - 54' },
      'D7': { count: 0, remark: 'Pass', range: '45 - 49' },
      'E8': { count: 0, remark: 'Weak Pass', range: '40 - 44' },
      'F9': { count: 0, remark: 'Fail / Remedial', range: '0 - 39' }
    };

    filteredScores.forEach(s => {
      const g = (s.grade || '').toUpperCase();
      if (counts[g]) {
        counts[g].count++;
      } else {
        // Fallback by score
        const score = s.finalScore || s.percentage || 0;
        if (score >= 75) counts['A1'].count++;
        else if (score >= 70) counts['B2'].count++;
        else if (score >= 65) counts['B3'].count++;
        else if (score >= 60) counts['C4'].count++;
        else if (score >= 55) counts['C5'].count++;
        else if (score >= 50) counts['C6'].count++;
        else if (score >= 45) counts['D7'].count++;
        else if (score >= 40) counts['E8'].count++;
        else counts['F9'].count++;
      }
    });

    const total = filteredScores.length || 1;
    return Object.entries(counts).map(([grade, data]) => {
      return {
        grade: `${grade} (${data.range})`,
        gradeCode: grade,
        range: data.range,
        remark: data.remark,
        count: data.count,
        percentage: Number(((data.count / total) * 100).toFixed(1)),
        fill: GRADE_COLORS[grade] || '#3b82f6'
      };
    });
  }, [filteredScores]);

  // 2. Academic Progress Trends Across Terms & Academic Cycles
  const progressTrendsData = useMemo(() => {
    const terms = ['Term 1', 'Term 2', 'Term 3'];
    
    return terms.map(termName => {
      const termScores = allScores.filter(s => {
        if (selectedClassId !== 'ALL' && s.classId !== selectedClassId) return false;
        if (selectedAcademicYear && s.academicYear !== selectedAcademicYear) return false;
        if (selectedSubjectId !== 'ALL' && s.subjectId !== selectedSubjectId) return false;
        return s.term === termName;
      });

      if (termScores.length === 0) {
        return {
          term: termName,
          averageScore: 0,
          sbaAverage: 0,
          examAverage: 0,
          passRate: 0,
          totalSubmissions: 0
        };
      }

      const totalFinal = termScores.reduce((acc, s) => acc + (s.finalScore || s.percentage || 0), 0);
      const totalSBA = termScores.reduce((acc, s) => acc + (s.sbaScaledScore || 0), 0);
      const totalExam = termScores.reduce((acc, s) => acc + (s.examScaledScore || 0), 0);
      const passCount = termScores.filter(s => (s.finalScore || s.percentage || 0) >= 50).length;

      return {
        term: termName,
        averageScore: Number((totalFinal / termScores.length).toFixed(1)),
        sbaAverage: Number((totalSBA / termScores.length).toFixed(1)),
        examAverage: Number((totalExam / termScores.length).toFixed(1)),
        passRate: Number(((passCount / termScores.length) * 100).toFixed(1)),
        totalSubmissions: termScores.length
      };
    });
  }, [allScores, selectedClassId, selectedAcademicYear, selectedSubjectId]);

  // 3. Subject-wise Comparison (for Class or School)
  const subjectPerformanceData = useMemo(() => {
    const subMap: Record<string, { totalScore: number; count: number; passCount: number; name: string }> = {};

    filteredScores.forEach(s => {
      const subName = s.subjectName || 'Unknown Subject';
      if (!subMap[subName]) {
        subMap[subName] = { totalScore: 0, count: 0, passCount: 0, name: subName };
      }
      const score = s.finalScore || s.percentage || 0;
      subMap[subName].totalScore += score;
      subMap[subName].count++;
      if (score >= 50) subMap[subName].passCount++;
    });

    return Object.values(subMap)
      .map(item => ({
        subject: item.name.length > 14 ? item.name.substring(0, 12) + '…' : item.name,
        fullSubjectName: item.name,
        average: Number((item.totalScore / (item.count || 1)).toFixed(1)),
        passRate: Number(((item.passCount / (item.count || 1)) * 100).toFixed(1)),
        entries: item.count
      }))
      .sort((a, b) => b.average - a.average);
  }, [filteredScores]);

  // 4. Performance Brackets Pie Data (Pass vs Needs Improvement)
  const performanceBracketsData = useMemo(() => {
    let distinction = 0; // >= 75
    let credit = 0;      // 60 - 74
    let pass = 0;        // 50 - 59
    let remediation = 0; // < 50

    filteredScores.forEach(s => {
      const score = s.finalScore || s.percentage || 0;
      if (score >= 75) distinction++;
      else if (score >= 60) credit++;
      else if (score >= 50) pass++;
      else remediation++;
    });

    const total = filteredScores.length || 1;
    return [
      { name: 'Distinction (75%+)', value: distinction, percentage: ((distinction / total) * 100).toFixed(1) },
      { name: 'Credit (60-74%)', value: credit, percentage: ((credit / total) * 100).toFixed(1) },
      { name: 'Pass (50-59%)', value: pass, percentage: ((pass / total) * 100).toFixed(1) },
      { name: 'Remediation (<50%)', value: remediation, percentage: ((remediation / total) * 100).toFixed(1) }
    ].filter(item => item.value > 0);
  }, [filteredScores]);

  // Summary Metrics
  const metrics = useMemo(() => {
    if (filteredScores.length === 0) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        passPercentage: 0,
        highestScore: 0,
        lowestScore: 0
      };
    }

    const scoresList = filteredScores.map(s => s.finalScore || s.percentage || 0);
    const sum = scoresList.reduce((a, b) => a + b, 0);
    const passCount = scoresList.filter(v => v >= 50).length;

    return {
      totalEvaluations: filteredScores.length,
      averageScore: Number((sum / filteredScores.length).toFixed(1)),
      passPercentage: Number(((passCount / filteredScores.length) * 100).toFixed(1)),
      highestScore: Number(Math.max(...scoresList).toFixed(1)),
      lowestScore: Number(Math.min(...scoresList).toFixed(1))
    };
  }, [filteredScores]);

  // Get active class and subject label for reports
  const activeClassName = useMemo(() => {
    if (selectedClassId === 'ALL') return 'All Classes / Whole School Cohort';
    const found = classes.find(c => c.id === selectedClassId);
    return found ? found.className : selectedClassId;
  }, [selectedClassId, classes]);

  const activeSubjectName = useMemo(() => {
    if (selectedSubjectId === 'ALL') return 'All Subjects Combined';
    const found = subjects.find(s => s.id === selectedSubjectId);
    return found ? found.subjectName : selectedSubjectId;
  }, [selectedSubjectId, subjects]);

  // Trigger browser print dialog for clean branded PDF report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div id="student-performance-analytics-widget" className="space-y-6">
      {/* ========================================================
          SCREEN VIEW (Interactive Visual Dashboard with Motion)
          ======================================================== */}
      <div className="space-y-6 no-print">
        {/* Widget Header & Filter Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-xl font-medium text-white serif italic">
                  Student Performance Analytics
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Visual analytics engine for grading distribution, academic progression trends, and class comparisons.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="analytics-download-report-btn"
                onClick={handlePrintReport}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-900/20 cursor-pointer"
                title="Generate and download a branded PDF analytics report for teachers using official print styles"
              >
                <Printer className="w-3.5 h-3.5" />
                Download Report (PDF)
              </button>

              <button
                onClick={loadAllData}
                disabled={loading}
                className="px-3 py-1.5 bg-[#161925] hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Analytics
              </button>
            </div>
          </div>

          {/* Dynamic Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
            {/* Class Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Class Filter
              </label>
              <select
                id="analytics-class-filter"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">All Classes ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.className}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Academic Year
              </label>
              <select
                id="analytics-year-filter"
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Term Period
              </label>
              <select
                id="analytics-term-filter"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">All Terms Combined</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Subject
              </label>
              <select
                id="analytics-subject-filter"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">All Curriculum Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subjectName}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Type Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Assessment Type
              </label>
              <select
                id="analytics-exam-type-filter"
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">All Assessments</option>
                <option value="END_OF_TERM">End of Term Exam</option>
                <option value="SBA">SBA Continuous</option>
                <option value="MOCK">BECE / Mock Exam</option>
                <option value="MID_TERM">Mid-Term Assessment</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* KPI Overview Cards with Staggered Entrance Animations */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              label: 'Evaluations Logged',
              value: metrics.totalEvaluations,
              sub: 'Scores recorded',
              color: 'text-white'
            },
            {
              label: 'Class Mean Score',
              value: `${metrics.averageScore}%`,
              sub: 'Overall performance',
              color: 'text-blue-400'
            },
            {
              label: 'Pass Rate (≥50%)',
              value: `${metrics.passPercentage}%`,
              sub: 'Credit & Distinction',
              color: 'text-emerald-400'
            },
            {
              label: 'Top Attained Score',
              value: `${metrics.highestScore}%`,
              sub: 'Cohort peak',
              color: 'text-purple-400'
            },
            {
              label: 'Lowest Score',
              value: `${metrics.lowestScore}%`,
              sub: 'Needs attention',
              color: 'text-rose-400'
            }
          ].map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 shadow-xl"
            >
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">
                {card.label}
              </span>
              <p className={`text-2xl font-light serif italic ${card.color}`}>{card.value}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">{card.sub}</span>
            </motion.div>
          ))}
        </div>

        {/* Main Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Grade Distribution Histogram (WAEC / Standard Grading) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-400" />
                  Class-wide Grade Distribution
                </h3>
                <p className="text-[11px] text-slate-400">
                  Frequency distribution across WAEC grading standards (A1 to F9)
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full font-mono">
                Histogram
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              {filteredScores.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                  No score records match the selected class and period filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                    <XAxis
                      dataKey="grade"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161925',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        `${value} students (${props.payload.percentage}%) - ${props.payload.remark}`,
                        'Count'
                      ]}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={900}>
                      {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Chart 2: Academic Progress Trends Over Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Academic Progress Trends Over Terms
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tracking mean performance, SBA, and exam scores across the academic year ({selectedAcademicYear})
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-mono">
                Progression
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                  <XAxis dataKey="term" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161925',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [`${value}%`, '']}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="averageScore"
                    name="Final Mean Score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="passRate"
                    name="Pass Rate %"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#10b981' }}
                    isAnimationActive={true}
                    animationDuration={1200}
                  />
                  <Line
                    type="monotone"
                    dataKey="examAverage"
                    name="Exam Average"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b' }}
                    isAnimationActive={true}
                    animationDuration={1100}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Secondary Charts: Subject Proficiency & Performance Tier Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject Comparison Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="lg:col-span-2 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  Subject-by-Subject Average Performance
                </h3>
                <p className="text-[11px] text-slate-400">
                  Comparative subject ranking by average score for the selected cohort
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {subjectPerformanceData.length} Subjects
              </span>
            </div>

            <div className="h-64 w-full">
              {subjectPerformanceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                  No subject scores recorded yet for this selection.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectPerformanceData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                    <YAxis
                      dataKey="subject"
                      type="category"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161925',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        `${value}% (Pass Rate: ${props.payload.passRate}%)`,
                        props.payload.fullSubjectName
                      ]}
                    />
                    <Bar
                      dataKey="average"
                      fill="#06b6d4"
                      radius={[0, 6, 6, 0]}
                      isAnimationActive={true}
                      animationDuration={900}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Performance Tier Donut Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-purple-400" />
                  Performance Tiers
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cohort mastery breakdown
                </p>
              </div>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              {performanceBracketsData.length === 0 ? (
                <div className="text-slate-500 text-xs italic">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceBracketsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={1000}
                    >
                      {performanceBracketsData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161925',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        `${value} (${props.payload.percentage}%)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tier Legend */}
            <div className="space-y-1.5 text-xs">
              {performanceBracketsData.map((tier, idx) => (
                <div key={tier.name} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-[11px] truncate max-w-[130px]">{tier.name}</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-white">
                    {tier.value} ({tier.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========================================================
          PRINT ONLY VIEW (Clean, High-Contrast Branded PDF Report)
          Leverages print styles in index.css for pixel-perfect A4 PDF
          ======================================================== */}
      <div className="hidden print:block printable-area print-report-document text-black bg-white space-y-6">
        {/* Official School Letterhead */}
        <div className="border-b-2 border-black pb-4 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-4">
            {school?.logoUrl ? (
              <img
                src={school.logoUrl}
                alt="School Crest"
                className="w-16 h-16 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 border-2 border-black rounded-lg flex items-center justify-center">
                <SchoolIcon className="w-8 h-8 text-black" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider text-black">
                {school?.name || 'EduMaster Academy Ghana'}
              </h1>
              {school?.motto && (
                <p className="text-xs italic text-gray-700 font-serif">
                  "{school.motto}"
                </p>
              )}
              <p className="text-[11px] text-gray-800">
                {school?.address ? `${school.address}, ` : ''}
                {school?.district || 'Accra Metropolis'}, {school?.region || 'Greater Accra Region'}, Ghana
              </p>
              <p className="text-[10px] text-gray-600 font-mono">
                Phone: {school?.phone || '0240000000'} | Email: {school?.email || 'admin@school.edu.gh'} | Digital Address: {school?.digitalAddress || 'GA-000-0000'}
              </p>
            </div>
          </div>
        </div>

        {/* Report Title & Metadata Banner */}
        <div className="bg-gray-100 p-3 rounded-lg border border-gray-400 space-y-1">
          <h2 className="text-center text-base font-bold uppercase tracking-wide text-black underline">
            Student Academic Performance Analytics & Cohort Progress Report
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1 text-black font-sans">
            <div>
              <span className="font-semibold">Academic Year:</span> {selectedAcademicYear}
            </div>
            <div>
              <span className="font-semibold">Term / Period:</span> {selectedTerm === 'ALL' ? 'All Terms Combined' : selectedTerm}
            </div>
            <div>
              <span className="font-semibold">Class Stream:</span> {activeClassName}
            </div>
            <div>
              <span className="font-semibold">Subject Focus:</span> {activeSubjectName}
            </div>
            <div>
              <span className="font-semibold">Assessment Type:</span> {selectedExamType === 'ALL' ? 'All Assessments (SBA + Exam)' : selectedExamType}
            </div>
            <div>
              <span className="font-semibold">Total Records:</span> {metrics.totalEvaluations} entries
            </div>
            <div>
              <span className="font-semibold">Generated Date:</span> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div>
              <span className="font-semibold">Status:</span> Official Academic Record
            </div>
          </div>
        </div>

        {/* Executive Summary Performance Metrics */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-2 border-b border-gray-400 pb-1">
            1. Executive Performance Summary
          </h3>
          <div className="grid grid-cols-5 gap-3 text-center">
            <div className="border border-black p-2.5 rounded bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-gray-700 block">Total Evaluations</span>
              <span className="text-lg font-bold text-black">{metrics.totalEvaluations}</span>
            </div>
            <div className="border border-black p-2.5 rounded bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-gray-700 block">Class Mean Score</span>
              <span className="text-lg font-bold text-black">{metrics.averageScore}%</span>
            </div>
            <div className="border border-black p-2.5 rounded bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-gray-700 block">Overall Pass Rate</span>
              <span className="text-lg font-bold text-black">{metrics.passPercentage}%</span>
            </div>
            <div className="border border-black p-2.5 rounded bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-gray-700 block">Top Peak Score</span>
              <span className="text-lg font-bold text-black">{metrics.highestScore}%</span>
            </div>
            <div className="border border-black p-2.5 rounded bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-gray-700 block">Lowest Score</span>
              <span className="text-lg font-bold text-black">{metrics.lowestScore}%</span>
            </div>
          </div>
        </div>

        {/* WAEC Grade Distribution Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-2 border-b border-gray-400 pb-1">
            2. WAEC Grading Distribution Frequency
          </h3>
          <table className="w-full text-xs border border-black border-collapse">
            <thead>
              <tr className="bg-gray-200 text-black font-bold">
                <th className="border border-black p-1.5 text-left">Grade</th>
                <th className="border border-black p-1.5 text-left">Mark Range (%)</th>
                <th className="border border-black p-1.5 text-center">Student Count</th>
                <th className="border border-black p-1.5 text-center">Distribution (%)</th>
                <th className="border border-black p-1.5 text-left">Standard WAEC / GES Remark</th>
              </tr>
            </thead>
            <tbody>
              {gradeDistributionData.map((g) => (
                <tr key={g.gradeCode} className="hover:bg-gray-50">
                  <td className="border border-black p-1.5 font-bold">{g.gradeCode}</td>
                  <td className="border border-black p-1.5 font-mono">{g.range}%</td>
                  <td className="border border-black p-1.5 text-center font-semibold">{g.count}</td>
                  <td className="border border-black p-1.5 text-center font-mono">{g.percentage}%</td>
                  <td className="border border-black p-1.5">{g.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Subject Comparison Table */}
        {subjectPerformanceData.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-2 border-b border-gray-400 pb-1">
              3. Subject Performance & Pass Rate Breakdown
            </h3>
            <table className="w-full text-xs border border-black border-collapse">
              <thead>
                <tr className="bg-gray-200 text-black font-bold">
                  <th className="border border-black p-1.5 text-left">Subject Name</th>
                  <th className="border border-black p-1.5 text-center">Candidates Assessed</th>
                  <th className="border border-black p-1.5 text-center">Subject Average (%)</th>
                  <th className="border border-black p-1.5 text-center">Pass Rate (≥50%)</th>
                  <th className="border border-black p-1.5 text-left">Performance Classification</th>
                </tr>
              </thead>
              <tbody>
                {subjectPerformanceData.map((sub, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-1.5 font-medium">{sub.fullSubjectName}</td>
                    <td className="border border-black p-1.5 text-center font-mono">{sub.entries}</td>
                    <td className="border border-black p-1.5 text-center font-bold font-mono">{sub.average}%</td>
                    <td className="border border-black p-1.5 text-center font-mono">{sub.passRate}%</td>
                    <td className="border border-black p-1.5">
                      {sub.average >= 75
                        ? 'Mastery / Distinction'
                        : sub.average >= 60
                        ? 'Commendable Progress'
                        : sub.average >= 50
                        ? 'Satisfactory'
                        : 'Requires Intervention'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Signatures & Verification Block */}
        <div className="pt-6 border-t-2 border-black space-y-4 prevent-split">
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-8">
              <p className="font-semibold text-gray-800">Prepared By (Subject / Class Teacher):</p>
              <div className="border-b border-black w-4/5 mx-auto" />
              <p className="text-[11px] text-gray-600">Signature & Date</p>
            </div>

            <div className="space-y-8">
              <p className="font-semibold text-gray-800">Academic Committee Head:</p>
              <div className="border-b border-black w-4/5 mx-auto" />
              <p className="text-[11px] text-gray-600">Signature & Date</p>
            </div>

            <div className="space-y-8">
              <p className="font-semibold text-gray-800">
                {settings?.headmasterPosition || 'Headmaster / Principal'}:
              </p>
              <div className="border-b border-black w-4/5 mx-auto" />
              <p className="text-[11px] text-gray-600">Official Signature & School Stamp</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-500 font-mono pt-4">
            Official Academic Record generated via EduMaster School Management ERP System.
          </div>
        </div>
      </div>
    </div>
  );
};

