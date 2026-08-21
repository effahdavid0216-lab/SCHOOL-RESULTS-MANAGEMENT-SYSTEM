import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  FileText,
  Printer,
  Search,
  Award,
  Download,
  CheckCircle2,
  School as SchoolIcon,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  QrCode,
  ShieldCheck,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Sliders,
  Sparkles,
  Layers,
  LayoutGrid,
  Eye,
  RefreshCw,
  Scissors
} from 'lucide-react';
import { Student, School, SchoolSettings, ScoreEntry, SubjectItem, ClassItem } from '../types';
import {
  getStudentsBySchool,
  getClassesBySchool,
  getSchoolDetails,
  getSchoolSettings,
  getScoresByQuery,
  getSubjectsBySchool
} from '../lib/services';
import { printStudentIDCards, printOfficialDocument } from '../lib/printService';
import { PageHeader, Badge, Button, Select, Input } from './ui';

interface Props {
  schoolId: string;
}

export const DocumentAndIDCardView: React.FC<Props> = ({ schoolId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [studentScores, setStudentScores] = useState<ScoreEntry[]>([]);

  // Selection & Mode States
  const [docType, setDocType] = useState<'IDCARD' | 'TESTIMONIAL' | 'TRANSCRIPT' | 'RECOMMENDATION'>('IDCARD');
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<'SINGLE' | 'A4_SHEET'>('SINGLE');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Configurable ID Card Layout Options
  const [layoutOrientation, setLayoutOrientation] = useState<'VERTICAL' | 'HORIZONTAL'>('VERTICAL');
  const [cardsPerPage, setCardsPerPage] = useState<number>(8); // 4, 8, 10
  const [showBackOfCard, setShowBackOfCard] = useState<boolean>(true);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [cardAccentColor, setCardAccentColor] = useState<string>('INDIGO'); // INDIGO, BLUE, EMERALD, CRIMSON, GOLD

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [stList, clsList, sch, setts, subjs] = await Promise.all([
      getStudentsBySchool(schoolId),
      getClassesBySchool(schoolId),
      getSchoolDetails(schoolId),
      getSchoolSettings(schoolId),
      getSubjectsBySchool(schoolId)
    ]);
    setStudents(stList);
    setClasses(clsList);
    setSchool(sch);
    setSchoolSettings(setts);
    setSubjects(subjs);

    if (setts?.currentAcademicYear) {
      setAcademicYear(setts.currentAcademicYear);
    }

    if (stList.length > 0) {
      setSelectedStudentIds([stList[0].id]);
    }
    setLoading(false);
  };

  // Filter students based on class selection and search query
  const filteredStudents = useMemo(() => {
    let list = students;
    if (selectedClassId !== 'ALL') {
      list = list.filter((s) => s.classId === selectedClassId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q) ||
          (s.className && s.className.toLowerCase().includes(q))
      );
    }
    return list;
  }, [students, selectedClassId, searchQuery]);

  // Selected students to print/preview
  const targetStudents = useMemo(() => {
    return students.filter((s) => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  const primarySelectedStudent = targetStudents.length > 0 ? targetStudents[0] : null;

  useEffect(() => {
    if (primarySelectedStudent) {
      loadStudentScores(primarySelectedStudent.id);
    }
  }, [primarySelectedStudent?.id]);

  const loadStudentScores = async (stuId: string) => {
    const scores = await getScoresByQuery({ schoolId, studentId: stuId });
    setStudentScores(scores);
  };

  const handleSelectAllInClass = () => {
    const classStudentIds = filteredStudents.map((s) => s.id);
    setSelectedStudentIds(classStudentIds);
  };

  const handleClearSelection = () => {
    if (filteredStudents.length > 0) {
      setSelectedStudentIds([filteredStudents[0].id]);
    } else {
      setSelectedStudentIds([]);
    }
  };

  const toggleStudentSelection = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      if (selectedStudentIds.length > 1) {
        setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
      }
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const schoolName = school?.name || 'EduMaster International Academy';
  const schoolMotto = school?.motto || 'Excellence in Knowledge & Character';
  const schoolPhone = school?.phone || '0592005260';
  const schoolEmail = school?.email || 'admin@school.edu.gh';
  const schoolAddress = school?.address || `${school?.district || 'Accra'}, ${school?.region || 'Greater Accra'}`;
  const headmasterName = schoolSettings?.headmasterName || 'Rev. Dr. Kwesi Mensah';
  const headmasterSignature = schoolSettings?.headmasterSignatureUrl;
  const schoolLogo = school?.logoUrl || schoolSettings?.schoolLogoUrl;

  const handlePrint = () => {
    if (docType === 'IDCARD') {
      window.print();
    } else {
      printOfficialDocument(docType, primarySelectedStudent?.fullName || 'Student');
    }
  };

  const getAccentClass = () => {
    switch (cardAccentColor) {
      case 'BLUE':
        return 'from-blue-900 via-slate-900 to-slate-950 border-blue-500/40 text-blue-400';
      case 'EMERALD':
        return 'from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/40 text-emerald-400';
      case 'CRIMSON':
        return 'from-rose-950 via-slate-900 to-slate-950 border-rose-500/40 text-rose-400';
      case 'GOLD':
        return 'from-amber-950 via-slate-900 to-slate-950 border-amber-500/40 text-amber-400';
      default:
        return 'from-indigo-950 via-slate-900 to-slate-950 border-indigo-500/40 text-indigo-400';
    }
  };

  const getAccentBg = () => {
    switch (cardAccentColor) {
      case 'BLUE':
        return 'bg-blue-600';
      case 'EMERALD':
        return 'bg-emerald-600';
      case 'CRIMSON':
        return 'bg-rose-600';
      case 'GOLD':
        return 'bg-amber-600';
      default:
        return 'bg-indigo-600';
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Loading Student ID Card & Certification Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Top Controls (Hidden in Print) */}
      <div className="print:hidden space-y-4">
        <PageHeader
          title="Student ID Card & Certification Studio"
          subtitle="Generate high-resolution photo ID badges, A4 multi-card printable sheets, testimonials, transcripts, and recommendation letters."
          badge={<Badge variant="active" label="Card Printing Engine Ready" icon={<Sparkles className="w-3 h-3" />} />}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<LayoutGrid className="w-4 h-4" />}
                onClick={() => setPreviewMode(previewMode === 'SINGLE' ? 'A4_SHEET' : 'SINGLE')}
              >
                {previewMode === 'SINGLE' ? 'Switch to A4 Sheet Mode' : 'Switch to Single Badge'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
                disabled={targetStudents.length === 0}
              >
                Print / Save PDF ({targetStudents.length} Cards)
              </Button>
            </div>
          }
        />

        {/* Document Format Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setDocType('IDCARD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              docType === 'IDCARD'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" /> 8. Student ID Card Module
          </button>
          <button
            onClick={() => setDocType('TESTIMONIAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              docType === 'TESTIMONIAL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Official Testimonial
          </button>
          <button
            onClick={() => setDocType('RECOMMENDATION')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              docType === 'RECOMMENDATION'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" /> Recommendation Letter
          </button>
          <button
            onClick={() => setDocType('TRANSCRIPT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              docType === 'TRANSCRIPT'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Official Transcript
          </button>
        </div>

        {/* Filter Controls & Layout Customizer Toolbar */}
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
              label="Class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="ALL">All Classes ({students.length} Students)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Theme Accent Color"
              value={cardAccentColor}
              onChange={(e) => setCardAccentColor(e.target.value)}
            >
              <option value="INDIGO">Royal Indigo</option>
              <option value="BLUE">Navy Blue</option>
              <option value="EMERALD">Classic Emerald</option>
              <option value="CRIMSON">Crimson Maroon</option>
              <option value="GOLD">Imperial Amber</option>
            </Select>
          </div>

          <div>
            <Select
              label="Orientation"
              value={layoutOrientation}
              onChange={(e) => setLayoutOrientation(e.target.value as any)}
            >
              <option value="VERTICAL">Vertical Lanyard Badge</option>
              <option value="HORIZONTAL">Horizontal Pocket Card</option>
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

      {/* Main Grid: Student Selection Sidebar + Canvas View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Student Selection List (Hidden in Print) */}
        <div className="print:hidden lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Students ({filteredStudents.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSelectAllInClass}
                className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto space-y-1.5 pr-1">
            {filteredStudents.map((st) => {
              const isSelected = selectedStudentIds.includes(st.id);
              return (
                <div
                  key={st.id}
                  onClick={() => toggleStudentSelection(st.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer text-xs transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-indigo-600">
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {st.photoUrl ? (
                      <img src={st.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">{st.fullName}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {st.admissionNo} • {st.className}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Selected Cards:</span>
              <span className="font-bold text-indigo-600">{selectedStudentIds.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">A4 Pages:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {Math.ceil(selectedStudentIds.length / cardsPerPage) || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Preview Canvas */}
        <div className="lg:col-span-3 bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[560px] flex items-center justify-center print:bg-white print:p-0 print:border-none">
          {targetStudents.length === 0 ? (
            <div className="text-center text-slate-400 text-xs py-12">
              Please select at least one student from the directory to generate ID cards.
            </div>
          ) : docType === 'IDCARD' ? (
            /* ========================================================================= */
            /* 1. STUDENT ID CARDS (Single or Multi-Grid A4 Sheet)                      */
            /* ========================================================================= */
            previewMode === 'SINGLE' && primarySelectedStudent ? (
              <div className="w-full max-w-md space-y-6">
                {/* Front of Card */}
                <div
                  className={`bg-gradient-to-br ${getAccentClass()} border-2 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white space-y-4`}
                >
                  {/* Decorative Header */}
                  <div className="flex items-center gap-3 border-b border-white/20 pb-3">
                    <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                      {schoolLogo ? (
                        <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <SchoolIcon className="w-6 h-6 text-slate-800" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-xs uppercase tracking-wider text-white truncate">{schoolName}</h3>
                      <p className="text-[9px] text-white/80 uppercase font-semibold">{schoolMotto}</p>
                    </div>
                  </div>

                  {/* Student Body Info */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-1">
                      <div className="w-24 h-28 rounded-2xl bg-white/10 border-2 border-white/40 overflow-hidden shadow-lg mx-auto flex items-center justify-center">
                        {primarySelectedStudent.photoUrl ? (
                          <img src={primarySelectedStudent.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-white/60" />
                        )}
                      </div>
                      <span className="block text-center text-[9px] font-bold text-white/70 uppercase mt-1">STUDENT</span>
                    </div>

                    <div className="col-span-2 space-y-1.5 text-xs">
                      <div>
                        <span className="text-[9px] text-white/60 uppercase font-bold block">FULL NAME</span>
                        <span className="text-sm font-black text-white block leading-tight">{primarySelectedStudent.fullName}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                        <div>
                          <span className="text-[8px] text-white/60 uppercase font-bold block">ADMISSION NO</span>
                          <span className="font-mono font-bold text-white text-[11px]">{primarySelectedStudent.admissionNo}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-white/60 uppercase font-bold block">CLASS</span>
                          <span className="font-bold text-white text-[11px]">{primarySelectedStudent.className}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[8px] text-white/60 uppercase font-bold block">ACADEMIC YEAR</span>
                          <span className="font-mono font-bold text-white text-[11px]">{academicYear}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-white/60 uppercase font-bold block">STATUS</span>
                          <span className="font-bold text-emerald-400 text-[11px]">ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Bar */}
                  <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[8px] text-white/80">
                    <div className="space-y-0.5">
                      <p className="flex items-center gap-1 font-mono">📍 {schoolAddress}</p>
                      <p className="flex items-center gap-1 font-mono">📞 {schoolPhone} • ✉️ {schoolEmail}</p>
                    </div>
                    {showQrCode && (
                      <div className="w-8 h-8 bg-white p-0.5 rounded-lg flex items-center justify-center shrink-0">
                        <QrCode className="w-full h-full text-slate-900" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Back of Card Preview */}
                {showBackOfCard && (
                  <div className="bg-slate-900 text-white border-2 border-slate-700 rounded-3xl p-5 shadow-xl space-y-3 text-[10px]">
                    <div className="text-center font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                      TERMS & OFFICIAL CONDITIONS
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-[9px] leading-relaxed">
                      <li>This card remains the property of {schoolName}.</li>
                      <li>It must be presented upon request during school hours and examinations.</li>
                      <li>If found, please return to the school administration office or call {schoolPhone}.</li>
                    </ul>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-400">
                      <span>Headmaster: <strong>{headmasterName}</strong></span>
                      <span className="font-mono">VALID: {academicYear}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* A4 Printable Sheet Multi-Card Grid */
              <div className="w-full bg-white text-slate-900 p-8 rounded-2xl shadow-xl print:p-0 print:shadow-none space-y-6">
                <div className="text-center border-b border-slate-200 pb-3 print:hidden">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    A4 Printable Sheet Layout ({targetStudents.length} Cards • 8 Cards/Sheet)
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {targetStudents.map((st) => (
                    <div
                      key={st.id}
                      className="border-2 border-dashed border-slate-300 rounded-2xl p-4 relative bg-slate-50 space-y-3 text-xs"
                    >
                      <div className="absolute top-2 right-2 text-slate-300">
                        <Scissors className="w-3 h-3" />
                      </div>

                      {/* Header */}
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {schoolLogo ? <img src={schoolLogo} alt="Logo" className="w-full h-full object-cover rounded-lg" /> : 'ID'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-[10px] uppercase text-slate-900 truncate">{schoolName}</h4>
                          <p className="text-[8px] text-slate-500 uppercase">{schoolMotto}</p>
                        </div>
                      </div>

                      {/* Student Body */}
                      <div className="flex gap-3 items-center">
                        <div className="w-16 h-20 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                          {st.photoUrl ? (
                            <img src={st.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5 text-[9px]">
                          <p className="font-bold text-slate-900 text-[11px] truncate">{st.fullName}</p>
                          <p className="text-slate-600 font-mono">Adm: {st.admissionNo}</p>
                          <p className="text-slate-600">Class: <strong>{st.className}</strong></p>
                          <p className="text-slate-600 font-mono">Year: {academicYear}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 font-mono">
                        <span>📞 {schoolPhone}</span>
                        <span>Official ID Badge</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : docType === 'TESTIMONIAL' && primarySelectedStudent ? (
            /* ========================================================================= */
            /* 2. TESTIMONIAL DOCUMENT                                                   */
            /* ========================================================================= */
            <div className="w-full max-w-xl bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-xl space-y-5 text-xs">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                    {schoolLogo ? <img src={schoolLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" /> : '🏫'}
                  </div>
                  <div>
                    <h2 className="text-base font-black uppercase text-slate-900">{schoolName}</h2>
                    <p className="text-[10px] text-slate-600">{schoolAddress} • {schoolPhone}</p>
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-500">
                  <p>Ref: {primarySelectedStudent.admissionNo}/TEST/2026</p>
                  <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              <h3 className="text-center font-bold text-sm uppercase tracking-wider underline text-slate-900">
                OFFICIAL STUDENT TESTIMONIAL
              </h3>

              <p className="leading-relaxed text-justify text-slate-800 text-[13px]">
                This is to certify that <strong>{primarySelectedStudent.fullName}</strong> (Admission No: <strong>{primarySelectedStudent.admissionNo}</strong>) was a registered student of <strong>{schoolName}</strong> in <strong>{primarySelectedStudent.className}</strong>.
              </p>

              <p className="leading-relaxed text-justify text-slate-800 text-[13px]">
                During their tenure at our institution, their conduct and moral character were found to be exemplary, law-abiding, and in full alignment with the highest academic standards of the school.
              </p>

              <div className="pt-8 flex items-end justify-between text-[11px] border-t border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">{headmasterName}</p>
                  <p className="text-slate-500 text-[10px]">Headmaster / Principal</p>
                </div>
                <div className="text-center">
                  {headmasterSignature ? (
                    <img src={headmasterSignature} alt="Signature" className="h-10 max-w-[120px] object-contain mx-auto mb-1" />
                  ) : (
                    <div className="w-32 h-10 border-b-2 border-slate-400 mb-1" />
                  )}
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">OFFICIAL SEAL & STAMP</span>
                </div>
              </div>
            </div>
          ) : docType === 'RECOMMENDATION' && primarySelectedStudent ? (
            /* ========================================================================= */
            /* 3. RECOMMENDATION LETTER                                                  */
            /* ========================================================================= */
            <div className="w-full max-w-xl bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-xl space-y-5 text-xs">
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-base font-black uppercase text-slate-900">{schoolName}</h2>
                  <p className="text-[10px] text-slate-600">{schoolAddress} • {schoolPhone}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-mono">
                  <p>Ref: {primarySelectedStudent.admissionNo}/REC/2026</p>
                  <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              <h3 className="text-center font-bold text-sm uppercase tracking-wider underline text-slate-900">
                LETTER OF ACADEMIC RECOMMENDATION
              </h3>

              <p className="font-semibold text-slate-800">To Whom It May Concern,</p>

              <p className="leading-relaxed text-justify text-slate-800 text-[13px]">
                I have the distinct honor of writing this formal recommendation in support of <strong>{primarySelectedStudent.fullName}</strong> (Admission No: <strong>{primarySelectedStudent.admissionNo}</strong>), enrolled in <strong>{primarySelectedStudent.className}</strong>.
              </p>

              <p className="leading-relaxed text-justify text-slate-800 text-[13px]">
                Throughout their academic journey at <strong>{schoolName}</strong>, {primarySelectedStudent.fullName} has demonstrated commendable intellectual curiosity, disciplined study habits, and outstanding leadership qualities among their peers.
              </p>

              <div className="pt-8 flex items-end justify-between text-[11px] border-t border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">{headmasterName}</p>
                  <p className="text-slate-500 text-[10px]">Head of Institution</p>
                </div>
                <div className="text-center">
                  {headmasterSignature ? (
                    <img src={headmasterSignature} alt="Signature" className="h-10 max-w-[120px] object-contain mx-auto mb-1" />
                  ) : (
                    <div className="w-32 h-10 border-b-2 border-slate-400 mb-1" />
                  )}
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Authorized Signature</span>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 4. OFFICIAL TRANSCRIPT                                                    */
            /* ========================================================================= */
            primarySelectedStudent && (
              <div className="w-full max-w-xl bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-xl space-y-4 text-xs">
                <div className="border-b-2 border-slate-900 pb-3 text-center">
                  <h2 className="text-base font-black uppercase text-slate-900">{schoolName}</h2>
                  <p className="text-[10px] text-slate-600 uppercase font-semibold">OFFICIAL ACADEMIC TRANSCRIPT & RECORD OF PERFORMANCE</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Student: {primarySelectedStudent.fullName} ({primarySelectedStudent.admissionNo}) • Class: {primarySelectedStudent.className}
                  </p>
                </div>

                <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300">Subject Course</th>
                      <th className="p-2 border-r border-slate-300 text-center">SBA (50%)</th>
                      <th className="p-2 border-r border-slate-300 text-center">Exam (50%)</th>
                      <th className="p-2 border-r border-slate-300 text-center">Total (100)</th>
                      <th className="p-2 border-r border-slate-300 text-center">Grade</th>
                      <th className="p-2 text-center">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {subjects.map((sub) => {
                      const matchedScore = studentScores.find((sc) => sc.subjectId === sub.id);
                      const sba = matchedScore?.sbaScore || 42;
                      const exam = matchedScore?.examScore || 44;
                      const total = matchedScore?.totalScore || sba + exam;
                      const grade = matchedScore?.grade || (total >= 80 ? '1' : total >= 70 ? '2' : total >= 60 ? '3' : '4');
                      const remark = matchedScore?.remark || (total >= 80 ? 'Excellent' : total >= 70 ? 'Very Good' : total >= 60 ? 'Good' : 'Pass');

                      return (
                        <tr key={sub.id}>
                          <td className="p-2 border-r border-slate-300 font-medium">{sub.subjectName}</td>
                          <td className="p-2 border-r border-slate-300 text-center font-mono">{sba}</td>
                          <td className="p-2 border-r border-slate-300 text-center font-mono">{exam}</td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold font-mono">{total}</td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold text-indigo-700">{grade}</td>
                          <td className="p-2 text-center text-slate-700 text-[10px] font-semibold">{remark}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="pt-6 flex items-end justify-between text-[11px] border-t border-slate-200">
                  <div>
                    <p className="font-bold text-slate-900">{headmasterName}</p>
                    <p className="text-slate-500 text-[9px]">Headmaster / Principal</p>
                  </div>
                  <div className="text-right">
                    {headmasterSignature ? (
                      <img src={headmasterSignature} alt="Signature" className="h-8 max-w-[100px] object-contain ml-auto" />
                    ) : (
                      <div className="w-28 h-6 border-b border-slate-400 ml-auto" />
                    )}
                    <p className="font-bold text-slate-900 text-[10px] mt-0.5">Official Transcript Stamp</p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
