import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  GraduationCap,
  UserCheck,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Layers,
  BookOpen,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  FileBadge
} from 'lucide-react';
import { School, License, SubscriptionPlan } from '../types';
import { createSchoolInSuperAdmin } from '../lib/services';
import { generateSecureLicenseKey } from '../lib/licenseService';

interface SchoolCreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolCreated: (result: {
    school: School;
    license: License;
    activationCode: string;
    securityToken: string;
    adminCredentials: { username: string; initialPassword: string; email: string; fullName?: string };
  }) => void;
}

export const SchoolCreationWizardModal: React.FC<SchoolCreationWizardModalProps> = ({
  isOpen,
  onClose,
  onSchoolCreated
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationResult, setCreationResult] = useState<{
    school: School;
    license: License;
    activationCode: string;
    securityToken: string;
    adminCredentials: { username: string; initialPassword: string; email: string; fullName?: string };
  } | null>(null);

  // Copied state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // STEP 1: School Information
  const [schoolName, setSchoolName] = useState('');
  const [schoolMotto, setSchoolMotto] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [region, setRegion] = useState('Greater Accra');
  const [country, setCountry] = useState('Ghana');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // STEP 2: Academic Setup
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [currentTerm, setCurrentTerm] = useState('Term 1');
  const [numberOfTerms, setNumberOfTerms] = useState(3);
  const [classesList, setClassesList] = useState<string[]>([
    'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'JHS 1', 'JHS 2', 'JHS 3'
  ]);
  const [newClassInput, setNewClassInput] = useState('');
  const [subjectsList, setSubjectsList] = useState<string[]>([
    'English Language',
    'Mathematics',
    'Integrated Science',
    'Social Studies',
    'Computing / ICT',
    'Ghanaian Language & Culture',
    'Religious & Moral Education (RME)',
    'Creative Arts and Design',
    'Career Technology'
  ]);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  // STEP 3: School Admin Account
  const [adminFullName, setAdminFullName] = useState('');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);
  const [adminRecoveryEmail, setAdminRecoveryEmail] = useState('');
  const [adminSecurityQuestion, setAdminSecurityQuestion] = useState('What was the name of your first elementary school?');
  const [adminCustomQuestion, setAdminCustomQuestion] = useState('');
  const [adminSecurityAnswer, setAdminSecurityAnswer] = useState('');

  // STEP 4: Licensing
  const [generatedSchoolId] = useState(() => `SCH-GH-${Math.floor(100000 + Math.random() * 900000)}`);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>('STANDARD');
  const [licenseDurationDays, setLicenseDurationDays] = useState(365);
  const [licenseKey, setLicenseKey] = useState(() => generateSecureLicenseKey(generatedSchoolId, 365));
  const [licenseStartDate, setLicenseStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return d.toISOString().split('T')[0];
  });
  const [licenseStatus, setLicenseStatus] = useState<'ACTIVE' | 'TRIAL'>('ACTIVE');
  const [systemVersion] = useState('3.0.0 Pro Multi-Tenant');

  if (!isOpen) return null;

  // Helpers
  const handleRegenerateLicenseKey = () => {
    const newKey = generateSecureLicenseKey(generatedSchoolId, licenseDurationDays);
    setLicenseKey(newKey);
    toast.success('Generated fresh license key!');
  };

  const handleGenerateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pass = 'EduMaster@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(pass);
    setAdminConfirmPassword(pass);
    toast.success('Generated strong administrator password!');
  };

  const handleAddClass = () => {
    if (newClassInput.trim() && !classesList.includes(newClassInput.trim())) {
      setClassesList([...classesList, newClassInput.trim()]);
      setNewClassInput('');
    }
  };

  const handleRemoveClass = (cls: string) => {
    setClassesList(classesList.filter(c => c !== cls));
  };

  const handleAddSubject = () => {
    if (newSubjectInput.trim() && !subjectsList.includes(newSubjectInput.trim())) {
      setSubjectsList([...subjectsList, newSubjectInput.trim()]);
      setNewSubjectInput('');
    }
  };

  const handleRemoveSubject = (sub: string) => {
    setSubjectsList(subjectsList.filter(s => s !== sub));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo image size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
        toast.success('School logo loaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Step Validation
  const validateStep1 = () => {
    if (!schoolName.trim()) {
      toast.error('School Name is required.');
      return false;
    }
    if (!phone.trim()) {
      toast.error('School Contact Phone is required.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('A valid School Contact Email is required.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!academicYear.trim()) {
      toast.error('Current Academic Year is required.');
      return false;
    }
    if (classesList.length === 0) {
      toast.error('At least one class must be configured.');
      return false;
    }
    if (subjectsList.length === 0) {
      toast.error('At least one subject must be configured.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!adminFullName.trim()) {
      toast.error('School Admin Full Name is required.');
      return false;
    }
    if (!adminUsername.trim()) {
      toast.error('School Admin Username is required.');
      return false;
    }
    const mail = adminEmail.trim() || email.trim();
    if (!mail || !mail.includes('@')) {
      toast.error('A valid School Admin Email is required.');
      return false;
    }
    if (!adminPassword || adminPassword.length < 8) {
      toast.error('Initial Password must contain at least 8 characters.');
      return false;
    }
    if (adminPassword !== adminConfirmPassword) {
      toast.error('Passwords do not match.');
      return false;
    }
    const finalQuestion = adminSecurityQuestion === 'CUSTOM' ? adminCustomQuestion.trim() : adminSecurityQuestion.trim();
    if (!finalQuestion) {
      toast.error('Security Question is required.');
      return false;
    }
    if (!adminSecurityAnswer.trim()) {
      toast.error('Security Answer is required.');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!licenseKey.trim()) {
      toast.error('License Key is required.');
      return false;
    }
    if (!licenseStartDate || !licenseExpiryDate) {
      toast.error('License start and expiry dates are required.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 5) as any);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as any);
  };

  const handleConfirmAndCreate = async () => {
    setIsSubmitting(true);
    try {
      const finalQuestion = adminSecurityQuestion === 'CUSTOM' ? adminCustomQuestion.trim() : adminSecurityQuestion.trim();
      const adminMail = adminEmail.trim() || email.trim();

      const schoolPayload = {
        schoolId: generatedSchoolId,
        name: schoolName.trim(),
        motto: schoolMotto.trim(),
        address: schoolAddress.trim(),
        district: district.trim(),
        region: region.trim(),
        country: country.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        logoUrl,
        schoolType: 'PRIMARY_JHS',
        // Academic
        currentAcademicYear: academicYear.trim(),
        currentTerm,
        numberOfTerms,
        classes: classesList,
        subjects: subjectsList,
        // Admin
        adminFullName: adminFullName.trim(),
        adminUsername: adminUsername.trim(),
        adminEmail: adminMail,
        adminPassword,
        adminRecoveryEmail: adminRecoveryEmail.trim() || adminMail,
        adminSecurityQuestion: finalQuestion,
        adminSecurityAnswer: adminSecurityAnswer.trim(),
        // Licensing
        licenseKey: licenseKey.trim(),
        licenseStartDate,
        licenseExpiryDate,
        licenseStatus,
        durationDays: licenseDurationDays,
        subscriptionPlan,
        subscriptionPrice: subscriptionPlan === 'BASIC' ? 500 : subscriptionPlan === 'STANDARD' ? 1200 : subscriptionPlan === 'PREMIUM' ? 2500 : 5000
      };

      const result = await createSchoolInSuperAdmin(schoolPayload, licenseDurationDays, subscriptionPlan);
      setCreationResult(result);
      onSchoolCreated(result);
      toast.success(`School tenant "${schoolName}" successfully provisioned!`);
    } catch (err: any) {
      console.error('School creation error:', err);
      toast.error(`School creation failed: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-[#0c0e17] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 text-slate-200">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-600" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Create New School Tenant</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Super Admin Wizard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                5-step guided tenant initialization, academic configuration, and credential provisioning.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="px-6 py-3 bg-[#121524] border-b border-slate-800/60 grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { step: 1, label: '1. School Info', icon: Building2 },
            { step: 2, label: '2. Academic Setup', icon: GraduationCap },
            { step: 3, label: '3. School Admin', icon: UserCheck },
            { step: 4, label: '4. Licensing', icon: KeyRound },
            { step: 5, label: '5. Confirmation', icon: ShieldCheck }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step || creationResult !== null;
            return (
              <div
                key={item.step}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 font-medium ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : isCompleted
                    ? 'text-slate-300 bg-slate-800/40'
                    : 'text-slate-500'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="hidden sm:inline text-[11px] truncate">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-5">
          {/* SUCCESS SCREEN IF PROVISIONED */}
          {creationResult ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-950/40 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-bold text-white">School Tenant Provisioned Successfully!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The school record, initial administrator account, license credentials, and storage configuration have been saved.
                </p>
              </div>

              {/* Summary of Issued Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-xs bg-[#121524] border border-slate-800 rounded-2xl p-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Building2 className="w-4 h-4" /> School Identification
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">School Name</span>
                    <strong className="text-white text-sm">{creationResult.school.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">School Tenant ID</span>
                    <span className="font-mono text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      {creationResult.school.schoolId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Plan & Expiry</span>
                    <span className="text-slate-200">
                      {creationResult.license.subscriptionPlan || 'STANDARD'} • Expires {new Date(creationResult.license.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <KeyRound className="w-4 h-4" /> Administrator Credentials
                  </div>
                  <div className="flex items-center justify-between bg-[#0b0d14] p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Login Email</span>
                      <span className="font-mono text-slate-200">{creationResult.adminCredentials.email}</span>
                    </div>
                    <button
                      onClick={() => copyText(creationResult.adminCredentials.email, 'Admin Email')}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-[#0b0d14] p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Initial Password</span>
                      <span className="font-mono text-amber-300 font-bold">{creationResult.adminCredentials.initialPassword}</span>
                    </div>
                    <button
                      onClick={() => copyText(creationResult.adminCredentials.initialPassword, 'Initial Password')}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-[#0b0d14] p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Activation Code</span>
                      <span className="font-mono text-emerald-400 font-bold">{creationResult.activationCode}</span>
                    </div>
                    <button
                      onClick={() => copyText(creationResult.activationCode, 'Activation Code')}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const text = `*EduMaster Pro - School Provisioning Confirmation*%0A%0A*School Name:* ${creationResult.school.name}%0A*School ID:* ${creationResult.school.schoolId}%0A*Admin Email:* ${creationResult.adminCredentials.email}%0A*Initial Password:* ${creationResult.adminCredentials.initialPassword}%0A*Activation Code:* ${creationResult.activationCode}%0A*License Key:* ${creationResult.license.licenseKey}%0A%0A*Portal Login:* ${window.location.origin}`;
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Share2 className="w-4 h-4" /> Share on WhatsApp
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Done & Return to Portal
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: School Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">STEP 1: School Information & Identity</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">School Name *</label>
                      <input
                        type="text"
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. St. Augustine Basic School"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">School Motto</label>
                      <input
                        type="text"
                        value={schoolMotto}
                        onChange={(e) => setSchoolMotto(e.target.value)}
                        placeholder="e.g. Excellence Through Discipline"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 italic"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">School Address *</label>
                      <input
                        type="text"
                        required
                        value={schoolAddress}
                        onChange={(e) => setSchoolAddress(e.target.value)}
                        placeholder="e.g. P.O. Box 45, Cape Coast"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">District / City *</label>
                      <input
                        type="text"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Cape Coast Metropolis"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Region *</label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Greater Accra">Greater Accra</option>
                        <option value="Ashanti">Ashanti</option>
                        <option value="Central">Central</option>
                        <option value="Eastern">Eastern</option>
                        <option value="Western">Western</option>
                        <option value="Volta">Volta</option>
                        <option value="Northern">Northern</option>
                        <option value="Upper East">Upper East</option>
                        <option value="Upper West">Upper West</option>
                        <option value="Bono">Bono</option>
                        <option value="Bono East">Bono East</option>
                        <option value="Ahafo">Ahafo</option>
                        <option value="Oti">Oti</option>
                        <option value="Savannah">Savannah</option>
                        <option value="North East">North East</option>
                        <option value="Western North">Western North</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 0244123456"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. info@staugustine.edu.gh"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-300">School Website (Optional)</label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://staugustine.edu.gh"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-300">School Logo / Crest</label>
                      <div className="flex items-center gap-4 p-3 bg-[#141824] border border-slate-700 rounded-2xl">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-slate-600 shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                            <Upload className="w-6 h-6" />
                          </div>
                        )}
                        <div className="space-y-1 flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-500">PNG, JPG, or SVG up to 2MB. Stored securely with school tenant.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Academic Setup */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">STEP 2: Academic Setup & Structure</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Current Academic Year *</label>
                      <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        placeholder="2026/2027"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Current Term *</label>
                      <select
                        value={currentTerm}
                        onChange={(e) => setCurrentTerm(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Number of Terms per Year</label>
                      <input
                        type="number"
                        min={1}
                        max={4}
                        value={numberOfTerms}
                        onChange={(e) => setNumberOfTerms(parseInt(e.target.value, 10) || 3)}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Classes Management */}
                  <div className="p-4 bg-[#141824] border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">Default Classes ({classesList.length})</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Add or remove classes for this school</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newClassInput}
                        onChange={(e) => setNewClassInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddClass())}
                        placeholder="e.g. Creche or Basic 7"
                        className="flex-1 px-3 py-2 bg-[#0c0e17] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddClass}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Class
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {classesList.map((cls) => (
                        <span
                          key={cls}
                          className="px-2.5 py-1 rounded-lg bg-[#0c0e17] border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
                        >
                          <span>{cls}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveClass(cls)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Subjects Management */}
                  <div className="p-4 bg-[#141824] border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">Default Subjects ({subjectsList.length})</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Curriculum subjects mapped to classes</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSubjectInput}
                        onChange={(e) => setNewSubjectInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                        placeholder="e.g. French Language"
                        className="flex-1 px-3 py-2 bg-[#0c0e17] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubject}
                        className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Subject
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {subjectsList.map((sub) => (
                        <span
                          key={sub}
                          className="px-2.5 py-1 rounded-lg bg-[#0c0e17] border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
                        >
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sub)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: School Admin Account */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">STEP 3: Primary School Admin Account</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateStrongPassword}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate Password
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Admin Full Name *</label>
                      <input
                        type="text"
                        required
                        value={adminFullName}
                        onChange={(e) => setAdminFullName(e.target.value)}
                        placeholder="e.g. Dr. Kwame Mensah (Headmaster)"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Username *</label>
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Admin Email Address *</label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder={email || "headmaster@school.edu.gh"}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Recovery Email (Optional)</label>
                      <input
                        type="email"
                        value={adminRecoveryEmail}
                        onChange={(e) => setAdminRecoveryEmail(e.target.value)}
                        placeholder="alternate@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Passwords */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Initial Password *</label>
                      <div className="relative">
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showAdminConfirmPassword ? 'text' : 'password'}
                          required
                          value={adminConfirmPassword}
                          onChange={(e) => setAdminConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showAdminConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Security Questions */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Security Question *</label>
                      <select
                        value={adminSecurityQuestion}
                        onChange={(e) => setAdminSecurityQuestion(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="What was the name of your first elementary school?">What was the name of your first elementary school?</option>
                        <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                        <option value="What was the name of your first childhood pet?">What was the name of your first childhood pet?</option>
                        <option value="In what city or town was your first job?">In what city or town was your first job?</option>
                        <option value="What is the name of your favorite school teacher?">What is the name of your favorite school teacher?</option>
                        <option value="CUSTOM">Custom Security Question...</option>
                      </select>
                      {adminSecurityQuestion === 'CUSTOM' && (
                        <input
                          type="text"
                          required
                          value={adminCustomQuestion}
                          onChange={(e) => setAdminCustomQuestion(e.target.value)}
                          placeholder="Enter custom question"
                          className="w-full mt-1.5 px-3.5 py-2 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white"
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Security Answer *</label>
                      <input
                        type="text"
                        required
                        value={adminSecurityAnswer}
                        onChange={(e) => setAdminSecurityAnswer(e.target.value)}
                        placeholder="Security answer for password recovery"
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Licensing */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">STEP 4: Licensing & Subscription Details</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleRegenerateLicenseKey}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-generate Key
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-300">Generated License Key *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={licenseKey}
                          onChange={(e) => setLicenseKey(e.target.value)}
                          className="w-full pl-3.5 pr-10 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-emerald-400 font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => copyText(licenseKey, 'License Key')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Subscription Plan *</label>
                      <select
                        value={subscriptionPlan}
                        onChange={(e) => setSubscriptionPlan(e.target.value as SubscriptionPlan)}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="BASIC">BASIC (GH₵ 500 / yr)</option>
                        <option value="STANDARD">STANDARD (GH₵ 1,200 / yr)</option>
                        <option value="PREMIUM">PREMIUM (GH₵ 2,500 / yr)</option>
                        <option value="ENTERPRISE">ENTERPRISE (GH₵ 5,000 / yr)</option>
                        <option value="TRIAL">30-DAY FREE TRIAL</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">License Status</label>
                      <select
                        value={licenseStatus}
                        onChange={(e) => setLicenseStatus(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="ACTIVE">ACTIVE (Ready for immediate use)</option>
                        <option value="TRIAL">TRIAL (Evaluation period)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">License Start Date *</label>
                      <input
                        type="date"
                        required
                        value={licenseStartDate}
                        onChange={(e) => setLicenseStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">License Expiry Date *</label>
                      <input
                        type="date"
                        required
                        value={licenseExpiryDate}
                        onChange={(e) => setLicenseExpiryDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Duration in Days</label>
                      <input
                        type="number"
                        value={licenseDurationDays}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 365;
                          setLicenseDurationDays(val);
                          const d = new Date(licenseStartDate);
                          d.setDate(d.getDate() + val);
                          setLicenseExpiryDate(d.toISOString().split('T')[0]);
                        }}
                        className="w-full px-3.5 py-2.5 bg-[#141824] border border-slate-700 rounded-xl text-xs text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">System Software Version</label>
                      <input
                        type="text"
                        disabled
                        value={systemVersion}
                        className="w-full px-3.5 py-2.5 bg-[#0e101a] border border-slate-800 rounded-xl text-xs text-slate-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Confirmation & Summary */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">STEP 5: Confirmation & Tenant Review</h4>
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    <div>
                      <p className="font-bold">Ready to Provision School Tenant</p>
                      <p className="text-[11px] text-emerald-300/80">
                        Please review the summary below. Clicking Confirm will execute database schema creation, Supabase Auth user setup, license registration, and default academic provisioning.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* School Profile Card */}
                    <div className="p-4 bg-[#141824] border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px] tracking-wider">
                        <Building2 className="w-3.5 h-3.5" /> School Identity
                      </div>
                      <p><strong className="text-white">{schoolName}</strong></p>
                      <p className="text-slate-400">Motto: <em className="text-slate-300">"{schoolMotto || 'N/A'}"</em></p>
                      <p className="text-slate-400">Location: {district}, {region}, {country}</p>
                      <p className="text-slate-400">Contact: {phone} • {email}</p>
                      {website && <p className="text-slate-400">Web: {website}</p>}
                    </div>

                    {/* Academic Structure Card */}
                    <div className="p-4 bg-[#141824] border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px] tracking-wider">
                        <GraduationCap className="w-3.5 h-3.5" /> Academic Structure
                      </div>
                      <p><strong className="text-white">Year: {academicYear}</strong> ({currentTerm})</p>
                      <p className="text-slate-400">Total Classes: <strong className="text-slate-200">{classesList.length}</strong></p>
                      <p className="text-slate-400">Total Subjects: <strong className="text-slate-200">{subjectsList.length}</strong></p>
                      <p className="text-[10px] text-slate-500 truncate">Classes: {classesList.join(', ')}</p>
                    </div>

                    {/* Admin Credentials Card */}
                    <div className="p-4 bg-[#141824] border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[11px] tracking-wider">
                        <UserCheck className="w-3.5 h-3.5" /> Administrator Credentials
                      </div>
                      <p><strong className="text-white">{adminFullName}</strong> ({adminUsername})</p>
                      <p className="text-slate-400">Email: <span className="font-mono text-slate-200">{adminEmail || email}</span></p>
                      <p className="text-slate-400">Initial Password: <span className="font-mono text-amber-300 font-bold">••••••••</span></p>
                      <p className="text-[10px] text-slate-500">Security Q: {adminSecurityQuestion === 'CUSTOM' ? adminCustomQuestion : adminSecurityQuestion}</p>
                    </div>

                    {/* License & Subscription Card */}
                    <div className="p-4 bg-[#141824] border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px] tracking-wider">
                        <KeyRound className="w-3.5 h-3.5" /> Licensing & Subscription
                      </div>
                      <p><strong className="text-white">{subscriptionPlan} Plan</strong> ({licenseStatus})</p>
                      <p className="text-slate-400">Key: <span className="font-mono text-emerald-400 text-[11px]">{licenseKey.slice(0, 16)}...</span></p>
                      <p className="text-slate-400">Duration: {licenseDurationDays} days (Expires {licenseExpiryDate})</p>
                      <p className="text-[10px] text-slate-500">Engine Version: {systemVersion}</p>
                    </div>
                  </div>

                  {/* Provisioning Checklist */}
                  <div className="p-4 bg-[#0d101a] border border-slate-800 rounded-2xl text-xs space-y-1.5">
                    <p className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">Automated Tenant Provisioning Pipeline:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Create primary school tenant record</span>
                      <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Provision School Admin auth account & profile</span>
                      <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Generate activation code & security token</span>
                      <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Provision {classesList.length} classes & {subjectsList.length} subjects</span>
                      <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Initialize cloud storage / documents bucket</span>
                      <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Log global audit entry for Super Admin</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!creationResult && (
          <div className="p-6 border-t border-slate-800/80 bg-[#0d101a] flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/50"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmAndCreate}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/50 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Provisioning School Tenant...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirm & Create School Tenant</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
