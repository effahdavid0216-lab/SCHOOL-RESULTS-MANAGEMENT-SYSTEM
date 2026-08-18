import React, { useState } from 'react';
import {
  UserCheck,
  ShieldAlert,
  Building2,
  GraduationCap,
  Users,
  Briefcase,
  Play,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Search,
  KeyRound,
  Eye,
  RotateCcw
} from 'lucide-react';
import { School, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  schools: School[];
  onLaunchImpersonation: (role: UserRole, schoolId: string, email: string, schoolName: string, reason?: string) => void;
  activeImpersonation?: {
    role: UserRole;
    schoolId: string;
    schoolName: string;
    email: string;
  } | null;
  onExitImpersonation?: () => void;
  className?: string;
}

interface RoleConfig {
  role: UserRole;
  title: string;
  badge: string;
  description: string;
  defaultEmailSuffix: string;
  icon: React.ElementType;
  accentColor: string;
}

const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: 'SCHOOL_ADMIN',
    title: 'School Administrator',
    badge: 'Full School Access',
    description: 'Manage teachers, student admissions, school fees, terms, grading policy, and global school settings.',
    defaultEmailSuffix: 'admin@school.edu.gh',
    icon: Building2,
    accentColor: 'from-blue-600 to-indigo-600'
  },
  {
    role: 'TEACHER',
    title: 'Teacher / Instructor',
    badge: 'Academics & Grading',
    description: 'Score entry, continuous assessments, class attendance, lesson logs, and student performance analytics.',
    defaultEmailSuffix: 'e.osei@school.edu.gh',
    icon: Briefcase,
    accentColor: 'from-emerald-600 to-teal-600'
  },
  {
    role: 'STUDENT',
    title: 'Student / Pupil',
    badge: 'Learner Dashboard',
    description: 'View terminal report cards, term grades, attendance metrics, class schedules, and subject notices.',
    defaultEmailSuffix: 'STU-2026-001',
    icon: GraduationCap,
    accentColor: 'from-purple-600 to-pink-600'
  },
  {
    role: 'PARENT',
    title: 'Parent / Guardian',
    badge: 'Parent Portal',
    description: 'Track children academic progress, fee balances, fee receipts, and terminal report downloads.',
    defaultEmailSuffix: 'parent@edu.gh',
    icon: Users,
    accentColor: 'from-amber-600 to-orange-600'
  }
];

export const RoleImpersonationWidget: React.FC<Props> = ({
  schools,
  onLaunchImpersonation,
  activeImpersonation,
  onExitImpersonation,
  className = ''
}) => {
  const { t } = useLanguage();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    schools.length > 0 ? schools[0].schoolId : 'SCH-GH-000001'
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>('SCHOOL_ADMIN');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [reason, setReason] = useState<string>('Testing & Support Verification');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState(false);

  const selectedSchool = schools.find((s) => s.schoolId === selectedSchoolId) || schools[0] || {
    schoolId: 'SCH-GH-000001',
    name: 'Prempeh College (HQ Demo)'
  };

  const selectedRoleConfig = ROLE_CONFIGS.find((r) => r.role === selectedRole) || ROLE_CONFIGS[0];

  const handleLaunch = () => {
    setIsLaunching(true);
    const targetEmail = customEmail.trim() || selectedRoleConfig.defaultEmailSuffix;
    const targetSchoolName = selectedSchool.name || `Tenant ${selectedSchoolId}`;

    setTimeout(() => {
      onLaunchImpersonation(selectedRole, selectedSchoolId, targetEmail, targetSchoolName, reason);
      setIsLaunching(false);
    }, 400);
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.schoolId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.district && s.district.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className={`bg-[#0f111a] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-900/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {t('impersonate.title', 'Super Admin Role Impersonation & Testing Portal')}
              <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                Developer Sandbox
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live switch into any user role across any school tenant to diagnose permissions, workflows, or grading broadsheets.
            </p>
          </div>
        </div>

        {activeImpersonation && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <div className="text-xs">
              <span className="text-amber-300 font-bold block">
                Active: {activeImpersonation.role} ({activeImpersonation.schoolName})
              </span>
              <span className="text-[10px] text-amber-200/80 font-mono">{activeImpersonation.email}</span>
            </div>
            {onExitImpersonation && (
              <button
                type="button"
                onClick={onExitImpersonation}
                className="ml-2 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
              >
                {t('impersonate.exit', 'Exit')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Select Target School Tenant (Left Column - 5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              1. {t('impersonate.select_school', 'Target School Tenant')}
            </label>
            <span className="text-[10px] text-slate-500 font-mono">{schools.length} Available</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search school name or ID..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {filteredSchools.length > 0 ? (
              filteredSchools.map((sch) => {
                const isSelected = sch.schoolId === selectedSchoolId;
                return (
                  <button
                    key={sch.schoolId}
                    type="button"
                    onClick={() => setSelectedSchoolId(sch.schoolId)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                        : 'bg-[#161925]/70 border-slate-800 text-slate-300 hover:bg-[#1f2334] hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{sch.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            sch.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {sch.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span className="text-blue-400">{sch.schoolId}</span>
                        {sch.district && <span>• {sch.district}</span>}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 bg-[#161925] rounded-xl">
                No matching school tenants found.
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Select Role & Configuration (Right Column - 7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              2. {t('impersonate.select_role', 'Select Role to Impersonate')}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLE_CONFIGS.map((cfg) => {
                const IconComponent = cfg.icon;
                const isSelected = selectedRole === cfg.role;
                return (
                  <button
                    key={cfg.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(cfg.role);
                      if (!customEmail) {
                        setCustomEmail(cfg.defaultEmailSuffix);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#1b2234] border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                        : 'bg-[#161925]/70 border-slate-800 hover:bg-[#1b1f2e] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr ${cfg.accentColor}`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                        {cfg.badge}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-white">{cfg.title}</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-1 line-clamp-2">
                      {cfg.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Account Email & Reason */}
          <div className="bg-[#161925] p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Test User Identifier / Email
                </label>
                <input
                  type="text"
                  placeholder={selectedRoleConfig.defaultEmailSuffix}
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Audit Log Support Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Testing & diagnostic reason"
                  className="w-full px-3 py-2 bg-[#0f111a] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Target Tenant: <strong>{selectedSchool.name}</strong> ({selectedSchoolId})
              </span>
              <span className="font-mono text-[10px] text-slate-500">Security Audit Logged</span>
            </div>
          </div>

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleLaunch}
            disabled={isLaunching}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {isLaunching
                ? 'Initializing Role Environment...'
                : `${t('impersonate.launch', 'Launch Impersonation Session as')} ${selectedRoleConfig.title}`}
            </span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
