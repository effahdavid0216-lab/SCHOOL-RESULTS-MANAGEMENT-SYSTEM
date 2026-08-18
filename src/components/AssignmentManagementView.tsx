import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, FileText, CheckCircle2, Clock, Send, Award, Upload } from 'lucide-react';
import { ClassItem, SubjectItem, AssignmentItem, AssignmentSubmission } from '../types';
import { getClassesBySchool, getSubjectsBySchool, getAssignmentsBySchool, saveAssignment, getAssignmentSubmissions, submitAssignment, gradeAssignmentSubmission } from '../lib/services';

interface Props {
  schoolId: string;
  isTeacher?: boolean;
  isStudent?: boolean;
  studentId?: string;
  studentName?: string;
}

export const AssignmentManagementView: React.FC<Props> = ({
  schoolId,
  isTeacher = true,
  isStudent = false,
  studentId,
  studentName
}) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Add Assignment
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxScore, setMaxScore] = useState(20);

  // Submission view
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);

  // Student submission
  const [subText, setSubText] = useState('');

  // Teacher grading
  const [gradeScore, setGradeScore] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');

  useEffect(() => {
    loadInitialData();
  }, [schoolId]);

  const loadInitialData = async () => {
    setLoading(true);
    const [cList, subList, assList] = await Promise.all([
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId),
      getAssignmentsBySchool(schoolId)
    ]);

    setClasses(cList);
    setSubjects(subList);
    setAssignments(assList);
    if (cList.length > 0) setClassId(cList[0].id);
    if (subList.length > 0) setSubjectId(subList[0].id);
    setLoading(false);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cls = classes.find(c => c.id === classId);
    const sub = subjects.find(s => s.id === subjectId);

    await saveAssignment({
      schoolId,
      classId,
      className: cls?.className || 'Class',
      subjectId,
      subjectName: sub?.subjectName || 'Subject',
      teacherId: 'TCH-001',
      teacherName: 'Subject Teacher',
      title,
      description,
      deadline,
      maxScore
    });

    setShowAddModal(false);
    setTitle('');
    setDescription('');
    loadInitialData();
  };

  const handleOpenAssignment = async (ass: AssignmentItem) => {
    setSelectedAssignment(ass);
    const subs = await getAssignmentSubmissions(ass.id);
    setSubmissions(subs);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !studentId) return;

    await submitAssignment({
      assignmentId: selectedAssignment.id,
      schoolId,
      studentId,
      studentName: studentName || 'Student',
      submissionText: subText
    });

    setSubText('');
    const subs = await getAssignmentSubmissions(selectedAssignment.id);
    setSubmissions(subs);
  };

  const handleGradeSubmission = async (subId: string) => {
    await gradeAssignmentSubmission(subId, gradeScore, gradeFeedback, 'Subject Teacher');
    setSelectedSubmissionId('');
    if (selectedAssignment) {
      const subs = await getAssignmentSubmissions(selectedAssignment.id);
      setSubmissions(subs);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading Homework & Assignment Center...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f111a] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-light text-white serif italic">Homework & Assignment Hub</h2>
            <p className="text-xs text-slate-400">Teacher task distribution, digital student submissions & grade feedback</p>
          </div>
        </div>

        {!isStudent && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Create New Assignment
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List */}
        <div className="lg:col-span-1 bg-[#0f111a] p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Assignments List ({assignments.length})</h3>
          {assignments.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No assignments published yet.</p>
          ) : (
            assignments.map(ass => (
              <div
                key={ass.id}
                onClick={() => handleOpenAssignment(ass)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedAssignment?.id === ass.id
                    ? 'bg-blue-600/10 border-blue-500 text-white shadow-md'
                    : 'bg-[#161925] border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-blue-400">{ass.className} • {ass.subjectName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Max: {ass.maxScore} pts</span>
                </div>
                <h4 className="font-semibold text-sm text-white mb-1">{ass.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{ass.description}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" /> Due: {ass.deadline}</span>
                  <span>By: {ass.teacherName}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Details / Submissions */}
        <div className="lg:col-span-2 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 space-y-6">
          {!selectedAssignment ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select an assignment from the left list to view details or submit responses.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-[#161925] rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase">
                    {selectedAssignment.className} • {selectedAssignment.subjectName}
                  </span>
                  <span className="text-xs font-semibold text-amber-400">Deadline: {selectedAssignment.deadline}</span>
                </div>
                <h3 className="text-xl font-semibold text-white">{selectedAssignment.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{selectedAssignment.description}</p>
              </div>

              {/* Student View: Submission Form */}
              {isStudent && (
                <div className="p-4 bg-[#161925] rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-400" /> Submit Your Response
                  </h4>
                  <form onSubmit={handleStudentSubmit} className="space-y-3">
                    <textarea
                      rows={4}
                      value={subText}
                      onChange={e => setSubText(e.target.value)}
                      placeholder="Type your answer or paste your homework link here..."
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-blue-500"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Turn In Assignment
                    </button>
                  </form>
                </div>
              )}

              {/* Teacher View: Submissions List */}
              {!isStudent && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Student Submissions ({submissions.length})
                  </h4>

                  {submissions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No students have turned in this assignment yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map(sub => (
                        <div key={sub.id} className="p-4 bg-[#161925] border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-xs">{sub.studentName}</span>
                            <span className="text-[10px] text-slate-500">Turned in: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-300 bg-[#0a0b10] p-3 rounded-lg border border-slate-800">{sub.submissionText}</p>

                          {sub.score !== undefined ? (
                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs flex items-center justify-between">
                              <span>Grade: <strong className="font-bold">{sub.score} / {selectedAssignment.maxScore}</strong></span>
                              <span className="text-[10px] text-emerald-400">Graded by: {sub.gradedBy}</span>
                            </div>
                          ) : (
                            <div>
                              {selectedSubmissionId === sub.id ? (
                                <div className="p-3 bg-[#0a0b10] border border-slate-700 rounded-lg space-y-2 text-xs">
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="number"
                                      placeholder={`Score (Max ${selectedAssignment.maxScore})`}
                                      value={gradeScore}
                                      onChange={e => setGradeScore(Number(e.target.value))}
                                      className="bg-[#161925] border border-slate-700 rounded p-1.5 text-white"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Feedback remark..."
                                      value={gradeFeedback}
                                      onChange={e => setGradeFeedback(e.target.value)}
                                      className="bg-[#161925] border border-slate-700 rounded p-1.5 text-white"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setSelectedSubmissionId('')}
                                      className="px-2 py-1 text-slate-400 hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleGradeSubmission(sub.id)}
                                      className="px-3 py-1 bg-emerald-600 text-white rounded font-semibold"
                                    >
                                      Save Grade
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedSubmissionId(sub.id);
                                    setGradeScore(selectedAssignment.maxScore);
                                  }}
                                  className="px-3 py-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 rounded text-xs font-semibold cursor-pointer"
                                >
                                  Grade Submission
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 text-slate-200">
            <h3 className="text-base font-semibold text-white serif italic">Create Homework / Assignment</h3>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Algebraic Expressions Problem Set"
                  className="w-full bg-[#161925] border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Class</label>
                  <select
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                    className="w-full bg-[#161925] border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    className="w-full bg-[#161925] border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-[#161925] border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Max Marks / Score</label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={e => setMaxScore(Number(e.target.value))}
                    className="w-full bg-[#161925] border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description & Instructions</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide step by step instructions..."
                  className="w-full bg-[#161925] border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#161925] hover:bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
