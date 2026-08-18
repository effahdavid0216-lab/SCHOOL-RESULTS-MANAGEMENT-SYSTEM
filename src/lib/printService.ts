/**
 * EduMaster Reusable Print Service
 * Standardizes document printing across Student Report Cards, Bulk Reports, ID Cards, Transcripts, and Certificates.
 * Manages document titles, print media style hooks, and cleanup.
 */

export interface PrintOptions {
  documentTitle?: string;
  landscape?: boolean;
  pageBreakClass?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Executes a clean browser print with automatic title management and lifecycle callbacks.
 */
export function triggerPrint(options: PrintOptions = {}): void {
  const {
    documentTitle,
    onBeforePrint,
    onAfterPrint
  } = options;

  const originalTitle = document.title;

  if (documentTitle) {
    document.title = documentTitle;
  }

  if (onBeforePrint) {
    try {
      onBeforePrint();
    } catch (e) {
      console.warn('Error in onBeforePrint callback:', e);
    }
  }

  // Use requestAnimationFrame to ensure DOM is fully rendered before invoking print dialog
  requestAnimationFrame(() => {
    window.print();

    // Restore title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
      if (onAfterPrint) {
        try {
          onAfterPrint();
        } catch (e) {
          console.warn('Error in onAfterPrint callback:', e);
        }
      }
    }, 500);
  });
}

/**
 * Reusable print trigger for Single Student Report Card.
 */
export function printStudentReportCard(
  studentName: string,
  className: string,
  term: string,
  academicYear: string
): void {
  const title = `Report_Card_${studentName.replace(/\s+/g, '_')}_${className}_${term.replace(/\s+/g, '_')}_${academicYear.replace(/[\/\\]/g, '-')}`;
  triggerPrint({ documentTitle: title });
}

/**
 * Reusable print trigger for Class Batch Report Cards.
 */
export function printBulkReportCards(
  className: string,
  term: string,
  academicYear: string
): void {
  const title = `Bulk_Reports_${className.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}_${academicYear.replace(/[\/\\]/g, '-')}`;
  triggerPrint({ documentTitle: title });
}

/**
 * Reusable print trigger for Student ID Cards and Badges.
 */
export function printStudentIDCards(
  categoryName: string = 'Student_ID_Cards'
): void {
  const title = `${categoryName.replace(/\s+/g, '_')}_EduMaster`;
  triggerPrint({ documentTitle: title });
}

/**
 * Reusable print trigger for Certificates, Testimonials, and Transcripts.
 */
export function printOfficialDocument(
  docType: string,
  studentName: string
): void {
  const title = `${docType.replace(/\s+/g, '_')}_${studentName.replace(/\s+/g, '_')}_Official`;
  triggerPrint({ documentTitle: title });
}
