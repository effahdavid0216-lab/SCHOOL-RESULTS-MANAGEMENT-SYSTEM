import React, { useState, useEffect, useRef } from 'react';
import {
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
  HeartHandshake,
  Users,
  Key,
  X,
  MapPin,
  Clock
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
import {
  Button,
  IconButton,
  Input,
  Select,
  FormField,
  Badge,
  Modal
} from './ui';

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
  const [stream, setStream] = useState('A');
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
    if (isOpen) {
      resetForm();
      setActiveTab('BASIC');
      setShowSignaturePad(false);

      if (record) {
        populateRecord(record);
      } else {
        initNewRecord();
      }
    }
  }, [isOpen, record, mode, entityType]);

  const initNewRecord = () => {
    const defaultDate = new Date().toISOString().split('T')[0];
    const defaultClass = classes.length > 0 ? classes[0] : null;

    if (entityType === 'TEACHER') {
      const randomStaffNum = Math.floor(100 + Math.random() * 900);
      setStaffId(`TCH-${randomStaffNum}`);
      setFullName('');
      setGender('MALE');
      setDateOfBirth('1990-01-01');
      setPhone('');
      setEmail('');
      setQualification('B.Ed. Basic Education');
      setDateEmployed(defaultDate);
      setPeriodsCount(18);
      setIsClassTeacher(false);
      setClassTeacherOfId('');
      setAssignedClassIds(classes.length > 0 ? [classes[0].id] : []);
      setSubjectsTaughtIds(subjects.length > 0 ? [subjects[0].id] : []);
      setTeacherStatus('ACTIVE');
      setPassword('Teacher123!');
      setPhotoUrl('');
      setSignatureUrl('');
      setHometown('');
      setAddress('');
    } else {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setAdmissionNo(`ADM/${year}/${randomNum}`);
      setStudentId(`STU-${year}-${randomNum}`);
      setFullName('');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setGender('MALE');
      setDateOfBirth('2014-05-15');
      setPassword('2014-05-15');
      setClassName(defaultClass ? defaultClass.className : 'BASIC 1');
      setClassId(defaultClass ? defaultClass.id : '');
      setStream('A');
      setHouse('');
      setAdmissionDate(defaultDate);
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

  const populateRecord = (rec: Teacher | Student) => {
    if (entityType === 'TEACHER') {
      const t = rec as Teacher;
      setStaffId(t.staffId || '');
      setFullName(t.fullName || '');
      setGender(t.gender || 'MALE');
      setDateOfBirth(t.dateOfBirth || '');
      setPhone(t.phone || '');
      setEmail(t.email || '');
      setQualification(t.qualification || 'B.Ed.');
      setDateEmployed(t.dateEmployed || '');
      setPeriodsCount(t.periodsCount || 18);
      setIsClassTeacher(Boolean(t.isClassTeacher));
      setClassTeacherOfId(t.classTeacherOfId || '');
      setAssignedClassIds(t.assignedClassIds || []);
      setSubjectsTaughtIds(t.subjectsTaughtIds || []);
      setTeacherStatus(t.accountStatus || 'ACTIVE');
      setPassword(t.password || 'Teacher123!');
      setPhotoUrl(t.photoUrl || '');
      setSignatureUrl(t.signatureUrl || '');
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
    setPhotoUploadNote('Compressing photo...');

    try {
      const compressedDataUrl = await compressPassportPhoto(file);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const folder = entityType === 'TEACHER' ? 'teachers' : 'students';
      const storagePath = `schools/${schoolId}/${folder}/photos/${Date.now()}_${cleanFileName}`;

      const blob = dataUrlToBlob(compressedDataUrl);
      const uploadRes = await uploadToSupabaseStorage('school-assets', storagePath, blob, 'image/jpeg');

      if (uploadRes.success && uploadRes.url) {
        setPhotoUrl(uploadRes.url);
        setPhotoUploadNote('Photo saved to cloud storage.');
      } else {
        setPhotoUrl(compressedDataUrl);
        setPhotoUploadNote('Photo compressed & attached.');
      }
    } catch (err: any) {
      console.warn('Photo upload exception, fallback to compressed data URL:', err);
      try {
        const compressedDataUrl = await compressPassportPhoto(file);
        setPhotoUrl(compressedDataUrl);
        setPhotoUploadNote('Photo attached.');
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
        setSignatureUploadNote('Signature stored in cloud storage.');
      } else {
        setSignatureUrl(compressedDataUrl);
        setSignatureUploadNote('Signature compressed & saved.');
      }
    } catch (err: any) {
      console.warn('Signature storage fallback:', err);
      try {
        const compressedDataUrl = await compressSignatureFile(file);
        setSignatureUrl(compressedDataUrl);
        setSignatureUploadNote('Signature saved.');
      } catch (fallbackErr) {
        console.error('Signature read error:', fallbackErr);
      }
    } finally {
      setIsUploadingSignature(false);
    }
  };

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
    ctx.strokeStyle = '#4f46e5';
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
    setSignatureUploadNote('Handwritten signature captured.');
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
      if (!phone.trim()) {
        setErrorMessage('Phone number is required.');
        setActiveTab('BASIC');
        return;
      }
    } else {
      if (!admissionNo.trim()) {
        setErrorMessage('Admission Number is required.');
        setActiveTab('BASIC');
        return;
      }
      if (!firstName.trim() && !fullName.trim()) {
        setErrorMessage('Student name is required.');
        setActiveTab('BASIC');
        return;
      }
      if (!parentPhone.trim()) {
        setErrorMessage('Parent / Guardian phone number is required.');
        setActiveTab('ACADEMIC');
        return;
      }
    }

    setIsProcessing(true);

    try {
      if (entityType === 'TEACHER') {
        const assignedClassNames = classes
          .filter((c) => assignedClassIds.includes(c.id))
          .map((c) => c.className);

        const assignedSubjectNames = (subjects || [])
          .filter((s) => subjectsTaughtIds.includes(s.id))
          .map((s) => s.subjectName);

        const assignedClass = classes.find((c) => c.id === classTeacherOfId);

        const teacherPayload: Teacher = {
          id: (record as Teacher)?.id || `tch_${Date.now()}`,
          schoolId,
          staffId: staffId.trim(),
          fullName: fullName.trim(),
          gender,
          dateOfBirth,
          phone: phone.trim(),
          email: email.trim() || `${staffId.toLowerCase()}@school.edu.gh`,
          qualification: qualification.trim(),
          dateEmployed: dateEmployed || new Date().toISOString().split('T')[0],
          periodsCount: Number(periodsCount) || 18,
          isClassTeacher,
          classTeacherOfId: isClassTeacher ? classTeacherOfId : undefined,
          classTeacherOfName: isClassTeacher && assignedClass ? assignedClass.className : undefined,
          assignedClassIds,
          assignedClassNames,
          subjectsTaughtIds,
          subjectsTaughtNames: assignedSubjectNames,
          photoUrl: photoUrl.trim(),
          signatureUrl: signatureUrl.trim(),
          accountStatus: teacherStatus,
          password: password.trim() || 'Teacher123!',
          hometown: hometown.trim(),
          address: address.trim(),
          createdAt: (record as Teacher)?.createdAt || new Date().toISOString()
        };

        await saveTeacher(teacherPayload);
        setSuccessMessage(`Teacher "${teacherPayload.fullName}" saved successfully.`);
        if (onSaveSuccess) await onSaveSuccess(teacherPayload);
      } else {
        const targetClass = classes.find((c) => c.id === classId || c.className === className);
        const derivedFirst = firstName.trim() || fullName.trim().split(' ')[0] || '';
        const derivedLast = lastName.trim() || fullName.trim().split(' ').slice(1).join(' ') || '';
        const finalFullName =
          fullName.trim() || `${derivedFirst} ${middleName ? middleName.trim() + ' ' : ''}${derivedLast}`.trim();

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
          classId: targetClass?.id || classId || (classes[0]?.id ?? 'class_1'),
          className: targetClass?.className || className || (classes[0]?.className ?? 'BASIC 1'),
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
      }, 600);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMessage(err.message || 'Failed to save record. Please try again.');
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
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Delete ${isTeacher ? 'Teacher Staff Record' : 'Student Enrollment'}`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isProcessing}
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleDeleteConfirm}
            >
              Confirm & Delete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Are you sure you want to permanently remove <strong className="text-slate-900 dark:text-white font-bold">{name}</strong> (
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">{identifier}</span>) from school records?
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Permanent Action Warning</span>
            </div>
            <p className="leading-relaxed">
              {isTeacher
                ? 'Deleting this teacher will detach linked class master assignments, timetable slots, and continuous assessment score logs.'
                : 'Deleting this student will permanently erase all terminal report cards, continuous assessment records, and fee payment ledgers.'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}
        </div>
      </Modal>
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
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={record.fullName}
        description={isTeacher ? `Staff ID: ${tch?.staffId}` : `Admission: ${stu?.admissionNo} • ID: ${stu?.studentId}`}
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                if (onChangeMode) onChangeMode('DELETE');
              }}
            >
              Delete Record
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (onChangeMode) onChangeMode('EDIT');
                }}
              >
                Edit Profile
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="w-24 h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {record.photoUrl ? (
                <img src={record.photoUrl} alt={record.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="space-y-2 flex-1 w-full text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Badge
                  variant={(isTeacher ? tch?.accountStatus : stu?.status) === 'ACTIVE' ? 'active' : 'inactive'}
                  label={isTeacher ? tch?.accountStatus : stu?.status}
                />
                <span className="text-xs text-slate-500 font-mono">
                  {isTeacher ? tch?.staffId : stu?.admissionNo}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{record.gender}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Date of Birth</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{record.dateOfBirth || 'N/A'}</span>
                </div>
                {isTeacher ? (
                  <>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Qualification</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{tch?.qualification}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Date Employed</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{tch?.dateEmployed}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Current Class</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stu?.className}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Admission Date</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{stu?.admissionDate || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Teacher Specific Details */}
          {isTeacher && tch && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Teaching Responsibilities & Assignments
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Class Teacher Assignment</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {tch.isClassTeacher ? `Form Master of ${tch.classTeacherOfName || 'Class'}` : 'Not a Class Teacher'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Weekly Teaching Load</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{tch.periodsCount || 18} Periods / Week</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold mb-1.5">Subjects Allocated</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tch.subjectsTaughtNames && tch.subjectsTaughtNames.length > 0 ? (
                      tch.subjectsTaughtNames.map((sName, i) => (
                        <Badge key={i} variant="submitted" label={sName} />
                      ))
                    ) : (
                      <span className="text-slate-500 text-xs italic">No specific subjects assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {tch.signatureUrl && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Teacher Digital Signature
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Applied automatically to student report card remarks</p>
                  </div>
                  <div className="h-12 w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 flex items-center justify-center">
                    <img src={tch.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student Specific Details */}
          {!isTeacher && stu && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Parent & Guardian Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Parent Name</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{stu.parentName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Relationship</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{stu.parentRelationship || 'Parent'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Primary Phone</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">{stu.parentPhone || 'N/A'}</span>
                  </div>
                  {stu.parentEmail && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Parent Email</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{stu.parentEmail}</span>
                    </div>
                  )}
                  {stu.parentAddress && (
                    <div className="sm:col-span-3">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Residential Address</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{stu.parentAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  // =========================================================================
  // VIEW 3: CREATE / EDIT RECORD MODAL FORM
  // =========================================================================
  const isTeacher = entityType === 'TEACHER';
  const modalTitle =
    mode === 'CREATE'
      ? isTeacher
        ? 'Register New Teacher'
        : 'Enroll New Student'
      : isTeacher
      ? `Edit Teacher: ${fullName || staffId}`
      : `Edit Student: ${fullName || admissionNo}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description={
        isTeacher
          ? 'Manage staff credentials, teaching allocations, profile photo & signature.'
          : 'Enroll student, assign class stream, configure parent contact & portal login.'
      }
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('BASIC')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'BASIC'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            3. Photo & Security
          </button>
        </div>

        {/* Notices */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'BASIC' && (
            <div className="space-y-4">
              {isTeacher ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Staff ID / Employee Code"
                      required
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      placeholder="e.g. TCH-409"
                    />
                    <Input
                      label="Full Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Samuel Mensah"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select
                      label="Gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </Select>
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                    <Select
                      label="Account Status"
                      value={teacherStatus}
                      onChange={(e) => setTeacherStatus(e.target.value as any)}
                    >
                      <option value="ACTIVE">Active Staff</option>
                      <option value="INACTIVE">Inactive / On Leave</option>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0244123456"
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. teacher@school.edu.gh"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Qualification"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. B.Ed. Basic Education, M.Sc."
                    />
                    <Input
                      label="Date Employed"
                      type="date"
                      value={dateEmployed}
                      onChange={(e) => setDateEmployed(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Admission Number (Portal Username)"
                      required
                      value={admissionNo}
                      onChange={(e) => setAdmissionNo(e.target.value)}
                      placeholder="e.g. ADM/2026/001"
                    />
                    <Input
                      label="Student Index / ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. STU-2026-402"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="First Name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Kofi"
                    />
                    <Input
                      label="Middle Name"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="e.g. Kwame"
                    />
                    <Input
                      label="Last Name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Owusu"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select
                      label="Gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </Select>
                    <Input
                      label="Date of Birth (Default Password)"
                      required
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        if (mode === 'CREATE') setPassword(e.target.value);
                      }}
                    />
                    <Select
                      label="Enrollment Status"
                      value={studentStatus}
                      onChange={(e) => setStudentStatus(e.target.value as any)}
                    >
                      <option value="ACTIVE">Active Student</option>
                      <option value="GRADUATED">Graduated</option>
                      <option value="WITHDRAWN">Withdrawn</option>
                      <option value="SUSPENDED">Suspended</option>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: ACADEMIC & ALLOCATIONS / PARENT INFORMATION */}
          {activeTab === 'ACADEMIC' && (
            <div className="space-y-4">
              {isTeacher ? (
                <>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isClassTeacher}
                        onChange={(e) => setIsClassTeacher(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        Assign as Class Form Master / Class Teacher
                      </span>
                    </label>

                    {isClassTeacher && (
                      <Select
                        label="Select Class"
                        value={classTeacherOfId}
                        onChange={(e) => setClassTeacherOfId(e.target.value)}
                      >
                        <option value="">-- Choose Class --</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.className}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>

                  <FormField label="Assigned Teaching Classes">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-36 overflow-y-auto">
                      {classes.map((c) => {
                        const checked = assignedClassIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignedClassIds([...assignedClassIds, c.id]);
                                } else {
                                  setAssignedClassIds(assignedClassIds.filter((id) => id !== c.id));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600"
                            />
                            <span>{c.className}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FormField>

                  <FormField label="Subjects Taught">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-36 overflow-y-auto">
                      {(subjects || []).map((s) => {
                        const checked = subjectsTaughtIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSubjectsTaughtIds([...subjectsTaughtIds, s.id]);
                                } else {
                                  setSubjectsTaughtIds(subjectsTaughtIds.filter((id) => id !== s.id));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600"
                            />
                            <span>{s.subjectName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FormField>
                </>
              ) : (
                <>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Class Enrollment & Academic Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Select
                        label="Class Assigned"
                        value={className}
                        onChange={(e) => {
                          setClassName(e.target.value);
                          const matched = classes.find((c) => c.className === e.target.value);
                          if (matched) setClassId(matched.id);
                        }}
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.className}>
                            {c.className}
                          </option>
                        ))}
                      </Select>
                      <Input
                        label="Stream (e.g. A, B)"
                        value={stream}
                        onChange={(e) => setStream(e.target.value)}
                        placeholder="A"
                      />
                      <Input
                        label="House (Optional)"
                        value={house}
                        onChange={(e) => setHouse(e.target.value)}
                        placeholder="e.g. Aggrey, Gbewaa"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Parent / Guardian Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Input
                          label="Parent Full Name"
                          required
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          placeholder="e.g. Beatrice Mensah"
                        />
                      </div>
                      <Select
                        label="Relationship"
                        value={parentRelationship}
                        onChange={(e) => setParentRelationship(e.target.value)}
                      >
                        <option value="Mother">Mother</option>
                        <option value="Father">Father</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Uncle">Uncle</option>
                        <option value="Aunt">Aunt</option>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Parent Phone Number"
                        required
                        type="tel"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="e.g. 0244123456"
                      />
                      <Input
                        label="Parent Email"
                        type="email"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        placeholder="e.g. parent@gmail.com"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: MEDIA & SECURITY */}
          {activeTab === 'MEDIA_SECURITY' && (
            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Passport Photo / Profile Picture
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Canvas Compressed &lt;40KB</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative shrink-0">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Passport Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md cursor-pointer hover:bg-rose-700 transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingPhoto}
                        leftIcon={<Upload className="w-3.5 h-3.5" />}
                        onClick={() => photoInputRef.current?.click()}
                      >
                        {isUploadingPhoto ? 'Processing...' : 'Upload Image'}
                      </Button>
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
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {photoUploadNote && <p className="text-[11px] text-indigo-600 dark:text-indigo-400">{photoUploadNote}</p>}
                  </div>
                </div>
              </div>

              {/* Digital Signature */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Digital Signature Image & Pad
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Used for report card remarks</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-32 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative shrink-0 p-1">
                    {signatureUrl ? (
                      <img src={signatureUrl} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No signature</span>
                    )}
                    {signatureUrl && (
                      <button
                        type="button"
                        onClick={() => setSignatureUrl('')}
                        className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded cursor-pointer hover:bg-rose-700 transition-colors"
                        title="Remove signature"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingSignature}
                        leftIcon={<Upload className="w-3.5 h-3.5" />}
                        onClick={() => signatureInputRef.current?.click()}
                      >
                        {isUploadingSignature ? 'Uploading...' : 'Upload File'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<PenTool className="w-3.5 h-3.5" />}
                        onClick={() => setShowSignaturePad(!showSignaturePad)}
                      >
                        {showSignaturePad ? 'Hide Pad' : 'Draw Pad'}
                      </Button>
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
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {signatureUploadNote && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{signatureUploadNote}</p>
                    )}
                  </div>
                </div>

                {showSignaturePad && (
                  <div className="p-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>Draw signature in the box below:</span>
                      <button
                        type="button"
                        onClick={clearCanvasSignature}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-semibold"
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
                      className="w-full h-28 bg-slate-50 dark:bg-slate-950 rounded-xl cursor-crosshair border border-slate-300 dark:border-slate-700 touch-none"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button type="button" variant="secondary" size="sm" onClick={() => setShowSignaturePad(false)}>
                        Cancel
                      </Button>
                      <Button type="button" variant="primary" size="sm" onClick={saveCanvasSignature}>
                        Apply Signature
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Portal Authentication Password
                </h4>
                <Input
                  label={isTeacher ? 'Teacher Account Password' : 'Student Portal Password (Default is Date of Birth)'}
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isTeacher ? 'Teacher123!' : 'YYYY-MM-DD'}
                  helperText={
                    isTeacher
                      ? 'Teacher signs in with their Staff ID or Email and this password.'
                      : 'Students sign in with their Admission Number and this password.'
                  }
                />
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              {activeTab !== 'BASIC' && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setActiveTab(activeTab === 'MEDIA_SECURITY' ? 'ACADEMIC' : 'BASIC')}
                >
                  Previous
                </Button>
              )}
              {activeTab !== 'MEDIA_SECURITY' ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setActiveTab(activeTab === 'BASIC' ? 'ACADEMIC' : 'MEDIA_SECURITY')}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isProcessing}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  {mode === 'CREATE' ? 'Complete Registration' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RecordManagementModal;
