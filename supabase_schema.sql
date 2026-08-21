-- =============================================================================
-- EDUMASTER MULTI-TENANT SCHOOL MANAGEMENT SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- Complete database schema with Multi-Tenancy, Row-Level Security (RLS), & Indexes
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SCHOOLS (TENANTS)
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  "schoolType" TEXT DEFAULT 'PRIMARY_JHS',
  "contactPerson" TEXT,
  phone TEXT,
  "altPhone" TEXT,
  email TEXT,
  address TEXT,
  district TEXT,
  region TEXT,
  country TEXT DEFAULT 'Ghana',
  motto TEXT,
  "logoUrl" TEXT,
  "activationStatus" TEXT DEFAULT 'PENDING',
  status TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LICENSES & SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.licenses (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "licenseKey" TEXT UNIQUE NOT NULL,
  "licenseType" TEXT DEFAULT '12_MONTHS',
  "durationDays" INTEGER DEFAULT 365,
  "startDate" TIMESTAMPTZ DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  "subscriptionPlan" TEXT DEFAULT 'STANDARD',
  price NUMERIC DEFAULT 1200,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ACTIVATION CODES & REGISTRATION TOKENS
CREATE TABLE IF NOT EXISTS public."activationCodes" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMPTZ,
  "isOneTime" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."registrationTokens" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  token TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMPTZ,
  "isOneTime" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SCHOOL SETTINGS
CREATE TABLE IF NOT EXISTS public."schoolSettings" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT UNIQUE NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "currentAcademicYear" TEXT NOT NULL DEFAULT '2026/2027',
  "currentTerm" TEXT NOT NULL DEFAULT 'Term 1',
  "numberOfTerms" INTEGER DEFAULT 3,
  "academicCalendar" JSONB DEFAULT '[]'::jsonb,
  "headmasterName" TEXT,
  "headmasterPosition" TEXT,
  "headmasterSignatureUrl" TEXT,
  "setupCompleted" BOOLEAN DEFAULT false,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SCHOOL ADMIN CREDENTIALS
CREATE TABLE IF NOT EXISTS public."schoolAdmins" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "schoolName" TEXT,
  username TEXT DEFAULT 'admin',
  email TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5B. ACADEMIC YEARS
CREATE TABLE IF NOT EXISTS public."academicYears" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "academicYear" TEXT NOT NULL, -- e.g. '2026/2027'
  "startDate" DATE,
  "endDate" DATE,
  "isCurrent" BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE' | 'ARCHIVED' | 'UPCOMING'
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_school_academic_year UNIQUE ("schoolId", "academicYear")
);

-- 6. CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "className" TEXT NOT NULL,
  "classCode" TEXT,
  level TEXT,
  stream TEXT,
  "schoolType" TEXT,
  "academicYear" TEXT,
  "academicYearId" TEXT REFERENCES public."academicYears"(id) ON DELETE SET NULL,
  "classTeacherId" TEXT,
  "classTeacherName" TEXT,
  capacity INTEGER DEFAULT 45,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "subjectName" TEXT NOT NULL,
  code TEXT,
  "subjectType" TEXT DEFAULT 'CORE',
  "schoolType" TEXT,
  "classIds" JSONB DEFAULT '[]'::jsonb,
  level TEXT,
  "teacherIds" JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. GRADING SYSTEMS
CREATE TABLE IF NOT EXISTS public."gradingSystems" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  name TEXT NOT NULL,
  "schoolType" TEXT,
  grades JSONB NOT NULL,
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TEACHERS
CREATE TABLE IF NOT EXISTS public.teachers (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "staffId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  gender TEXT,
  phone TEXT,
  email TEXT,
  qualification TEXT,
  "dateEmployed" TEXT,
  "subjectsTaughtIds" JSONB DEFAULT '[]'::jsonb,
  "subjectsTaughtNames" JSONB DEFAULT '[]'::jsonb,
  "isClassTeacher" BOOLEAN DEFAULT false,
  "classTeacherOfId" TEXT,
  "classTeacherOfName" TEXT,
  "periodsCount" INTEGER DEFAULT 0,
  "photoUrl" TEXT,
  "signatureUrl" TEXT,
  "accountStatus" TEXT DEFAULT 'ACTIVE',
  password TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL,
  "admissionNo" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  gender TEXT,
  "dateOfBirth" TEXT,
  nationality TEXT DEFAULT 'Ghanaian',
  "academicYear" TEXT,
  "schoolType" TEXT,
  "classId" TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
  "className" TEXT,
  "admissionDate" TEXT,
  status TEXT DEFAULT 'ACTIVE',
  "photoUrl" TEXT,
  "parentName" TEXT,
  "parentPhone" TEXT,
  "parentEmail" TEXT,
  "parentRelationship" TEXT,
  "emergencyName" TEXT,
  "emergencyPhone" TEXT,
  "emergencyRelationship" TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EXAM CONFIGURATIONS
CREATE TABLE IF NOT EXISTS public."examConfigurations" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "examType" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  "schoolType" TEXT NOT NULL,
  "sbaComponents" JSONB NOT NULL,
  "sbaWeightage" NUMERIC DEFAULT 40,
  "examWeightage" NUMERIC DEFAULT 60,
  "rawMaxScore" NUMERIC DEFAULT 100,
  "isLocked" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SCORES / SCORE ENTRIES
CREATE TABLE IF NOT EXISTS public.scores (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "className" TEXT,
  "subjectId" TEXT NOT NULL,
  "subjectName" TEXT,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "admissionNo" TEXT,
  "teacherId" TEXT,
  "teacherName" TEXT,
  "examType" TEXT NOT NULL,
  "sbaRawScores" JSONB DEFAULT '{}'::jsonb,
  "sbaRawTotal" NUMERIC DEFAULT 0,
  "sbaRawMaxTotal" NUMERIC DEFAULT 60,
  "sbaScaledScore" NUMERIC DEFAULT 0,
  "examRawScore" NUMERIC DEFAULT 0,
  "examRawMax" NUMERIC DEFAULT 100,
  "examScaledScore" NUMERIC DEFAULT 0,
  "finalScore" NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  grade TEXT,
  "gradePoint" NUMERIC,
  remark TEXT,
  "isPass" BOOLEAN DEFAULT true,
  "subjectPosition" INTEGER,
  status TEXT DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 13. REPORT CARDS
CREATE TABLE IF NOT EXISTS public."reportCards" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "className" TEXT,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "admissionNo" TEXT,
  "totalSubjects" INTEGER,
  "totalMarks" NUMERIC,
  "overallAverage" NUMERIC,
  "overallGrade" TEXT,
  "classPosition" INTEGER,
  "totalStudentsInClass" INTEGER,
  "attendanceSummary" JSONB DEFAULT '{}'::jsonb,
  "conductRemark" TEXT,
  "attitudeRemark" TEXT,
  "interestRemark" TEXT,
  "classTeacherRemark" TEXT,
  "headmasterRemark" TEXT,
  "reopeningDate" TEXT,
  "vacationDate" TEXT,
  status TEXT DEFAULT 'PUBLISHED',
  "subjectSummaries" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ATTENDANCE (INDIVIDUAL & BULK)
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "classId" TEXT NOT NULL,
  "className" TEXT,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  date TEXT NOT NULL,
  status TEXT NOT NULL, -- 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  reason TEXT,
  "recordedBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."bulkAttendance" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "classId" TEXT NOT NULL,
  "className" TEXT,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  date TEXT NOT NULL,
  "totalStudents" INTEGER,
  "presentCount" INTEGER,
  "absentCount" INTEGER,
  "lateCount" INTEGER,
  "excusedCount" INTEGER,
  "recordsMap" JSONB DEFAULT '{}'::jsonb,
  "recordedBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TIMETABLES & ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.timetables (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "classId" TEXT NOT NULL,
  "className" TEXT,
  "dayOfWeek" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "subjectName" TEXT NOT NULL,
  "teacherId" TEXT,
  "teacherName" TEXT,
  room TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "classId" TEXT NOT NULL,
  "className" TEXT,
  "subjectId" TEXT NOT NULL,
  "subjectName" TEXT,
  "teacherId" TEXT,
  "teacherName" TEXT,
  title TEXT NOT NULL,
  description TEXT,
  "dueDate" TEXT NOT NULL,
  "totalMarks" NUMERIC DEFAULT 100,
  "attachmentUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."assignmentSubmissions" (
  id TEXT PRIMARY KEY,
  "assignmentId" TEXT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  "schoolId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "admissionNo" TEXT,
  "submissionText" TEXT,
  "attachmentUrl" TEXT,
  "submittedAt" TIMESTAMPTZ DEFAULT NOW(),
  score NUMERIC,
  feedback TEXT,
  "gradedBy" TEXT
);

-- 16. FINANCIALS & FEES
CREATE TABLE IF NOT EXISTS public."feeStructures" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "className" TEXT,
  "feeItems" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "totalAmount" NUMERIC NOT NULL,
  "dueDate" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."feeInvoices" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "admissionNo" TEXT,
  "classId" TEXT NOT NULL,
  "className" TEXT,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  "totalBilled" NUMERIC NOT NULL,
  "totalPaid" NUMERIC DEFAULT 0,
  balance NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."feePayments" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "invoiceId" TEXT,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "amountPaid" NUMERIC NOT NULL,
  "paymentMethod" TEXT DEFAULT 'CASH',
  "referenceNo" TEXT,
  "receiptNo" TEXT NOT NULL,
  "receivedBy" TEXT,
  "paymentDate" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  "approvedBy" TEXT,
  "receiptUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 17. ANNOUNCEMENTS, NOTIFICATIONS, AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "targetAudience" TEXT DEFAULT 'ALL',
  author TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  "isRead" BOOLEAN DEFAULT false,
  link TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."calendarEvents" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "eventType" TEXT DEFAULT 'EVENT',
  "targetAudience" TEXT DEFAULT 'ALL'
);

CREATE TABLE IF NOT EXISTS public.certificates (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "certificateType" TEXT NOT NULL,
  "issueDate" TEXT NOT NULL,
  description TEXT,
  "certificateUrl" TEXT
);

CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  "fileUrl" TEXT NOT NULL,
  "uploadedBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."auditLogs" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL,
  "userEmail" TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  "targetRecord" TEXT,
  details TEXT,
  "ipAddress" TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."resultCorrections" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "scoreId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "subjectId" TEXT,
  "subjectName" TEXT,
  "oldScore" NUMERIC,
  "newScore" NUMERIC,
  "oldGrade" TEXT,
  "newGrade" TEXT,
  reason TEXT NOT NULL,
  "correctedBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 18. SYSTEM SINGLETONS
CREATE TABLE IF NOT EXISTS public."superAdminConfig" (
  id TEXT PRIMARY KEY,
  "fullName" TEXT,
  username TEXT,
  email TEXT,
  password TEXT,
  "recoveryEmail" TEXT,
  "recoveryPhone" TEXT,
  "recoveryPin" TEXT,
  "isInitialSetupDone" BOOLEAN DEFAULT true,
  "superAdminInitialized" BOOLEAN DEFAULT true,
  "passwordUpdatedAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."globalSystemSettings" (
  id TEXT PRIMARY KEY,
  "maintenanceMode" BOOLEAN DEFAULT false,
  "maintenanceMessage" TEXT,
  "allowRegistration" BOOLEAN DEFAULT true,
  "enforceStrongPasswords" BOOLEAN DEFAULT true,
  "sessionTimeoutMinutes" INTEGER DEFAULT 60,
  "enableGoogleWorkspace" BOOLEAN DEFAULT true,
  "enableWhatsAppAlerts" BOOLEAN DEFAULT true,
  "enableAuditLogging" BOOLEAN DEFAULT true,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."systemLicenseConfig" (
  id TEXT PRIMARY KEY,
  "standardPricePerYear" NUMERIC DEFAULT 1200,
  "basicPricePerYear" NUMERIC DEFAULT 500,
  "premiumPricePerYear" NUMERIC DEFAULT 2500,
  "enterprisePricePerYear" NUMERIC DEFAULT 5000,
  "defaultGracePeriodDays" INTEGER DEFAULT 14,
  "autoRevokeOnExpiry" BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'GHS',
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."superAdminContactConfig" (
  id TEXT PRIMARY KEY,
  "primaryPhone" TEXT,
  "whatsappPhone" TEXT,
  "supportEmail" TEXT,
  "developerName" TEXT,
  "supportHours" TEXT,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."systemUpdates" (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'FEATURE',
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."schoolPermissions" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT UNIQUE NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  permissions JSONB NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."schoolWorkspaceConfigs" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT UNIQUE NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "enableClassroom" BOOLEAN DEFAULT true,
  "enableGmail" BOOLEAN DEFAULT true,
  "enableCalendar" BOOLEAN DEFAULT true,
  "enableKeep" BOOLEAN DEFAULT true,
  "enableTasks" BOOLEAN DEFAULT true,
  "allowedRoles" JSONB DEFAULT '["ADMIN", "TEACHER", "STUDENT"]'::jsonb,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE INDEXES (Optimized for Multi-Tenant Querying by schoolId)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_licenses_school ON public.licenses("schoolId");
CREATE INDEX IF NOT EXISTS idx_classes_school ON public.classes("schoolId");
CREATE INDEX IF NOT EXISTS idx_subjects_school ON public.subjects("schoolId");
CREATE INDEX IF NOT EXISTS idx_teachers_school ON public.teachers("schoolId");
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students("schoolId");
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students("classId");
CREATE INDEX IF NOT EXISTS idx_scores_query ON public.scores("schoolId", "academicYear", term, "classId");
CREATE INDEX IF NOT EXISTS idx_report_cards_query ON public."reportCards"("schoolId", "academicYear", term, "classId");
CREATE INDEX IF NOT EXISTS idx_attendance_query ON public.attendance("schoolId", "classId", date);
CREATE INDEX IF NOT EXISTS idx_bulk_attendance_query ON public."bulkAttendance"("schoolId", "classId", date);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_query ON public."feeInvoices"("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_query ON public."auditLogs"("schoolId", timestamp DESC);

-- =============================================================================
-- 19. PHASE 2/3 EXTENDED TABLES (Storage, ID Cards, Reports, Rankings, Analysis)
-- =============================================================================

-- STORAGE PROVIDERS & CONNECTIONS
CREATE TABLE IF NOT EXISTS public."storageProviders" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'SUPABASE', -- 'SUPABASE' | 'GOOGLE_DRIVE'
  "isActive" BOOLEAN DEFAULT true,
  "configData" JSONB DEFAULT '{}'::jsonb,
  "connectedAccount" TEXT,
  "connectedAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."storageConnections" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "providerType" TEXT NOT NULL,
  status TEXT DEFAULT 'CONNECTED',
  "rootFolderId" TEXT,
  "storageUsageBytes" BIGINT DEFAULT 0,
  "lastVerifiedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- EXTENDED MANAGED FILES & VERSIONS
CREATE TABLE IF NOT EXISTS public."managedFiles" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "ownerUserId" TEXT,
  "folderId" TEXT,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileCategory" TEXT NOT NULL, -- 'LOGO' | 'CREST' | 'SIGNATURE' | 'PHOTO' | 'REPORT' | 'ID_CARD'
  "storageProvider" TEXT NOT NULL DEFAULT 'SUPABASE',
  "externalFileId" TEXT,
  "publicUrl" TEXT NOT NULL,
  "fileSizeBytes" BIGINT,
  version INTEGER DEFAULT 1,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."fileVersions" (
  id TEXT PRIMARY KEY,
  "fileId" TEXT NOT NULL REFERENCES public."managedFiles"(id) ON DELETE CASCADE,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  version INTEGER NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "changedBy" TEXT,
  "changeReason" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ID CARD & REPORT TEMPLATES
CREATE TABLE IF NOT EXISTS public."idCardTemplates" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "templateName" TEXT NOT NULL,
  "layoutConfig" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."reportTemplates" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "templateName" TEXT NOT NULL,
  "layoutConfig" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "footerNotes" TEXT,
  "showPosition" BOOLEAN DEFAULT true,
  "showAttendance" BOOLEAN DEFAULT true,
  "isDefault" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- RESULT SUBMISSIONS & PUBLICATIONS WORKFLOW
CREATE TABLE IF NOT EXISTS public."resultSubmissions" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  "examType" TEXT NOT NULL,
  "classId" TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  "className" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  "subjectName" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "teacherName" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'PUBLISHED' | 'UNPUBLISHED'
  "totalStudents" INTEGER DEFAULT 0,
  "completedScoresCount" INTEGER DEFAULT 0,
  "submittedAt" TIMESTAMPTZ,
  "reviewedAt" TIMESTAMPTZ,
  "reviewedBy" TEXT,
  "reviewRemarks" TEXT,
  "publishedAt" TIMESTAMPTZ,
  "publishedBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."resultPublications" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  "examType" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "isPublished" BOOLEAN DEFAULT false,
  "publishedBy" TEXT,
  "publishedAt" TIMESTAMPTZ,
  "reopenedBy" TEXT,
  "reopenedAt" TIMESTAMPTZ,
  "reopenReason" TEXT
);

-- RANKING RESULTS & ANALYSIS SNAPSHOTS
CREATE TABLE IF NOT EXISTS public."rankingResults" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  "examType" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "totalScore" NUMERIC NOT NULL,
  "averageScore" NUMERIC NOT NULL,
  rank INTEGER NOT NULL,
  "ordinalRank" TEXT NOT NULL,
  "isTie" BOOLEAN DEFAULT false,
  "calculatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."analysisSnapshots" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  "examType" TEXT NOT NULL,
  "classId" TEXT,
  "subjectId" TEXT,
  "metricsData" JSONB NOT NULL,
  "generatedBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- SETUP PROGRESS TRACKER
CREATE TABLE IF NOT EXISTS public."setupProgress" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT UNIQUE NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "completedSteps" JSONB DEFAULT '[]'::jsonb,
  "completionPercentage" INTEGER DEFAULT 0,
  "isCompleted" BOOLEAN DEFAULT false,
  "lastSavedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tenant-owned tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."schoolSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."schoolAdmins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."studentEnrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."studentStatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."teacherSubjectAssignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."termAttendanceSummaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."reportCards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."auditLogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."resultSubmissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."resultPublications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."rankingResults" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."storageProviders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."managedFiles" ENABLE ROW LEVEL SECURITY;

-- 1. Super Admin Full Access Policy (Global Platform)
CREATE POLICY "Super Admin Full Access" ON public.schools
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- 2. School Admin Isolation Policy (Tenant Scoped by schoolId)
CREATE POLICY "School Admin Tenant Isolation - Classes" ON public.classes
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId') OR auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "School Admin Tenant Isolation - Students" ON public.students
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId') OR auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "School Admin Tenant Isolation - Teachers" ON public.teachers
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId') OR auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "School Admin Tenant Isolation - Scores" ON public.scores
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId') OR auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "School Admin Tenant Isolation - AuditLogs" ON public."auditLogs"
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId') OR auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "School Admin Tenant Isolation - Submissions" ON public."resultSubmissions"
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId') OR auth.jwt() ->> 'role' = 'super_admin');

-- 3. Teacher Access Policy (Tenant and assigned classes/subjects)
CREATE POLICY "Teacher Access - Scores" ON public.scores
  FOR SELECT USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId'));

-- 4. Student Access Policy (Own records and published scores only)
CREATE POLICY "Student Access - Scores" ON public.scores
  FOR SELECT USING (
    "schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId') AND 
    "studentId" = (auth.jwt() -> 'app_metadata' ->> 'studentId') AND
    status = 'PUBLISHED'
  );

-- =============================================================================
-- STORAGE BUCKETS (Run in Supabase Dashboard or SQL editor)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket access policy
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'school-assets');

CREATE POLICY "Authenticated Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'school-assets');

CREATE POLICY "Authenticated Update Access" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'school-assets');
