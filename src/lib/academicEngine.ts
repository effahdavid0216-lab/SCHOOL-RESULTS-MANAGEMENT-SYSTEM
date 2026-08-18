import {
  SBAComponentConfig,
  GradingSystem,
  GradeBoundary,
  ScoreEntry,
  ExamType
} from '../types';

// Default SBA Components Configuration
export const DEFAULT_SBA_COMPONENTS: SBAComponentConfig[] = [
  { id: 'classTest', key: 'classTest', name: 'CLASS TEST', maxScore: 15, weightPercent: 15, status: 'ACTIVE' },
  { id: 'classExercise', key: 'classExercise', name: 'CLASS EXERCISE', maxScore: 15, weightPercent: 15, status: 'ACTIVE' },
  { id: 'projectWork', key: 'projectWork', name: 'PROJECT WORK', maxScore: 15, weightPercent: 15, status: 'ACTIVE' },
  { id: 'groupWork', key: 'groupWork', name: 'GROUP WORK', maxScore: 15, weightPercent: 15, status: 'ACTIVE' },
];

// Default BECE / WAEC Grading System
export const DEFAULT_BECE_GRADING: GradeBoundary[] = [
  { grade: 'A1', minScore: 80, maxScore: 100, points: 1, remarks: 'EXCELLENT' },
  { grade: 'B2', minScore: 70, maxScore: 79.99, points: 2, remarks: 'VERY GOOD' },
  { grade: 'B3', minScore: 65, maxScore: 69.99, points: 3, remarks: 'GOOD' },
  { grade: 'C4', minScore: 60, maxScore: 64.99, points: 4, remarks: 'CREDIT' },
  { grade: 'C5', minScore: 55, maxScore: 59.99, points: 5, remarks: 'CREDIT' },
  { grade: 'C6', minScore: 50, maxScore: 54.99, points: 6, remarks: 'CREDIT' },
  { grade: 'D7', minScore: 45, maxScore: 49.99, points: 7, remarks: 'PASS' },
  { grade: 'E8', minScore: 40, maxScore: 44.99, points: 8, remarks: 'PASS' },
  { grade: 'F9', minScore: 0, maxScore: 39.99, points: 9, remarks: 'FAIL' },
];

export const DEFAULT_WAEC_GRADING: GradeBoundary[] = [
  { grade: 'A1', minScore: 80, maxScore: 100, points: 1, remarks: 'EXCELLENT' },
  { grade: 'B2', minScore: 75, maxScore: 79.99, points: 2, remarks: 'VERY GOOD' },
  { grade: 'B3', minScore: 70, maxScore: 74.99, points: 3, remarks: 'GOOD' },
  { grade: 'C4', minScore: 65, maxScore: 69.99, points: 4, remarks: 'CREDIT' },
  { grade: 'C5', minScore: 60, maxScore: 64.99, points: 5, remarks: 'CREDIT' },
  { grade: 'C6', minScore: 50, maxScore: 59.99, points: 6, remarks: 'CREDIT' },
  { grade: 'D7', minScore: 45, maxScore: 49.99, points: 7, remarks: 'PASS' },
  { grade: 'E8', minScore: 40, maxScore: 44.99, points: 8, remarks: 'PASS' },
  { grade: 'F9', minScore: 0, maxScore: 39.99, points: 9, remarks: 'FAIL' },
];

export const DEFAULT_GPA_GRADING: GradeBoundary[] = [
  { grade: 'A', minScore: 80, maxScore: 100, points: 4.0, remarks: 'EXCELLENT' },
  { grade: 'B+', minScore: 75, maxScore: 79.99, points: 3.5, remarks: 'VERY GOOD' },
  { grade: 'B', minScore: 70, maxScore: 74.99, points: 3.0, remarks: 'GOOD' },
  { grade: 'C+', minScore: 65, maxScore: 69.99, points: 2.5, remarks: 'ABOVE AVERAGE' },
  { grade: 'C', minScore: 60, maxScore: 64.99, points: 2.0, remarks: 'AVERAGE' },
  { grade: 'D+', minScore: 55, maxScore: 59.99, points: 1.5, remarks: 'PASS' },
  { grade: 'D', minScore: 50, maxScore: 54.99, points: 1.0, remarks: 'PASS' },
  { grade: 'F', minScore: 0, maxScore: 49.99, points: 0.0, remarks: 'FAIL' },
];

export function getDefaultGradingBoundaries(type: 'BECE' | 'WAEC' | 'GPA' | 'CUSTOM'): GradeBoundary[] {
  switch (type) {
    case 'WAEC':
      return JSON.parse(JSON.stringify(DEFAULT_WAEC_GRADING));
    case 'GPA':
      return JSON.parse(JSON.stringify(DEFAULT_GPA_GRADING));
    case 'BECE':
    default:
      return JSON.parse(JSON.stringify(DEFAULT_BECE_GRADING));
  }
}

/**
 * Validates individual component raw scores against maximum limits.
 */
export function validateScoreInput(
  value: number,
  maxAllowed: number,
  fieldName: string = 'Score'
): { isValid: boolean; errorMsg?: string } {
  if (isNaN(value) || value < 0) {
    return { isValid: false, errorMsg: `${fieldName} cannot be negative or invalid.` };
  }
  if (value > maxAllowed) {
    return { isValid: false, errorMsg: `${fieldName} (${value}) exceeds maximum allowed score of ${maxAllowed}.` };
  }
  return { isValid: true };
}

/**
 * Calculates raw total, scaled score for SBA components.
 * Formula: SBA Scaled Score = (SBA Raw Score / SBA Raw Max) * Target Scaling (default 50)
 */
export function calculateSBAResult(
  sbaRawScores: { [componentId: string]: number },
  components: SBAComponentConfig[] = DEFAULT_SBA_COMPONENTS,
  sbaTargetScale: number = 50
): { sbaRawTotal: number; sbaRawMaxTotal: number; sbaScaledScore: number } {
  let sbaRawTotal = 0;
  let sbaRawMaxTotal = 0;

  components.forEach(comp => {
    if (comp.status === 'ACTIVE') {
      const rawVal = sbaRawScores[comp.id] || sbaRawScores[comp.key] || 0;
      sbaRawTotal += rawVal;
      sbaRawMaxTotal += comp.maxScore;
    }
  });

  const sbaScaledScore = sbaRawMaxTotal > 0 ? (sbaRawTotal / sbaRawMaxTotal) * sbaTargetScale : 0;

  return {
    sbaRawTotal,
    sbaRawMaxTotal,
    sbaScaledScore
  };
}

/**
 * Calculates scaled score for End-of-Term Examination.
 * Formula: Exam Scaled Score = (Exam Raw Score / Exam Max) * Target Scaling (default 50)
 */
export function calculateExamResult(
  examRawScore: number,
  examMax: number = 100,
  examTargetScale: number = 50
): { examScaledScore: number } {
  const safeExam = Math.max(0, Math.min(examRawScore, examMax));
  const examScaledScore = examMax > 0 ? (safeExam / examMax) * examTargetScale : 0;

  return { examScaledScore };
}

/**
 * Determines Grade, Points, Remark, and Pass status from a final percentage score.
 */
export function determineGradeAndRemark(
  finalScore: number,
  gradingSystem?: GradingSystem | null
): { grade: string; gradePoint: number; remark: string; isPass: boolean } {
  const boundaries = gradingSystem?.boundaries || DEFAULT_BECE_GRADING;
  const rounded = Math.round(finalScore * 100) / 100;

  // Find matching boundary
  const matched = boundaries.find(
    b => rounded >= b.minScore && rounded <= b.maxScore
  ) || boundaries[boundaries.length - 1];

  if (matched) {
    const isPass = matched.grade !== 'F9' && !matched.remarks.toUpperCase().includes('FAIL');
    return {
      grade: matched.grade,
      gradePoint: matched.points || 1,
      remark: matched.remarks,
      isPass
    };
  }

  return {
    grade: 'F9',
    gradePoint: 9,
    remark: 'FAIL',
    isPass: false
  };
}

/**
 * Complete single authoritative calculation engine for any score entry.
 * Handles SBA + Exam and Mock Exam.
 */
export function computeCompleteScore(params: {
  examType: ExamType;
  sbaRawScores: { [componentId: string]: number };
  examRawScore: number;
  sbaComponents?: SBAComponentConfig[];
  sbaTargetScale?: number;
  examTargetScale?: number;
  examMaxScore?: number;
  gradingSystem?: GradingSystem | null;
}): {
  sbaRawTotal: number;
  sbaRawMaxTotal: number;
  sbaScaledScore: number;
  examScaledScore: number;
  finalScore: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  remark: string;
  isPass: boolean;
} {
  const {
    examType,
    sbaRawScores,
    examRawScore,
    sbaComponents = DEFAULT_SBA_COMPONENTS,
    sbaTargetScale = 50,
    examTargetScale = 50,
    examMaxScore = 100,
    gradingSystem
  } = params;

  if (examType === 'MOCK') {
    // MOCK Exam is 100% direct score with no SBA component
    const mockScore = Math.max(0, Math.min(examRawScore, 100));
    const gradeInfo = determineGradeAndRemark(mockScore, gradingSystem);

    return {
      sbaRawTotal: 0,
      sbaRawMaxTotal: 0,
      sbaScaledScore: 0,
      examScaledScore: mockScore,
      finalScore: mockScore,
      percentage: mockScore,
      grade: gradeInfo.grade,
      gradePoint: gradeInfo.gradePoint,
      remark: gradeInfo.remark,
      isPass: gradeInfo.isPass
    };
  } else {
    // SBA + END-OF-TERM EXAMINATION
    const sbaRes = calculateSBAResult(sbaRawScores, sbaComponents, sbaTargetScale);
    const examRes = calculateExamResult(examRawScore, examMaxScore, examTargetScale);

    const finalScore = sbaRes.sbaScaledScore + examRes.examScaledScore;
    const percentage = finalScore; // Already out of 100%

    const gradeInfo = determineGradeAndRemark(finalScore, gradingSystem);

    return {
      sbaRawTotal: sbaRes.sbaRawTotal,
      sbaRawMaxTotal: sbaRes.sbaRawMaxTotal,
      sbaScaledScore: sbaRes.sbaScaledScore,
      examScaledScore: examRes.examScaledScore,
      finalScore,
      percentage,
      grade: gradeInfo.grade,
      gradePoint: gradeInfo.gradePoint,
      remark: gradeInfo.remark,
      isPass: gradeInfo.isPass
    };
  }
}

/**
 * Ranks items using Standard Competition Ranking (e.g., 1st, 1st, 3rd for ties).
 */
export function calculateRankings<T>(
  items: T[],
  getScore: (item: T) => number
): (T & { rank: number })[] {
  if (!items || items.length === 0) return [];

  // Sort descending by score
  const sorted = [...items].map((item, index) => ({ item, originalIndex: index, score: getScore(item) }));
  sorted.sort((a, b) => b.score - a.score);

  const rankedResult: (T & { rank: number })[] = new Array(items.length);

  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].score < sorted[i - 1].score) {
      currentRank = i + 1;
    }
    const targetIndex = sorted[i].originalIndex;
    rankedResult[targetIndex] = {
      ...sorted[i].item,
      rank: currentRank
    };
  }

  return rankedResult;
}

/**
 * Formats rank number with proper ordinal suffix (1st, 2nd, 3rd, 4th...).
 */
export function formatOrdinalRank(rank: number): string {
  if (!rank || rank <= 0) return '-';
  const j = rank % 10;
  const k = rank % 100;
  if (j === 1 && k !== 11) return `${rank}st`;
  if (j === 2 && k !== 12) return `${rank}nd`;
  if (j === 3 && k !== 13) return `${rank}rd`;
  return `${rank}th`;
}
