import {
  School,
  License,
  ActivationCode,
  RegistrationToken,
  ClassItem,
  SubjectItem,
  Teacher,
  Student,
  ScoreEntry,
  SchoolSettings
} from '../types';
import { computeCompleteScore } from './academicEngine';
import {
  supabaseGetRecordById,
  supabaseUpsertRecord,
  supabaseBulkUpsert
} from './supabaseService';

export const DEMO_SCHOOL_CREDENTIALS = {
  schoolId: 'SCH-GH-000001',
  schoolName: 'Achimota Academy',
  activationCode: 'ACT-987654',
  token: 'TOK-123456',
  licenseKey: 'LIC-GH-2026-X89',
};

export async function ensureSeedData() {
  const isSeededLocally = typeof window !== 'undefined' && localStorage.getItem('edumaster_seed_initialized_v2') === 'true';

  try {
    let existingSchool: School | null = null;
    try {
      existingSchool = await supabaseGetRecordById<School>('schools', DEMO_SCHOOL_CREDENTIALS.schoolId);
    } catch {
      existingSchool = null;
    }

    const needsSeeding = !existingSchool && !isSeededLocally;

    if (needsSeeding || !existingSchool) {
      const now = new Date().toISOString();
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      const expiresIso = expires.toISOString();

      // 1. Seed default school
      const school: School = {
        id: DEMO_SCHOOL_CREDENTIALS.schoolId,
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        name: DEMO_SCHOOL_CREDENTIALS.schoolName,
        schoolType: 'PRIMARY_JHS',
        contactPerson: 'Dr. Kwame Mensah',
        phone: '+233 24 123 4567',
        altPhone: '+233 20 987 6543',
        email: 'info@achimotaacademy.edu.gh',
        address: '12 Independence Avenue',
        district: 'Accra Metropolis',
        region: 'Greater Accra',
        country: 'Ghana',
        motto: 'Excellence and Integrity',
        logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80',
        activationStatus: 'ACTIVATED',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };

      // 2. Seed License
      const license: License = {
        id: `lic_${DEMO_SCHOOL_CREDENTIALS.schoolId}`,
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        licenseKey: DEMO_SCHOOL_CREDENTIALS.licenseKey,
        licenseType: '12_MONTHS',
        durationDays: 365,
        startDate: now,
        expiresAt: expiresIso,
        status: 'ACTIVE',
        createdAt: now,
      };

      // 3. Seed Activation Code & Token
      const activationCode: ActivationCode = {
        id: `act_${DEMO_SCHOOL_CREDENTIALS.schoolId}`,
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        code: DEMO_SCHOOL_CREDENTIALS.activationCode,
        status: 'ACTIVE',
        expiresAt: expiresIso,
        isOneTime: true,
        createdAt: now,
      };

      const token: RegistrationToken = {
        id: `tok_${DEMO_SCHOOL_CREDENTIALS.schoolId}`,
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        token: DEMO_SCHOOL_CREDENTIALS.token,
        status: 'ACTIVE',
        expiresAt: expiresIso,
        isOneTime: true,
        createdAt: now,
      };

      // 4. Seed School Settings
      const schoolSettings: SchoolSettings = {
        id: DEMO_SCHOOL_CREDENTIALS.schoolId,
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        currentAcademicYear: '2026/2027',
        currentTerm: 'Term 1',
        numberOfTerms: 3,
        academicCalendar: [
          { termName: 'Term 1', reopeningDate: '2026-09-08', closingDate: '2026-12-18', vacationDate: '2026-12-19' },
          { termName: 'Term 2', reopeningDate: '2027-01-12', closingDate: '2027-04-09', vacationDate: '2027-04-10' },
          { termName: 'Term 3', reopeningDate: '2027-05-04', closingDate: '2027-07-23', vacationDate: '2027-07-24' }
        ],
        headmasterName: 'Rev. Dr. Emmanuel Owusu',
        headmasterPosition: 'Headmaster & Academic Director',
        headmasterSignatureUrl: '',
        setupCompleted: true,
        updatedAt: now
      };

      // 5. Seed Class JHS 3A
      const classJhs3a: ClassItem = {
        id: 'cls_jhs3a',
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        className: 'JHS 3A',
        level: 'JHS',
        stream: 'A',
        schoolType: 'JHS',
        academicYear: '2026/2027',
        classTeacherId: 'tch_001',
        classTeacherName: 'Mr. John Appiah',
        capacity: 45,
        status: 'ACTIVE',
        createdAt: now
      };

      // 6. Seed Subjects
      const mathSubject: SubjectItem = {
        id: 'sub_math',
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        subjectName: 'Mathematics',
        code: 'MATH-JHS',
        subjectType: 'CORE',
        schoolType: 'JHS',
        classIds: ['cls_jhs3a'],
        level: 'JHS',
        teacherIds: ['tch_001'],
        status: 'ACTIVE',
        createdAt: now
      };

      const englishSubject: SubjectItem = {
        id: 'sub_eng',
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        subjectName: 'English Language',
        code: 'ENG-JHS',
        subjectType: 'CORE',
        schoolType: 'JHS',
        classIds: ['cls_jhs3a'],
        level: 'JHS',
        teacherIds: ['tch_001'],
        status: 'ACTIVE',
        createdAt: now
      };

      const scienceSubject: SubjectItem = {
        id: 'sub_sci',
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        subjectName: 'Integrated Science',
        code: 'SCI-JHS',
        subjectType: 'CORE',
        schoolType: 'JHS',
        classIds: ['cls_jhs3a'],
        level: 'JHS',
        teacherIds: ['tch_001'],
        status: 'ACTIVE',
        createdAt: now
      };

      // 7. Seed Teacher
      const teacherJohn: Teacher = {
        id: 'tch_001',
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        staffId: 'TCH-2026-001',
        fullName: 'Mr. John Appiah',
        gender: 'MALE',
        phone: '+233 24 555 0192',
        email: 'john.appiah@school.edu.gh',
        qualification: 'B.Ed Mathematics & Science',
        dateEmployed: '2021-09-01',
        subjectsTaughtIds: ['sub_math', 'sub_eng', 'sub_sci'],
        subjectsTaughtNames: ['Mathematics', 'English Language', 'Integrated Science'],
        isClassTeacher: true,
        classTeacherOfId: 'cls_jhs3a',
        classTeacherOfName: 'JHS 3A',
        periodsCount: 22,
        accountStatus: 'ACTIVE',
        createdAt: now
      };

      // 8. Seed Students
      const davidStudent: Student = {
        id: 'stu_david',
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        studentId: 'STU-2026-001',
        admissionNo: 'ADM-2026-001',
        fullName: 'David Mensah',
        firstName: 'David',
        lastName: 'Mensah',
        gender: 'MALE',
        dateOfBirth: '2011-04-12',
        nationality: 'Ghanaian',
        academicYear: '2026/2027',
        schoolType: 'JHS',
        classId: 'cls_jhs3a',
        className: 'JHS 3A',
        admissionDate: '2024-09-10',
        status: 'ACTIVE',
        parentName: 'Mr. Kofi Mensah',
        parentRelationship: 'Father',
        parentPhone: '+233 20 111 2233',
        emergencyName: 'Mrs. Akosua Mensah',
        emergencyPhone: '+233 20 111 2244',
        emergencyRelationship: 'Mother',
        createdAt: now
      };

      const sarahStudent: Student = {
        id: 'stu_sarah',
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        studentId: 'STU-2026-002',
        admissionNo: 'ADM-2026-002',
        fullName: 'Sarah Quarshie',
        firstName: 'Sarah',
        lastName: 'Quarshie',
        gender: 'FEMALE',
        dateOfBirth: '2011-08-25',
        nationality: 'Ghanaian',
        academicYear: '2026/2027',
        schoolType: 'JHS',
        classId: 'cls_jhs3a',
        className: 'JHS 3A',
        admissionDate: '2024-09-10',
        status: 'ACTIVE',
        parentName: 'Mrs. Janet Quarshie',
        parentRelationship: 'Mother',
        parentPhone: '+233 24 333 4455',
        emergencyName: 'Mr. Peter Quarshie',
        emergencyPhone: '+233 24 333 4466',
        emergencyRelationship: 'Father',
        createdAt: now
      };

      // 9. Compute Score for David Mensah
      const davidMathComputed = computeCompleteScore({
        examType: 'END_OF_TERM',
        sbaRawScores: { classTest: 12, classExercise: 13, projectWork: 14, groupWork: 10 },
        examRawScore: 80
      });

      const davidScore: ScoreEntry = {
        id: 'score_david_math_end',
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        academicYear: '2026/2027',
        term: 'Term 1',
        classId: 'cls_jhs3a',
        className: 'JHS 3A',
        subjectId: 'sub_math',
        subjectName: 'Mathematics',
        studentId: 'stu_david',
        studentName: 'David Mensah',
        admissionNo: 'ADM-2026-001',
        teacherId: 'tch_001',
        teacherName: 'Mr. John Appiah',
        examType: 'END_OF_TERM',
        sbaRawScores: { classTest: 12, classExercise: 13, projectWork: 14, groupWork: 10 },
        sbaRawTotal: davidMathComputed.sbaRawTotal,
        sbaRawMaxTotal: davidMathComputed.sbaRawMaxTotal,
        sbaScaledScore: davidMathComputed.sbaScaledScore,
        examRawScore: 80,
        examRawMax: 100,
        examScaledScore: davidMathComputed.examScaledScore,
        finalScore: davidMathComputed.finalScore,
        percentage: davidMathComputed.percentage,
        grade: davidMathComputed.grade,
        gradePoint: davidMathComputed.gradePoint,
        remark: davidMathComputed.remark,
        isPass: davidMathComputed.isPass,
        subjectPosition: 1,
        status: 'PUBLISHED',
        publishedAt: now,
        createdAt: now,
        updatedAt: now
      };

      const davidMockComputed = computeCompleteScore({
        examType: 'MOCK',
        sbaRawScores: {},
        examRawScore: 75
      });

      const davidMockScore: ScoreEntry = {
        id: 'score_david_math_mock',
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        academicYear: '2026/2027',
        term: 'Term 1',
        classId: 'cls_jhs3a',
        className: 'JHS 3A',
        subjectId: 'sub_math',
        subjectName: 'Mathematics',
        studentId: 'stu_david',
        studentName: 'David Mensah',
        admissionNo: 'ADM-2026-001',
        teacherId: 'tch_001',
        teacherName: 'Mr. John Appiah',
        examType: 'MOCK',
        sbaRawScores: {},
        sbaRawTotal: 0,
        sbaRawMaxTotal: 0,
        sbaScaledScore: 0,
        examRawScore: 75,
        examRawMax: 100,
        examScaledScore: 75,
        finalScore: 75,
        percentage: 75,
        grade: davidMockComputed.grade,
        gradePoint: davidMockComputed.gradePoint,
        remark: davidMockComputed.remark,
        isPass: davidMockComputed.isPass,
        subjectPosition: 1,
        status: 'PUBLISHED',
        publishedAt: now,
        createdAt: now,
        updatedAt: now
      };

      const sarahMathComputed = computeCompleteScore({
        examType: 'END_OF_TERM',
        sbaRawScores: { classTest: 10, classExercise: 10, projectWork: 10, groupWork: 10 },
        examRawScore: 70
      });

      const sarahScore: ScoreEntry = {
        id: 'score_sarah_math_end',
        schoolId: DEMO_SCHOOL_CREDENTIALS.schoolId,
        academicYear: '2026/2027',
        term: 'Term 1',
        classId: 'cls_jhs3a',
        className: 'JHS 3A',
        subjectId: 'sub_math',
        subjectName: 'Mathematics',
        studentId: 'stu_sarah',
        studentName: 'Sarah Quarshie',
        admissionNo: 'ADM-2026-002',
        teacherId: 'tch_001',
        teacherName: 'Mr. John Appiah',
        examType: 'END_OF_TERM',
        sbaRawScores: { classTest: 10, classExercise: 10, projectWork: 10, groupWork: 10 },
        sbaRawTotal: sarahMathComputed.sbaRawTotal,
        sbaRawMaxTotal: sarahMathComputed.sbaRawMaxTotal,
        sbaScaledScore: sarahMathComputed.sbaScaledScore,
        examRawScore: 70,
        examRawMax: 100,
        examScaledScore: sarahMathComputed.examScaledScore,
        finalScore: sarahMathComputed.finalScore,
        percentage: sarahMathComputed.percentage,
        grade: sarahMathComputed.grade,
        gradePoint: sarahMathComputed.gradePoint,
        remark: sarahMathComputed.remark,
        isPass: sarahMathComputed.isPass,
        subjectPosition: 2,
        status: 'PUBLISHED',
        publishedAt: now,
        createdAt: now,
        updatedAt: now
      };

      // Persist to Supabase and cache
      await Promise.all([
        supabaseUpsertRecord('schools', school),
        supabaseUpsertRecord('licenses', license),
        supabaseUpsertRecord('activationCodes', activationCode),
        supabaseUpsertRecord('registrationTokens', token),
        supabaseUpsertRecord('schoolSettings', schoolSettings),
        supabaseUpsertRecord('classes', classJhs3a),
        supabaseUpsertRecord('subjects', mathSubject),
        supabaseUpsertRecord('subjects', englishSubject),
        supabaseUpsertRecord('subjects', scienceSubject),
        supabaseUpsertRecord('teachers', teacherJohn),
        supabaseUpsertRecord('students', davidStudent),
        supabaseUpsertRecord('students', sarahStudent),
        supabaseUpsertRecord('scoreEntries', davidScore),
        supabaseUpsertRecord('scoreEntries', davidMockScore),
        supabaseUpsertRecord('scoreEntries', sarahScore)
      ]);

      if (typeof window !== 'undefined') {
        localStorage.setItem('edumaster_seed_initialized_v2', 'true');
        // Also persist to local school storage for instant hydration
        localStorage.setItem(`edumaster_school_${DEMO_SCHOOL_CREDENTIALS.schoolId}`, JSON.stringify(school));
        localStorage.setItem(`edumaster_settings_${DEMO_SCHOOL_CREDENTIALS.schoolId}`, JSON.stringify(schoolSettings));
      }
      console.log('Seeded complete Supabase multi-tenant demo records successfully.');
    }
  } catch (err) {
    console.debug('Seed data initialization note:', err);
  }
}
