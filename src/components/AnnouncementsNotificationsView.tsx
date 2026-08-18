import React, { useState, useEffect } from 'react';
import { Bell, Megaphone, Plus, Calendar, UserCheck, Send, CheckCircle2 } from 'lucide-react';
import { Announcement, NotificationItem } from '../types';
import { getAnnouncementsBySchool, saveAnnouncement, getNotificationsByUser, markNotificationAsRead } from '../lib/services';

interface Props {
  schoolId: string;
}

export const AnnouncementsNotificationsView: React.FC<Props> = ({ schoolId }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'CLASS'>('ALL');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [annList, notifList] = await Promise.all([
      getAnnouncementsBySchool(schoolId),
      getNotificationsByUser(schoolId, 'admin_user')
    ]);

    setAnnouncements(annList);
    setNotifications(notifList);
    setLoading(false);
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAnnouncement({
      schoolId,
      title,
      message,
      targetAudience,
      authorName: 'School Administrator',
      expiryDate: expiryDate || undefined
    });

    setShowModal(false);
    setTitle('');
    setMessage('');
    loadData();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading School Noticeboard & Communications...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f111a] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-light text-white serif italic">School Noticeboard & Broadcast Center</h2>
            <p className="text-xs text-slate-400">Publish notices to Teachers, Students, Parents or the Entire School Community</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Broadcast Notice
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Published Announcements */}
        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-blue-400" />
            Active School Announcements ({announcements.length})
          </h3>

          {announcements.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No active school announcements.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="p-4 bg-[#161925] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold rounded-full text-[10px] uppercase">
                      Target: {ann.targetAudience}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-semibold text-white text-sm">{ann.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{ann.message}</p>
                  <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                    Author: {ann.authorName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Hub */}
        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            System Alerts & Notifications Center
          </h3>

          <div className="space-y-2.5">
            <div className="p-3 bg-[#161925] border border-slate-800 rounded-xl text-xs flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Academic Term Calendar Updated</span>
                <span className="text-[10px] text-slate-400">Reopening and examination dates have been updated for 2026/2027 Term 1.</span>
              </div>
            </div>

            <div className="p-3 bg-[#161925] border border-slate-800 rounded-xl text-xs flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Terminal Results Approval Pending</span>
                <span className="text-[10px] text-slate-400">JHS 1 Mathematics scores submitted by teacher for review.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 text-slate-200">
            <h3 className="text-base font-semibold text-white serif italic">Broadcast Announcement</h3>

            <form onSubmit={handlePublishAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value as any)}
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="ALL">Entire School (Teachers, Parents & Students)</option>
                  <option value="TEACHERS">Teachers Only</option>
                  <option value="PARENTS">Parents & Guardians Only</option>
                  <option value="STUDENTS">Students Only</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. End of Term Examination & PTA General Meeting Date"
                  className="w-full bg-[#161925] border border-slate-700 text-white rounded-xl p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Notice Content</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type full broadcast message..."
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
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
