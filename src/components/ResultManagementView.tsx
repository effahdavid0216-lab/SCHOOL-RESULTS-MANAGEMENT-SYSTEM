import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Lock,
  Globe,
  Edit,
  History,
  AlertTriangle,
  RefreshCw,
  Search,
  FileText
} from 'lucide-react';
import {
  ClassItem,
  SubjectItem,
  ScoreEntry,
  ResultCorrectionLog,
  ExamType,
  ResultStatus
} from '../types';
import {
  getClassesBySchool,
  getSubjectsBySchool,
  getScoresByQuery,
  updateScoreStatus,
  logResultCorrection,
  getCorrectionLogs,
  saveBatchScores
} from '../lib/services';
import { computeCompleteScore } from '../lib/academicEngine';
import { Protect } from './AccessControlManager';

interface Props {
  schoolId: string;
}

export const ResultManagementView: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [term, setTerm] = useState<string>('Term 1');
  const [examType, setExamType] = useState<ExamType>('END_OF_TERM');

  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<ResultCorrectionLog[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal for Result Correction
  const [editingScore, setEditingScore] = useState<ScoreEntry | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [newExamScore, setNewExamScore] = useState<number>(0);

  useEffect(() => {
    loadInitialData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      loadScoresAndAudit();
    }
  }, [selectedClassId, selectedSubjectId, academicYear, term, examType]);

  const loadInitialData = async () => {
    setLoading(true);
    const [cList, sList] = await Promise.all([
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId)
    ]);

    setClasses(cList);
    setSubjects(sList);

    if (cList.length > 0) setSelectedClassId(cList[0].id);
    if (sList.length > 0) setSelectedSubjectId(sList[0].id);

    setLoading(false);
  };

  const loadScoresAndAudit = async () => {
    const [sList, logs] = await Promise.all([
      getScoresByQuery({
        schoolId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        academicYear,
        term,
        examType
      }),
      getCorrectionLogs(schoolId)
    ]);

    setScores(sList);
    setAuditLogs(logs);
  };

  const handleUpdateStatusBatch = async (status: ResultStatus) => {
    if (scores.length === 0) return;
    setUpdating(true);
    setMsg(null);

    const scoreIds = scores.map(s => s.id);
    try {
      await updateScoreStatus(scoreIds, status, 'School Administrator');
      setMsg({
        type: 'success',
        text: `Results status updated to ${status} for all ${scores.length} student records.`
      });
      loadScoresAndAudit();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update result status.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenCorrectionModal = (score: ScoreEntry) => {
    setEditingScore(score);
    setNewExamScore(score.examRawScore);
    setCorrectionReason('');
  };

  const handleSaveCorrection = async () => {
    if (!editingScore) return;
    if (!correctionReason.trim()) {
      alert('A valid reason/justification is required for result corrections.');
      return;
    }

    setUpdating(true);
    try {
      // Compute new score
      const recomputed = computeCompleteScore({
        examType: editingScore.examType,
        sbaRawScores: editingScore.sbaRawScores,
        examRawScore: newExamScore
      });

      const updatedScore: ScoreEntry = {
        ...editingScore,
        examRawScore: newExamScore,
        examScaledScore: recomputed.examScaledScore,
        finalScore: recomputed.finalScore,
        percentage: recomputed.percentage,
        grade: recomputed.grade,
        gradePoint: recomputed.gradePoint,
        remark: recomputed.remark,
        isPass: recomputed.isPass,
        updatedAt: new Date().toISOString()
      };

      await saveBatchScores([updatedScore]);

      // Log correction audit
      await logResultCorrection({
        schoolId,
        scoreId: editingScore.id,
        studentName: editingScore.studentName,
        subjectName: editingScore.subjectName,
        originalScore: editingScore.finalScore,
        newScore: recomputed.finalScore,
        reason: correctionReason,
        requestedBy: editingScore.submittedBy || 'Teacher',
        approvedBy: 'School Administrator'
      });

      setMsg({ type: 'success', text: `Score corrected and logged in audit history.` });
      setEditingScore(null);
      loadScoresAndAudit();
    } catch (err: any) {
      alert(`Error saving correction: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs uppercase tracking-wider">Loading Result Lifecycle Manager...</p>
      </div>
    );
  }

  const currentStatus = scores.length > 0 ? scores[0].status : 'NO_DATA';

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header Banner */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              ADMIN CONTROL PANEL
            </span>
            <h2 className="text-xl font-light text-white serif italic mt-1">Result Lifecycle & Approval Engine</h2>
            <p className="text-xs text-slate-400">
              Review teacher score submissions, approve, publish to student/parent portals, and lock results.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Protect permission="results.approve">
              <button
                onClick={() => handleUpdateStatusBatch('DRAFT')}
                disabled={updating || scores.length === 0}
                className="px-3 py-1.5 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Return to Draft
              </button>
              <button
                onClick={() => handleUpdateStatusBatch('APPROVED')}
                disabled={updating || scores.length === 0}
                className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Approve
              </button>
              <button
                onClick={() => handleUpdateStatusBatch('PUBLISHED')}
                disabled={updating || scores.length === 0}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" /> Publish
              </button>
              <button
                onClick={() => handleUpdateStatusBatch('LOCKED')}
                disabled={updating || scores.length === 0}
                className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" /> Lock Results
              </button>
            </Protect>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.className}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subjectName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
              className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="END_OF_TERM">End-of-Term Examination</option>
              <option value="MOCK">Mock Examination</option>
            </select>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Results Table & Status Badge */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-[#161925]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-xs text-white">
              Submitted Marksheet Status ({scores.length} Records)
            </span>
          </div>

          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
            currentStatus === 'PUBLISHED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : currentStatus === 'LOCKED'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : currentStatus === 'APPROVED'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            Lifecycle: {currentStatus}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d0f18]">
                <th className="py-3 px-3">Admission No</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3 text-center">SBA Scaled /50</th>
                <th className="py-3 px-3 text-center">Exam Scaled /50</th>
                <th className="py-3 px-3 text-center">Final Score (%)</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-3">Remark</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {scores.map((sc) => (
                <tr key={sc.id} className="hover:bg-[#161925]/70 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-400">{sc.admissionNo}</td>
                  <td className="py-3 px-3 font-semibold text-white">{sc.studentName}</td>
                  <td className="py-3 px-3 text-center font-mono text-blue-300">{sc.sbaScaledScore.toFixed(2)}</td>
                  <td className="py-3 px-3 text-center font-mono text-indigo-300">{sc.examScaledScore.toFixed(2)}</td>
                  <td className="py-3 px-3 text-center font-bold font-mono text-emerald-400">{sc.finalScore.toFixed(2)}%</td>
                  <td className="py-3 px-3 text-center font-bold text-white">{sc.grade}</td>
                  <td className="py-3 px-3 text-slate-300">{sc.remark}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleOpenCorrectionModal(sc)}
                      className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" /> Correct Score
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Correction Logs Section */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-light text-white serif italic flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" /> Result Correction Audit Trail ({auditLogs.length} Entries)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Date/Time</th>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3 text-center">Original</th>
                <th className="py-2.5 px-3 text-center">New Score</th>
                <th className="py-2.5 px-3">Reason / Justification</th>
                <th className="py-2.5 px-3">Approved By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#161925]">
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-white font-semibold">{log.studentName}</td>
                  <td className="py-2.5 px-3 text-slate-300">{log.subjectName}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-rose-400">{log.originalScore.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-bold">{log.newScore.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-slate-300 italic">{log.reason}</td>
                  <td className="py-2.5 px-3 text-blue-400 font-semibold">{log.approvedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controlled Correction Modal */}
      {editingScore && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-light text-white serif italic flex items-center gap-2">
              <Edit className="w-4 h-4 text-blue-400" /> Result Correction Protocol
            </h3>
            <p className="text-xs text-slate-400">
              Correcting score for <strong>{editingScore.studentName}</strong> ({editingScore.subjectName}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">New Raw Exam Score (out of 100)</label>
                <input
                  type="number"
                  value={newExamScore}
                  onChange={(e) => setNewExamScore(Number(e.target.value))}
                  className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Audit Justification / Reason *</label>
                <textarea
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Provide explicit reason for mark amendment e.g., Script re-marking, clerical summation adjustment..."
                  rows={3}
                  className="w-full bg-[#161925] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingScore(null)}
                className="px-4 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCorrection}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Apply & Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
