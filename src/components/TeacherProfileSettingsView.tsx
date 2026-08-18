import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  FileSignature,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Lock,
  Phone,
  Mail,
  Calendar,
  Award,
  BookOpen,
  Upload,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { Teacher, ClassItem, SubjectItem } from '../types';
import {
  getTeachersBySchool,
  saveTeacher,
  getClassesBySchool,
  getSubjectsBySchool
} from '../lib/services';
import { compressPassportPhoto, compressSignatureFile } from '../lib/imageOptimizer';

interface Props {
  schoolId: string;
  teacherEmail: string;
}

export const TeacherProfileSettingsView: React.FC<Props> = ({ schoolId, teacherEmail }) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [qualification, setQualification] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [subjectsTaughtIds, setSubjectsTaughtIds] = useState<string[]>([]);

  // Refs & upload states
  const photoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  useEffect(() => {
    loadData();
  }, [schoolId, teacherEmail]);

  const loadData = async () => {
    setLoading(true);
    const [tList, cList, sList] = await Promise.all([
      getTeachersBySchool(schoolId),
      getClassesBySchool(schoolId),
      getSubjectsBySchool(schoolId)
    ]);

    const currentTeacher = tList.find(t => t.email.toLowerCase() === teacherEmail.toLowerCase()) || tList[0];
    if (currentTeacher) {
      setTeacher(currentTeacher);
      setFullName(currentTeacher.fullName || '');
      setStaffId(currentTeacher.staffId || '');
      setGender(currentTeacher.gender || 'MALE');
      setDateOfBirth(currentTeacher.dateOfBirth || '1990-05-15');
      setPhone(currentTeacher.phone || '');
      setEmail(currentTeacher.email || teacherEmail);
      setPassword(currentTeacher.password || 'Teacher123!');
      setQualification(currentTeacher.qualification || 'B.Ed.');
      setPhotoUrl(currentTeacher.photoUrl || '');
      setSignatureUrl(currentTeacher.signatureUrl || '');
      setAssignedClassIds(currentTeacher.assignedClassIds || (currentTeacher.classAssignedId ? [currentTeacher.classAssignedId] : []));
      setSubjectsTaughtIds(currentTeacher.subjectsTaughtIds || []);
    }
    setClasses(cList);
    setSubjects(sList);
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const compressed = await compressPassportPhoto(file);
      setPhotoUrl(compressed);
      setMsg({ type: 'success', text: 'Passport photo compressed & ready. Click Save Profile to apply.' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSignature(true);
    try {
      const compressed = await compressSignatureFile(file);
      setSignatureUrl(compressed);
      setMsg({ type: 'success', text: 'Digital signature compressed & ready. Click Save Profile to apply.' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const toggleAssignedClass = (cid: string) => {
    if (assignedClassIds.includes(cid)) {
      setAssignedClassIds(assignedClassIds.filter(id => id !== cid));
    } else {
      setAssignedClassIds([...assignedClassIds, cid]);
    }
  };

  const toggleAssignedSubject = (sid: string) => {
    if (subjectsTaughtIds.includes(sid)) {
      setSubjectsTaughtIds(subjectsTaughtIds.filter(id => id !== sid));
    } else {
      setSubjectsTaughtIds([...subjectsTaughtIds, sid]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    setSaving(true);
    setMsg(null);

    try {
      const subNames = subjects
        .filter(s => subjectsTaughtIds.includes(s.id))
        .map(s => s.subjectName);

      await saveTeacher({
        ...teacher,
        fullName,
        staffId,
        gender,
        dateOfBirth,
        phone,
        email,
        password,
        qualification,
        photoUrl,
        signatureUrl,
        assignedClassIds,
        classAssignedId: assignedClassIds[0] || teacher.classAssignedId || '',
        subjectsTaughtIds,
        subjectsTaughtNames: subNames
      });

      setMsg({ type: 'success', text: 'Teacher profile & signature credentials updated successfully!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update teacher profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs uppercase tracking-wider">Loading Teacher Profile & Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-light text-white serif italic flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Teacher Account Settings & Profile
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Update personal info, date of birth, passport photo, assessment signature, and login password.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Photo & Signature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Passport Photo */}
          <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" /> Teacher Passport Photo
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-slate-700 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {photoUrl ? (
                  <img src={photoUrl} alt="Passport" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Change Photo
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="px-2.5 py-1 bg-rose-500/10 text-rose-300 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
                <p className="text-[10px] text-slate-500">⚡ Auto-compressed under 50KB for rapid synchronization.</p>
              </div>
            </div>
          </div>

          {/* Digital Signature */}
          <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-purple-400" /> Digital Assessment Signature
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-28 h-20 rounded-2xl border-2 border-slate-700 bg-white overflow-hidden flex items-center justify-center shrink-0 p-1">
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                ) : (
                  <FileSignature className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={isUploadingSignature}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isUploadingSignature ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Change Signature
                </button>
                {signatureUrl && (
                  <button
                    type="button"
                    onClick={() => setSignatureUrl('')}
                    className="px-2.5 py-1 bg-rose-500/10 text-rose-300 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
                <p className="text-[10px] text-slate-500">⚡ Stamped on term assessment sheets & class records.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Biodata & Credentials Form */}
        <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-white pb-2 border-b border-slate-800">
            Personal Information & Login Credentials
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Staff ID *</label>
              <input
                type="text"
                required
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Date of Birth (DOB) *</label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Portal Login Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Portal Password *</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-cyan-300 font-mono font-bold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Academic Qualification</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Assigned Classes & Subjects */}
        <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-white pb-2 border-b border-slate-800">
            Assigned Teaching Classes & Subjects
          </h3>

          <div className="space-y-3">
            <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">Assigned Teaching Classes</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {classes.map(c => {
                const isSelected = assignedClassIds.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleAssignedClass(c.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-[#161925] border-slate-800 text-slate-400'
                    }`}
                  >
                    {c.className}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">Teaching Subjects</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {subjects.map(s => {
                const isSelected = subjectsTaughtIds.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleAssignedSubject(s.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-[#161925] border-slate-800 text-slate-400'
                    }`}
                  >
                    {s.subjectName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xl shadow-blue-900/30 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Updating Profile...' : 'Save Profile & Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
