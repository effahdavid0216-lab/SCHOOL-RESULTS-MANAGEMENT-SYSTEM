import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Users, Plus, Trash2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ClassItem, SubjectItem, Teacher, TimetableSlot } from '../types';
import { getClassesBySchool, getSubjectsBySchool, getTeachersBySchool, getTimetableBySchool, saveTimetableSlot, deleteTimetableSlot } from '../lib/services';

interface Props {
  schoolId: string;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
const PERIODS = [
  { name: 'Period 1', start: '08:00', end: '08:45' },
  { name: 'Period 2', start: '08:45', end: '09:30' },
  { name: 'Period 3', start: '09:30', end: '10:15' },
  { name: 'Break', start: '10:15', end: '10:45' },
  { name: 'Period 4', start: '10:45', end: '11:30' },
  { name: 'Period 5', start: '11:30', end: '12:15' },
  { name: 'Period 6', start: '12:15', end: '13:00' },
  { name: 'Lunch', start: '13:00', end: '13:45' },
  { name: 'Period 7', start: '13:45', end: '14:30' }
];

export const TimetableManagementView: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'CLASS' | 'TEACHER' | 'SCHOOL'>('CLASS');

  // Modal / Add state
  const [showModal, setShowModal] = useState(false);
  const [formClassId, setFormClassId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formDay, setFormDay] = useState<typeof DAYS[number]>('MONDAY');
  const [formPeriod, setFormPeriod] = useState(PERIODS[0].name);
  const [formRoom, setFormRoom] = useState('Room 1');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [cList, subList, tList, ttList] = await Promise.all([
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId),
      getTeachersBySchool(schoolId),
      getTimetableBySchool(schoolId)
    ]);

    setClasses(cList);
    setSubjects(subList);
    setTeachers(tList);
    setTimetable(ttList);

    if (cList.length > 0) setSelectedClassId(cList[0].id);
    if (tList.length > 0) setSelectedTeacherId(tList[0].id);
    setLoading(false);
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetPeriod = PERIODS.find(p => p.name === formPeriod);
    if (!targetPeriod || targetPeriod.name === 'Break' || targetPeriod.name === 'Lunch') {
      setErrorMsg('Cannot schedule classes during Break or Lunch intervals.');
      return;
    }

    // Double Booking Checks
    // 1. Teacher double booking
    const teacherConflict = timetable.find(
      s => s.teacherId === formTeacherId && s.dayOfWeek === formDay && s.periodName === formPeriod
    );
    if (teacherConflict) {
      setErrorMsg(`Teacher conflict! Selected teacher is already assigned to ${teacherConflict.className} during ${formPeriod} on ${formDay}.`);
      return;
    }

    // 2. Class double booking
    const classConflict = timetable.find(
      s => s.classId === formClassId && s.dayOfWeek === formDay && s.periodName === formPeriod
    );
    if (classConflict) {
      setErrorMsg(`Class conflict! ${classConflict.className} already has ${classConflict.subjectName} scheduled for ${formPeriod} on ${formDay}.`);
      return;
    }

    // 3. Room double booking
    if (formRoom) {
      const roomConflict = timetable.find(
        s => s.room === formRoom && s.dayOfWeek === formDay && s.periodName === formPeriod
      );
      if (roomConflict) {
        setErrorMsg(`Room conflict! ${formRoom} is already occupied by ${roomConflict.className} during ${formPeriod} on ${formDay}.`);
        return;
      }
    }

    const cls = classes.find(c => c.id === formClassId);
    const sub = subjects.find(s => s.id === formSubjectId);
    const tch = teachers.find(t => t.id === formTeacherId);

    try {
      await saveTimetableSlot({
        schoolId,
        classId: formClassId,
        className: cls?.className || 'Class',
        subjectId: formSubjectId,
        subjectName: sub?.subjectName || 'Subject',
        teacherId: formTeacherId,
        teacherName: tch?.fullName || 'Teacher',
        dayOfWeek: formDay,
        startTime: targetPeriod.start,
        endTime: targetPeriod.end,
        periodName: targetPeriod.name,
        room: formRoom
      });

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save timetable slot.');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (confirm('Delete this timetable slot?')) {
      await deleteTimetableSlot(slotId);
      loadData();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading Timetable Engine...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f111a] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-light text-white serif italic">Academic Timetable Scheduler</h2>
            <p className="text-xs text-slate-400">Class & Teacher Period Schedules with Real-Time Double Booking Prevention</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFormClassId(classes[0]?.id || '');
              setFormSubjectId(subjects[0]?.id || '');
              setFormTeacherId(teachers[0]?.id || '');
              setShowModal(true);
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Add Lesson Period
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('CLASS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              viewMode === 'CLASS' ? 'bg-blue-600 text-white' : 'bg-[#161925] text-slate-400 hover:bg-slate-800'
            }`}
          >
            Class Schedule
          </button>
          <button
            onClick={() => setViewMode('TEACHER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              viewMode === 'TEACHER' ? 'bg-blue-600 text-white' : 'bg-[#161925] text-slate-400 hover:bg-slate-800'
            }`}
          >
            Teacher Workload Timetable
          </button>
          <button
            onClick={() => setViewMode('SCHOOL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              viewMode === 'SCHOOL' ? 'bg-blue-600 text-white' : 'bg-[#161925] text-slate-400 hover:bg-slate-800'
            }`}
          >
            School Master Overview
          </button>
        </div>

        {viewMode === 'CLASS' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Class:</span>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="bg-[#161925] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-blue-500"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
            </select>
          </div>
        )}

        {viewMode === 'TEACHER' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Teacher:</span>
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="bg-[#161925] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-blue-500"
            >
              {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.staffId})</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#121420] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="p-3 border-r border-slate-800 min-w-[100px]">Time / Period</th>
                {DAYS.map(day => (
                  <th key={day} className="p-3 text-center border-r border-slate-800 min-w-[140px] text-blue-400 font-bold">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {PERIODS.map(period => {
                const isBreakOrLunch = period.name === 'Break' || period.name === 'Lunch';

                return (
                  <tr key={period.name} className={isBreakOrLunch ? 'bg-[#141724]' : ''}>
                    <td className="p-3 font-semibold text-slate-400 border-r border-slate-800 bg-[#121420]">
                      <span className="block font-bold text-white text-[11px]">{period.name}</span>
                      <span className="text-[10px] text-slate-500">{period.start} - {period.end}</span>
                    </td>

                    {DAYS.map(day => {
                      if (isBreakOrLunch) {
                        return (
                          <td key={day} className="p-3 text-center border-r border-slate-800 text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                            {period.name} INTERVAL
                          </td>
                        );
                      }

                      // Find slots
                      const matchingSlots = timetable.filter(s => {
                        const dayMatch = s.dayOfWeek === day;
                        const periodMatch = s.periodName === period.name;
                        if (viewMode === 'CLASS') return dayMatch && periodMatch && s.classId === selectedClassId;
                        if (viewMode === 'TEACHER') return dayMatch && periodMatch && s.teacherId === selectedTeacherId;
                        return dayMatch && periodMatch;
                      });

                      return (
                        <td key={day} className="p-2 border-r border-slate-800/60 align-top min-h-[70px]">
                          {matchingSlots.length === 0 ? (
                            <span className="text-[10px] text-slate-700 block text-center py-2 italic">—</span>
                          ) : (
                            <div className="space-y-1.5">
                              {matchingSlots.map(slot => (
                                <div key={slot.id} className="p-2 bg-[#161925] border border-slate-700/80 rounded-xl relative group shadow-sm">
                                  <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-300 p-0.5"
                                    title="Delete Slot"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  <span className="font-bold text-white block text-[11px]">{slot.subjectName}</span>
                                  {viewMode !== 'CLASS' && <span className="text-[10px] text-blue-400 block font-semibold">{slot.className}</span>}
                                  {viewMode !== 'TEACHER' && <span className="text-[10px] text-slate-400 block">{slot.teacherName}</span>}
                                  {slot.room && <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 inline-block mt-1">{slot.room}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-200">
            <h3 className="text-base font-semibold text-white serif italic">Schedule Lesson Period</h3>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Class</label>
                <select
                  value={formClassId}
                  onChange={e => setFormClassId(e.target.value)}
                  className="w-full bg-[#161925] border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Subject</label>
                <select
                  value={formSubjectId}
                  onChange={e => setFormSubjectId(e.target.value)}
                  className="w-full bg-[#161925] border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Teacher</label>
                <select
                  value={formTeacherId}
                  onChange={e => setFormTeacherId(e.target.value)}
                  className="w-full bg-[#161925] border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.staffId})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Day</label>
                  <select
                    value={formDay}
                    onChange={e => setFormDay(e.target.value as any)}
                    className="w-full bg-[#161925] border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Period</label>
                  <select
                    value={formPeriod}
                    onChange={e => setFormPeriod(e.target.value)}
                    className="w-full bg-[#161925] border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  >
                    {PERIODS.filter(p => p.name !== 'Break' && p.name !== 'Lunch').map(p => (
                      <option key={p.name} value={p.name}>{p.name} ({p.start})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Classroom / Facility</label>
                <input
                  type="text"
                  value={formRoom}
                  onChange={e => setFormRoom(e.target.value)}
                  placeholder="e.g. Science Lab, Room 3B"
                  className="w-full bg-[#161925] border border-slate-700 text-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#161925] hover:bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Save Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
