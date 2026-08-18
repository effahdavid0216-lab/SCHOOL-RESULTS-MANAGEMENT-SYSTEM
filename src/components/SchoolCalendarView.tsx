import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Tag } from 'lucide-react';
import { SchoolCalendarEvent } from '../types';
import { getCalendarEventsBySchool, saveCalendarEvent } from '../lib/services';

interface Props {
  schoolId: string;
}

export const SchoolCalendarView: React.FC<Props> = ({ schoolId }) => {
  const [events, setEvents] = useState<SchoolCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'EXAM' | 'HOLIDAY' | 'VACATION' | 'REOPENING' | 'PTA' | 'SPORTS' | 'EVENT'>('EXAM');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadEvents();
  }, [schoolId]);

  const loadEvents = async () => {
    setLoading(true);
    const evs = await getCalendarEventsBySchool(schoolId);
    setEvents(evs);
    setLoading(false);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCalendarEvent({
      schoolId,
      title,
      category,
      startDate,
      endDate,
      description
    });

    setShowModal(false);
    setTitle('');
    setDescription('');
    loadEvents();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading School Academic Calendar...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f111a] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-light text-white serif italic">Academic Calendar & Events Schedule</h2>
            <p className="text-xs text-slate-400">Reopening, closing, examination weeks, PTA meetings & sports events</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Add Event Date
        </button>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(ev => (
          <div key={ev.id} className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                ev.category === 'EXAM'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : ev.category === 'REOPENING'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {ev.category}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{ev.startDate}</span>
            </div>
            <h3 className="font-semibold text-white text-base">{ev.title}</h3>
            {ev.description && <p className="text-xs text-slate-400">{ev.description}</p>}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-200">
            <h3 className="text-base font-semibold text-white serif italic">Schedule Academic Event</h3>

            <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Event Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="EXAM">Examination Week</option>
                  <option value="REOPENING">School Reopening Date</option>
                  <option value="VACATION">Vacation / Term Closing</option>
                  <option value="PTA">PTA General Meeting</option>
                  <option value="SPORTS">Inter-Houses Sports Competition</option>
                  <option value="HOLIDAY">Public Holiday</option>
                  <option value="EVENT">General School Event</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. End of Term 1 BECE Mock Examinations"
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#161925] text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Save Calendar Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
