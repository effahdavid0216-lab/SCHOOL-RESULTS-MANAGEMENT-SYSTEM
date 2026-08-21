import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  Eye,
  AlertCircle,
  Calendar,
  Layers,
  Loader2,
  ShieldCheck,
  Check,
  MessageSquare
} from 'lucide-react';
import { ResultSubmission, ClassItem, SubjectItem } from '../types';
import {
  getResultSubmissions,
  reviewResultSubmission,
  getClassesBySchool,
  getSubjectsBySchool
} from '../lib/services';

interface Props {
  schoolId: string;
  academicYear: string;
  term: string;
}

export const TeacherSubmissionMonitorView: React.FC<Props> = ({
  schoolId,
  academicYear,
  term
}) => {
  const [submissions, setSubmissions] = useState<ResultSubmission[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Return Feedback Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedSubForReturn, setSelectedSubForReturn] = useState<ResultSubmission | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [schoolId, academicYear, term]);

  const loadData = async () => {
    setLoading(true);
    const [subList, cList, sList] = await Promise.all([
      getResultSubmissions(schoolId, academicYear, term),
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId)
    ]);
    setSubmissions(subList);
    setClasses(cList);
    setSubjects(sList);
    setLoading(false);
  };

  const handleApprove = async (subId: string) => {
    if (confirm('Approve these exam scores for terminal report generation?')) {
      await reviewResultSubmission(schoolId, subId, 'APPROVED', 'admin@school.edu.gh');
      await loadData();
    }
  };

  const handlePublish = async (subId: string) => {
    if (confirm('Publish results? Students and parents will now be able to view report cards.')) {
      await reviewResultSubmission(schoolId, subId, 'PUBLISHED', 'admin@school.edu.gh');
      await loadData();
    }
  };

  const handleOpenReturnModal = (sub: ResultSubmission) => {
    setSelectedSubForReturn(sub);
    setReturnReason('');
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForReturn || !returnReason.trim()) return;

    setIsProcessing(true);
    try {
      await reviewResultSubmission(
        schoolId,
        selectedSubForReturn.id,
        'RETURNED',
        'admin@school.edu.gh',
        returnReason.trim()
      );
      setIsReturnModalOpen(false);
      await loadData();
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = submissions.filter((s) => {
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchClass = classFilter === 'ALL' || s.classId === classFilter;
    const matchSearch =
      s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchClass && matchSearch;
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              ACADEMIC GOVERNANCE
            </span>
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider font-mono">
              {academicYear} • {term}
            </span>
          </div>
          <h2 className="text-xl font-light text-white serif italic flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            Result Submission & Verification Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit score submissions from teaching staff, review completion percentages, return with feedback notes, approve, and publish.
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teacher, class, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Submission Statuses</option>
            <option value="SUBMITTED">Submitted (Pending Review)</option>
            <option value="IN_PROGRESS">In Progress / Draft</option>
            <option value="RETURNED">Returned for Corrections</option>
            <option value="APPROVED">Approved</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>

        <div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.className}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Faculty Score Submissions ({filtered.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Real-time synchronization with teacher score entry worksheets
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading submission status entries...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No submissions recorded yet for {term} ({academicYear}). As teachers save and submit marks, they will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161925] text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Teacher</th>
                  <th className="px-6 py-3.5">Class & Subject</th>
                  <th className="px-6 py-3.5">Exam Type</th>
                  <th className="px-6 py-3.5 text-center">Roster Progress</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5">Submission Timestamp</th>
                  <th className="px-6 py-3.5 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filtered.map((sub) => {
                  const pct = sub.totalStudents > 0 ? Math.round((sub.completedStudents / sub.totalStudents) * 100) : 0;
                  return (
                    <tr key={sub.id} className="hover:bg-[#161925]/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                            {sub.teacherName.charAt(0)}
                          </div>
                          <span>{sub.teacherName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{sub.subjectName}</div>
                        <div className="text-[11px] text-blue-400 font-mono">{sub.className}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-300">
                        {sub.examType === 'MOCK' ? `Mock ${sub.mockNumber || 1}` : sub.examType}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="font-mono text-[11px] font-bold text-slate-200">
                            {sub.completedStudents} / {sub.totalStudents} ({pct}%)
                          </span>
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            sub.status === 'SUBMITTED'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : sub.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : sub.status === 'PUBLISHED'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : sub.status === 'RETURNED'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'Draft Mode'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sub.status === 'SUBMITTED' && (
                            <>
                              <button
                                onClick={() => handleApprove(sub.id)}
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleOpenReturnModal(sub)}
                                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Return
                              </button>
                            </>
                          )}
                          {sub.status === 'APPROVED' && (
                            <button
                              onClick={() => handlePublish(sub.id)}
                              className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Send className="w-3.5 h-3.5" /> Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Reason Feedback Modal */}
      {isReturnModalOpen && selectedSubForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f111a] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-[#161925] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-400" /> Return Results to Teacher
              </h3>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="p-6 space-y-4 text-xs">
              <p className="text-slate-300">
                Provide instructions and return reasons for{' '}
                <strong className="text-white">{selectedSubForReturn.teacherName}</strong> (
                {selectedSubForReturn.subjectName} - {selectedSubForReturn.className}):
              </p>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Correction Notes *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Please verify project work marks for absent students before resubmitting."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Back for Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
