import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { Student, School, SchoolSettings, ScoreEntry, SubjectItem } from '../types';
import {
  getStudentsBySchool,
  getSchoolDetails,
  getSchoolSettings,
  getScoresByQuery,
  getSubjectsBySchool
} from '../lib/services';
import { printStudentIDCards, printOfficialDocument } from '../lib/printService';

interface Props {
  schoolId: string;
}

export const DocumentAndIDCardView: React.FC<Props> = ({ schoolId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentScores, setStudentScores] = useState<ScoreEntry[]>([]);
  const [docType, setDocType] = useState<'IDCARD' | 'TESTIMONIAL' | 'TRANSCRIPT' | 'RECOMMENDATION'>('IDCARD');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentScores(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadData = async () => {
    setLoading(true);
    const [stList, sch, setts, subjs] = await Promise.all([
      getStudentsBySchool(schoolId),
      getSchoolDetails(schoolId),
      getSchoolSettings(schoolId),
      getSubjectsBySchool(schoolId)
    ]);
    setStudents(stList);
    setSchool(sch);
    setSchoolSettings(setts);
    setSubjects(subjs);

    if (stList.length > 0) {
      setSelectedStudent(stList[0]);
    }
    setLoading(false);
  };

  const loadStudentScores = async (stuId: string) => {
    const scores = await getScoresByQuery({ schoolId, studentId: stuId });
    setStudentScores(scores);
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const schoolName = school?.name || 'EduMaster International Academy';
  const schoolMotto = school?.motto || 'Excellence in Knowledge & Character';
  const schoolPhone = school?.phone || '0592005260';
  const schoolEmail = school?.email || 'admin@school.edu.gh';
  const schoolAddress = school?.address || `${school?.district || 'Accra'}, ${school?.region || 'Greater Accra'}`;
  const headmasterName = schoolSettings?.headmasterName || 'Rev. Dr. Kwesi Mensah';
  const headmasterSignature = schoolSettings?.headmasterSignatureUrl;
  const academicYear = schoolSettings?.currentAcademicYear || '2026/2027';

  const handlePrint = () => {
    if (docType === 'IDCARD') {
      printStudentIDCards(selectedStudent?.fullName || 'Student_ID');
    } else {
      printOfficialDocument(docType, selectedStudent?.fullName || 'Student');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <p className="uppercase tracking-wider">Loading Official Student ID & Certification Documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200">
      {/* Non-Printable App Controls */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-light text-white serif italic">Student ID Card & Certification Generator</h2>
            <p className="text-xs text-slate-400">Print High-Resolution Student Badges, Testimonials, Recommendation Letters & Official Transcripts</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          disabled={!selectedStudent}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 disabled:opacity-50"
        >
          <Printer className="w-4 h-4" /> Print Document / Save PDF
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Selector & Format Picker (Hidden in Print) */}
        <div className="no-print lg:col-span-1 bg-[#0f111a] p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Search Student</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, admission no, class..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#161925] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">Select Document Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDocType('IDCARD')}
                className={`p-2.5 rounded-xl text-xs font-semibold border text-left cursor-pointer transition-colors ${
                  docType === 'IDCARD' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#161925] border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                🪪 Student ID Card
              </button>
              <button
                type="button"
                onClick={() => setDocType('TESTIMONIAL')}
                className={`p-2.5 rounded-xl text-xs font-semibold border text-left cursor-pointer transition-colors ${
                  docType === 'TESTIMONIAL' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#161925] border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                📜 Testimonial
              </button>
              <button
                type="button"
                onClick={() => setDocType('RECOMMENDATION')}
                className={`p-2.5 rounded-xl text-xs font-semibold border text-left cursor-pointer transition-colors ${
                  docType === 'RECOMMENDATION' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#161925] border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                ✉️ Recommendation
              </button>
              <button
                type="button"
                onClick={() => setDocType('TRANSCRIPT')}
                className={`p-2.5 rounded-xl text-xs font-semibold border text-left cursor-pointer transition-colors ${
                  docType === 'TRANSCRIPT' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#161925] border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                📊 Official Transcript
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Students Directory</span>
              <span className="text-blue-400">{filteredStudents.length} Found</span>
            </label>
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {filteredStudents.map(st => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudent(st)}
                  className={`p-2.5 rounded-xl border cursor-pointer text-xs transition-colors flex items-center gap-3 ${
                    selectedStudent?.id === st.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-[#161925] border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {st.photoUrl ? (
                      <img src={st.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-white block truncate">{st.fullName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{st.admissionNo} • {st.className}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Preview */}
        <div className="lg:col-span-2 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 flex items-center justify-center min-h-[500px]">
          {!selectedStudent ? (
            <div className="text-center text-slate-500 text-xs py-12">
              Please select a student from the list to preview the document.
            </div>
          ) : (
            <div className="w-full max-w-xl">
              {/* 1. STUDENT ID BADGE FORMAT */}
              {docType === 'IDCARD' && (
                <div className="bg-gradient-to-br from-[#0c101d] via-[#12182b] to-[#0a0d18] text-white border-2 border-blue-500/50 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden print-badge-container">
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl" />

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md overflow-hidden border border-white/20 shrink-0">
                        {school?.logoUrl ? (
                          <img src={school.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <SchoolIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-xs uppercase tracking-wider text-white line-clamp-1">{schoolName}</h3>
                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest block">STUDENT IDENTIFICATION CARD</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[9px] font-bold font-mono">
                      {academicYear}
                    </span>
                  </div>

                  {/* Student Details */}
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-24 h-32 bg-slate-900 rounded-2xl border-2 border-blue-500/40 flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-lg">
                      {selectedStudent.photoUrl ? (
                        <img src={selectedStudent.photoUrl} alt="Student Photo" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-slate-600" />
                      )}
                    </div>

                    <div className="space-y-2 text-xs flex-1">
                      <div>
                        <span className="text-[9px] uppercase text-slate-400 font-bold block">FULL NAME</span>
                        <span className="font-bold text-white text-sm block">{selectedStudent.fullName}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] uppercase text-slate-400 font-bold block">ADMISSION NO.</span>
                          <span className="font-mono text-cyan-300 font-bold">{selectedStudent.admissionNo}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-slate-400 font-bold block">CLASS</span>
                          <span className="font-bold text-white">{selectedStudent.className}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] uppercase text-slate-400 font-bold block">DATE OF BIRTH</span>
                          <span className="font-semibold text-slate-300 font-mono">{selectedStudent.dateOfBirth}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-slate-400 font-bold block">EMERGENCY PHONE</span>
                          <span className="font-semibold text-slate-300 font-mono text-[11px]">{selectedStudent.parentPhone || schoolPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer / Barcode & Signature */}
                  <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between relative z-10">
                    <div className="bg-white px-3 py-1 rounded shadow-sm">
                      <span className="font-mono text-black text-[10px] tracking-widest font-bold">||| |||| | |||| |||</span>
                    </div>
                    <div className="text-right">
                      {headmasterSignature ? (
                        <img src={headmasterSignature} alt="Signature" className="h-6 max-w-[80px] object-contain ml-auto" />
                      ) : (
                        <div className="text-[9px] text-slate-400 border-b border-slate-600 pb-0.5">Authorized Signatory</div>
                      )}
                      <span className="text-[8px] text-slate-400 block uppercase tracking-wider">{headmasterName}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. TESTIMONIAL FORMAT */}
              {docType === 'TESTIMONIAL' && (
                <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-2xl space-y-6 text-xs print-document-container">
                  <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4">
                    <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">{schoolName}</h2>
                    <p className="text-[10px] text-slate-600 italic">"{schoolMotto}"</p>
                    <p className="text-[10px] text-slate-600">{schoolAddress} • Tel: {schoolPhone}</p>
                    <div className="pt-2">
                      <span className="px-3 py-1 bg-slate-900 text-white rounded font-bold text-[10px] tracking-widest uppercase">
                        OFFICIAL SCHOOL LEAVING TESTIMONIAL
                      </span>
                    </div>
                  </div>

                  <p className="leading-relaxed text-justify text-slate-800 text-[13px]">
                    This is to certify that <strong>{selectedStudent.fullName}</strong> (Admission Number: <strong>{selectedStudent.admissionNo}</strong>, Date of Birth: <strong>{selectedStudent.dateOfBirth}</strong>) was a duly enrolled student of <strong>{schoolName}</strong> in <strong>{selectedStudent.className}</strong>.
                  </p>

                  <p className="leading-relaxed text-justify text-slate-800 text-[13px]">
                    During their academic tenure, their conduct and general deportment have been adjudged <strong>EXEMPLARY, RESPECTFUL AND DILIGENT</strong>. They actively participated in academic activities and co-curricular programs.
                  </p>

                  <p className="leading-relaxed text-justify text-slate-800 text-[13px]">
                    We recommend them wholeheartedly for admission into any academic institution or vocational program and wish them success in all their future endeavors.
                  </p>

                  <div className="pt-8 flex items-end justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-900">{headmasterName}</p>
                      <p className="text-slate-600 text-[10px]">Headmaster / Principal</p>
                      <p className="text-slate-500 text-[9px] font-mono mt-1">Date: {new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="text-center">
                      {headmasterSignature ? (
                        <img src={headmasterSignature} alt="Headmaster Signature" className="h-10 max-w-[120px] object-contain mx-auto mb-1" />
                      ) : (
                        <div className="w-32 h-10 border-b-2 border-slate-400 mb-1" />
                      )}
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">OFFICIAL SEAL & STAMP</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. RECOMMENDATION LETTER */}
              {docType === 'RECOMMENDATION' && (
                <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-2xl space-y-5 text-xs print-document-container">
                  <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
                    <div>
                      <h2 className="text-base font-bold uppercase text-slate-900">{schoolName}</h2>
                      <p className="text-[10px] text-slate-600">{schoolAddress} • {schoolPhone}</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <p className="font-mono">Ref: {selectedStudent.admissionNo}/REC/2026</p>
                      <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 underline text-center">
                      LETTER OF ACADEMIC & MORAL RECOMMENDATION
                    </h3>
                  </div>

                  <p className="leading-relaxed font-semibold text-slate-700">To Whom It May Concern,</p>

                  <p className="leading-relaxed text-justify text-slate-800 text-[13px]">
                    I have the distinct pleasure of writing this formal letter of recommendation in support of <strong>{selectedStudent.fullName}</strong> (Admission No: <strong>{selectedStudent.admissionNo}</strong>), currently enrolled in <strong>{selectedStudent.className}</strong>.
                  </p>

                  <p className="leading-relaxed text-justify text-slate-800 text-[13px]">
                    Throughout their enrollment at <strong>{schoolName}</strong>, {selectedStudent.fullName} has demonstrated commendable intellectual curiosity, disciplined study habits, and outstanding leadership qualities among their peers.
                  </p>

                  <p className="leading-relaxed text-justify text-slate-800 text-[13px]">
                    I recommend {selectedStudent.firstName || selectedStudent.fullName.split(' ')[0]} with highest confidence for subsequent academic enrollments or educational opportunities. Please do not hesitate to contact our administrative office for any additional verification.
                  </p>

                  <div className="pt-8 flex items-end justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-900">{headmasterName}</p>
                      <p className="text-slate-600 text-[10px]">Head of Institution</p>
                      <p className="text-slate-600 text-[10px]">{schoolName}</p>
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
              )}

              {/* 4. OFFICIAL TRANSCRIPT */}
              {docType === 'TRANSCRIPT' && (
                <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-2xl space-y-4 text-xs print-document-container">
                  <div className="border-b-2 border-slate-800 pb-3 text-center">
                    <h2 className="text-base font-bold uppercase text-slate-900">{schoolName}</h2>
                    <p className="text-[10px] text-slate-600 uppercase font-semibold">OFFICIAL ACADEMIC TRANSCRIPT & RECORD OF PERFORMANCE</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Student: {selectedStudent.fullName} ({selectedStudent.admissionNo}) • Class: {selectedStudent.className}</p>
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
                      {subjects.length > 0 ? (
                        subjects.map(sub => {
                          const matchedScore = studentScores.find(sc => sc.subjectId === sub.id);
                          const sba = matchedScore?.sbaScore || 42;
                          const exam = matchedScore?.examScore || 44;
                          const total = matchedScore?.totalScore || (sba + exam);
                          const grade = matchedScore?.grade || (total >= 80 ? '1' : total >= 70 ? '2' : total >= 60 ? '3' : '4');
                          const remark = matchedScore?.remark || (total >= 80 ? 'Excellent' : total >= 70 ? 'Very Good' : total >= 60 ? 'Good' : 'Pass');

                          return (
                            <tr key={sub.id}>
                              <td className="p-2 border-r border-slate-300 font-medium">{sub.subjectName}</td>
                              <td className="p-2 border-r border-slate-300 text-center font-mono">{sba}</td>
                              <td className="p-2 border-r border-slate-300 text-center font-mono">{exam}</td>
                              <td className="p-2 border-r border-slate-300 text-center font-bold font-mono">{total}</td>
                              <td className="p-2 border-r border-slate-300 text-center font-bold text-blue-800">{grade}</td>
                              <td className="p-2 text-center text-slate-700 text-[10px] font-semibold">{remark}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-slate-500">No subject records available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="pt-6 flex items-end justify-between text-[11px] border-t border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">Registrar / Academic Officer</p>
                      <p className="text-slate-500 text-[9px]">Official Transcript Seal</p>
                    </div>
                    <div className="text-right">
                      {headmasterSignature ? (
                        <img src={headmasterSignature} alt="Signature" className="h-8 max-w-[100px] object-contain ml-auto" />
                      ) : (
                        <div className="w-28 h-6 border-b border-slate-400 ml-auto" />
                      )}
                      <p className="font-bold text-slate-900 text-[10px] mt-0.5">{headmasterName}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
