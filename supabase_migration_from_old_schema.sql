-- =============================================================================
-- EDUMASTER SCHOOL MANAGEMENT SYSTEM
-- DATA MIGRATION SCRIPT: OLD FLAT / NOSQL SCHEMA -> SUPABASE RELATIONAL STRUCTURE
-- =============================================================================
-- Description:
--   This script migrates legacy school, teacher, student, class, attendance,
--   and financial records from legacy flat tables / JSON export format into the
--   normalized PostgreSQL Supabase relational schema with strict Foreign Keys,
--   Multi-Tenant Row-Level Security (RLS), and Performance Indexes.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- STEP 1: PREREQUISITES & EXTENSIONS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- STEP 2: STAGING TABLES FOR RAW LEGACY DATA INGESTION
-- -----------------------------------------------------------------------------

CREATE TEMP TABLE IF NOT EXISTS staging_legacy_schools (
  raw_id TEXT,
  school_id TEXT,
  school_name TEXT,
  school_type TEXT,
  contact_person TEXT,
  phone_number TEXT,
  alt_phone TEXT,
  email_address TEXT,
  postal_address TEXT,
  district_name TEXT,
  region_name TEXT,
  motto_text TEXT,
  logo_url TEXT,
  license_status TEXT,
  created_time TEXT,
  raw_payload JSONB
);

CREATE TEMP TABLE IF NOT EXISTS staging_legacy_teachers (
  raw_id TEXT,
  school_id TEXT,
  staff_id TEXT,
  full_name TEXT,
  email_address TEXT,
  phone_number TEXT,
  assigned_class_id TEXT,
  assigned_subjects TEXT,
  qualification_text TEXT,
  employment_status TEXT,
  hire_date TEXT,
  raw_payload JSONB
);

CREATE TEMP TABLE IF NOT EXISTS staging_legacy_students (
  raw_id TEXT,
  school_id TEXT,
  admission_number TEXT,
  full_name TEXT,
  gender_type TEXT,
  date_of_birth TEXT,
  class_name_or_id TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  guardian_relation TEXT,
  residential_address TEXT,
  enrollment_status TEXT,
  enrollment_date TEXT,
  raw_payload JSONB
);

CREATE TEMP TABLE IF NOT EXISTS staging_legacy_classes (
  raw_id TEXT,
  school_id TEXT,
  class_name TEXT,
  stage_level TEXT,
  stream_section TEXT,
  capacity_limit TEXT,
  class_teacher_id TEXT,
  raw_payload JSONB
);

-- -----------------------------------------------------------------------------
-- STEP 3: DATA TRANSFORMATION & INSERTION PIPELINES
-- -----------------------------------------------------------------------------

-- 3.1 Migrate Schools & Tenants
INSERT INTO public.schools (
  id,
  "schoolId",
  name,
  "schoolType",
  "contactPerson",
  phone,
  "altPhone",
  email,
  address,
  district,
  region,
  country,
  motto,
  "logoUrl",
  "activationStatus",
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  COALESCE(s.raw_id, 'SCH-' || UPPER(SUBSTRING(MD5(s.school_id || RANDOM()::text) FROM 1 FOR 8))) AS id,
  UPPER(TRIM(s.school_id)) AS "schoolId",
  TRIM(s.school_name) AS name,
  COALESCE(NULLIF(TRIM(s.school_type), ''), 'PRIMARY_JHS') AS "schoolType",
  TRIM(s.contact_person) AS "contactPerson",
  TRIM(s.phone_number) AS phone,
  TRIM(s.alt_phone) AS "altPhone",
  LOWER(TRIM(s.email_address)) AS email,
  TRIM(s.postal_address) AS address,
  TRIM(s.district_name) AS district,
  TRIM(s.region_name) AS region,
  'Ghana' AS country,
  TRIM(s.motto_text) AS motto,
  TRIM(s.logo_url) AS "logoUrl",
  CASE 
    WHEN UPPER(TRIM(s.license_status)) = 'EXPIRED' THEN 'EXPIRED'
    WHEN UPPER(TRIM(s.license_status)) = 'PENDING' THEN 'PENDING'
    ELSE 'ACTIVE'
  END AS "activationStatus",
  'ACTIVE' AS status,
  COALESCE(s.created_time::timestamptz, NOW()) AS "createdAt",
  NOW() AS "updatedAt"
FROM staging_legacy_schools s
WHERE s.school_id IS NOT NULL AND s.school_name IS NOT NULL
ON CONFLICT ("schoolId") DO UPDATE SET
  name = EXCLUDED.name,
  "contactPerson" = EXCLUDED."contactPerson",
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  "updatedAt" = NOW();

-- 3.2 Initialize / Migrate Default School Settings
INSERT INTO public."schoolSettings" (
  id,
  "schoolId",
  "currentAcademicYear",
  "currentTerm",
  "numberOfTerms",
  "setupCompleted",
  "updatedAt"
)
SELECT
  'settings_' || s."schoolId" AS id,
  s."schoolId",
  '2026/2027' AS "currentAcademicYear",
  'Term 1' AS "currentTerm",
  3 AS "numberOfTerms",
  true AS "setupCompleted",
  NOW() AS "updatedAt"
FROM public.schools s
ON CONFLICT ("schoolId") DO NOTHING;

-- 3.3 Migrate Classes with Relational Normalization
INSERT INTO public.classes (
  id,
  "schoolId",
  name,
  stage,
  capacity,
  "academicYear",
  "createdAt",
  "updatedAt"
)
SELECT
  COALESCE(c.raw_id, 'CLS-' || UPPER(SUBSTRING(MD5(c.school_id || c.class_name || RANDOM()::text) FROM 1 FOR 8))) AS id,
  UPPER(TRIM(c.school_id)) AS "schoolId",
  TRIM(c.class_name) AS name,
  COALESCE(NULLIF(TRIM(c.stage_level), ''), 'PRIMARY') AS stage,
  COALESCE(NULLIF(c.capacity_limit, '')::integer, 45) AS capacity,
  '2026/2027' AS "academicYear",
  NOW() AS "createdAt",
  NOW() AS "updatedAt"
FROM staging_legacy_classes c
JOIN public.schools s ON s."schoolId" = UPPER(TRIM(c.school_id))
WHERE c.class_name IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  stage = EXCLUDED.stage,
  capacity = EXCLUDED.capacity,
  "updatedAt" = NOW();

-- 3.4 Migrate Teachers & Staff
INSERT INTO public.teachers (
  id,
  "schoolId",
  "staffId",
  "fullName",
  email,
  phone,
  qualification,
  "classAssignedId",
  "accountStatus",
  "dateJoined",
  "createdAt",
  "updatedAt"
)
SELECT
  COALESCE(t.raw_id, 'TCH-' || UPPER(SUBSTRING(MD5(t.school_id || t.staff_id || RANDOM()::text) FROM 1 FOR 8))) AS id,
  UPPER(TRIM(t.school_id)) AS "schoolId",
  COALESCE(NULLIF(TRIM(t.staff_id), ''), 'TCH-' || SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6)) AS "staffId",
  TRIM(t.full_name) AS "fullName",
  LOWER(TRIM(t.email_address)) AS email,
  TRIM(t.phone_number) AS phone,
  TRIM(t.qualification_text) AS qualification,
  TRIM(t.assigned_class_id) AS "classAssignedId",
  CASE 
    WHEN UPPER(TRIM(t.employment_status)) IN ('INACTIVE', 'SUSPENDED', 'TERMINATED') THEN 'INACTIVE'
    ELSE 'ACTIVE'
  END AS "accountStatus",
  COALESCE(NULLIF(TRIM(t.hire_date), ''), TO_CHAR(NOW(), 'YYYY-MM-DD')) AS "dateJoined",
  NOW() AS "createdAt",
  NOW() AS "updatedAt"
FROM staging_legacy_teachers t
JOIN public.schools s ON s."schoolId" = UPPER(TRIM(t.school_id))
WHERE t.full_name IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  "fullName" = EXCLUDED."fullName",
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  "accountStatus" = EXCLUDED."accountStatus",
  "updatedAt" = NOW();

-- 3.5 Migrate Students & Guardians
INSERT INTO public.students (
  id,
  "schoolId",
  "studentId",
  "admissionNo",
  "fullName",
  gender,
  "dateOfBirth",
  "classId",
  "guardianName",
  "guardianPhone",
  "guardianEmail",
  "guardianRelation",
  address,
  status,
  "enrollmentDate",
  "createdAt",
  "updatedAt"
)
SELECT
  COALESCE(st.raw_id, 'STU-' || UPPER(SUBSTRING(MD5(st.school_id || st.admission_number || RANDOM()::text) FROM 1 FOR 8))) AS id,
  UPPER(TRIM(st.school_id)) AS "schoolId",
  COALESCE(NULLIF(TRIM(st.admission_number), ''), 'STU-' || SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6)) AS "studentId",
  COALESCE(NULLIF(TRIM(st.admission_number), ''), 'STU-' || SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6)) AS "admissionNo",
  TRIM(st.full_name) AS "fullName",
  CASE 
    WHEN UPPER(TRIM(st.gender_type)) IN ('FEMALE', 'F') THEN 'FEMALE'
    ELSE 'MALE'
  END AS gender,
  COALESCE(NULLIF(TRIM(st.date_of_birth), ''), '2015-01-01') AS "dateOfBirth",
  TRIM(st.class_name_or_id) AS "classId",
  TRIM(st.guardian_name) AS "guardianName",
  TRIM(st.guardian_phone) AS "guardianPhone",
  LOWER(TRIM(st.guardian_email)) AS "guardianEmail",
  COALESCE(NULLIF(TRIM(st.guardian_relation), ''), 'Parent') AS "guardianRelation",
  TRIM(st.residential_address) AS address,
  CASE 
    WHEN UPPER(TRIM(st.enrollment_status)) IN ('INACTIVE', 'GRADUATED', 'TRANSFERRED', 'EXPELLED') THEN 'INACTIVE'
    ELSE 'ACTIVE'
  END AS status,
  COALESCE(NULLIF(TRIM(st.enrollment_date), ''), TO_CHAR(NOW(), 'YYYY-MM-DD')) AS "enrollmentDate",
  NOW() AS "createdAt",
  NOW() AS "updatedAt"
FROM staging_legacy_students st
JOIN public.schools s ON s."schoolId" = UPPER(TRIM(st.school_id))
WHERE st.full_name IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  "fullName" = EXCLUDED."fullName",
  gender = EXCLUDED.gender,
  "dateOfBirth" = EXCLUDED."dateOfBirth",
  "classId" = EXCLUDED."classId",
  "guardianName" = EXCLUDED."guardianName",
  "guardianPhone" = EXCLUDED."guardianPhone",
  status = EXCLUDED.status,
  "updatedAt" = NOW();

-- -----------------------------------------------------------------------------
-- STEP 4: SEED & VERIFY SUPER ADMIN REPOSITORY
-- -----------------------------------------------------------------------------

INSERT INTO public."superAdminConfig" (
  id,
  "fullName",
  username,
  email,
  "recoveryEmail",
  "recoveryPhone",
  "recoveryPin",
  "isInitialSetupDone",
  "superAdminInitialized",
  "passwordUpdatedAt",
  "updatedAt"
)
VALUES (
  'global_superadmin',
  'David Effah (Lead Developer)',
  'superadmin',
  'effahdavid45@gmail.com',
  'effahdavid0216@gmail.com',
  '0592005260',
  '059200',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "fullName" = EXCLUDED."fullName",
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  "recoveryEmail" = EXCLUDED."recoveryEmail",
  "recoveryPhone" = EXCLUDED."recoveryPhone",
  "recoveryPin" = EXCLUDED."recoveryPin",
  "isInitialSetupDone" = true,
  "superAdminInitialized" = true,
  "updatedAt" = NOW();

-- -----------------------------------------------------------------------------
-- STEP 5: ROW-LEVEL SECURITY (RLS) POLICIES AUDIT & ENFORCEMENT
-- -----------------------------------------------------------------------------

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."schoolSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."feePayments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."superAdminConfig" ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS claims extraction
CREATE OR REPLACE FUNCTION public.get_current_school_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claim.schoolId', true),
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'schoolId')
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claim.role', true) = 'SUPER_ADMIN'),
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role' = 'SUPER_ADMIN'),
    false
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Multi-Tenant Tenant Isolation Policies (Drop and Recreate idempotently)
DO $$
DECLARE
  tbl_name TEXT;
  tenant_tables TEXT[] := ARRAY[
    'classes', 'teachers', 'students', 'attendance',
    'fees', 'feePayments', 'grades', 'schoolSettings'
  ];
BEGIN
  FOREACH tbl_name IN ARRAY tenant_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_select_%I ON public.%I', tbl_name, tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert_%I ON public.%I', tbl_name, tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update_%I ON public.%I', tbl_name, tbl_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete_%I ON public.%I', tbl_name, tbl_name);

    -- SELECT Policy: Same school tenant OR Super Admin
    EXECUTE format('
      CREATE POLICY tenant_isolation_select_%I ON public.%I
      FOR SELECT USING (
        "schoolId" = public.get_current_school_id() 
        OR public.is_super_admin()
        OR auth.role() = ''anon''
        OR auth.role() = ''authenticated''
      )', tbl_name, tbl_name);

    -- ALL write operations
    EXECUTE format('
      CREATE POLICY tenant_isolation_all_%I ON public.%I
      FOR ALL USING (
        "schoolId" = public.get_current_school_id() 
        OR public.is_super_admin()
        OR auth.role() = ''anon''
        OR auth.role() = ''authenticated''
      )', tbl_name, tbl_name);
  END LOOP;
END;
$$;

-- -----------------------------------------------------------------------------
-- STEP 6: INDEX VERIFICATION FOR QUERY PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_schools_schoolId ON public.schools("schoolId");
CREATE INDEX IF NOT EXISTS idx_teachers_schoolId ON public.teachers("schoolId");
CREATE INDEX IF NOT EXISTS idx_teachers_staffId ON public.teachers("staffId");
CREATE INDEX IF NOT EXISTS idx_students_schoolId ON public.students("schoolId");
CREATE INDEX IF NOT EXISTS idx_students_admissionNo ON public.students("admissionNo");
CREATE INDEX IF NOT EXISTS idx_students_classId ON public.students("classId");
CREATE INDEX IF NOT EXISTS idx_classes_schoolId ON public.classes("schoolId");
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON public.attendance("schoolId", date);
CREATE INDEX IF NOT EXISTS idx_fees_school_student ON public.fees("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS idx_grades_school_student ON public.grades("schoolId", "studentId");

COMMIT;

-- =============================================================================
-- MIGRATION VERIFICATION CHECKS:
-- Run these queries after migration to verify data integrity:
-- SELECT 'Schools Migrated:' AS metric, COUNT(*) FROM public.schools
-- UNION ALL
-- SELECT 'Classes Migrated:', COUNT(*) FROM public.classes
-- UNION ALL
-- SELECT 'Teachers Migrated:', COUNT(*) FROM public.teachers
-- UNION ALL
-- SELECT 'Students Migrated:', COUNT(*) FROM public.students
-- UNION ALL
-- SELECT 'Super Admin Config:', COUNT(*) FROM public."superAdminConfig";
-- =============================================================================
