export type SchoolType = 'PRIMARY' | 'JHS' | 'PRIMARY_JHS';

export type SubjectType = 'CORE' | 'ELECTIVE' | 'LANGUAGE';

export type LicenseStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'CANCELLED';

export type SubscriptionPlan = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'TRIAL';

export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT';

export interface School {
  id: string;
  schoolId: string; // Unique primary tenant identifier e.g. SCH-GH-000001
  name: string;
  schoolType: SchoolType;
  contactPerson: string;
  phone: string;
  altPhone?: string;
  email: string;
  address: string;
  district: string;
  region: string;
  country: string;
  motto?: string;
  logoUrl?: string;
  digitalAddress?: string;
  website?: string;
  registrationNumber?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  activationStatus: 'NOT_ACTIVATED' | 'ACTIVATED' | 'SETUP_COMPLETED';
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  subscriptionPlan?: SubscriptionPlan;
  subscriptionPrice?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface License {
  id: string;
  schoolId: string;
  licenseKey: string;
  licenseType: '30_DAYS' | '3_MONTHS' | '6_MONTHS' | '8_MONTHS' | '12_MONTHS' | 'CUSTOM';
  durationDays: number;
  startDate: string;
  expiresAt: string;
  status: LicenseStatus;
  subscriptionPlan?: SubscriptionPlan;
  price?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SuperAdminConfig {
  fullName?: string;
  username: string;
  password?: string;
  passwordHash?: string;
  email: string;
  recoveryEmail?: string;
  recoveryPhone?: string;
  recoveryPin: string;
  securityQuestion?: string;
  securityAnswer?: string;
  securityAnswerHash?: string;
  isInitialSetupDone: boolean;
  superAdminInitialized?: boolean;
  failedLoginAttempts?: number;
  lockoutUntil?: string;
  lastLoginAt?: string;
  passwordUpdatedAt?: string;
  resetTokenHash?: string;
  resetTokenExpiresAt?: string;
  updatedAt: string;
}

export interface SuperAdminContactConfig {
  phone1: string;
  phone2: string;
  email: string;
  whatsapp: string;
  facebookHandle: string;
  tiktokHandle: string;
  twitterHandle: string;
  instagramHandle: string;
  appDownloadUrl?: string;
  updatedAt: string;
}

export interface SystemUpdateNotice {
  id: string;
  version: string;
  title: string;
  description: string;
  releaseDate: string;
  status: 'PUBLISHED' | 'DRAFT';
  isCritical: boolean;
}

export interface GlobalSystemSettings {
  appName: string;
  systemDescription?: string;
  companyName?: string;
  companyContact?: string;
  companyEmail?: string;
  companyWebsite?: string;
  supportPhone?: string;
  supportEmail?: string;
  defaultLanguage?: string;
  defaultTimeZone?: string;
  dateFormat?: string;
  timeFormat?: string;
  currencySymbol?: string;
  
  // System Branding
  logoUrl: string;
  developerLogoUrl?: string;
  faviconUrl: string;
  platformMotto?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  
  // System Versioning & Maintenance
  currentVersion: string;
  latestAvailableVersion?: string;
  minSupportedVersion: string;
  maintenanceVersion?: string;
  updateStatus?: string;
  releaseNotes?: string;
  maintenanceMode: boolean;
  maintenanceNotice?: string;
  maintenanceBypassPin?: string;

  // Defaults & Licensing
  defaultSubscriptionPlan: SubscriptionPlan;
  defaultTrialDays: number;
  licenseGracePeriodDays?: number;
  licenseRenewalBehavior?: string;
  activationValidityDays?: number;
  tokenValidityDays?: number;

  // Notifications & Gateway
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smsSenderId?: string;
  smsApiKey?: string;

  // Academic Defaults
  defaultExamPercentage: number;
  defaultSbaPercentage: number;
  
  // Storage & Backup
  autoBackupEnabled: boolean;
  backupFrequency: string;

  // Security & MFA
  securityMaxFailedLogins: number;
  sessionTimeoutMinutes?: number;
  mfaEnforced?: boolean;
  mfaMethod?: 'TOTP' | 'SMS' | 'EMAIL';

  // Feature Controls
  featureControls?: {
    studentPortal: boolean;
    teacherPortal: boolean;
    parentPortal: boolean;
    attendance: boolean;
    fees: boolean;
    examination: boolean;
    results: boolean;
    reports: boolean;
    notifications: boolean;
    timetable: boolean;
    messaging: boolean;
    analytics: boolean;
    mockExam: boolean;
    sba: boolean;
    resultPublishing: boolean;
  };

  updatedAt: string;
}

export interface SystemLicenseConfig {
  prefixSchoolId: string;
  prefixLicenseKey: string;
  prefixActivationCode: string;
  prefixSecurityToken: string;
  autoIncrementCounter: number;
  defaultDurationDays: number;
  enforceSecurityTokens: boolean;
  totalIssuedLicenses: number;
  lastGeneratedLicenseKey?: string;
  lastGeneratedSchoolId?: string;
  lastGeneratedAt?: string;
  updatedAt: string;
}

export interface ActivationCode {
  id: string;
  schoolId: string;
  code: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  usedAt?: string;
  isOneTime: boolean;
  createdAt: string;
}

export interface RegistrationToken {
  id: string;
  schoolId: string;
  token: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  usedAt?: string;
  isOneTime: boolean;
  createdAt: string;
}

export interface User {
  uid: string;
  schoolId: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  staffId?: string;
  studentId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isFirstLogin?: boolean;
  createdAt: string;
}

export interface TermCalendar {
  termName: string; // e.g., 'Term 1', 'Term 2', 'Term 3'
  reopeningDate: string;
  closingDate: string;
  vacationDate: string;
}

export interface SchoolSettings {
  id: string;
  schoolId: string;
  currentAcademicYear: string; // e.g., '2026/2027'
  currentTerm: string; // e.g., 'Term 1'
  numberOfTerms: number;
  academicCalendar: TermCalendar[];
  headmasterName?: string;
  headmasterPosition?: string;
  headmasterSignatureUrl?: string;
  schoolLogoUrl?: string;
  schoolMotto?: string;
  setupCompleted: boolean;
  updatedAt: string;
}

export type StudentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PROMOTED'
  | 'REPEATED'
  | 'GRADUATED'
  | 'TRANSFERRED'
  | 'WITHDRAWN'
  | 'SUSPENDED'
  | 'ARCHIVED';

export interface ClassItem {
  id: string;
  class_id?: string;
  schoolId: string;
  school_id?: string;
  academicYear?: string;
  academic_year_id?: string;
  className: string; // e.g. "JHS 1A", "BASIC 3"
  class_name?: string;
  classCode?: string;
  class_code?: string;
  level: string; // e.g. "KG", "PRIMARY", "JHS", "SHS"
  stream?: string; // e.g. "A", "B", "Gold"
  description?: string;
  schoolType?: SchoolType;
  classTeacherId?: string;
  classTeacherName?: string;
  subjectIds?: string[];
  teacherIds?: string[];
  capacity: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
}

export interface House {
  id: string;
  schoolId: string;
  houseName: string;
  houseMaster?: string;
  houseColor?: string;
  capacity?: number;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt?: string;
}

export interface StudentEnrollment {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  academicYear: string;
  classId: string;
  className: string;
  stream?: string;
  house?: string;
  status: StudentStatus;
  promotedToClassId?: string;
  promotedToClassName?: string;
  enrollmentDate: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentStatusHistory {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  previousStatus: StudentStatus | string;
  newStatus: StudentStatus;
  academicYear: string;
  reason?: string;
  changedBy: string;
  timestamp: string;
}

export interface TeacherSubjectAssignment {
  id: string;
  schoolId: string;
  academicYear: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
}

export interface ResultSubmission {
  id: string;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  academicYear: string;
  term: string;
  examType: ExamType;
  mockNumber?: number;
  totalStudents: number;
  completedStudents: number;
  missingStudents: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'RETURNED' | 'APPROVED' | 'PUBLISHED';
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  returnReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageFileRecord {
  id: string;
  schoolId: string;
  storageProvider: 'SUPABASE_STORAGE' | 'GOOGLE_DRIVE' | 'LOCAL_BLOB';
  fileId: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  entityType: 'STUDENT' | 'TEACHER' | 'SCHOOL_LOGO' | 'DOCUMENT' | 'SIGNATURE' | 'HOUSE';
  entityId: string;
  fileCategory: string;
  createdAt: string;
}

export interface SubjectItem {
  id: string;
  schoolId: string;
  subjectName: string;
  code?: string;
  subjectType: SubjectType; // CORE, ELECTIVE, LANGUAGE
  schoolType: SchoolType; // PRIMARY, JHS, or PRIMARY_JHS
  classIds?: string[];
  level?: string; // PRIMARY, JHS, ALL
  teacherIds?: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
}

export interface GradeBoundary {
  grade: string; // e.g. "A1", "B2", "1", "2"
  minScore: number;
  maxScore: number;
  points?: number;
  remarks: string; // e.g. "Excellent", "Credit"
}

export interface GradingSystem {
  id: string;
  schoolId: string;
  name: string; // e.g. "BECE Standard", "WAEC Scale", "GPA 4.0"
  type: 'BECE' | 'WAEC' | 'GPA' | 'CUSTOM';
  boundaries: GradeBoundary[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Teacher {
  id: string;
  schoolId: string;
  userId?: string;
  staffId: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  phone: string;
  email: string;
  password?: string;
  temporaryPassword?: string;
  isFirstLogin?: boolean;
  address?: string;
  hometown?: string;
  qualification: string;
  dateEmployed: string;
  subjectsTaughtIds: string[];
  subjectsTaughtNames?: string[];
  classAssignedId?: string;
  classAssignedName?: string;
  assignedClassIds?: string[];
  assignedClassNames?: string[];
  periodsCount: number;
  isClassTeacher: boolean;
  classTeacherOfId?: string;
  classTeacherOfName?: string;
  photoUrl?: string;
  signatureUrl?: string;
  accountStatus: 'ACTIVE' | 'INACTIVE';
  username?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  schoolId: string;
  studentId: string;
  admissionNo: string;
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  password?: string;
  photoUrl?: string;
  nationality: string;
  academicYear: string;
  schoolType: SchoolType;
  classId: string;
  className: string;
  stream?: string;
  house?: string;
  admissionDate: string;
  previousSchool?: string;
  status: StudentStatus;
  
  // Parent / Guardian
  parentName: string;
  parentRelationship: string;
  parentPhone: string;
  parentAltPhone?: string;
  parentEmail?: string;
  parentAddress?: string;
  parentDigitalAddress?: string;
  parentOccupation?: string;
  
  // Emergency
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  
  createdAt: string;
  updatedAt?: string;
}

export interface VerificationResult {
  isValid: boolean;
  message: string;
  school?: School;
  license?: License;
  reason?: string;
}

// ==========================================
// PART 2: EXAMINATION, SCORE & REPORT TYPES
// ==========================================

export type ExamType = 'SBA' | 'END_OF_TERM' | 'MID_TERM' | 'MOCK' | 'CUSTOM';

export type ResultStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'LOCKED';

export interface SBAComponentConfig {
  id: string;
  key: string; // e.g. 'classTest', 'classExercise', 'projectWork', 'groupWork'
  name: string; // e.g. 'CLASS TEST', 'CLASS EXERCISE', 'PROJECT WORK', 'GROUP WORK'
  maxScore: number; // e.g. 15
  weightPercent: number; // e.g. 15
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ExamConfig {
  id: string;
  schoolId: string;
  examType: ExamType;
  name: string;
  sbaTargetScale: number; // 50
  examTargetScale: number; // 50
  sbaComponents: SBAComponentConfig[];
  examMaxScore: number; // 100
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface ScoreEntry {
  id: string;
  schoolId: string;
  academicYear: string; // e.g. '2026/2027'
  term: string; // e.g. 'Term 1'
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  teacherId?: string;
  teacherName?: string;
  examType: ExamType;
  mockNumber?: number;

  // SBA Raw Scores
  sbaRawScores?: { [componentId: string]: number }; // { classTest: 12, classExercise: 13, projectWork: 14, groupWork: 10 }
  sbaRawTotal?: number; // 49
  sbaRawMaxTotal?: number; // 60
  sbaScaledScore?: number; // 40.8333

  // Convenience SBA breakdown keys
  projectScore?: number;
  classTestScore?: number;
  groupWorkScore?: number;
  classExerciseScore?: number;
  classScore50?: number;
  examScore50?: number;
  totalScore100?: number;

  // Exam
  examRawScore?: number; // 80
  examRawMax?: number; // 100
  examScaledScore?: number; // 40.0

  // Final Outcome
  finalScore?: number; // 80.8333
  percentage?: number; // 80.8333
  grade: string; // 'A1'
  gradePoint?: number; // 1
  remark?: string; // 'Excellent'
  remarks?: string; // alias for remark
  isPass?: boolean; // true

  subjectPosition?: number; // 1

  status: ResultStatus;
  submittedBy?: string;
  approvedBy?: string;
  publishedAt?: string;
  lockedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface StudentReportCard {
  id: string;
  schoolId: string;
  academicYear: string;
  term: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  gender: string;
  photoUrl?: string;

  subjectResults: ScoreEntry[];
  totalScore: number;
  averageScore: number;
  overallPosition?: number;
  totalStudentsInClass?: number;

  totalDaysInTerm?: number;
  daysPresent?: number;
  daysAbsent?: number;
  attendancePercentage?: number;

  conductComment?: string;
  teacherComment?: string;
  headmasterComment?: string;
  promotionStatus?: 'PROMOTED' | 'RETAINED' | 'PROMOTED_ON_TRIAL' | 'PENDING';
  nextTermOpeningDate?: string;

  status: ResultStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ResultCorrectionLog {
  id: string;
  schoolId: string;
  scoreId: string;
  studentName: string;
  subjectName: string;
  originalScore: number;
  newScore: number;
  reason: string;
  requestedBy: string;
  approvedBy: string;
  createdAt: string;
}

// ==========================================
// PART 3: EXTENDED MODULE TYPES
// ==========================================

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  subjectId?: string;
  date: string; // YYYY-MM-DD
  academicYear: string;
  term: string;
  recordedBy: string;
  students: {
    studentId: string;
    studentName: string;
    admissionNo: string;
    status: AttendanceStatus;
    remark?: string;
  }[];
  createdAt: string;
}

export interface BulkAttendanceRecord {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  academicYear: string;
  term: string;
  totalSchoolDays: number;
  recordedBy: string;
  students: {
    studentId: string;
    studentName: string;
    admissionNo: string;
    daysPresent: number;
    daysAbsent: number;
    attendancePercentage: number;
    remark?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface TimetableSlot {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
  startTime: string; // e.g., '08:00'
  endTime: string; // e.g., '09:00'
  periodName: string; // e.g., 'Period 1'
  room?: string;
}

export interface AssignmentItem {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  deadline: string;
  maxScore: number;
  attachmentUrl?: string;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  submissionText: string;
  attachmentUrl?: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
}

export type FeeCategoryType = 'TUITION' | 'ADMISSION' | 'BOOKS' | 'UNIFORM' | 'EXAMINATION' | 'FEEDING' | 'TRANSPORTATION' | 'ICT' | 'OTHER';

export interface FeeItem {
  id: string;
  category: FeeCategoryType;
  description: string;
  amount: number;
}

export interface FeeStructure {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  academicYear: string;
  term: string;
  feeItems: FeeItem[];
  totalAmount: number;
  createdAt: string;
}

export interface StudentFeeInvoice {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  classId: string;
  className: string;
  academicYear: string;
  term: string;
  feeStructureId?: string;
  totalBilled: number;
  totalPaid: number;
  discount: number;
  outstandingBalance: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  createdAt: string;
  updatedAt: string;
}

export interface FeePaymentRecord {
  id: string;
  schoolId: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  amountPaid: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE';
  referenceNo: string;
  receivedBy: string;
  paymentDate: string;
  receiptNo: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  schoolId: string;
  category: string;
  amount: number;
  payee: string;
  description: string;
  expenseDate: string;
  receiptUrl?: string;
  approvedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  message: string;
  targetAudience: 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'CLASS';
  classId?: string;
  authorName: string;
  attachmentUrl?: string;
  expiryDate?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  type: 'RESULT' | 'ASSIGNMENT' | 'FEE' | 'ATTENDANCE' | 'ANNOUNCEMENT' | 'EVENT';
  isRead: boolean;
  createdAt: string;
}

export interface SchoolCalendarEvent {
  id: string;
  schoolId: string;
  title: string;
  category: 'EXAM' | 'HOLIDAY' | 'VACATION' | 'REOPENING' | 'PTA' | 'SPORTS' | 'EVENT';
  startDate: string;
  endDate: string;
  description?: string;
}

export interface CertificateRecord {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  className: string;
  certificateType: 'BECE_COMPLETION' | 'ACADEMIC_EXCELLENCE' | 'GRADUATION' | 'CHARACTER';
  issueDate: string;
  academicYear: string;
  signatoryTitle: string;
  signatoryName: string;
}

export interface DocumentItem {
  id: string;
  schoolId: string;
  title: string;
  category: 'STUDENT' | 'TEACHER' | 'RECEIPT' | 'REPORT' | 'LETTER' | 'SCHOOL';
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  schoolId: string;
  userEmail: string;
  role: string;
  action: string;
  targetRecord?: string;
  timestamp: string;
  details?: string;
  performedBy?: string;
}

// ==========================================
// PART 4: TERM ATTENDANCE SUMMARY TYPES
// ==========================================

export interface TermStudentAttendance {
  studentId: string;
  studentName: string;
  admissionNo: string;
  gender?: string;
  studentTotalAttendanceDays: number; // Student total attendance days for the term
  totalSchoolAttendanceDays: number; // Total school attendance days for that term
  attendancePercentage: number; // calculated: (studentTotalAttendanceDays / totalSchoolAttendanceDays) * 100
  remark?: string;
  updatedAt?: string;
}

export interface TermAttendanceSummary {
  id: string; // term_att_${schoolId}_${academicYear}_${term}_${classId}
  schoolId: string;
  academicYear: string;
  term: string;
  classId: string;
  className: string;
  defaultTotalSchoolDays: number;
  recordedBy: string;
  students: TermStudentAttendance[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PHASE 2 & 3 EXTENDED DATA TYPES
// ==========================================

export interface StorageProviderConfig {
  id: string;
  schoolId: string;
  provider: 'SUPABASE' | 'GOOGLE_DRIVE';
  isActive: boolean;
  configData?: Record<string, any>;
  connectedAccount?: string;
  rootFolderId?: string;
  rootFolderName?: string;
  connectedAt?: string;
  updatedAt?: string;
}

export interface StorageConnectionStatus {
  id: string;
  schoolId: string;
  providerType: 'SUPABASE' | 'GOOGLE_DRIVE';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  rootFolderId?: string;
  storageUsageBytes?: number;
  lastVerifiedAt?: string;
}

export interface ManagedFileRecord {
  id: string;
  schoolId: string;
  ownerUserId?: string;
  folderId?: string;
  fileName: string;
  mimeType: string;
  fileCategory: 'LOGO' | 'CREST' | 'SIGNATURE' | 'PHOTO' | 'REPORT' | 'ID_CARD' | 'BROADSHEET' | 'ANALYSIS' | 'BACKUP' | 'DOCUMENT';
  storageProvider: 'SUPABASE' | 'GOOGLE_DRIVE';
  externalFileId?: string;
  publicUrl: string;
  fileSizeBytes?: number;
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IdCardTemplateConfig {
  id: string;
  schoolId: string;
  templateName: string;
  layoutConfig: {
    cardsPerPage?: number; // e.g. 4, 8
    orientation?: 'PORTRAIT' | 'LANDSCAPE';
    showQrCode?: boolean;
    showSchoolLogo?: boolean;
    showHouse?: boolean;
    primaryColor?: string;
  };
  isDefault: boolean;
  createdAt?: string;
}

export interface ReportCardTemplateConfig {
  id: string;
  schoolId: string;
  templateName: string;
  layoutConfig: {
    showClassPosition?: boolean;
    showAttendance?: boolean;
    showGradingLegend?: boolean;
    showConduct?: boolean;
    showNextTermDate?: boolean;
  };
  footerNotes?: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface RankingResultItem {
  id: string;
  schoolId: string;
  academicYear: string;
  term: string;
  examType: ExamType;
  mockNumber?: number;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  totalScore: number;
  averageScore: number;
  rank: number;
  ordinalRank: string;
  totalStudents: number;
  passStatus: boolean;
  calculatedAt: string;
}

export interface AnalysisSnapshot {
  id: string;
  schoolId: string;
  academicYear: string;
  term: string;
  examType: ExamType;
  mockNumber?: number;
  classId?: string;
  subjectId?: string;
  totalStudents: number;
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  passCount: number;
  failCount: number;
  passRate: number;
  failRate: number;
  gradeDistribution: Record<string, number>;
  scoreDistribution?: { range: string; count: number }[];
  positionDistribution?: { rank: number; studentName: string; score: number }[];
  calculatedAt: string;
}

export interface FileVersion {
  id: string;
  fileId: string;
  schoolId: string;
  versionNumber: number;
  fileUrl: string;
  fileSizeBytes: number;
  changedBy: string;
  createdAt: string;
}

export interface ResultPublication {
  id: string;
  schoolId: string;
  academicYear: string;
  term: string;
  examType: ExamType;
  mockNumber?: number;
  classId?: string;
  isPublished: boolean;
  publishedBy: string;
  publishedAt: string;
  unpublishedAt?: string;
}

export interface SetupProgressRecord {
  id: string;
  schoolId: string;
  completedSteps: string[];
  completionPercentage: number;
  isCompleted: boolean;
  lastSavedAt: string;
}



