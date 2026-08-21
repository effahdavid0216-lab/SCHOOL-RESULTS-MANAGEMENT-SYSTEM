import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Building2,
  Calendar,
  FileSignature,
  Save,
  CheckCircle,
  Loader2,
  ShieldAlert,
  Lock,
  Check,
  Image as ImageIcon,
  Globe,
  Facebook,
  Upload,
  Camera,
  Trash2,
  Sparkles
} from 'lucide-react';
import { School, SchoolSettings } from '../types';
import { WorkspaceIntegrationPanel } from './WorkspaceIntegrationPanel';
import { compressLogoFile, compressSignatureFile } from '../lib/imageOptimizer';
import {
  getSchoolDetails,
  getSchoolSettings,
  updateSchoolInformation,
  saveSchoolSettings,
  getSchoolPermissions,
  saveSchoolPermissions,
  logAuditAction
} from '../lib/services';
import { PageHeader, Badge, Button, Input, Card } from './ui';

interface Props {
  schoolId: string;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'results.approve', label: 'Approve & Publish Results', category: 'Academic' },
  { key: 'results.edit', label: 'Enter & Edit Exam/SBA Scores', category: 'Academic' },
  { key: 'students.edit', label: 'Create & Edit Student Profiles', category: 'Students' },
  { key: 'students.promote', label: 'Process Student Promotions', category: 'Students' },
  { key: 'fees.manage', label: 'Collect Fees & Issue Digital Receipts', category: 'Finance' },
  { key: 'expenses.manage', label: 'Manage Expense Ledger', category: 'Finance' },
  { key: 'attendance.mark', label: 'Mark Class Roll Call & Attendance', category: 'Operations' },
  { key: 'teachers.manage', label: 'Assign Teachers & Manage Staff', category: 'Staff' },
  { key: 'assignments.manage', label: 'Post & Grade Assignments', category: 'Academic' },
  { key: 'reports.generate', label: 'Generate Terminal & Broadsheet Reports', category: 'Reports' },
  { key: 'settings.edit', label: 'Modify School Settings & Signatures', category: 'System' },
  { key: 'audit.view', label: 'View Security Audit Logs', category: 'System' }
];

export const SchoolSettingsView: React.FC<Props> = ({ schoolId }) => {
  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [selectedRole, setSelectedRole] = useState<string>('TEACHER');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [region, setRegion] = useState('');
  const [headmasterName, setHeadmasterName] = useState('');
  const [headmasterPosition, setHeadmasterPosition] = useState('Headmaster / Principal');
  const [headmasterSignatureUrl, setHeadmasterSignatureUrl] = useState('');
  const [currentAcademicYear, setCurrentAcademicYear] = useState('2026/2027');
  const [currentTerm, setCurrentTerm] = useState('Term 1');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const compressedDataUrl = await compressLogoFile(file);
      setLogoUrl(compressedDataUrl);
    } catch (err) {
      console.error('Error optimizing logo:', err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSignatureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSignature(true);
    try {
      const compressedDataUrl = await compressSignatureFile(file);
      setHeadmasterSignatureUrl(compressedDataUrl);
    } catch (err) {
      console.error('Error optimizing signature:', err);
    } finally {
      setIsUploadingSignature(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [sch, setts, perms] = await Promise.all([
      getSchoolDetails(schoolId),
      getSchoolSettings(schoolId),
      getSchoolPermissions(schoolId)
    ]);
    if (sch) {
      setSchool(sch);
      setName(sch.name);
      setMotto(sch.motto || '');
      setLogoUrl(sch.logoUrl || '');
      setPhone(sch.phone);
      setEmail(sch.email);
      setAddress(sch.address);
      setDistrict(sch.district);
      setRegion(sch.region);
    }
    if (setts) {
      setSettings(setts);
      setHeadmasterName(setts.headmasterName || '');
      setHeadmasterPosition(setts.headmasterPosition || '');
      setHeadmasterSignatureUrl(setts.headmasterSignatureUrl || '');
      setCurrentAcademicYear(setts.currentAcademicYear || '2026/2027');
      setCurrentTerm(setts.currentTerm || 'Term 1');
    }
    if (perms) {
      setPermissions(perms);
    }
    setLoading(false);
  };

  const togglePermission = (permKey: string) => {
    const rolePerms = permissions[selectedRole] || [];
    let updated: string[];
    if (rolePerms.includes(permKey)) {
      updated = rolePerms.filter(p => p !== permKey);
    } else {
      updated = [...rolePerms, permKey];
    }
    setPermissions({
      ...permissions,
      [selectedRole]: updated
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSchoolInformation(schoolId, {
        name,
        motto,
        logoUrl,
        phone,
        email,
        address,
        district,
        region
      });

      if (settings) {
        await saveSchoolSettings({
          ...settings,
          headmasterName,
          headmasterPosition,
          headmasterSignatureUrl,
          currentAcademicYear,
          currentTerm,
          updatedAt: new Date().toISOString()
        });
      }

      await saveSchoolPermissions(schoolId, permissions);

      await logAuditAction({
        schoolId,
        userEmail: 'admin@school.edu',
        role: 'ADMIN',
        action: 'SETTINGS_AND_PERMISSIONS_UPDATE',
        targetRecord: `School Permissions for ${selectedRole}`,
        details: `Updated permissions matrix and school branding settings.`
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Error updating settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="text-xs">Loading school settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl text-slate-800 dark:text-slate-200">
      <PageHeader
        title="School Profile & Branding Settings"
        subtitle="Configure school identity, logo, headmaster signature, and academic term preferences."
        badge={
          savedSuccess ? (
            <Badge variant="active" label="Settings Saved!" icon={<CheckCircle className="w-3.5 h-3.5" />} />
          ) : undefined
        }
      />

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 text-xs shadow-xs">
        {/* Section 1: Branding */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> School Identity & Branding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="School Name *"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Motto"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Phone *"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Email *"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Official School Logo / Crest</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
                <div className="w-16 h-16 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-inner">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      leftIcon={isUploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    >
                      Upload School Crest / Logo
                    </Button>
                    {logoUrl && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setLogoUrl('')}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Or paste direct Image URL (e.g., https://...)"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    ⚡ Auto-compressed in browser under 50ms for instant saving. PNG/JPEG supported.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Input
                label="Street / Campus Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="District / Municipality"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Region / State"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Headmaster */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Headmaster / Principal Signature & Terminal Reports Stamp
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Headmaster Name"
                value={headmasterName}
                onChange={(e) => setHeadmasterName(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Headmaster Position Title"
                value={headmasterPosition}
                onChange={(e) => setHeadmasterPosition(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Official Digital Signature</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
                <div className="w-32 h-16 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-inner">
                  {headmasterSignatureUrl ? (
                    <img src={headmasterSignatureUrl} alt="Signature" className="w-full h-full object-contain p-1" />
                  ) : (
                    <FileSignature className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => signatureInputRef.current?.click()}
                      disabled={isUploadingSignature}
                      leftIcon={isUploadingSignature ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    >
                      Upload Headmaster Signature
                    </Button>
                    {headmasterSignatureUrl && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setHeadmasterSignatureUrl('')}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Or paste Signature Image URL"
                    value={headmasterSignatureUrl}
                    onChange={(e) => setHeadmasterSignatureUrl(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    ⚡ This signature is stamped on all Student Terminal Report Cards and Certificates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Granular Role & Permission Management */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-500" /> Granular Role & Access Control Rights
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Configure system access rights for staff roles. Check/uncheck permissions to control what each user role can view or modify.
          </p>

          {/* Role selector tabs */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            {['TEACHER', 'ACCOUNTANT', 'EXAM_OFFICER', 'VICE_PRINCIPAL'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedRole === r
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Permissions Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            {AVAILABLE_PERMISSIONS.map(perm => {
              const rolePerms = permissions[selectedRole] || [];
              const isChecked = rolePerms.includes(perm.key);

              return (
                <div
                  key={perm.key}
                  onClick={() => togglePermission(perm.key)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/80 text-purple-900 dark:text-purple-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold block">{perm.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Code: <code className="text-purple-600 dark:text-purple-300">{perm.key}</code> • {perm.category}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={saving}
          isLoading={saving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save All Changes
        </Button>

      </form>

      {/* Section 4: Google Workspace API Services */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <WorkspaceIntegrationPanel schoolId={schoolId} />
      </div>

      {/* Section 5: Developer Support & Super Admin Contact Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-slate-800 dark:text-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Developer SaaS Support & Licensing Contact
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          For license renewals, extra student capacity, custom feature requests, or technical assistance, contact the Developer / Super Admin:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Support Phone Lines</span>
            <span className="font-mono text-slate-900 dark:text-white font-semibold">0592005260 / 0540712524</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Developer Email</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">effahdavid45@gmail.com</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 font-bold block">WhatsApp Support</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">0592005260</span>
          </div>
        </div>

        <div className="pt-2">
          <span className="text-[10px] uppercase text-slate-500 font-bold block mb-2">Connect on Social Media</span>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/share/1CK2w7tBZT/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-200 dark:border-blue-800 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 cursor-pointer font-semibold"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@kindav44?_r=1&_t=ZS-98kantth0Eu"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 text-slate-800 dark:text-slate-200 hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 cursor-pointer font-semibold"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.34 1.51-1.4 2.5-.07.96.34 1.93 1.07 2.56.82.72 2.01.91 3.03.53.95-.33 1.68-1.14 1.92-2.11.14-.62.14-1.28.14-1.92V.02z"/>
              </svg>
              <span>TikTok</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
