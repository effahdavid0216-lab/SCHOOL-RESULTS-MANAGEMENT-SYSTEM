import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  GraduationCap,
  Archive,
  ArrowUpRight,
  Filter,
  CheckSquare,
  Square,
  Loader2,
  ShieldCheck,
  History
} from 'lucide-react';
import {
  Student,
  ClassItem,
  StudentEnrollment,
  StudentStatus
} from '../types';
import {
  getStudentsBySchool,
  getClassesBySchool,
  saveStudentEnrollment,
  logStudentStatusChange,
  getStudentStatusHistory,
  logAuditAction
} from '../lib/services';
import { supabaseUpdateRecord } from '../lib/supabaseService';

interface Props {
  schoolId: string;
  currentAcademicYear?: string;
}

export const PromotionModuleView: React.FC<Props> = ({
  schoolId,
  currentAcademicYear = '2026/2027'
}) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Workflow State
  const [sourceYear, setSourceYear] = useState<string>(currentAcademicYear);
  const [sourceClassId, setSourceClassId] = useState<string>('');
  const [targetYear, setTargetYear] = useState<string>('');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [actionType, setActionType] = useState<'PROMOTE' | 'REPEAT' | 'GRADUATE' | 'TRANSFER' | 'ARCHIVE'>('PROMOTE');
  
  // Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [promotionRemarks, setPromotionRemarks] = useState<string>('Standard academic session progression');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusHistoryView, setStatusHistoryView] = useState(false);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);

  useEffect(() => {
    // Generate next academic year suggestion (e.g., "2025/2026" -> "2026/2027")
    const parts = currentAcademicYear.split('/');
    if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
      setTargetYear(`${parseInt(parts[0]) + 1}/${parseInt(parts[1]) + 1}`);
    } else {
      setTargetYear('2026/2027');
    }
    loadData();
  }, [schoolId, currentAcademicYear]);

  const loadData = async () => {
    setLoading(true);
    const [cList, sList] = await Promise.all([
      getClassesBySchool(schoolId),
      getStudentsBySchool(schoolId)
    ]);
    const activeClasses = cList.filter((c) => (c.status || 'ACTIVE') === 'ACTIVE');
    setClasses(activeClasses);
    setAllStudents(sList);
    if (activeClasses.length > 0 && !sourceClassId) {
      setSourceClassId(activeClasses[0].id);
      if (activeClasses.length > 1) {
        setTargetClassId(activeClasses[1].id);
      }
    }
    setLoading(false);
  };

  const loadStatusLogs = async () => {
    const logs = await getStudentStatusHistory(schoolId);
    setStatusLogs(logs);
  };

  // Enrolled students in the selected source class
  const classStudents = allStudents.filter(
    (s) => s.classId === sourceClassId && (s.status || 'ACTIVE') !== 'ARCHIVED'
  );

  const handleSelectAll = () => {
    if (selectedStudentIds.length === classStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(classStudents.map((s) => s.id));
    }
  };

  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sId) => sId !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleExecuteTransition = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student to proceed.');
      return;
    }

    if (actionType === 'PROMOTE' && !targetClassId) {
      alert('Please select the target class for promotion.');
      return;
    }

    const targetClass = classes.find((c) => c.id === targetClassId);
    const sourceClass = classes.find((c) => c.id === sourceClassId);

    const confirmMsg = `Execute ${actionType} for ${selectedStudentIds.length} student(s)?\nHistorical records, past examination results, and attendance will be safely preserved.`;
    if (!confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      for (const studentId of selectedStudentIds) {
        const student = allStudents.find((s) => s.id === studentId);
        if (!student) continue;

        let newStatus: StudentStatus = 'ACTIVE';
        let newClassId = student.classId;
        let newClassName = student.className;

        if (actionType === 'PROMOTE') {
          newStatus = 'PROMOTED';
          newClassId = targetClassId;
          newClassName = targetClass?.className || student.className;
        } else if (actionType === 'REPEAT') {
          newStatus = 'REPEATED';
          newClassId = sourceClassId;
          newClassName = sourceClass?.className || student.className;
        } else if (actionType === 'GRADUATE') {
          newStatus = 'GRADUATED';
        } else if (actionType === 'TRANSFER') {
          newStatus = 'TRANSFERRED';
        } else if (actionType === 'ARCHIVE') {
          newStatus = 'ARCHIVED';
        }

        // 1. Create New Student Enrollment Record (preserving historical year)
        await saveStudentEnrollment({
          schoolId,
          studentId: student.id,
          studentName: student.fullName,
          admissionNo: student.admissionNo,
          academicYear: targetYear || sourceYear,
          classId: newClassId,
          className: newClassName,
          stream: student.stream,
          house: student.house,
          status: newStatus,
          promotedToClassId: actionType === 'PROMOTE' ? targetClassId : undefined,
          promotedToClassName: actionType === 'PROMOTE' ? targetClass?.className : undefined,
          enrollmentDate: new Date().toISOString(),
          remarks: promotionRemarks
        });

        // 2. Update Student Master Record
        await supabaseUpdateRecord<any>('students', student.id, {
          classId: newClassId,
          className: newClassName,
          academicYear: targetYear || sourceYear,
          status: newStatus === 'PROMOTED' || newStatus === 'REPEATED' ? 'ACTIVE' : newStatus,
          updatedAt: new Date().toISOString()
        });

        // 3. Log Status Audit History
        await logStudentStatusChange({
          schoolId,
          studentId: student.id,
          studentName: student.fullName,
          admissionNo: student.admissionNo,
          previousStatus: student.status,
          newStatus,
          academicYear: targetYear || sourceYear,
          reason: `${actionType} from ${sourceClass?.className} to ${newClassName}. ${promotionRemarks}`,
          changedBy: 'admin@school.edu.gh'
        });
      }

      await logAuditAction({
        schoolId,
        userEmail: 'admin@school.edu.gh',
        role: 'SCHOOL_ADMIN',
        action: `STUDENT_BATCH_${actionType}`,
        targetRecord: `${selectedStudentIds.length} students in ${sourceClass?.className}`,
        details: `Batch ${actionType} processed into ${targetClass?.className || 'status change'} for academic year ${targetYear}.`
      });

      alert(`Successfully processed ${selectedStudentIds.length} student(s).`);
      setSelectedStudentIds([]);
      await loadData();
    } catch (err: any) {
      alert(`Error during processing: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              ACADEMIC TRANSITION ENGINE
            </span>
          </div>
          <h2 className="text-xl font-light text-white serif italic flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Student Promotion & Academic Progression
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Promote entire classes or individual students to new grade levels, handle repeating or graduating students with complete historical record preservation.
          </p>
        </div>

        <button
          onClick={() => {
            setStatusHistoryView(!statusHistoryView);
            if (!statusHistoryView) loadStatusLogs();
          }}
          className="px-4 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <History className="w-4 h-4 text-blue-400" />
          {statusHistoryView ? 'Back to Promotion Setup' : 'View Status History Logs'}
        </button>
      </div>

      {statusHistoryView ? (
        /* Status History Audit View */
        <div className="bg-[#0f111a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Promotion & Status Change Audit History
            </h3>
            <span className="text-xs text-slate-400">Total Entries: {statusLogs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161925] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Previous Status</th>
                  <th className="px-4 py-3">New Status</th>
                  <th className="px-4 py-3">Academic Session</th>
                  <th className="px-4 py-3">Reason / Details</th>
                  <th className="px-4 py-3">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {statusLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-sans text-xs">
                      No status transitions recorded yet.
                    </td>
                  </tr>
                ) : (
                  statusLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#161925]/50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-sans">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-sans font-semibold text-white">
                        {log.studentName}
                      </td>
                      <td className="px-4 py-3 text-blue-400">{log.admissionNo}</td>
                      <td className="px-4 py-3 text-slate-400">{log.previousStatus}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold">
                          {log.newStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{log.academicYear}</td>
                      <td className="px-4 py-3 text-slate-400 font-sans">{log.reason || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 font-sans">{log.changedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Standard Promotion Wizard */
        <div className="space-y-6">
          {/* Step 1: Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                1. Source Class & Year
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={sourceYear}
                  onChange={(e) => setSourceYear(e.target.value)}
                  placeholder="e.g. 2024/2025"
                  className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <select
                  value={sourceClassId}
                  onChange={(e) => {
                    setSourceClassId(e.target.value);
                    setSelectedStudentIds([]);
                  }}
                  className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.className} ({c.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                2. Transition Action
              </label>
              <div className="space-y-2">
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="PROMOTE">Promote to Next Grade / Class</option>
                  <option value="REPEAT">Repeat Current Class Level</option>
                  <option value="GRADUATE">Graduate (Alumni Finalized)</option>
                  <option value="TRANSFER">Transfer Out of School</option>
                  <option value="ARCHIVE">Archive Student Profile</option>
                </select>
                <input
                  type="text"
                  placeholder="Optional remarks (e.g. Passed BECE)"
                  value={promotionRemarks}
                  onChange={(e) => setPromotionRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                3. Destination Class & Year
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  placeholder="e.g. 2025/2026"
                  className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <select
                  disabled={actionType !== 'PROMOTE'}
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161925] border border-slate-700 disabled:opacity-40 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.className} ({c.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student Roster Selection Table */}
          <div className="bg-[#0f111a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161925]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  {selectedStudentIds.length === classStudents.length && classStudents.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  Select All ({classStudents.length} Students)
                </button>
                <span className="text-xs text-blue-400 font-medium">
                  {selectedStudentIds.length} Selected
                </span>
              </div>

              <button
                type="button"
                disabled={isProcessing || selectedStudentIds.length === 0}
                onClick={handleExecuteTransition}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Execute {actionType} ({selectedStudentIds.length})
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs">Loading class students...</span>
              </div>
            ) : classStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No active students currently enrolled in this class. Select a different source class.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161925]/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5 w-12 text-center">Select</th>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Admission No</th>
                      <th className="px-6 py-3.5">Gender</th>
                      <th className="px-6 py-3.5">House</th>
                      <th className="px-6 py-3.5">Current Status</th>
                      <th className="px-6 py-3.5">Proposed Destination</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {classStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <tr
                          key={student.id}
                          onClick={() => toggleStudent(student.id)}
                          className={`hover:bg-[#161925]/60 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleStudent(student.id)}
                              className="text-slate-400 hover:text-white"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 font-semibold text-white">
                            <div className="flex items-center gap-2.5">
                              {student.photoUrl ? (
                                <img
                                  src={student.photoUrl}
                                  alt={student.fullName}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-700"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                                  {student.fullName.charAt(0)}
                                </div>
                              )}
                              <span>{student.fullName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-blue-400 font-mono text-[11px]">
                            {student.admissionNo}
                          </td>
                          <td className="px-6 py-4 text-slate-300">{student.gender}</td>
                          <td className="px-6 py-4 text-slate-400">{student.house || '—'}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full uppercase">
                              {student.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-200">
                            {actionType === 'PROMOTE' && (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <ArrowRight className="w-3.5 h-3.5" />
                                {classes.find((c) => c.id === targetClassId)?.className || 'Select Target'} ({targetYear})
                              </span>
                            )}
                            {actionType === 'REPEAT' && (
                              <span className="text-amber-400 flex items-center gap-1">
                                <RotateCcw className="w-3.5 h-3.5" />
                                Repeat {student.className} ({targetYear})
                              </span>
                            )}
                            {actionType === 'GRADUATE' && (
                              <span className="text-purple-400 flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5" />
                                Graduate / Alumni
                              </span>
                            )}
                            {actionType === 'TRANSFER' && (
                              <span className="text-sky-400">Transfer Out</span>
                            )}
                            {actionType === 'ARCHIVE' && (
                              <span className="text-slate-400 flex items-center gap-1">
                                <Archive className="w-3.5 h-3.5" />
                                Archive Roster
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
