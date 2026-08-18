import React, { useState, useEffect } from 'react';
import {
  Globe,
  BookOpen,
  Mail,
  Calendar as CalendarIcon,
  CheckSquare,
  StickyNote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Send,
  Plus,
  RefreshCw,
  ExternalLink,
  Users
} from 'lucide-react';
import {
  SchoolWorkspaceConfig,
  getSchoolWorkspaceConfig,
  saveSchoolWorkspaceConfig,
  signInWithGoogleWorkspace,
  getWorkspaceAccessToken,
  fetchClassroomCourses,
  createClassroomCourse,
  sendGmailNotification,
  fetchCalendarEvents,
  createCalendarEvent,
  fetchGoogleTasks,
  createGoogleTask
} from '../lib/workspaceService';
import { logAuditAction } from '../lib/services';

interface Props {
  schoolId: string;
}

export const WorkspaceIntegrationPanel: React.FC<Props> = ({ schoolId }) => {
  const [config, setConfig] = useState<SchoolWorkspaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auth state
  const [accessToken, setAccessToken] = useState<string | null>(getWorkspaceAccessToken());
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'CLASSROOM' | 'GMAIL' | 'CALENDAR' | 'TASKS'>('SETTINGS');

  // Interactive Action States
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Classroom state
  const [courses, setCourses] = useState<any[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSection, setNewCourseSection] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Gmail state
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Calendar state
  const [events, setEvents] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Tasks state
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [schoolId]);

  const loadConfig = async () => {
    setLoading(true);
    const cfg = await getSchoolWorkspaceConfig(schoolId);
    setConfig(cfg);
    setLoading(false);
  };

  const handleGoogleConnect = async () => {
    setAuthError(null);
    try {
      const res = await signInWithGoogleWorkspace();
      setAccessToken(res.accessToken);
      setAuthUserEmail(res.user.email);
      setStatusMsg({ type: 'success', text: `Successfully connected Google account: ${res.user.email}` });
    } catch (err: any) {
      console.error('Google Connect error:', err);
      setAuthError(err.message || 'Failed to connect Google account');
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await saveSchoolWorkspaceConfig(config);
      await logAuditAction({
        schoolId,
        userEmail: authUserEmail || 'admin@school.edu',
        role: 'ADMIN',
        action: 'WORKSPACE_SETTINGS_UPDATE',
        targetRecord: `Google Workspace Config for School ${schoolId}`,
        details: `Updated enabled services: Classroom (${config.enableClassroom}), Gmail (${config.enableGmail}), Calendar (${config.enableCalendar}), Keep (${config.enableKeep}), Tasks (${config.enableTasks})`
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Error saving Google Workspace settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Google Classroom Handlers
  const handleLoadClassroomCourses = async () => {
    if (!accessToken) return;
    setLoadingCourses(true);
    try {
      const data = await fetchClassroomCourses(accessToken);
      setCourses(data.courses || []);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newCourseName) return;

    if (!window.confirm(`Are you sure you want to create Google Classroom course "${newCourseName}"?`)) {
      return;
    }

    try {
      await createClassroomCourse(accessToken, newCourseName, newCourseSection, 'Created from School Management Portal');
      setStatusMsg({ type: 'success', text: `Created course "${newCourseName}" on Google Classroom!` });
      setNewCourseName('');
      setNewCourseSection('');
      handleLoadClassroomCourses();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  // Gmail Handlers
  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !emailTo || !emailSubject || !emailBody) return;

    if (!window.confirm(`Send email to ${emailTo} via Google Mail?`)) {
      return;
    }

    setSendingEmail(true);
    try {
      await sendGmailNotification(accessToken, emailTo, emailSubject, emailBody);
      setStatusMsg({ type: 'success', text: `Email successfully sent to ${emailTo}` });
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSendingEmail(false);
    }
  };

  // Calendar Handlers
  const handleLoadCalendarEvents = async () => {
    if (!accessToken) return;
    setLoadingEvents(true);
    try {
      const data = await fetchCalendarEvents(accessToken);
      setEvents(data.items || []);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !eventTitle || !eventStart || !eventEnd) return;

    if (!window.confirm(`Add school event "${eventTitle}" to Google Calendar?`)) {
      return;
    }

    try {
      await createCalendarEvent(
        accessToken,
        eventTitle,
        'Synced from School Management Calendar',
        new Date(eventStart).toISOString(),
        new Date(eventEnd).toISOString()
      );
      setStatusMsg({ type: 'success', text: `Event "${eventTitle}" added to Google Calendar!` });
      setEventTitle('');
      handleLoadCalendarEvents();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  // Tasks Handlers
  const handleLoadTasks = async () => {
    if (!accessToken) return;
    setLoadingTasks(true);
    try {
      const data = await fetchGoogleTasks(accessToken);
      setTasksList(data.items || []);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !taskTitle) return;

    if (!window.confirm(`Add Google Task "${taskTitle}"?`)) {
      return;
    }

    try {
      await createGoogleTask(accessToken, taskTitle, taskNotes);
      setStatusMsg({ type: 'success', text: `Task "${taskTitle}" added to Google Tasks!` });
      setTaskTitle('');
      setTaskNotes('');
      handleLoadTasks();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  if (loading || !config) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-xs font-medium">Loading Google Workspace Configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Google Workspace API Integration
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Enable and manage Classroom, Gmail, Calendar, Keep, and Tasks services for authenticated teachers and students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {accessToken ? (
            <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Connected {authUserEmail ? `(${authUserEmail})` : ''}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleConnect}
              className="gsi-material-button text-xs px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>Connect Google Account</span>
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-[10px] text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wider"
          >
            Dismiss
          </button>
        </div>
      )}

      {authError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{authError}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SETTINGS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" /> Service Toggles & Access
        </button>

        {config.enableClassroom && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('CLASSROOM');
              if (accessToken && courses.length === 0) handleLoadClassroomCourses();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'CLASSROOM'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Google Classroom
          </button>
        )}

        {config.enableGmail && (
          <button
            type="button"
            onClick={() => setActiveTab('GMAIL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'GMAIL'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" /> Gmail Dispatcher
          </button>
        )}

        {config.enableCalendar && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('CALENDAR');
              if (accessToken && events.length === 0) handleLoadCalendarEvents();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'CALENDAR'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> Google Calendar
          </button>
        )}

        {config.enableTasks && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('TASKS');
              if (accessToken && tasksList.length === 0) handleLoadTasks();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'TASKS'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Google Tasks
          </button>
        )}
      </div>

      {/* Tab 1: Service Enable/Disable Settings */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h4 className="text-sm font-semibold text-slate-900">Enable Workspace Services for School</h4>
            <p className="text-xs text-slate-600">
              Select which Google Workspace features are active and available to school users.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Toggle: Classroom */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Google Classroom</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Sync course rosters, assignments, and class announcements.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enableClassroom}
                onChange={(e) => setConfig({ ...config, enableClassroom: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* Toggle: Gmail */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-rose-600 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Gmail Notifications</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Dispatch official fee reminders, result alerts, and school circulars.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enableGmail}
                onChange={(e) => setConfig({ ...config, enableGmail: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* Toggle: Calendar */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Google Calendar</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Push exam timetables, PTA meetings, and term dates to Google Calendar.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enableCalendar}
                onChange={(e) => setConfig({ ...config, enableCalendar: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* Toggle: Tasks */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckSquare className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Google Tasks</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Sync teacher grade entry duties and student homework tasks.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enableTasks}
                onChange={(e) => setConfig({ ...config, enableTasks: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* Toggle: Keep */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <StickyNote className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Google Keep</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Allow teachers and students to save quick class scratchpad notes.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enableKeep}
                onChange={(e) => setConfig({ ...config, enableKeep: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Role Access Permissions */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-700" /> Authorized Roles
            </label>
            <p className="text-[11px] text-slate-600">Select which user roles can access Google Workspace API tools:</p>
            <div className="flex flex-wrap gap-3 pt-1">
              {['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].map((role) => {
                const isChecked = config.allowedRoles.includes(role);
                return (
                  <label
                    key={role}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer flex items-center gap-2 ${
                      isChecked ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...config.allowedRoles, role]
                          : config.allowedRoles.filter((r) => r !== role);
                        setConfig({ ...config, allowedRoles: updated });
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>{role}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Save Workspace Settings</span>
            </button>
            {saveSuccess && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Workspace Settings Updated!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Google Classroom Interactive */}
      {activeTab === 'CLASSROOM' && (
        <div className="space-y-6">
          {!accessToken ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs text-center space-y-3">
              <p className="font-semibold">Connect your Google account to manage Google Classroom courses.</p>
              <button
                type="button"
                onClick={handleGoogleConnect}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-sm hover:bg-blue-500 inline-flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" /> Sign in with Google
              </button>
            </div>
          ) : (
            <>
              {/* Create Course Form */}
              <form onSubmit={handleCreateCourse} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" /> Create Google Classroom Course
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Course Name (e.g., Grade 10 Mathematics)"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Section (e.g., Section A - 2026/2027)"
                    value={newCourseSection}
                    onChange={(e) => setNewCourseSection(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Course
                </button>
              </form>

              {/* Course List */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Classroom Courses</h4>
                  <button
                    type="button"
                    onClick={handleLoadClassroomCourses}
                    disabled={loadingCourses}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCourses ? 'animate-spin' : ''}`} /> Sync Courses
                  </button>
                </div>

                {courses.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No Classroom courses loaded yet. Click Sync Courses above.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {courses.map((c) => (
                      <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-start justify-between">
                          <h5 className="text-xs font-bold text-slate-900">{c.name}</h5>
                          {c.alternateLink && (
                            <a
                              href={c.alternateLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-0.5"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600">{c.section || 'General Section'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Code: {c.enrollmentCode || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Gmail Dispatcher */}
      {activeTab === 'GMAIL' && (
        <div className="space-y-6">
          {!accessToken ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs text-center space-y-3">
              <p className="font-semibold">Connect your Google account to send emails via Gmail API.</p>
              <button
                type="button"
                onClick={handleGoogleConnect}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-sm hover:bg-blue-500 inline-flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" /> Sign in with Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendGmail} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-600" /> Send Email via Gmail API
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Recipient Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="parent@example.com or teacher@school.edu"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="Official School Circular / Academic Report Notice"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Message Body *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write school email notification content..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={sendingEmail}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Email via Gmail</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 4: Google Calendar */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-6">
          {!accessToken ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs text-center space-y-3">
              <p className="font-semibold">Connect your Google account to sync Google Calendar events.</p>
              <button
                type="button"
                onClick={handleGoogleConnect}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-sm hover:bg-blue-500 inline-flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" /> Sign in with Google
              </button>
            </div>
          ) : (
            <>
              {/* Create Calendar Event */}
              <form onSubmit={handleCreateCalendarEvent} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-600" /> Push School Event to Google Calendar
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Event Title (e.g. Mid-Term Examination)"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                  <input
                    type="datetime-local"
                    required
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                  <input
                    type="datetime-local"
                    required
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Event
                </button>
              </form>

              {/* Event List */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Upcoming Calendar Events</h4>
                  <button
                    type="button"
                    onClick={handleLoadCalendarEvents}
                    disabled={loadingEvents}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingEvents ? 'animate-spin' : ''}`} /> Sync Events
                  </button>
                </div>

                {events.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No upcoming events loaded. Click Sync Events above.</p>
                ) : (
                  <div className="space-y-2">
                    {events.map((ev) => (
                      <div key={ev.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{ev.summary}</p>
                          <p className="text-[11px] text-slate-600">
                            {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString() : ev.start?.date}
                          </p>
                        </div>
                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-0.5"
                          >
                            Google Calendar <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 5: Google Tasks */}
      {activeTab === 'TASKS' && (
        <div className="space-y-6">
          {!accessToken ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs text-center space-y-3">
              <p className="font-semibold">Connect your Google account to manage Google Tasks.</p>
              <button
                type="button"
                onClick={handleGoogleConnect}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-sm hover:bg-blue-500 inline-flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" /> Sign in with Google
              </button>
            </div>
          ) : (
            <>
              {/* Add Google Task */}
              <form onSubmit={handleCreateTask} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-amber-600" /> Create Google Task
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Task Title (e.g. Grade Terminal Reports)"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Task Details / Notes"
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Task
                </button>
              </form>

              {/* Tasks List */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Google Tasks</h4>
                  <button
                    type="button"
                    onClick={handleLoadTasks}
                    disabled={loadingTasks}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingTasks ? 'animate-spin' : ''}`} /> Sync Tasks
                  </button>
                </div>

                {tasksList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No tasks loaded. Click Sync Tasks above.</p>
                ) : (
                  <div className="space-y-2">
                    {tasksList.map((t) => (
                      <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-0.5">
                        <p className="font-bold text-slate-900">{t.title}</p>
                        {t.notes && <p className="text-[11px] text-slate-600">{t.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
