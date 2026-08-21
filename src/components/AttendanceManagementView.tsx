import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Save, Loader2, Download, Printer } from 'lucide-react';
import { Student, ClassItem, AttendanceStatus } from '../types';
import { getClassesBySchool, getStudentsBySchool, getAttendanceByClassAndDate, saveAttendanceRecord, getAttendanceHistory } from '../lib/services';
import { PageHeader, Badge, Button, Input, Select, Card } from './ui';

interface Props {
  schoolId: string;
}

export const AttendanceManagementView: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<{ [studentId: string]: { status: AttendanceStatus; remark: string } }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'MARK' | 'REPORTS'>('MARK');

  useEffect(() => {
    loadClasses();
  }, [schoolId]);

  const loadClasses = async () => {
    setLoading(true);
    const clsList = await getClassesBySchool(schoolId);
    setClasses(clsList);
    if (clsList.length > 0) {
      setSelectedClassId(clsList[0].id);
    }
    const hist = await getAttendanceHistory(schoolId);
    setHistory(hist);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedClassId) {
      loadStudentsAndAttendance();
    }
  }, [selectedClassId, selectedDate]);

  const loadStudentsAndAttendance = async () => {
    setLoading(true);
    const stList = await getStudentsBySchool(schoolId, selectedClassId);
    setStudents(stList);

    const existing = await getAttendanceByClassAndDate(schoolId, selectedClassId, selectedDate);
    const stateMap: { [studentId: string]: { status: AttendanceStatus; remark: string } } = {};

    if (existing) {
      existing.students.forEach(s => {
        stateMap[s.studentId] = { status: s.status, remark: s.remark || '' };
      });
    } else {
      stList.forEach(st => {
        stateMap[st.id] = { status: 'PRESENT', remark: '' };
      });
    }

    setAttendanceState(stateMap);
    setLoading(false);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remark }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated = { ...attendanceState };
    students.forEach(st => {
      updated[st.id] = { ...updated[st.id], status };
    });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const cls = classes.find(c => c.id === selectedClassId);
      const studentRecords = students.map(st => ({
        studentId: st.id,
        studentName: st.fullName,
        admissionNo: st.admissionNo,
        status: attendanceState[st.id]?.status || 'PRESENT',
        remark: attendanceState[st.id]?.remark || ''
      }));

      await saveAttendanceRecord({
        schoolId,
        classId: selectedClassId,
        className: cls?.className || 'Class',
        date: selectedDate,
        academicYear: cls?.academicYear || '2026/2027',
        term: 'Term 1',
        recordedBy: 'School Administrator',
        students: studentRecords
      });

      setMsg({ type: 'success', text: `Attendance for ${cls?.className} on ${selectedDate} saved successfully!` });
      const hist = await getAttendanceHistory(schoolId);
      setHistory(hist);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
        <p className="text-xs uppercase font-bold tracking-wider">Loading Attendance System...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <PageHeader
        title="Attendance Tracker"
        subtitle="Daily student presence marking, monthly percentage calculation & terminal reports"
        icon={<UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'MARK' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('MARK')}
            >
              Mark Daily Roll Call
            </Button>
            <Button
              variant={activeTab === 'REPORTS' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('REPORTS')}
            >
              Attendance Logs & Summary
            </Button>
          </div>
        }
      />

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
          msg.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
          {msg.text}
        </div>
      )}

      {activeTab === 'MARK' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center shadow-xs">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Select Class</label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl p-2.5 focus:border-indigo-500 outline-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.className}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Attendance Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl p-2.5 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-end gap-2 pt-4 sm:pt-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={() => handleMarkAll('PRESENT')}
              >
                All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => handleMarkAll('ABSENT')}
              >
                All Absent
              </Button>
            </div>
          </div>

          {/* Student Roll Call List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Class Roll Call List ({students.length} Enrolled)
              </h3>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAttendance}
                disabled={saving || students.length === 0}
                isLoading={saving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Attendance Record
              </Button>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                No students enrolled in this class.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3.5">#</th>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Admission No.</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5">Remark / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {students.map((st, idx) => {
                      const stState = attendanceState[st.id] || { status: 'PRESENT', remark: '' };
                      return (
                        <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3.5 text-slate-400 dark:text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-900 dark:text-white">{st.fullName}</td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono">{st.admissionNo}</td>
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(stt => (
                                <button
                                  key={stt}
                                  type="button"
                                  onClick={() => handleStatusChange(st.id, stt)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider cursor-pointer border transition-all ${
                                    stState.status === stt
                                      ? stt === 'PRESENT'
                                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                        : stt === 'ABSENT'
                                        ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                                        : stt === 'LATE'
                                        ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                                        : 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {stt}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <input
                              type="text"
                              placeholder="Optional note..."
                              value={stState.remark}
                              onChange={e => handleRemarkChange(st.id, e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
                            />
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

      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Saved Attendance Logs ({history.length} Saved Sheets)
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No historical attendance records saved yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map(item => {
                  const presentCount = item.students?.filter((s: any) => s.status === 'PRESENT').length || 0;
                  const total = item.students?.length || 0;
                  const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

                  return (
                    <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm block">{item.className}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Date: {item.date} • Recorded by: {item.recordedBy}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">{presentCount} / {total} Present ({pct}%)</span>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Term Roll Call</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
