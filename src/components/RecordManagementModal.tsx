import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  GraduationCap,
  BookOpen,
  Phone,
  Mail,
  Calendar,
  Shield,
  Trash2,
  Edit2,
  Eye,
  Upload,
  Camera,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Award,
  Clock,
  Home,
  MapPin,
  HeartHandshake,
  Users,
  Key
} from 'lucide-react';
import { Teacher, Student, ClassItem, SubjectItem, SchoolType } from '../types';
import {
  compressPassportPhoto,
  compressSignatureFile,
  dataUrlToBlob
} from '../lib/imageOptimizer';
import {
  saveTeacher,
  deleteTeacher,
  saveStudent,
  deleteStudent
} from '../lib/services';
import { uploadToSupabaseStorage } from '../lib/supabaseService';

export type RecordEntityType = 'TEACHER' | 'STUDENT';
export type RecordModalMode = 'CREATE' | 'EDIT' | 'VIEW' | 'DELETE';

export interface RecordManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: RecordEntityType;
  mode: RecordModalMode;
  record?: Teacher | Student | null;
  schoolId: string;
  classes: ClassItem[];
  subjects?: SubjectItem[];
  onSaveSuccess?: (savedRecord: Teacher | Student) => void | Promise<void>;
  onDeleteSuccess?: (deletedId: string) => void | Promise<void>;
  onChangeMode?: (newMode: RecordModalMode) => void;
}

export const RecordManagementModal: React.FC<RecordManagementModalProps> = ({
  isOpen,
  onClose,
  entityType,
  mode,
  record,
  schoolId,
  classes = [],
  subjects = [],
  onSaveSuccess,
  onDeleteSuccess,
  onChangeMode
}) => {
  // Navigation Tabs for Form Mode
  const [activeTab, setActiveTab] = useState<'BASIC' | 'ACADEMIC' | 'MEDIA_SECURITY'>('BASIC');

  // Loading & Feedback States
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // File Upload States
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [photoUploadNote, setPhotoUploadNote] = useState<string | null>(null);
  const [signatureUploadNote, setSignatureUploadNote] = useState<string | null>(null);

  // Digital Signature Canvas Pad State
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // ==========================================
  // SHARED & TEACHER FORM FIELDS
  // ==========================================
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [password, setPassword] = useState('');

  // Teacher-Specific
  const [staffId, setStaffId] = useState('');
  const [qualification, setQualification] = useState('B.Ed.');
  const [dateEmployed, setDateEmployed] = useState('');
  const [periodsCount, setPeriodsCount] = useState(18);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [classTeacherOfId, setClassTeacherOfId] = useState('');
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [subjectsTaughtIds, setSubjectsTaughtIds] = useState<string[]>([]);
  const [teacherStatus, setTeacherStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [hometown, setHometown] = useState('');
  const [address, setAddress] = useState('');

  // ==========================================
  // STUDENT-SPECIFIC FORM FIELDS
  // ==========================================
  const [studentId, setStudentId] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [className, setClassName] = useState('');
  const [classId, setClassId] = useState('');
  const [stream, setStream] = useState('');
  const [house, setHouse] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [studentStatus, setStudentStatus] = useState<'ACTIVE' | 'GRADUATED' | 'WITHDRAWN' | 'SUSPENDED'>('ACTIVE');

  // Parent / Guardian
  const [parentName, setParentName] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Parent');
  const [parentPhone, setParentPhone] = useState('');
  const [parentAltPhone, setParentAltPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentAddress, setParentAddress] = useState('');
  const [parentDigitalAddress, setParentDigitalAddress] = useState('');
  const [parentOccupation, setParentOccupation] = useState('');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Guardian');

  // Populate or Reset Form whenever modal opens or record changes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveTab('BASIC');
    setShowSignaturePad(false);

    if (mode === 'CREATE') {
      initNewRecord();
    } else if (record) {
      populateFromRecord(record);
    }
  }, [isOpen, mode, record, entityType]);

  const initNewRecord = () => {
    const rand = Math.floor(100 + Math.random() * 900);
    const today = new Date().toISOString().split('T')[0];

    if (entityType === 'TEACHER') {
      setStaffId(`TCH-${rand}`);
      setFullName('');
      setGender('MALE');
      setDateOfBirth('1992-05-15');
      setPhone('');
      setEmail('');
      setPassword('Teacher123!');
      setQualification('B.Ed. (Basic Education)');
      setDateEmployed(today);
      setPeriodsCount(18);
      setIsClassTeacher(false);
      setClassTeacherOfId('');
      setAssignedClassIds([]);
      setSubjectsTaughtIds([]);
      setPhotoUrl('');
      setSignatureUrl('');
      setTeacherStatus('ACTIVE');
      setHometown('');
      setAddress('');
    } else {
      setStudentId(`STU-2026-${rand}`);
      setAdmissionNo(`ADM/2026/${rand}`);
      setFullName('');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setGender('MALE');
      setDateOfBirth('2014-06-12');
      setPassword('2014-06-12');
      const defaultClass = classes[0];
      setClassName(defaultClass?.className || 'BASIC 1');
      setClassId(defaultClass?.id || '');
      setStream('A');
      setHouse('Blue House');
      setAdmissionDate(today);
      setPreviousSchool('');
      setPhotoUrl('');
      setSignatureUrl('');
      setStudentStatus('ACTIVE');
      setParentName('');
      setParentRelationship('Mother');
      setParentPhone('');
      setParentAltPhone('');
      setParentEmail('');
      setParentAddress('');
      setParentDigitalAddress('');
      setParentOccupation('');
      setEmergencyName('');
      setEmergencyPhone('');
      setEmergencyRelationship('Mother');
    }
  };

  const populateFromRecord = (rec: Teacher | Student) => {
    if (entityType === 'TEACHER') {
      const t = rec as Teacher;
      setStaffId(t.staffId || '');
      setFullName(t.fullName || '');
      setGender(t.gender || 'MALE');
      setDateOfBirth(t.dateOfBirth || '1990-05-15');
      setPhone(t.phone || '');
      setEmail(t.email || '');
      setPassword(t.password || 'Teacher123!');
      setQualification(t.qualification || 'B.Ed.');
      setDateEmployed(t.dateEmployed || '2026-01-01');
      setPeriodsCount(t.periodsCount || 18);
      setIsClassTeacher(t.isClassTeacher || false);
      setClassTeacherOfId(t.classTeacherOfId || '');
      setAssignedClassIds(t.assignedClassIds || (t.classAssignedId ? [t.classAssignedId] : []));
      setSubjectsTaughtIds(t.subjectsTaughtIds || []);
      setPhotoUrl(t.photoUrl || '');
      setSignatureUrl(t.signatureUrl || '');
      setTeacherStatus(t.accountStatus || 'ACTIVE');
      setHometown(t.hometown || '');
      setAddress(t.address || '');
    } else {
      const s = rec as Student;
      setStudentId(s.studentId || '');
      setAdmissionNo(s.admissionNo || '');
      setFullName(s.fullName || '');
      setFirstName(s.firstName || '');
      setMiddleName(s.middleName || '');
      setLastName(s.lastName || '');
      setGender(s.gender || 'MALE');
      setDateOfBirth(s.dateOfBirth || '2014-06-12');
      setPassword(s.password || s.dateOfBirth || '2014-06-12');
      setClassName(s.className || 'BASIC 1');
      setClassId(s.classId || '');
      setStream(s.stream || 'A');
      setHouse(s.house || '');
      setAdmissionDate(s.admissionDate || '');
      setPreviousSchool(s.previousSchool || '');
      setPhotoUrl(s.photoUrl || '');
      setSignatureUrl('');
      setStudentStatus((s.status as any) || 'ACTIVE');
      setParentName(s.parentName || '');
      setParentRelationship(s.parentRelationship || 'Parent');
      setParentPhone(s.parentPhone || '');
      setParentAltPhone(s.parentAltPhone || '');
      setParentEmail(s.parentEmail || '');
      setParentAddress(s.parentAddress || '');
      setParentDigitalAddress(s.parentDigitalAddress || '');
      setParentOccupation(s.parentOccupation || '');
      setEmergencyName(s.emergencyName || '');
      setEmergencyPhone(s.emergencyPhone || '');
      setEmergencyRelationship(s.emergencyRelationship || 'Guardian');
    }
  };

  const resetForm = () => {
    setIsProcessing(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploadingPhoto(false);
    setIsUploadingSignature(false);
    setPhotoUploadNote(null);
    setSignatureUploadNote(null);
  };

  // ==========================================
  // IMAGE & SIGNATURE HANDLERS
  // ==========================================
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setPhotoUploadNote('Compressing passport photo via canvas...');

    try {
      // 1. Client-side canvas compression (scales down to 300x360, <40KB)
      const compressedDataUrl = await compressPassportPhoto(file);

      // 2. Upload to Supabase Storage
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const folder = entityType === 'TEACHER' ? 'teachers' : 'students';
      const storagePath = `schools/${schoolId}/${folder}/photos/${Date.now()}_${cleanFileName}`;

      const blob = dataUrlToBlob(compressedDataUrl);
      const uploadRes = await uploadToSupabaseStorage('school-assets', storagePath, blob, 'image/jpeg');

      if (uploadRes.success && uploadRes.url) {
        setPhotoUrl(uploadRes.url);
        setPhotoUploadNote('Photo compressed and saved to Supabase storage.');
      } else {
        setPhotoUrl(compressedDataUrl);
        setPhotoUploadNote('Photo compressed & attached (local storage).');
      }
    } catch (err: any) {
      console.warn('Photo upload exception, using compressed data URL:', err);
      try {
        const compressedDataUrl = await compressPassportPhoto(file);
        setPhotoUrl(compressedDataUrl);
        setPhotoUploadNote('Photo compressed & attached (local storage).');
      } catch {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setPhotoUrl(ev.target.result as string);
            setPhotoUploadNote('Photo attached.');
          }
        };
        reader.readAsDataURL(file);
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSignature(true);
    setSignatureUploadNote('Compressing digital signature...');

    try {
      const compressedDataUrl = await compressSignatureFile(file);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const storagePath = `schools/${schoolId}/signatures/${Date.now()}_${cleanFileName}`;

      const blob = dataUrlToBlob(compressedDataUrl);
      const uploadRes = await uploadToSupabaseStorage('school-assets', storagePath, blob, 'image/png');

      if (uploadRes.success && uploadRes.url) {
        setSignatureUrl(uploadRes.url);
        setSignatureUploadNote('Signature compressed and stored in Supabase.');
      } else {
        setSignatureUrl(compressedDataUrl);
        setSignatureUploadNote('Signature compressed & saved.');
      }
    } catch (err: any) {
      console.warn('Signature storage fallback to compressed data URL:', err);
      try {
        const compressedDataUrl = await compressSignatureFile(file);
        setSignatureUrl(compressedDataUrl);
        setSignatureUploadNote('Signature compressed & saved.');
      } catch (fallbackErr) {
        console.error('Signature read error:', fallbackErr);
      }
    } finally {
      setIsUploadingSignature(false);
    }
  };

  // Interactive Signature Canvas Draw Pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2563eb';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureUrl(dataUrl);
    setShowSignaturePad(false);
    setSignatureUploadNote('Handwritten signature captured via pad.');
  };

  // ==========================================
  // FORM SUBMISSION & SAVE HANDLER
  // ==========================================
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic Validation
    if (entityType === 'TEACHER') {
      if (!fullName.trim()) {
        setErrorMessage('Teacher full name is required.');
        setActiveTab('BASIC');
        return;
      }
      if (!staffId.trim()) {
        setErrorMessage('Staff ID is required.');
        setActiveTab('BASIC');
        return;
      }
    } else {
      const computedFullName = fullName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim();
      if (!computedFullName) {
        setErrorMessage('Student name (First & Last name) is required.');
        setActiveTab('BASIC');
        return;
      }
      if (!admissionNo.trim()) {
        setErrorMessage('Admission Number is required.');
        setActiveTab('BASIC');
        return;
      }
    }

    setIsProcessing(true);

    try {
      if (entityType === 'TEACHER') {
        const assignedClass = classes.find(c => c.id === classTeacherOfId);
        const subjectsTaughtNames = subjects
          .filter(s => subjectsTaughtIds.includes(s.id))
          .map(s => s.subjectName);

        const teacherPayload: Teacher = {
          id: (record as Teacher)?.id || `tch_${Date.now()}`,
          schoolId,
          staffId: staffId.trim(),
          fullName: fullName.trim(),
          gender,
          dateOfBirth,
          phone: phone.trim(),
          email: email.trim(),
          password: password.trim() || 'Teacher123!',
          qualification: qualification.trim(),
          dateEmployed,
          periodsCount: Number(periodsCount) || 18,
          isClassTeacher,
          classTeacherOfId: isClassTeacher ? classTeacherOfId : '',
          classTeacherOfName: isClassTeacher ? (assignedClass?.className || '') : '',
          assignedClassIds,
          subjectsTaughtIds,
          subjectsTaughtNames,
          photoUrl: photoUrl.trim(),
          signatureUrl: signatureUrl.trim(),
          accountStatus: teacherStatus,
          hometown: hometown.trim(),
          address: address.trim(),
          createdAt: (record as Teacher)?.createdAt || new Date().toISOString()
        };

        await saveTeacher(teacherPayload);
        setSuccessMessage(`Teacher "${teacherPayload.fullName}" saved successfully.`);
        if (onSaveSuccess) await onSaveSuccess(teacherPayload);
      } else {
        const targetClass = classes.find(c => c.id === classId || c.className === className);
        const derivedFirst = firstName.trim() || fullName.trim().split(' ')[0] || '';
        const derivedLast = lastName.trim() || fullName.trim().split(' ').slice(1).join(' ') || '';
        const finalFullName = fullName.trim() || `${derivedFirst} ${middleName ? middleName.trim() + ' ' : ''}${derivedLast}`.trim();

        const studentPayload: Student = {
          id: (record as Student)?.id || `stu_${Date.now()}`,
          schoolId,
          studentId: studentId.trim(),
          admissionNo: admissionNo.trim(),
          fullName: finalFullName,
          firstName: derivedFirst,
          middleName: middleName.trim(),
          lastName: derivedLast,
          gender,
          dateOfBirth,
          password: password.trim() || dateOfBirth,
          photoUrl: photoUrl.trim(),
          nationality: 'Ghanaian',
          academicYear: '2026/2027',
          schoolType: (targetClass?.schoolType as SchoolType) || 'PRIMARY',
          classId: targetClass?.id || classId || 'class_1',
          className: targetClass?.className || className || 'BASIC 1',
          stream: stream.trim(),
          house: house.trim(),
          admissionDate: admissionDate || new Date().toISOString().split('T')[0],
          previousSchool: previousSchool.trim(),
          status: studentStatus,
          parentName: parentName.trim(),
          parentRelationship: parentRelationship.trim(),
          parentPhone: parentPhone.trim(),
          parentAltPhone: parentAltPhone.trim(),
          parentEmail: parentEmail.trim(),
          parentAddress: parentAddress.trim(),
          parentDigitalAddress: parentDigitalAddress.trim(),
          parentOccupation: parentOccupation.trim(),
          emergencyName: emergencyName.trim() || parentName.trim(),
          emergencyPhone: emergencyPhone.trim() || parentPhone.trim(),
          emergencyRelationship: emergencyRelationship.trim() || parentRelationship.trim(),
          createdAt: (record as Student)?.createdAt || new Date().toISOString()
        };

        await saveStudent(studentPayload);
        setSuccessMessage(`Student "${studentPayload.fullName}" saved successfully.`);
        if (onSaveSuccess) await onSaveSuccess(studentPayload);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMessage(err.message || 'Failed to save record. Please check connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // DELETE CONFIRMATION HANDLER
  // ==========================================
  const handleDeleteConfirm = async () => {
    if (!record) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (entityType === 'TEACHER') {
        await deleteTeacher(record.id);
      } else {
        await deleteStudent(record.id);
      }

      if (onDeleteSuccess) {
        await onDeleteSuccess(record.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorMessage(err.message || 'Failed to delete record.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // =========================================================================
  // VIEW 1: DELETE CONFIRMATION MODAL
  // =========================================================================
  if (mode === 'DELETE' && record) {
    const isTeacher = entityType === 'TEACHER';
    const identifier = isTeacher ? (record as Teacher).staffId : (record as Student).admissionNo;
    const name = record.fullName;

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-[#0f111a] border border-rose-900/50 rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl text-slate-200 space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Delete {isTeacher ? 'Teacher Staff Record' : 'Student Enrollment'}
              </h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently remove <strong className="text-white font-semibold">{name}</strong> (<span className="text-cyan-400 font-mono">{identifier}</span>) from school records?
              </p>
            </div>
          </div>

          <div className="p-3 bg-rose-950/25 border border-rose-900/40 rounded-2xl text-[11px] text-rose-300/90 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              Permanent Action Warning
            </div>
            <p>
              {isTeacher
                ? 'Deleting this teacher will detach linked class masterships, timetable slots, and continuous assessment score logs.'
                : 'Deleting this student will permanently erase all terminal report cards, continuous assessment records, and fee payment ledgers.'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-4 py-2.5 bg-[#161925] border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDeleteConfirm}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-lg shadow-rose-950/50 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isProcessing ? 'Deleting Record...' : 'Confirm & Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PROFILE VIEW DETAILS MODAL
  // =========================================================================
  if (mode === 'VIEW' && record) {
    const isTeacher = entityType === 'TEACHER';
    const tch = isTeacher ? (record as Teacher) : null;
    const stu = !isTeacher ? (record as Student) : null;

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-[#0f111a] border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl text-xs text-slate-300 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                {isTeacher ? <GraduationCap className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{record.fullName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    (isTeacher ? tch?.accountStatus : stu?.status) === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {isTeacher ? tch?.accountStatus : stu?.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {isTeacher ? `Staff ID: ${tch?.staffId}` : `Admission: ${stu?.admissionNo} | ID: ${stu?.studentId}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto space-y-6 pr-1 flex-1">
            {/* Top Identity & Photo Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-[#161925] border border-slate-800">
              <div className="w-24 h-28 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                {record.photoUrl ? (
                  <img src={record.photoUrl} alt={record.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-600" />
                )}
              </div>
              <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Gender</span>
                    <span className="font-semibold text-white">{record.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Birth</span>
                    <span className="font-semibold text-white">{record.dateOfBirth || 'N/A'}</span>
                  </div>
                  {isTeacher ? (
                    <>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Qualification</span>
                        <span className="font-semibold text-white">{tch?.qualification}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Date Employed</span>
                        <span className="font-semibold text-white">{tch?.dateEmployed}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Current Class</span>
                        <span className="font-semibold text-blue-400">{stu?.className}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Admission Date</span>
                        <span className="font-semibold text-white">{stu?.admissionDate || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Teacher Specific Details */}
            {isTeacher && tch && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#161925] border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    Teaching Responsibilities & Assignments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Class Teacher Assignment</span>
                      <span className="font-semibold text-white">
                        {tch.isClassTeacher ? `Form Master of ${tch.classTeacherOfName || 'Class'}` : 'Not a Class Teacher'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Weekly Teaching Load</span>
                      <span className="font-semibold text-white">{tch.periodsCount || 18} Periods / Week</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Subjects Allocated</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tch.subjectsTaughtNames && tch.subjectsTaughtNames.length > 0 ? (
                        tch.subjectsTaughtNames.map((sName, i) => (
                          <span key={i} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-[11px] font-medium">
                            {sName}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-xs italic">No specific subjects assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Digital Signature Card */}
                {tch.signatureUrl && (
                  <div className="p-4 rounded-2xl bg-[#161925] border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                        Teacher Digital Signature
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Applied automatically to student report card remarks</p>
                    </div>
                    <div className="h-12 w-28 bg-white/5 border border-slate-700 rounded-xl p-1 flex items-center justify-center">
                      <img src={tch.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Student Specific Details: Parent & Emergency */}
            {!isTeacher && stu && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#161925] border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-blue-400" />
                    Parent / Guardian Contact Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Parent / Guardian Name</span>
                      <span className="font-semibold text-white">{stu.parentName || 'N/A'} ({stu.parentRelationship || 'Parent'})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Parent Phone Number</span>
                      <a href={`tel:${stu.parentPhone}`} className="font-semibold text-blue-400 hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {stu.parentPhone || 'N/A'}
                      </a>
                    </div>
                    {stu.parentEmail && (
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Email Address</span>
                        <a href={`mailto:${stu.parentEmail}`} className="text-blue-400 hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {stu.parentEmail}
                        </a>
                      </div>
                    )}
                    {stu.parentAddress && (
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Residential Address</span>
                        <span className="text-slate-300">{stu.parentAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#161925] border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Emergency Contact & Portal Credentials
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Emergency Contact</span>
                      <span className="font-semibold text-white">{stu.emergencyName || stu.parentName} ({stu.emergencyPhone || stu.parentPhone})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Student Portal Initial Passcode</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/40">
                        {stu.password || stu.dateOfBirth} (DOB)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onChangeMode) onChangeMode('DELETE');
              }}
              className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Record
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onChangeMode) onChangeMode('EDIT');
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: CREATE / EDIT RECORD MODAL FORM
  // =========================================================================
  const isTeacher = entityType === 'TEACHER';
  const modalTitle = mode === 'CREATE'
    ? (isTeacher ? 'Register New Teacher' : 'Enroll New Student')
    : (isTeacher ? `Edit Teacher: ${fullName || staffId}` : `Edit Student: ${fullName || admissionNo}`);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl max-w-3xl w-full p-4 sm:p-7 shadow-2xl text-xs text-slate-300 space-y-5 my-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              {isTeacher ? <GraduationCap className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{modalTitle}</h3>
              <p className="text-[11px] text-slate-400">
                {isTeacher
                  ? 'Manage staff credentials, teaching allocations, profile photo & signature.'
                  : 'Enroll student, assign class stream, configure parent contact & portal login.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs for Form Sections */}
        <div className="flex items-center gap-1.5 p-1 bg-[#161925] border border-slate-800 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('BASIC')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'BASIC'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            1. Basic & Personal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACADEMIC')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ACADEMIC'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isTeacher ? <BookOpen className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            {isTeacher ? '2. Teaching & Classes' : '2. Class & Parent'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MEDIA_SECURITY')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'MEDIA_SECURITY'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            3. Photo & Credentials
          </button>
        </div>

        {/* Feedback Notices */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'BASIC' && (
            <div className="space-y-4">
              {isTeacher ? (
                // TEACHER BASIC INFO
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Staff ID / Employee Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        placeholder="e.g. TCH-409"
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Samuel Mensah"
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Account Status</label>
                      <select
                        value={teacherStatus}
                        onChange={(e) => setTeacherStatus(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="ACTIVE">Active Staff</option>
                        <option value="INACTIVE">Inactive / On Leave</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 0244123456"
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. teacher@school.edu.gh"
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Qualification</label>
                      <input
                        type="text"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        placeholder="e.g. B.Ed. Basic Education, M.Sc."
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date Employed</label>
                      <input
                        type="date"
                        value={dateEmployed}
                        onChange={(e) => setDateEmployed(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                // STUDENT BASIC INFO
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Admission Number * (Portal Username)
                      </label>
                      <input
                        type="text"
                        required
                        value={admissionNo}
                        onChange={(e) => setAdmissionNo(e.target.value)}
                        placeholder="e.g. ADM/2026/001"
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Student Index / ID
                      </label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. STU-2026-402"
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Kofi"
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Middle Name</label>
                      <input
                        type="text"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="e.g. Kwame"
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Owusu"
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Date of Birth * (Default Password)
                      </label>
                      <input
                        type="date"
                        required
                        value={dateOfBirth}
                        onChange={(e) => {
                          setDateOfBirth(e.target.value);
                          if (mode === 'CREATE') setPassword(e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Enrollment Status</label>
                      <select
                        value={studentStatus}
                        onChange={(e) => setStudentStatus(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="ACTIVE">Active Student</option>
                        <option value="GRADUATED">Graduated</option>
                        <option value="WITHDRAWN">Withdrawn</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: ACADEMIC & ALLOCATIONS / PARENT INFORMATION */}
          {activeTab === 'ACADEMIC' && (
            <div className="space-y-4">
              {isTeacher ? (
                // TEACHER ACADEMIC ALLOCATIONS
                <>
                  <div className="p-4 bg-[#161925] border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isClassTeacher}
                          onChange={(e) => setIsClassTeacher(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded bg-[#0f111a] border-slate-700"
                        />
                        <span className="font-semibold text-white text-xs">Assign as Class Form Master / Class Teacher</span>
                      </label>
                    </div>

                    {isClassTeacher && (
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Select Class
                        </label>
                        <select
                          value={classTeacherOfId}
                          onChange={(e) => setClassTeacherOfId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">-- Choose Class --</option>
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.className}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Assigned Teaching Classes
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-[#161925] border border-slate-800 rounded-2xl max-h-36 overflow-y-auto">
                      {classes.map(c => {
                        const checked = assignedClassIds.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-800/50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignedClassIds([...assignedClassIds, c.id]);
                                } else {
                                  setAssignedClassIds(assignedClassIds.filter(id => id !== c.id));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded bg-[#0f111a] border-slate-700 text-blue-600"
                            />
                            <span>{c.className}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Subjects Taught
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-[#161925] border border-slate-800 rounded-2xl max-h-36 overflow-y-auto">
                      {subjects.map(s => {
                        const checked = subjectsTaughtIds.includes(s.id);
                        return (
                          <label key={s.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-800/50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSubjectsTaughtIds([...subjectsTaughtIds, s.id]);
                                } else {
                                  setSubjectsTaughtIds(subjectsTaughtIds.filter(id => id !== s.id));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded bg-[#0f111a] border-slate-700 text-blue-600"
                            />
                            <span>{s.subjectName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                // STUDENT ACADEMIC & PARENT DETAILS
                <>
                  <div className="p-4 bg-[#161925] border border-slate-800 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                      Class Enrollment & Academic Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Class Assigned</label>
                          <select
                            value={className}
                            onChange={(e) => {
                              setClassName(e.target.value);
                              const matched = classes.find(c => c.className === e.target.value);
                              if (matched) setClassId(matched.id);
                            }}
                            className="w-full px-3.5 py-2.5 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                          >
                            {classes.map(c => (
                              <option key={c.id} value={c.className}>{c.className}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">House (Optional)</label>
                        <input
                          type="text"
                          value={house}
                          onChange={(e) => setHouse(e.target.value)}
                          placeholder="e.g. Aggrey, Gbewaa"
                          className="w-full px-3.5 py-2.5 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#161925] border border-slate-800 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-blue-400" />
                      Parent / Guardian Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Parent Full Name</label>
                        <input
                          type="text"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          placeholder="e.g. Beatrice Mensah"
                          className="w-full px-3.5 py-2.5 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Relationship</label>
                        <select
                          value={parentRelationship}
                          onChange={(e) => setParentRelationship(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="Mother">Mother</option>
                          <option value="Father">Father</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Uncle">Uncle</option>
                          <option value="Aunt">Aunt</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Parent Phone Number *</label>
                        <input
                          type="tel"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          placeholder="e.g. 0244123456"
                          className="w-full px-3.5 py-2.5 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Parent Email</label>
                        <input
                          type="email"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          placeholder="e.g. parent@gmail.com"
                          className="w-full px-3.5 py-2.5 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: MEDIA (PROFILE PICTURE & DIGITAL SIGNATURE) & SECURITY */}
          {activeTab === 'MEDIA_SECURITY' && (
            <div className="space-y-4">
              {/* Profile Photo Upload */}
              <div className="p-4 bg-[#161925] border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    Passport Photo / Profile Picture
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Canvas Compressed &lt;40KB</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-28 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center relative shrink-0">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Passport Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-600" />
                    )}
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-1 right-1 p-1 bg-rose-600/80 hover:bg-rose-500 text-white rounded-md cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploadingPhoto}
                        onClick={() => photoInputRef.current?.click()}
                        className="px-3.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Upload Image File
                      </button>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <input
                        type="text"
                        placeholder="Or paste photo URL..."
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    {photoUploadNote && (
                      <p className="text-[11px] text-blue-400">{photoUploadNote}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Digital Signature Field (Especially for Teachers / School Staff) */}
              <div className="p-4 bg-[#161925] border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                    Digital Signature Image & Pad
                  </h4>
                  <span className="text-[10px] text-slate-400">Used for report cards & credentials</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-32 h-16 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center relative shrink-0 p-1">
                    {signatureUrl ? (
                      <img src={signatureUrl} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No signature</span>
                    )}
                    {signatureUrl && (
                      <button
                        type="button"
                        onClick={() => setSignatureUrl('')}
                        className="absolute top-1 right-1 p-0.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded cursor-pointer"
                        title="Remove signature"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploadingSignature}
                        onClick={() => signatureInputRef.current?.click()}
                        className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        {isUploadingSignature ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Upload Signature
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSignaturePad(!showSignaturePad)}
                        className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        {showSignaturePad ? 'Hide Pad' : 'Draw with Pad'}
                      </button>
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                      <input
                        type="text"
                        placeholder="Or signature URL..."
                        value={signatureUrl}
                        onChange={(e) => setSignatureUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    {signatureUploadNote && (
                      <p className="text-[11px] text-emerald-400">{signatureUploadNote}</p>
                    )}
                  </div>
                </div>

                {/* Draw Canvas Pad Modal Container */}
                {showSignaturePad && (
                  <div className="p-3 bg-[#0f111a] border border-purple-900/40 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-purple-300">
                      <span>Draw signature in the box below using mouse or touchscreen:</span>
                      <button
                        type="button"
                        onClick={clearCanvasSignature}
                        className="text-xs text-rose-400 hover:underline cursor-pointer"
                      >
                        Clear Canvas
                      </button>
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={320}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-28 bg-white rounded-xl cursor-crosshair border border-slate-600 touch-none"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowSignaturePad(false)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveCanvasSignature}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs cursor-pointer shadow flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Apply Pad Signature
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Portal Security / Login Password */}
              <div className="p-4 bg-[#161925] border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  Portal Authentication Password
                </h4>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {isTeacher ? 'Teacher Account Password' : 'Student Portal Password (Default is Date of Birth)'}
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isTeacher ? 'Teacher123!' : 'YYYY-MM-DD'}
                    className="w-full px-3.5 py-2.5 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isTeacher
                      ? 'Teacher signs in with their Staff ID or Email and this password.'
                      : 'Students sign in with their Admission Number and this password.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#161925] border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {activeTab !== 'BASIC' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'MEDIA_SECURITY' ? 'ACADEMIC' : 'BASIC')}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Previous
                </button>
              )}
              {activeTab !== 'MEDIA_SECURITY' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'BASIC' ? 'ACADEMIC' : 'MEDIA_SECURITY')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-md transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-lg shadow-blue-900/40 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isProcessing ? 'Saving Record...' : mode === 'CREATE' ? 'Complete Registration' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default RecordManagementModal;
