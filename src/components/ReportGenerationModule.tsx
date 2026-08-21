import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  Download,
  Users,
  User,
  RefreshCw,
  CheckCircle2,
  FileText,
  Sparkles,
  School as SchoolIcon,
  Settings,
  Eye,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  QrCode,
  Calendar,
  Layers,
  Award,
  BookOpen,
  Filter,
  Check,
  Stamp,
  PenTool,
  Upload,
  BarChart3
} from 'lucide-react';
import {
  ClassItem,
  Student,
  ScoreEntry,
  School,
  SchoolSettings,
  ExamType,
  TermAttendanceSummary,
  GradingSystem,
  GradeBoundary
} from '../types';
import {
  getClassesBySchool,
  getStudentsBySchool,
  getScoresByQuery,
  getSchoolDetails,
  getSchoolSettings,
  getTermAttendanceSummary,
  getGradingSystemsBySchool
} from '../lib/services';
import {
  calculateRankings,
  formatOrdinalRank,
  DEFAULT_BECE_GRADING,
  DEFAULT_WAEC_GRADING,
  DEFAULT_GPA_GRADING
} from '../lib/academicEngine';
import { triggerPrint } from '../lib/printService';
import { PageHeader, Badge, Button, Modal, Card, StatCard } from './ui';
import { Input, Select, Switch, Textarea } from './FormControls';

interface Props {
  schoolId: string;
}

export type ReportMode = 'SINGLE' | 'BULK' | 'BROADSHEET';

export interface BrandingConfig {
  showLogo: boolean;
  showWatermark: boolean;
  showMotto: boolean;
  showContactInfo: boolean;
  showStudentPhoto: boolean;
  showQRVerification: boolean;
  showAttendanceSummary: boolean;
  showGradingScaleKey: boolean;
  showConductSummary: boolean;
  showFeesSummary: boolean;
  headerThemeColor: 'indigo' | 'emerald' | 'navy' | 'crimson' | 'slate';
}

export interface SignatureConfig {
  teacherSignatureUrl?: string;
  headmasterSignatureUrl?: string;
  officialStampUrl?: string;
  teacherTitle: string;
  headmasterTitle: string;
}

export const ReportGenerationModule: React.FC<Props> = ({ schoolId }) => {
  // Database Data State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [gradingSystems, setGradingSystems] = useState<GradingSystem[]>([]);

  // Selection Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('Term 1');
  const [reportType, setReportType] = useState<'END_OF_TERM' | 'MID_TERM' | 'MOCK'>('END_OF_TERM');
  const [mockNumber, setMockNumber] = useState<number>(1);
  const [selectedGradingScheme, setSelectedGradingScheme] = useState<'BECE' | 'WAEC' | 'GPA' | 'CUSTOM'>('BECE');

  // View Mode
  const [viewMode, setViewMode] = useState<ReportMode>('SINGLE');
  const [isCustomizeDrawerOpen, setIsCustomizeDrawerOpen] = useState<boolean>(false);

  // Scores & Attendance
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [termAttendance, setTermAttendance] = useState<TermAttendanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scoresLoading, setScoresLoading] = useState<boolean>(false);

  // Customization & Branding Settings
  const [branding, setBranding] = useState<BrandingConfig>({
    showLogo: true,
    showWatermark: false,
    showMotto: true,
    showContactInfo: true,
    showStudentPhoto: true,
    showQRVerification: true,
    showAttendanceSummary: true,
    showGradingScaleKey: true,
    showConductSummary: true,
    showFeesSummary: false,
    headerThemeColor: 'indigo'
  });

  const [signatures, setSignatures] = useState<SignatureConfig>({
    teacherTitle: 'Class Teacher',
    headmasterTitle: 'Headmaster / Principal'
  });

  const [vacationDate, setVacationDate] = useState<string>('2026-12-18');
  const [nextTermResumptionDate, setNextTermResumptionDate] = useState<string>('2027-01-12');

  useEffect(() => {
    loadInitialData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedClassId) {
      loadBatchScores();
    }
  }, [selectedClassId, academicYear, term, reportType, mockNumber]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cList, stList, sch, setts, gSystems] = await Promise.all([
        getClassesBySchool(schoolId),
        getStudentsBySchool(schoolId),
        getSchoolDetails(schoolId),
        getSchoolSettings(schoolId),
        getGradingSystemsBySchool(schoolId)
      ]);

      setClasses(cList);
      setStudents(stList);
      setSchool(sch);
      setSettings(setts);
      setGradingSystems(gSystems);

      if (setts?.currentAcademicYear) setAcademicYear(setts.currentAcademicYear);
      if (setts?.currentTerm) setTerm(setts.currentTerm);
      if (setts?.academicCalendar && setts.academicCalendar.length > 0) {
        const cal = setts.academicCalendar[0];
        if (cal.reopeningDate) setNextTermResumptionDate(cal.reopeningDate);
        if (cal.vacationDate) setVacationDate(cal.vacationDate);
      }

      if (cList.length > 0) {
        setSelectedClassId(cList[0].id);
        const classSts = stList.filter((s) => s.classId === cList[0].id);
        if (classSts.length > 0) {
          setSelectedStudentId(classSts[0].id);
        }
      }
    } catch (err) {
      console.error('Error initializing Report Generation Module:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchScores = async () => {
    setScoresLoading(true);
    try {
      let resolvedExamType: ExamType = 'END_OF_TERM';
      let resolvedMockNo: number | undefined = undefined;

      if (reportType === 'MID_TERM') {
        resolvedExamType = 'MID_TERM';
      } else if (reportType === 'MOCK') {
        resolvedExamType = 'MOCK';
        resolvedMockNo = mockNumber;
      } else {
        resolvedExamType = 'END_OF_TERM';
      }

      const [fetchedScores, termAtt] = await Promise.all([
        getScoresByQuery({
          schoolId,
          classId: selectedClassId,
          academicYear,
          term,
          examType: resolvedExamType,
          mockNumber: resolvedMockNo
        }),
        getTermAttendanceSummary(schoolId, academicYear, term, selectedClassId)
      ]);

      setScores(fetchedScores);
      setTermAttendance(termAtt);
    } catch (err) {
      console.error('Error loading report scores:', err);
    } finally {
      setScoresLoading(false);
    }
  };

  // Derived calculations
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId);
  }, [classes, selectedClassId]);

  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || classStudents[0];
  }, [students, selectedStudentId, classStudents]);

  // Active grading boundaries
  const activeBoundaries: GradeBoundary[] = useMemo(() => {
    if (selectedGradingScheme === 'WAEC') return DEFAULT_WAEC_GRADING;
    if (selectedGradingScheme === 'GPA') return DEFAULT_GPA_GRADING;
    if (selectedGradingScheme === 'CUSTOM' && gradingSystems.length > 0) {
      return gradingSystems[0].boundaries;
    }
    return DEFAULT_BECE_GRADING;
  }, [selectedGradingScheme, gradingSystems]);

  // Overall Class Rankings
  interface StudentAggregates {
    studentId: string;
    totalScore: number;
    averageScore: number;
    best6Aggregate: number;
    subjectCount: number;
  }

  const studentAggregatesMap = useMemo(() => {
    return classStudents.map((st) => {
      const stScores = scores.filter((sc) => sc.studentId === st.id);
      const totalScore = stScores.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
      const averageScore = stScores.length > 0 ? totalScore / stScores.length : 0;

      // Best 6 Grade Points Aggregate for Mock/BECE
      const gradePoints = stScores
        .map((sc) => sc.gradePoint || 9)
        .sort((a, b) => a - b);
      const best6Aggregate = gradePoints.slice(0, 6).reduce((acc, pts) => acc + pts, 0);

      return {
        studentId: st.id,
        totalScore,
        averageScore,
        best6Aggregate,
        subjectCount: stScores.length
      };
    });
  }, [classStudents, scores]);

  const rankedStudents = useMemo(() => {
    return calculateRankings<StudentAggregates>(studentAggregatesMap, (s) => s.totalScore);
  }, [studentAggregatesMap]);

  // Quick Student Navigation
  const currentStudentIndex = classStudents.findIndex((s) => s.id === (currentStudent?.id || ''));

  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      setSelectedStudentId(classStudents[currentStudentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < classStudents.length - 1) {
      setSelectedStudentId(classStudents[currentStudentIndex + 1].id);
    }
  };

  // Print Handlers
  const handlePrintCurrent = () => {
    const title = `${reportType}_Report_${currentStudent?.fullName || 'Student'}_${currentClass?.className || 'Class'}_${term}_${academicYear}`.replace(/\s+/g, '_');
    triggerPrint({ documentTitle: title });
  };

  const handlePrintBatch = () => {
    const title = `Class_Reports_${currentClass?.className || 'Class'}_${reportType}_${term}_${academicYear}`.replace(/\s+/g, '_');
    triggerPrint({ documentTitle: title });
  };

  // Header Color Resolver
  const headerBgClass = {
    indigo: 'bg-indigo-700 text-white',
    emerald: 'bg-emerald-700 text-white',
    navy: 'bg-slate-900 text-white',
    crimson: 'bg-rose-800 text-white',
    slate: 'bg-slate-800 text-white'
  }[branding.headerThemeColor];

  const headerBorderColor = {
    indigo: 'border-indigo-600',
    emerald: 'border-emerald-600',
    navy: 'border-slate-900',
    crimson: 'border-rose-700',
    slate: 'border-slate-800'
  }[branding.headerThemeColor];

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-xs uppercase font-bold tracking-wider">Initializing Report Generation Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Top Header Controls (Hidden on Print) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="active" label="Report Card Studio" icon={<Award className="w-3.5 h-3.5" />} />
              <Badge
                variant="neutral"
                label={reportType === 'END_OF_TERM' ? 'End-of-Term' : reportType === 'MID_TERM' ? 'Mid-Term' : `Mock ${mockNumber}`}
              />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Official Academic Report Generation Module
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive report generation engine with dynamic branding injection, automated single-page A4 breaks, signatures, and grading schemes.
            </p>
          </div>

          {/* Action Button Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sliders className="w-4 h-4" />}
              onClick={() => setIsCustomizeDrawerOpen(!isCustomizeDrawerOpen)}
            >
              Branding & Layout Settings
            </Button>

            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setViewMode('SINGLE')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'SINGLE'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Single Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode('BULK')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'BULK'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Class Batch ({classStudents.length})
              </button>
            </div>

            {viewMode === 'SINGLE' ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrintCurrent}
              >
                Print Student Report
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrintBatch}
              >
                Batch Print All ({classStudents.length})
              </Button>
            )}
          </div>
        </div>

        {/* Global Report Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <Select
              label="1. Target Class"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const classSts = students.filter((s) => s.classId === e.target.value);
                if (classSts.length > 0) setSelectedStudentId(classSts[0].id);
              }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="2. Report Assessment Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
            >
              <option value="END_OF_TERM">End-of-Term Terminal Report</option>
              <option value="MID_TERM">Mid-Term Progressive Report</option>
              <option value="MOCK">BECE / WAEC Mock Examination</option>
            </Select>
          </div>

          {reportType === 'MOCK' ? (
            <div>
              <Select
                label="3. Mock Examination Series"
                value={mockNumber}
                onChange={(e) => setMockNumber(parseInt(e.target.value, 10))}
              >
                <option value={1}>Mock 1 Examination</option>
                <option value={2}>Mock 2 Examination</option>
                <option value={3}>Mock 3 Examination</option>
                <option value={4}>Mock 4 Examination</option>
                <option value={5}>Mock 5 Examination</option>
              </Select>
            </div>
          ) : (
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
          )}

          <div>
            <Input
              label="4. Academic Year"
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </div>

          <div>
            <Select
              label="5. Grading Scale Scheme"
              value={selectedGradingScheme}
              onChange={(e) => setSelectedGradingScheme(e.target.value as any)}
            >
              <option value="BECE">BECE / NaCCA 9-Point Scale</option>
              <option value="WAEC">WASSCE / WAEC SHS Scale</option>
              <option value="GPA">Standard 4.0 GPA Scale</option>
              {gradingSystems.length > 0 && <option value="CUSTOM">Custom School Grading Scale</option>}
            </Select>
          </div>
        </div>

        {/* Single Student Selector Navigation */}
        {viewMode === 'SINGLE' && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Active Student ({currentStudentIndex + 1} of {classStudents.length}):
              </span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {classStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.admissionNo})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                onClick={handlePrevStudent}
                disabled={currentStudentIndex <= 0}
              >
                Prev Student
              </Button>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={handleNextStudent}
                disabled={currentStudentIndex >= classStudents.length - 1}
              >
                Next Student
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customization Drawer / Settings Modal (Hidden in Print) */}
      <Modal
        isOpen={isCustomizeDrawerOpen}
        onClose={() => setIsCustomizeDrawerOpen(false)}
        title="Report Card Branding & Layout Customization"
        description="Toggle branding elements, stamp watermarks, and signature titles for official print export."
        maxWidth="2xl"
      >
        <div className="space-y-6 text-xs">
          {/* Theme Color Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Header Banner Theme Accent
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'indigo', label: 'Royal Indigo', bg: 'bg-indigo-600' },
                { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-600' },
                { id: 'navy', label: 'Classic Navy', bg: 'bg-slate-900' },
                { id: 'crimson', label: 'Crimson Wine', bg: 'bg-rose-700' },
                { id: 'slate', label: 'Monochrome', bg: 'bg-slate-700' }
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setBranding({ ...branding, headerThemeColor: c.id as any })}
                  className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    branding.headerThemeColor === c.id
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${c.bg} shadow-xs`} />
                  <span className="text-[10px] text-slate-800 dark:text-slate-200">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Switch
              label="Display Official School Logo"
              checked={branding.showLogo}
              onChange={(v) => setBranding({ ...branding, showLogo: v })}
            />
            <Switch
              label="Display Student Passport Photo"
              checked={branding.showStudentPhoto}
              onChange={(v) => setBranding({ ...branding, showStudentPhoto: v })}
            />
            <Switch
              label="Display School Motto"
              checked={branding.showMotto}
              onChange={(v) => setBranding({ ...branding, showMotto: v })}
            />
            <Switch
              label="Display QR Code Verification"
              checked={branding.showQRVerification}
              onChange={(v) => setBranding({ ...branding, showQRVerification: v })}
            />
            <Switch
              label="Display Term Attendance Rate"
              checked={branding.showAttendanceSummary}
              onChange={(v) => setBranding({ ...branding, showAttendanceSummary: v })}
            />
            <Switch
              label="Display Grading Scale Reference Key"
              checked={branding.showGradingScaleKey}
              onChange={(v) => setBranding({ ...branding, showGradingScaleKey: v })}
            />
            <Switch
              label="Display Character & Conduct Remarks"
              checked={branding.showConductSummary}
              onChange={(v) => setBranding({ ...branding, showConductSummary: v })}
            />
            <Switch
              label="Display Background Watermark Crest"
              checked={branding.showWatermark}
              onChange={(v) => setBranding({ ...branding, showWatermark: v })}
            />
          </div>

          {/* Resumption & Vacation Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Term Vacation Date"
              type="date"
              value={vacationDate}
              onChange={(e) => setVacationDate(e.target.value)}
            />
            <Input
              label="Next Term Resumption Date"
              type="date"
              value={nextTermResumptionDate}
              onChange={(e) => setNextTermResumptionDate(e.target.value)}
            />
          </div>

          {/* Signatory Titles */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Teacher Signature Title"
              value={signatures.teacherTitle}
              onChange={(e) => setSignatures({ ...signatures, teacherTitle: e.target.value })}
            />
            <Input
              label="Headmaster Signature Title"
              value={signatures.headmasterTitle}
              onChange={(e) => setSignatures({ ...signatures, headmasterTitle: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCustomizeDrawerOpen(false)}
            >
              Apply Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* Main Report Container */}
      <div className="space-y-8">
        {(viewMode === 'SINGLE' ? [currentStudent] : classStudents).map((st) => {
          if (!st) return null;

          const stScores = scores.filter((sc) => sc.studentId === st.id);
          const stRank = rankedStudents.find((r) => r.studentId === st.id);
          const totalScore = stScores.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
          const averageScore = stScores.length > 0 ? totalScore / stScores.length : 0;
          const best6Aggregate = stRank?.best6Aggregate || 0;

          // Attendance info
          const stAtt = termAttendance?.students?.find((a) => a.studentId === st.id);
          const daysPresent = stAtt ? stAtt.studentTotalAttendanceDays : 0;
          const totalSchoolDays = stAtt ? stAtt.totalSchoolAttendanceDays : termAttendance?.defaultTotalSchoolDays || 60;
          const attendancePercent = totalSchoolDays > 0 ? ((daysPresent / totalSchoolDays) * 100).toFixed(1) : '0.0';

          return (
            <div
              key={st.id}
              className="bg-white dark:bg-slate-900 print:bg-white print:text-black p-6 sm:p-8 print:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 print:border-none shadow-xs max-w-4xl mx-auto space-y-4 text-xs font-sans page-break-after one-page-report relative overflow-hidden"
            >
              {/* Optional Background Watermark */}
              {branding.showWatermark && school?.logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
                  <img src={school.logoUrl} alt="Watermark" className="w-96 h-96 object-contain" />
                </div>
              )}

              {/* REPORT HEADER */}
              <div className={`flex items-center justify-between border-b-2 ${headerBorderColor} pb-4 relative z-10`}>
                <div className="flex items-center gap-3.5">
                  {branding.showLogo && (
                    <div className="shrink-0">
                      {school?.logoUrl ? (
                        <img
                          src={school.logoUrl}
                          alt="School Crest"
                          className="w-14 h-14 rounded-xl object-contain bg-white p-1 border border-slate-200 print:border-black/20 shadow-xs"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 border border-indigo-200">
                          <SchoolIcon className="w-7 h-7" />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
                      {school?.name || 'ACHIMOTA SENIOR ACADEMY'}
                    </h1>
                    {branding.showMotto && school?.motto && (
                      <p className="text-[11px] font-semibold italic text-indigo-600 dark:text-indigo-400 print:text-black">
                        "{school.motto}"
                      </p>
                    )}
                    {branding.showContactInfo && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black/70 mt-0.5">
                        {school?.address || 'P.O. Box 102, Accra'} • {school?.district || 'Accra Metro'}, {school?.region || 'Greater Accra'} • Tel: {school?.phone || '+233 24 123 4567'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`px-3 py-1 font-extrabold rounded-lg text-[10px] uppercase tracking-wider shadow-xs ${headerBgClass}`}>
                    {reportType === 'END_OF_TERM'
                      ? 'TERMINAL REPORT'
                      : reportType === 'MID_TERM'
                      ? 'MID-TERM REPORT'
                      : `MOCK ${mockNumber} REPORT`}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black font-mono mt-1 font-bold">
                    ACADEMIC YEAR: {academicYear}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black font-semibold">
                    {term}
                  </p>
                </div>
              </div>

              {/* STUDENT PROFILE & METRICS SUMMARY */}
              <div className="grid grid-cols-12 gap-3 bg-slate-50 dark:bg-slate-800/50 print:bg-gray-100 p-3 rounded-xl border border-slate-200 dark:border-slate-700 print:border-black/20 relative z-10">
                {branding.showStudentPhoto && (
                  <div className="col-span-2 flex items-center justify-center">
                    {st.passportPhotoUrl ? (
                      <img
                        src={st.passportPhotoUrl}
                        alt={st.fullName}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-300 dark:border-slate-600 print:border-black/30 shadow-xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-base">
                        {st.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                )}

                <div className={branding.showStudentPhoto ? 'col-span-6 space-y-1' : 'col-span-8 space-y-1'}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 print:text-black/70 uppercase">
                      STUDENT NAME:
                    </span>
                    <strong className="text-sm font-extrabold text-slate-900 dark:text-white print:text-black">
                      {st.fullName}
                    </strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 print:text-black/70">Admission No: </span>
                      <strong className="font-mono text-slate-900 dark:text-white print:text-black">{st.admissionNo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 print:text-black/70">Class: </span>
                      <strong className="text-slate-900 dark:text-white print:text-black">{currentClass?.className}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 print:text-black/70">Gender: </span>
                      <strong className="text-slate-900 dark:text-white print:text-black">{st.gender}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 print:text-black/70">Class Size: </span>
                      <strong className="text-slate-900 dark:text-white print:text-black">{classStudents.length} Students</strong>
                    </div>
                  </div>
                </div>

                <div className="col-span-4 border-l border-slate-200 dark:border-slate-700 print:border-black/20 pl-3 flex flex-col justify-center space-y-1 text-right">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 print:text-black/70 block">
                      Class Position
                    </span>
                    <strong className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 print:text-black font-mono">
                      {stRank ? formatOrdinalRank(stRank.rank) : '-'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-end gap-2 text-[10px] font-mono">
                    <span className="text-slate-500 dark:text-slate-400 print:text-black/70">Total: </span>
                    <strong className="text-slate-900 dark:text-white print:text-black">{totalScore.toFixed(1)}</strong>
                    <span>•</span>
                    <span className="text-slate-500 dark:text-slate-400 print:text-black/70">Avg: </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 print:text-black">{averageScore.toFixed(1)}%</strong>
                  </div>

                  {reportType === 'MOCK' && (
                    <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 print:text-black">
                      Best 6 Aggregate: <span className="font-mono text-xs">{best6Aggregate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ACADEMIC SCORES TABLE */}
              <div className="relative z-10">
                <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 print:border-black/30 text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 print:bg-gray-200 text-slate-800 dark:text-slate-200 print:text-black uppercase text-[10px] border-b border-slate-200 dark:border-slate-800 print:border-black/30 font-extrabold">
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20">Subject</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center w-16">
                        SBA ({reportType === 'END_OF_TERM' ? '30/50' : 'SBA'})
                      </th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center w-16">
                        Exam ({reportType === 'END_OF_TERM' ? '70/50' : 'Exam'})
                      </th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center w-16 font-bold">
                        Total /100
                      </th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center w-14 font-bold">
                        Grade
                      </th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center w-14">
                        Rank
                      </th>
                      <th className="p-2 text-left">Teacher Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black/20">
                    {stScores.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          No scores recorded for this assessment session.
                        </td>
                      </tr>
                    ) : (
                      stScores.map((sc) => (
                        <tr key={sc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 font-bold text-slate-900 dark:text-white print:text-black">
                            {sc.subjectName}
                          </td>
                          <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-mono">
                            {(sc.sbaScaledScore || 0).toFixed(1)}
                          </td>
                          <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-mono">
                            {(sc.examScaledScore || 0).toFixed(1)}
                          </td>
                          <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-bold font-mono text-slate-900 dark:text-white print:text-black">
                            {(sc.finalScore || 0).toFixed(1)}
                          </td>
                          <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-extrabold font-mono text-indigo-600 dark:text-indigo-400 print:text-black">
                            {sc.grade || 'A1'}
                          </td>
                          <td className="p-2 border-r border-slate-200 dark:border-slate-800 print:border-black/20 text-center font-mono text-slate-500 dark:text-slate-400 print:text-black">
                            {sc.classRank ? formatOrdinalRank(sc.classRank) : '-'}
                          </td>
                          <td className="p-2 text-slate-700 dark:text-slate-300 print:text-black text-[11px]">
                            {sc.remark || 'Good performance'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ATTENDANCE & CONDUCT SECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                {branding.showAttendanceSummary && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 print:bg-gray-100 rounded-xl border border-slate-200 dark:border-slate-700 print:border-black/20 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 print:text-black/70 uppercase block">
                      Attendance Record
                    </span>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Total Days: <strong>{totalSchoolDays}</strong></span>
                      <span>Attended: <strong>{daysPresent}</strong></span>
                      <span className="text-emerald-600 dark:text-emerald-400 print:text-black font-bold">
                        Rate: {attendancePercent}%
                      </span>
                    </div>
                  </div>
                )}

                {branding.showConductSummary && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 print:bg-gray-100 rounded-xl border border-slate-200 dark:border-slate-700 print:border-black/20 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 print:text-black/70 uppercase block">
                      Character & Conduct
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>Attitude: <strong>Satisfactory</strong></div>
                      <div>Punctuality: <strong>Regular</strong></div>
                      <div>Conduct: <strong>Exemplary</strong></div>
                      <div>Interest: <strong>Academics & Sports</strong></div>
                    </div>
                  </div>
                )}
              </div>

              {/* REMARKS & SIGNATURES SECTION */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 print:border-black/20 space-y-3 relative z-10">
                {/* Comments Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 print:text-black/70 uppercase">
                      Class Teacher's General Remarks:
                    </span>
                    <p className="p-2 bg-slate-50 dark:bg-slate-800/40 print:bg-transparent rounded-lg border border-slate-200 dark:border-slate-800 print:border-none italic text-slate-800 dark:text-slate-200 print:text-black text-[11px]">
                      {averageScore >= 70
                        ? 'An outstanding academic performance. Demonstrates strong analytical ability and high diligence.'
                        : averageScore >= 50
                        ? 'Good academic effort shown this term. Consistent practice in core subjects will yield further improvement.'
                        : 'Needs closer monitoring and intensive study time, especially in numeracy and science fundamentals.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 print:text-black/70 uppercase">
                      Headmaster's Recommendation:
                    </span>
                    <p className="p-2 bg-slate-50 dark:bg-slate-800/40 print:bg-transparent rounded-lg border border-slate-200 dark:border-slate-800 print:border-none italic text-slate-800 dark:text-slate-200 print:text-black text-[11px]">
                      {averageScore >= 60
                        ? 'Promising academic trajectory. Keep up the high standard of academic excellence and good conduct.'
                        : 'Encouraged to attend remedial clinics during the vacation period. Recommended for targeted support.'}
                    </p>
                  </div>
                </div>

                {/* Signatures & Stamp Row */}
                <div className="grid grid-cols-3 gap-4 pt-3 items-end text-xs">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 print:text-black/70 text-[10px]">{signatures.teacherTitle}:</p>
                    <div className="border-b border-dashed border-slate-400 dark:border-slate-600 print:border-black/50 w-36 mt-4 mb-1"></div>
                    <p className="font-bold text-slate-900 dark:text-white print:text-black text-[11px]">
                      {currentClass?.classTeacherName || 'Class Teacher'}
                    </p>
                  </div>

                  <div className="text-center flex flex-col items-center">
                    {branding.showQRVerification ? (
                      <div className="flex flex-col items-center">
                        <div className="p-1 bg-white border border-slate-200 dark:border-slate-700 print:border-black/20 rounded shadow-2xs">
                          <QrCode className="w-10 h-10 text-slate-900" />
                        </div>
                        <span className="text-[8px] text-slate-400 print:text-black/60 mt-0.5 uppercase tracking-wider font-mono">
                          ID: {st.admissionNo}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Stamp className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                        <span className="text-[9px] text-slate-400 uppercase">Official Seal</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-slate-500 dark:text-slate-400 print:text-black/70 text-[10px]">{signatures.headmasterTitle}:</p>
                    <div className="border-b border-dashed border-slate-400 dark:border-slate-600 print:border-black/50 w-36 ml-auto mt-4 mb-1"></div>
                    <p className="font-bold text-slate-900 dark:text-white print:text-black text-[11px]">
                      {settings?.headmasterName || 'Headmaster'}
                    </p>
                  </div>
                </div>
              </div>

              {/* DATES & GRADING SCALE FOOTER */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 print:border-black/20 text-[9px] space-y-1.5 relative z-10">
                <div className="flex flex-wrap items-center justify-between text-slate-600 dark:text-slate-400 print:text-black font-semibold">
                  <span>Term Vacation: <strong>{vacationDate}</strong></span>
                  <span>Next Term Resumes: <strong className="text-indigo-600 dark:text-indigo-400 print:text-black">{nextTermResumptionDate}</strong></span>
                  <span>Report Generated: <strong>{new Date().toLocaleDateString()}</strong></span>
                </div>

                {branding.showGradingScaleKey && (
                  <div className="bg-slate-50 dark:bg-slate-800/30 print:bg-transparent p-1.5 rounded border border-slate-200 dark:border-slate-700 print:border-black/10 text-[8px] flex flex-wrap items-center justify-between text-slate-500 dark:text-slate-400 print:text-black">
                    <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">
                      Grading Key:
                    </span>
                    {activeBoundaries.slice(0, 9).map((b) => (
                      <span key={b.grade}>
                        <strong>{b.grade}</strong> ({b.minScore}-{b.maxScore}%): {b.remarks}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
