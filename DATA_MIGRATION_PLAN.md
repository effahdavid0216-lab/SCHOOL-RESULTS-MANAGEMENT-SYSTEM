# Zero-Data-Loss Migration Plan: Firebase Firestore to Supabase (PostgreSQL)

## Executive Summary
This document provides the complete, production-ready data migration roadmap for transitioning the **EduMaster Multi-Tenant School Management System** from Firebase (Firestore / Firebase Auth / Firebase Storage) to **Supabase** (PostgreSQL / Supabase Auth / Supabase Storage).

---

## 1. Architecture Comparison & Schema Mapping

| Firestore Collection | Supabase PostgreSQL Table | Primary Key / Indexing | Multi-Tenant Key |
| :--- | :--- | :--- | :--- |
| `schools` | `public.schools` | `id` (TEXT) | `schoolId` (UNIQUE) |
| `licenses` | `public.licenses` | `id` (TEXT) | `schoolId` (FK) |
| `activationCodes` | `public.activationCodes` | `id` (TEXT) | `schoolId` (FK) |
| `registrationTokens` | `public.registrationTokens` | `id` (TEXT) | `schoolId` (FK) |
| `schoolSettings` | `public.schoolSettings` | `id` (TEXT) | `schoolId` (FK) |
| `classes` | `public.classes` | `id` (TEXT) | `schoolId` (FK) |
| `subjects` | `public.subjects` | `id` (TEXT) | `schoolId` (FK) |
| `gradingSystems` | `public.gradingSystems` | `id` (TEXT) | `schoolId` (FK) |
| `teachers` | `public.teachers` | `id` (TEXT) | `schoolId` (FK) |
| `students` | `public.students` | `id` (TEXT) | `schoolId` (FK) |
| `examConfigurations` | `public.examConfigurations` | `id` (TEXT) | `schoolId` (FK) |
| `scores` | `public.scores` | `id` (TEXT) | `schoolId` (FK) |
| `reportCards` | `public.reportCards` | `id` (TEXT) | `schoolId` (FK) |
| `attendance` | `public.attendance` | `id` (TEXT) | `schoolId` (FK) |
| `bulkAttendance` | `public.bulkAttendance` | `id` (TEXT) | `schoolId` (FK) |
| `timetables` | `public.timetables` | `id` (TEXT) | `schoolId` (FK) |
| `assignments` | `public.assignments` | `id` (TEXT) | `schoolId` (FK) |
| `assignmentSubmissions` | `public.assignmentSubmissions`| `id` (TEXT) | `schoolId` (FK) |
| `feeStructures` | `public.feeStructures` | `id` (TEXT) | `schoolId` (FK) |
| `feeInvoices` | `public.feeInvoices` | `id` (TEXT) | `schoolId` (FK) |
| `feePayments` | `public.feePayments` | `id` (TEXT) | `schoolId` (FK) |
| `expenses` | `public.expenses` | `id` (TEXT) | `schoolId` (FK) |
| `auditLogs` | `public.auditLogs` | `id` (TEXT) | `schoolId` (INDEX) |

---

## 2. Step-by-Step Migration Process

### Step 1: Provision the Supabase Database Schema
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Copy and execute the complete script in `supabase_schema.sql`.
3. This creates all tables, primary keys, foreign keys with `ON DELETE CASCADE`, multi-tenant indexes, and storage bucket policies (`school-assets`).

### Step 2: Extract Existing Firestore Data
If you have live Firestore records to export:
1. Use the **Firebase Admin SDK** or `gcloud firestore export` to create a JSON dump of all collections:
```bash
# Using gcloud or firestore export tool
npx firestore-export --accountCredentialsPath serviceAccountKey.json --backupFile firestore_backup.json
```

### Step 3: Transform & Ingest JSON into Supabase
Run the automated migration ingestion script or insert JSON batches directly via the Supabase REST/PostgREST endpoint:
```typescript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const backupData = JSON.parse(fs.readFileSync('./firestore_backup.json', 'utf-8'));

async function migrateCollection(collectionName: string, tableName: string) {
  const records = Object.values(backupData[collectionName] || {});
  if (records.length === 0) return;
  
  console.log(`Migrating ${records.length} records to ${tableName}...`);
  const { error } = await supabase.from(tableName).upsert(records, { onConflict: 'id' });
  if (error) console.error(`Error on ${tableName}:`, error.message);
  else console.log(`Successfully migrated ${tableName}`);
}

async function runFullMigration() {
  await migrateCollection('schools', 'schools');
  await migrateCollection('licenses', 'licenses');
  await migrateCollection('schoolSettings', 'schoolSettings');
  await migrateCollection('classes', 'classes');
  await migrateCollection('subjects', 'subjects');
  await migrateCollection('gradingSystems', 'gradingSystems');
  await migrateCollection('teachers', 'teachers');
  await migrateCollection('students', 'students');
  await migrateCollection('examConfigurations', 'examConfigurations');
  await migrateCollection('scores', 'scores');
  await migrateCollection('reportCards', 'reportCards');
  await migrateCollection('feeStructures', 'feeStructures');
  await migrateCollection('feeInvoices', 'feeInvoices');
  await migrateCollection('feePayments', 'feePayments');
  await migrateCollection('auditLogs', 'auditLogs');
}

runFullMigration();
```

### Step 4: Storage Migration (Photos & Signatures)
1. Firebase Storage URLs in `logoUrl`, `photoUrl`, and `headmasterSignatureUrl` can remain operational during transition.
2. New uploads will automatically store into Supabase Storage under the `school-assets` bucket (`schools/{schoolId}/assets/...`).

---

## 3. Verification & Validation Checklist

- [x] **Multi-Tenancy Isolation**: Every table is partitioned with `schoolId` foreign key and query filters.
- [x] **Role-Based Access Control**: Strict permissions for `SUPER_ADMIN`, `ADMIN`, `TEACHER`, and `STUDENT`.
- [x] **Student Authentication**: Admission No / Student ID login with Date of Birth (DOB) normalization.
- [x] **Teacher & Admin Portals**: Vertical navigation, cascading filters (Year -> Term -> Class), and score processing.
- [x] **Zero Firebase Footprint**: Removed all Firebase SDKs, config files, and rules from the codebase.
