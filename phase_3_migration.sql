-- =============================================================================
-- EDUMASTER MULTI-TENANT PLATFORM - PHASE 3 DATABASE MIGRATION SCRIPT
-- =============================================================================
-- Tables included:
--   1. academicYears (Academic Session Management)
--   2. classes (Classes & Streams with Custom Names & Teacher Assignment)
--   3. students (Student Profiles, Demographics & Guardian Contact)
--   4. studentEnrollments (Multi-term Enrollment History & Class Cohorts)
--   5. resultSubmissions (Teacher-Admin Result Review, Approval & Publication Pipeline)
--   6. storageProviders & managedFiles (Multi-Tenant Storage Abstraction)
--
-- Features:
--   - Strict Multi-Tenant Isolation via "schoolId"
--   - Foreign Key Cascades & Constraints
--   - High Performance Composite Indexes
--   - PostgreSQL Row Level Security (RLS) Policies
-- =============================================================================

BEGIN;

-- 1. ACADEMIC YEARS
CREATE TABLE IF NOT EXISTS public."academicYears" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "academicYear" TEXT NOT NULL,
  "startDate" DATE,
  "endDate" DATE,
  "isCurrent" BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_school_academic_year UNIQUE ("schoolId", "academicYear")
);

-- 2. CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "className" TEXT NOT NULL,
  "classCode" TEXT,
  level TEXT DEFAULT 'JHS',
  stream TEXT DEFAULT 'A',
  "schoolType" TEXT DEFAULT 'PRIMARY_JHS',
  "academicYear" TEXT DEFAULT '2026/2027',
  "academicYearId" TEXT REFERENCES public."academicYears"(id) ON DELETE SET NULL,
  "classTeacherId" TEXT,
  "classTeacherName" TEXT,
  capacity INTEGER DEFAULT 45,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "admissionNo" TEXT NOT NULL,
  "studentId" TEXT,
  "fullName" TEXT NOT NULL,
  gender TEXT DEFAULT 'MALE',
  "dateOfBirth" DATE,
  "residentialAddress" TEXT,
  "digitalAddress" TEXT,
  "classId" TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
  "className" TEXT,
  "academicYear" TEXT DEFAULT '2026/2027',
  "houseId" TEXT,
  "houseName" TEXT,
  "photoUrl" TEXT,
  "guardianName" TEXT,
  "guardianPhone" TEXT,
  "guardianEmail" TEXT,
  "guardianRelation" TEXT,
  "guardianOccupation" TEXT,
  "emergencyContact" TEXT,
  "bloodGroup" TEXT,
  "medicalNotes" TEXT,
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE' | 'ARCHIVED' | 'TRANSFERRED' | 'GRADUATED'
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_school_admission UNIQUE ("schoolId", "admissionNo")
);

-- 4. STUDENT ENROLLMENTS
CREATE TABLE IF NOT EXISTS public."studentEnrollments" (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES public.schools("schoolId") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  "studentName" TEXT NOT NULL,
  "admissionNo" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  term TEXT NOT NULL,
  "classId" TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  "className" TEXT NOT NULL,
  "enrollmentDate" TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'ENROLLED',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RESULT SUBMISSIONS
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

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_academic_years_school ON public."academicYears"("schoolId");
CREATE INDEX IF NOT EXISTS idx_classes_school ON public.classes("schoolId");
CREATE INDEX IF NOT EXISTS idx_classes_level ON public.classes("schoolId", level);
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students("schoolId");
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students("schoolId", "classId");
CREATE INDEX IF NOT EXISTS idx_students_admission ON public.students("schoolId", "admissionNo");
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public."studentEnrollments"("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS idx_enrollments_class_term ON public."studentEnrollments"("schoolId", "academicYear", term, "classId");
CREATE INDEX IF NOT EXISTS idx_result_submissions_query ON public."resultSubmissions"("schoolId", "academicYear", term, "classId", "subjectId");

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public."academicYears" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."studentEnrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."resultSubmissions" ENABLE ROW LEVEL SECURITY;

-- Super Admin Global Access
CREATE POLICY "Super Admin Access - Academic Years" ON public."academicYears"
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super Admin Access - Classes" ON public.classes
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super Admin Access - Students" ON public.students
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super Admin Access - Enrollments" ON public."studentEnrollments"
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super Admin Access - Submissions" ON public."resultSubmissions"
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- School Admin Tenant Isolation
CREATE POLICY "School Admin Isolation - Academic Years" ON public."academicYears"
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId'));

CREATE POLICY "School Admin Isolation - Classes" ON public.classes
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId'));

CREATE POLICY "School Admin Isolation - Students" ON public.students
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId'));

CREATE POLICY "School Admin Isolation - Enrollments" ON public."studentEnrollments"
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId'));

CREATE POLICY "School Admin Isolation - Submissions" ON public."resultSubmissions"
  FOR ALL USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId'));

-- Teacher Access
CREATE POLICY "Teacher Read - Classes" ON public.classes
  FOR SELECT USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId'));

CREATE POLICY "Teacher Read - Students" ON public.students
  FOR SELECT USING ("schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId'));

CREATE POLICY "Teacher Manage - Submissions" ON public."resultSubmissions"
  FOR ALL USING (
    "schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId') AND
    "teacherId" = (auth.jwt() -> 'app_metadata' ->> 'teacherId')
  );

-- Student Access
CREATE POLICY "Student Read Own Profile" ON public.students
  FOR SELECT USING (
    "schoolId" = (auth.jwt() -> 'app_metadata' ->> 'schoolId') AND
    id = (auth.jwt() -> 'app_metadata' ->> 'studentId')
  );

COMMIT;
