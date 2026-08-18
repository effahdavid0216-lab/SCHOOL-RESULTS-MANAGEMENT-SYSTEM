import React, { useState } from 'react';
import { uploadToSupabaseStorage } from '../lib/supabaseService';
import {
  School,
  Calendar,
  Layers,
  BookOpen,
  Award,
  UserCheck,
  Users,
  GraduationCap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  FileSignature,
  Loader2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import {
  School as SchoolType,
  SchoolSettings,
  ClassItem,
  SubjectItem,
  GradingSystem,
  Teacher,
  Student,
  SubjectType
} from '../types';
import { WizardTooltip } from './WizardTooltip';
import {
  updateSchoolInformation,
  saveSchoolSettings,
  saveClassItem,
  saveSubjectItem,
  saveGradingSystem,
  saveTeacher,
  saveStudent,
  markSchoolSetupCompleted
} from '../lib/services';
import { compressLogoFile, compressSignatureFile, dataUrlToBlob } from '../lib/imageOptimizer';

interface Props {
  school: SchoolType;
  onSetupCompleted: () => void;
}

export const SchoolSetupWizard: React.FC<Props> = ({ school, onSetupCompleted }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: School Info
  const [schoolName, setSchoolName] = useState(school.name || '');
  const [motto, setMotto] = useState(school.motto || '');
  const [logoUrl, setLogoUrl] = useState(
    school.logoUrl || 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80'
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadNotice, setLogoUploadNotice] = useState<string | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [signatureUploadNotice, setSignatureUploadNotice] = useState<string | null>(null);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoUploadNotice('Compressing logo & uploading to Supabase Storage...');

    try {
      // 1. Client-side canvas compression for ultra-fast transfer & small footprint
      const compressedDataUrl = await compressLogoFile(file);
      const targetSchoolId = school.schoolId || school.id || 'NEW_SCHOOL';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const storagePath = `schools/${targetSchoolId}/assets/logo_${Date.now()}_${cleanFileName}`;

      const blob = dataUrlToBlob(compressedDataUrl);
      const uploadRes = await uploadToSupabaseStorage('school-assets', storagePath, blob, 'image/png');

      if (uploadRes.success && uploadRes.url) {
        setLogoUrl(uploadRes.url);
        setLogoUploadNotice('Logo compressed & stored successfully in Supabase.');
      } else {
        setLogoUrl(compressedDataUrl);
        setLogoUploadNotice('Logo compressed & attached locally.');
      }
    } catch (err: any) {
      console.warn('Logo upload exception, using compressed data URL fallback:', err);
      try {
        const compressedDataUrl = await compressLogoFile(file);
        setLogoUrl(compressedDataUrl);
        setLogoUploadNotice('Logo compressed & attached (instant memory fallback).');
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setLogoUrl(event.target.result as string);
            setLogoUploadNotice('Image attached as data URL preview.');
          }
        };
        reader.readAsDataURL(file);
      }
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSignatureFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSignature(true);
    setSignatureUploadNotice('Compressing signature & uploading to Supabase...');

    try {
      const compressedDataUrl = await compressSignatureFile(file);
      const targetSchoolId = school.schoolId || school.id || 'NEW_SCHOOL';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const storagePath = `schools/${targetSchoolId}/assets/sig_${Date.now()}_${cleanFileName}`;

      const blob = dataUrlToBlob(compressedDataUrl);
      const uploadRes = await uploadToSupabaseStorage('school-assets', storagePath, blob, 'image/png');

      if (uploadRes.success && uploadRes.url) {
        setHeadmasterSignature(uploadRes.url);
        setSignatureUploadNotice('Headmaster signature compressed & stored in Supabase.');
      } else {
        setHeadmasterSignature(compressedDataUrl);
        setSignatureUploadNotice('Signature compressed & saved.');
      }
    } catch (err) {
      console.warn('Signature storage fallback to compressed data URL:', err);
      try {
        const compressedDataUrl = await compressSignatureFile(file);
        setHeadmasterSignature(compressedDataUrl);
        setSignatureUploadNotice('Signature compressed & attached.');
      } catch (fallbackErr) {
        console.error('Signature read error:', fallbackErr);
      }
    } finally {
      setIsUploadingSignature(false);
    }
  };
  const [address, setAddress] = useState(school.address || '');
  const [district, setDistrict] = useState(school.district || '');
  const [region, setRegion] = useState(school.region || '');
  const [country, setCountry] = useState(school.country || 'Ghana');
  const [digitalAddress, setDigitalAddress] = useState(school.digitalAddress || '');
  const [phone, setPhone] = useState(school.phone || '');
  const [altPhone, setAltPhone] = useState(school.altPhone || '');
  const [email, setEmail] = useState(school.email || '');
  const [website, setWebsite] = useState(school.website || '');
  const [registrationNumber, setRegistrationNumber] = useState(school.registrationNumber || '');

  // Step 2 & 3: Academic Setup & Calendar
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [currentTerm, setCurrentTerm] = useState('Term 1');
  const [term1Reopen, setTerm1Reopen] = useState('2026-09-08');
  const [term1Close, setTerm1Close] = useState('2026-12-18');
  const [term1Vacation, setTerm1Vacation] = useState('2026-12-19');

  const [term2Reopen, setTerm2Reopen] = useState('2027-01-12');
  const [term2Close, setTerm2Close] = useState('2027-04-09');
  const [term2Vacation, setTerm2Vacation] = useState('2027-04-10');

  const [term3Reopen, setTerm3Reopen] = useState('2027-05-04');
  const [term3Close, setTerm3Close] = useState('2027-07-23');
  const [term3Vacation, setTerm3Vacation] = useState('2027-07-24');

  // Step 4: School Type
  const [selectedSchoolType, setSelectedSchoolType] = useState<SchoolType['schoolType']>(
    school.schoolType || 'PRIMARY_JHS'
  );

  // Step 5: Classes Setup State
  const [classesList, setClassesList] = useState<Partial<ClassItem>[]>(() => {
    if (selectedSchoolType === 'PRIMARY') {
      return [
        { className: 'KG 1', level: 'KG', capacity: 30, status: 'ACTIVE' },
        { className: 'KG 2', level: 'KG', capacity: 30, status: 'ACTIVE' },
        { className: 'BASIC 1', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'BASIC 2', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'BASIC 3', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'BASIC 4', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'BASIC 5', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'BASIC 6', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' }
      ];
    } else if (selectedSchoolType === 'JHS') {
      return [
        { className: 'JHS 1A', level: 'JHS', stream: 'A', capacity: 40, status: 'ACTIVE' },
        { className: 'JHS 2A', level: 'JHS', stream: 'A', capacity: 40, status: 'ACTIVE' },
        { className: 'JHS 3A', level: 'JHS', stream: 'A', capacity: 40, status: 'ACTIVE' }
      ];
    } else {
      return [
        { className: 'KG 1', level: 'KG', capacity: 30, status: 'ACTIVE' },
        { className: 'KG 2', level: 'KG', capacity: 30, status: 'ACTIVE' },
        { className: 'BASIC 1', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'BASIC 2', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'BASIC 3', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'BASIC 4', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'BASIC 5', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'BASIC 6', level: 'PRIMARY', capacity: 35, status: 'ACTIVE' },
        { className: 'JHS 1A', level: 'JHS', stream: 'A', capacity: 40, status: 'ACTIVE' },
        { className: 'JHS 2A', level: 'JHS', stream: 'A', capacity: 40, status: 'ACTIVE' },
        { className: 'JHS 3A', level: 'JHS', stream: 'A', capacity: 40, status: 'ACTIVE' }
      ];
    }
  });

  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('JHS');

  // Step 6: Subjects Setup State
  const [subjectsList, setSubjectsList] = useState<Partial<SubjectItem>[]>(() => [
    { subjectName: 'Mathematics', code: 'MATH', subjectType: 'CORE', schoolType: 'PRIMARY_JHS', status: 'ACTIVE' },
    { subjectName: 'English Language', code: 'ENG', subjectType: 'CORE', schoolType: 'PRIMARY_JHS', status: 'ACTIVE' },
    { subjectName: 'Integrated Science', code: 'SCI', subjectType: 'CORE', schoolType: 'PRIMARY_JHS', status: 'ACTIVE' },
    { subjectName: 'Social Studies', code: 'SOC', subjectType: 'CORE', schoolType: 'JHS', status: 'ACTIVE' },
    { subjectName: 'Computing', code: 'COMP', subjectType: 'CORE', schoolType: 'PRIMARY_JHS', status: 'ACTIVE' },
    { subjectName: 'Career Technology', code: 'CT', subjectType: 'ELECTIVE', schoolType: 'JHS', status: 'ACTIVE' },
    { subjectName: 'Creative Arts', code: 'CA', subjectType: 'ELECTIVE', schoolType: 'PRIMARY', status: 'ACTIVE' },
    { subjectName: 'Ghanaian Language (Twi/Fante/Ewe/Ga)', code: 'GHL', subjectType: 'LANGUAGE', schoolType: 'PRIMARY_JHS', status: 'ACTIVE' },
    { subjectName: 'French', code: 'FRE', subjectType: 'LANGUAGE', schoolType: 'JHS', status: 'ACTIVE' }
  ]);

  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubCategory, setNewSubCategory] = useState<SubjectType>('CORE');
  const [newSubSchoolType, setNewSubSchoolType] = useState<SchoolType['schoolType']>('PRIMARY_JHS');

  // Step 7: Grading System
  const [selectedGradingType, setSelectedGradingType] = useState<'BECE' | 'WAEC' | 'GPA'>('BECE');

  // Step 8: Administrator Account
  const [adminFullName, setAdminFullName] = useState('Head Admin');
  const [adminUsername, setAdminUsername] = useState(email || 'admin@school.edu.gh');
  const [adminPhone, setAdminPhone] = useState(phone || '+233 24 111 2222');
  const [adminPassword, setAdminPassword] = useState('Admin@2026');

  // Step 9: Headmaster / Headteacher
  const [headmasterName, setHeadmasterName] = useState('Dr. Kwame Mensah');
  const [headmasterPosition, setHeadmasterPosition] = useState('Headmaster / Principal');
  const [headmasterSignature, setHeadmasterSignature] = useState(
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80'
  );

  // Step 10: Initial Teachers
  const [teachersList, setTeachersList] = useState<Partial<Teacher>[]>(() => [
    {
      staffId: 'TCH-001',
      fullName: 'Mr. Emmanuel Osei',
      gender: 'MALE',
      phone: '+233 24 555 1111',
      email: 'e.osei@school.edu.gh',
      qualification: 'B.Ed. Mathematics',
      dateEmployed: '2022-09-01',
      periodsCount: 18,
      isClassTeacher: true,
      accountStatus: 'ACTIVE'
    },
    {
      staffId: 'TCH-002',
      fullName: 'Mrs. Patience Addo',
      gender: 'FEMALE',
      phone: '+233 20 666 2222',
      email: 'p.addo@school.edu.gh',
      qualification: 'B.A. English & Education',
      dateEmployed: '2023-01-15',
      periodsCount: 20,
      isClassTeacher: false,
      accountStatus: 'ACTIVE'
    }
  ]);

  // Step 11: Initial Students
  const [studentsList, setStudentsList] = useState<Partial<Student>[]>(() => [
    {
      studentId: 'STU-2026-001',
      admissionNo: 'ADM/2026/01',
      fullName: 'Kwaku Appiah Mensah',
      firstName: 'Kwaku',
      lastName: 'Mensah',
      gender: 'MALE',
      dateOfBirth: '2012-05-14',
      nationality: 'Ghanaian',
      academicYear: '2026/2027',
      schoolType: 'JHS',
      className: 'JHS 1A',
      admissionDate: '2026-09-08',
      status: 'ACTIVE',
      parentName: 'Mr. Joseph Mensah',
      parentRelationship: 'Father',
      parentPhone: '+233 24 999 8888',
      emergencyName: 'Mrs. Mary Mensah',
      emergencyPhone: '+233 20 777 6666',
      emergencyRelationship: 'Mother'
    }
  ]);

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    setClassesList([
      ...classesList,
      {
        className: newClassName.toUpperCase().trim(),
        level: newClassLevel,
        capacity: 35,
        status: 'ACTIVE'
      }
    ]);
    setNewClassName('');
  };

  const handleAddSubject = () => {
    if (!newSubName.trim()) return;
    setSubjectsList([
      ...subjectsList,
      {
        subjectName: newSubName.trim(),
        code: newSubCode.toUpperCase().trim() || newSubName.slice(0, 3).toUpperCase(),
        subjectType: newSubCategory,
        schoolType: newSubSchoolType,
        status: 'ACTIVE'
      }
    ]);
    setNewSubName('');
    setNewSubCode('');
  };

  const handleFinishSetup = async () => {
    setIsSaving(true);
    try {
      // 1. Update School Info
      await updateSchoolInformation(school.schoolId, {
        name: schoolName,
        motto,
        logoUrl,
        address,
        district,
        region,
        country,
        digitalAddress,
        phone,
        altPhone,
        email,
        website,
        registrationNumber,
        schoolType: selectedSchoolType
      });

      // 2. Save School Settings
      const settings: SchoolSettings = {
        id: school.schoolId,
        schoolId: school.schoolId,
        currentAcademicYear: academicYear,
        currentTerm,
        numberOfTerms: 3,
        academicCalendar: [
          { termName: 'Term 1', reopeningDate: term1Reopen, closingDate: term1Close, vacationDate: term1Vacation },
          { termName: 'Term 2', reopeningDate: term2Reopen, closingDate: term2Close, vacationDate: term2Vacation },
          { termName: 'Term 3', reopeningDate: term3Reopen, closingDate: term3Close, vacationDate: term3Vacation }
        ],
        headmasterName,
        headmasterPosition,
        headmasterSignatureUrl: headmasterSignature,
        setupCompleted: true,
        updatedAt: new Date().toISOString()
      };
      await saveSchoolSettings(settings);

      // 3. Save Classes
      for (const cls of classesList) {
        await saveClassItem({
          schoolId: school.schoolId,
          className: cls.className || 'Class',
          level: cls.level || 'PRIMARY',
          schoolType: selectedSchoolType,
          academicYear,
          capacity: cls.capacity || 35,
          status: 'ACTIVE'
        });
      }

      // 4. Save Subjects
      for (const sub of subjectsList) {
        await saveSubjectItem({
          schoolId: school.schoolId,
          subjectName: sub.subjectName || 'Subject',
          code: sub.code || 'SUB',
          subjectType: sub.subjectType || 'CORE',
          schoolType: sub.schoolType || selectedSchoolType,
          status: 'ACTIVE'
        });
      }

      // 5. Save Grading System
      await saveGradingSystem({
        schoolId: school.schoolId,
        name: `${selectedGradingType} Standard Scale`,
        type: selectedGradingType,
        boundaries: [
          { grade: 'A1', minScore: 80, maxScore: 100, points: 1, remarks: 'Excellent' },
          { grade: 'B2', minScore: 70, maxScore: 79, points: 2, remarks: 'Very Good' },
          { grade: 'B3', minScore: 65, maxScore: 69, points: 3, remarks: 'Good' },
          { grade: 'C4', minScore: 60, maxScore: 64, points: 4, remarks: 'Credit' },
          { grade: 'C5', minScore: 55, maxScore: 59, points: 5, remarks: 'Credit' },
          { grade: 'C6', minScore: 50, maxScore: 54, points: 6, remarks: 'Credit' },
          { grade: 'D7', minScore: 45, maxScore: 49, points: 7, remarks: 'Pass' },
          { grade: 'E8', minScore: 40, maxScore: 44, points: 8, remarks: 'Pass' },
          { grade: 'F9', minScore: 0, maxScore: 39, points: 9, remarks: 'Fail' }
        ],
        status: 'ACTIVE'
      });

      // 6. Save Teachers
      for (const tch of teachersList) {
        await saveTeacher({
          schoolId: school.schoolId,
          staffId: tch.staffId || 'TCH-001',
          fullName: tch.fullName || 'Teacher',
          gender: tch.gender || 'MALE',
          phone: tch.phone || phone,
          email: tch.email || email,
          qualification: tch.qualification || 'B.Ed.',
          dateEmployed: tch.dateEmployed || '2026-01-01',
          subjectsTaughtIds: [],
          periodsCount: tch.periodsCount || 15,
          isClassTeacher: tch.isClassTeacher || false,
          accountStatus: 'ACTIVE'
        });
      }

      // 7. Save Students
      for (const stu of studentsList) {
        await saveStudent({
          schoolId: school.schoolId,
          studentId: stu.studentId || 'STU-001',
          admissionNo: stu.admissionNo || 'ADM/001',
          fullName: stu.fullName || 'Student Name',
          firstName: stu.firstName || 'First',
          lastName: stu.lastName || 'Last',
          gender: stu.gender || 'MALE',
          dateOfBirth: stu.dateOfBirth || '2012-01-01',
          nationality: 'Ghanaian',
          academicYear,
          schoolType: selectedSchoolType,
          classId: 'cls_1',
          className: stu.className || 'JHS 1A',
          admissionDate: '2026-09-08',
          status: 'ACTIVE',
          parentName: stu.parentName || 'Parent Name',
          parentRelationship: 'Guardian',
          parentPhone: stu.parentPhone || phone,
          emergencyName: stu.emergencyName || 'Emergency Contact',
          emergencyPhone: stu.emergencyPhone || phone,
          emergencyRelationship: 'Relative'
        });
      }

      // 8. Mark Setup Completed
      await markSchoolSetupCompleted(school.schoolId);
      onSetupCompleted();
    } catch (err: any) {
      alert('Error completing setup: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 font-sans pb-16">
      {/* Top Header Wizard Navigation */}
      <header className="bg-[#0f111a] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-white serif italic block leading-none">
                School Setup Wizard
              </span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                {schoolName || school.schoolId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Step {currentStep} of 12</span>
            <div className="w-24 bg-[#161925] border border-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${(currentStep / 12) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Wizard Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
          {/* STEP 1: SCHOOL INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 1 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">School Information</h2>
                <p className="text-xs text-slate-400">Provide official identity and contact details for your institution.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    School Name *
                    <WizardTooltip
                      title="Official Institutional Name"
                      description="Enter the full registered name of your school as recognized by the Ministry of Education, GES, or NaSIA."
                      example="Achimota Senior High School"
                      tip="This name appears on official report cards, fee receipts, and certificates."
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    School Motto
                    <WizardTooltip
                      title="School Motto / Slogan"
                      description="The inspirational Latin or English slogan defining your school's vision."
                      example="Sub Hoc Signo Vinces / Excellence & Integrity"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Excellence in Knowledge & Integrity"
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Official Address *
                    <WizardTooltip
                      title="Physical & Postal Address"
                      description="Street location or P.O. Box address for administrative correspondence."
                      example="P.O. Box 8, Achimota - Accra"
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Digital Address
                    <WizardTooltip
                      title="Ghana Post GPS Address"
                      description="11-character Ghana Post digital property address code for mapping and location verification."
                      example="GA-183-9020"
                      tip="Required for official Ministry inspection and location audits."
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GA-123-4567"
                    value={digitalAddress}
                    onChange={(e) => setDigitalAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    District *
                    <WizardTooltip
                      title="GES District Directorate"
                      description="Municipal or District Education Directorate overseeing your circuit."
                      example="Ayawaso West Municipal Directorate"
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Region *
                    <WizardTooltip
                      title="Administrative Region"
                      description="Administrative region in Ghana where the school is located."
                      example="Greater Accra / Ashanti / Eastern Region"
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Phone *
                    <WizardTooltip
                      title="School Contact Phone Number"
                      description="Primary phone number for administrative contact and automated parent SMS updates."
                      example="+233 24 111 2222"
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Email *
                    <WizardTooltip
                      title="Official Administration Email"
                      description="Used for system notifications, license renewal reminders, and Super Admin support."
                      example="info@achimota.edu.gh"
                    />
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">
                  School Logo (Upload from Device or enter URL)
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    className="w-14 h-14 rounded-xl border border-slate-700 object-cover bg-[#161925] shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-md">
                        {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span>{isUploadingLogo ? 'Uploading to Storage...' : 'Upload Logo from Device'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Target path: schools/{school.schoolId || school.id || 'default'}/assets
                      </span>
                    </div>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Or paste external image URL..."
                      className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                    {logoUploadNotice && (
                      <p className="text-[11px] text-blue-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 inline" /> {logoUploadNotice}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC SETUP */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 2 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">Academic Setup</h2>
                <p className="text-xs text-slate-400">Configure current session, term structures, and academic period boundaries.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Current Academic Year *
                    <WizardTooltip
                      title="Academic Year Session"
                      description="Active 12-month school calendar session for class enrolment and academic reporting."
                      example="2026/2027"
                      tip="Changing academic year archives active continuous assessment sheets."
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Current Active Term *
                    <WizardTooltip
                      title="Active School Term"
                      description="The term currently in session. Scores entered by subject teachers automatically bind to this active term."
                      example="Term 1"
                    />
                  </label>
                  <select
                    value={currentTerm}
                    onChange={(e) => setCurrentTerm(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACADEMIC CALENDAR */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 3 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">Academic Calendar & Term Dates</h2>
                <p className="text-xs text-slate-400">Set reopening, closing, and vacation dates for all three terms.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-[#161925] border border-slate-800 rounded-2xl p-4">
                  <h4 className="font-semibold text-xs text-white tracking-wider uppercase mb-3">TERM 1</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Reopening Date</label>
                      <input type="date" value={term1Reopen} onChange={(e) => setTerm1Reopen(e.target.value)} className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Closing Date</label>
                      <input type="date" value={term1Close} onChange={(e) => setTerm1Close(e.target.value)} className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Vacation Date</label>
                      <input type="date" value={term1Vacation} onChange={(e) => setTerm1Vacation(e.target.value)} className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#161925] border border-slate-800 rounded-2xl p-4">
                  <h4 className="font-semibold text-xs text-white tracking-wider uppercase mb-3">TERM 2</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Reopening Date</label>
                      <input type="date" value={term2Reopen} onChange={(e) => setTerm2Reopen(e.target.value)} className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Closing Date</label>
                      <input type="date" value={term2Close} onChange={(e) => setTerm2Close(e.target.value)} className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Vacation Date</label>
                      <input type="date" value={term2Vacation} onChange={(e) => setTerm2Vacation(e.target.value)} className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#161925] border border-slate-800 rounded-2xl p-4">
                  <h4 className="font-semibold text-xs text-white tracking-wider uppercase mb-3">TERM 3</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Reopening Date</label>
                      <input type="date" value={term3Reopen} onChange={(e) => setTerm3Reopen(e.target.value)} className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Closing Date</label>
                      <input type="date" value={term3Close} onChange={(e) => setTerm3Close(e.target.value)} className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Vacation Date</label>
                      <input type="date" value={term3Vacation} onChange={(e) => setTerm3Vacation(e.target.value)} className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SCHOOL TYPE */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 4 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">Select School Type</h2>
                <p className="text-xs text-slate-400">Controls subject offerings, class options, and levels across the app.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setSelectedSchoolType('PRIMARY')}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                    selectedSchoolType === 'PRIMARY'
                      ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-900/20'
                      : 'border-slate-800 bg-[#161925] hover:border-slate-700'
                  }`}
                >
                  <h3 className="font-semibold text-white mb-1">1. PRIMARY ONLY</h3>
                  <p className="text-xs text-slate-400">KG 1 to Basic 6 level coverage.</p>
                </div>

                <div
                  onClick={() => setSelectedSchoolType('JHS')}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                    selectedSchoolType === 'JHS'
                      ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-900/20'
                      : 'border-slate-800 bg-[#161925] hover:border-slate-700'
                  }`}
                >
                  <h3 className="font-semibold text-white mb-1">2. JHS ONLY</h3>
                  <p className="text-xs text-slate-400">JHS 1 to JHS 3 level coverage.</p>
                </div>

                <div
                  onClick={() => setSelectedSchoolType('PRIMARY_JHS')}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                    selectedSchoolType === 'PRIMARY_JHS'
                      ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-900/20'
                      : 'border-slate-800 bg-[#161925] hover:border-slate-700'
                  }`}
                >
                  <h3 className="font-semibold text-white mb-1">3. PRIMARY + JHS</h3>
                  <p className="text-xs text-slate-400">Complete Basic Education spectrum (KG to JHS 3).</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CLASS SETUP */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 5 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">Class Setup</h2>
                <p className="text-xs text-slate-400">Review default classes and add custom stream divisions.</p>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="e.g. JHS 1B or BASIC 4 GOLD"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddClass}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs tracking-wider uppercase cursor-pointer"
                >
                  Add Class
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {classesList.map((c, i) => (
                  <div key={i} className="p-3 bg-[#161925] border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-white block">{c.className}</span>
                      <span className="text-[10px] text-slate-500">Level: {c.level}</span>
                    </div>
                    <button
                      onClick={() => setClassesList(classesList.filter((_, idx) => idx !== i))}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: SUBJECT SETUP */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 6 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">Subject Setup & Categories</h2>
                <p className="text-xs text-slate-400">Configure subjects under CORE, ELECTIVE, and LANGUAGE categories.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
                />
                <select
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value as SubjectType)}
                  className="px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="CORE">CORE</option>
                  <option value="ELECTIVE">ELECTIVE</option>
                  <option value="LANGUAGE">LANGUAGE</option>
                </select>
                <select
                  value={newSubSchoolType}
                  onChange={(e) => setNewSubSchoolType(e.target.value as SchoolType['schoolType'])}
                  className="px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="PRIMARY_JHS">PRIMARY + JHS</option>
                  <option value="PRIMARY">PRIMARY ONLY</option>
                  <option value="JHS">JHS ONLY</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs tracking-wider uppercase cursor-pointer"
                >
                  Add Subject
                </button>
              </div>

              <div className="space-y-2">
                {subjectsList.map((s, idx) => (
                  <div key={idx} className="p-3 bg-[#161925] border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-white">{s.subjectName}</span>
                      <span className="text-[10px] text-slate-500 ml-2">[{s.code}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.subjectType === 'CORE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        s.subjectType === 'ELECTIVE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {s.subjectType}
                      </span>
                      <button
                        onClick={() => setSubjectsList(subjectsList.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: GRADING SYSTEM */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 7 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">Grading System Setup</h2>
                <p className="text-xs text-slate-400">Select standard evaluation scale for academic results.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {['BECE', 'WAEC', 'GPA'].map((type) => (
                  <div
                    key={type}
                    onClick={() => setSelectedGradingType(type as any)}
                    className={`p-5 rounded-2xl border text-center cursor-pointer transition-all ${
                      selectedGradingType === type ? 'border-blue-500 bg-blue-950/20 text-white font-semibold' : 'border-slate-800 bg-[#161925] text-slate-400'
                    }`}
                  >
                    <Award className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <span className="text-xs tracking-wider uppercase">{type} Scale</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: ADMIN ACCOUNT */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 8 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">School Administrator Credentials</h2>
                <p className="text-xs text-slate-400">Create the primary administrator account for this school.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Full Name *
                    <WizardTooltip
                      title="Administrator Full Name"
                      description="The official full name of the head administrator managing this school tenant account."
                      example="Mr. Kwabena Darko"
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={adminFullName}
                    onChange={(e) => setAdminFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Username / Email *
                    <WizardTooltip
                      title="Admin Login Email"
                      description="Used for logging into the School Admin Portal. Must be unique across all school tenants."
                      example="admin.head@school.edu.gh"
                    />
                  </label>
                  <input
                    type="email"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Phone *
                    <WizardTooltip
                      title="Administrator Contact Phone"
                      description="Mobile number for receiving security verification codes and critical system alerts."
                      example="+233 24 000 1122"
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Initial Password *
                    <WizardTooltip
                      title="School Admin Password"
                      description="Initial password for logging into the school dashboard. The admin will be prompted to update it upon initial login."
                      tip="Must contain at least 8 characters, a number, and a special character."
                    />
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: HEADMASTER */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 9 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">Headmaster / Headteacher</h2>
                <p className="text-xs text-slate-400">Signature will automatically appear on official reports and certificates.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Name *
                    <WizardTooltip
                      title="Headteacher Full Name"
                      description="Official name of the principal or headmaster rendered on term report cards and broadsheet reports."
                      example="Rev. Dr. Samuel Addo-Yeboah"
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={headmasterName}
                    onChange={(e) => setHeadmasterName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Position *
                    <WizardTooltip
                      title="Official Designation"
                      description="The exact administrative title displayed under the signature line."
                      example="Headmaster / Headmistress / Principal"
                    />
                  </label>
                  <input
                    type="text"
                    required
                    value={headmasterPosition}
                    onChange={(e) => setHeadmasterPosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                  Digital Signature Image & Upload
                  <WizardTooltip
                    title="Digital Signature Image"
                    description="Scanned signature image rendered automatically on student term reports and graduation certificates."
                  />
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-24 h-14 rounded-xl border border-slate-700 bg-[#161925] p-1 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={headmasterSignature} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                        {isUploadingSignature ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Upload Signature File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureFileUpload}
                          disabled={isUploadingSignature}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Or enter signature URL..."
                        value={headmasterSignature}
                        onChange={(e) => setHeadmasterSignature(e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                    {signatureUploadNotice && (
                      <p className="text-[11px] text-blue-400">{signatureUploadNotice}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: TEACHERS */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 10 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">Teacher Staff Setup</h2>
                <p className="text-xs text-slate-400">Review initial teaching staff accounts.</p>
              </div>

              <div className="space-y-3">
                {teachersList.map((t, i) => (
                  <div key={i} className="p-4 bg-[#161925] border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-xs text-white">{t.fullName} ({t.staffId})</p>
                      <p className="text-[10px] text-slate-400">{t.qualification} • {t.phone}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase">
                      {t.accountStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 11: STUDENTS */}
          {currentStep === 11 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  STEP 11 OF 12
                </span>
                <h2 className="text-2xl font-light text-white serif italic mt-2">Student Registration</h2>
                <p className="text-xs text-slate-400">Review initial registered student records.</p>
              </div>

              <div className="space-y-3">
                {studentsList.map((s, i) => (
                  <div key={i} className="p-4 bg-[#161925] border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-xs text-white">{s.fullName} ({s.studentId})</p>
                      <p className="text-[10px] text-slate-400">Class: {s.className} • Parent: {s.parentName} ({s.parentPhone})</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 12: FINISH SETUP */}
          {currentStep === 12 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-light text-white serif italic">Setup Verification Complete</h2>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                All school configuration steps, academic calendar rules, subjects, classes, teachers, and student databases are ready.
              </p>

              <div className="bg-[#161925] border border-slate-800 rounded-2xl p-6 text-left max-w-lg mx-auto text-xs space-y-2 text-slate-300">
                <p><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">School Name</span> {schoolName}</p>
                <p><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">School ID</span> {school.schoolId}</p>
                <p><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Academic Year</span> {academicYear}</p>
                <p><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Active Classes</span> {classesList.length}</p>
                <p><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Active Subjects</span> {subjectsList.length}</p>
                <p><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Administrator Email</span> {adminUsername}</p>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinishSetup}
                className="w-full max-w-md mx-auto py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs tracking-wider uppercase"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Finalizing & Saving Configuration to Firestore...
                  </>
                ) : (
                  <>
                    COMPLETE SCHOOL SETUP & LAUNCH DASHBOARD
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Bottom Step Buttons */}
          {currentStep < 12 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-5 py-2.5 bg-[#161925] hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-xs rounded-xl transition-colors disabled:opacity-40 flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
