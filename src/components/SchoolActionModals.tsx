import React, { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Key,
  Lock,
  Copy,
  Check,
  Trash2,
  Share2,
  Building,
  ShieldAlert,
  Database,
  Users,
  GraduationCap,
  DollarSign
} from 'lucide-react';
import { School, License, SubscriptionPlan } from '../types';
import toast from 'react-hot-toast';

// ----------------------------------------------------
// 1. RENEW LICENSE MODAL
// ----------------------------------------------------
interface RenewLicenseModalProps {
  school: School;
  currentLicense?: License;
  onClose: () => void;
  onConfirm: (days: number) => Promise<void>;
}

export const RenewLicenseModal: React.FC<RenewLicenseModalProps> = ({
  school,
  currentLicense,
  onClose,
  onConfirm
}) => {
  const [days, setDays] = useState(365);
  const [submitting, setSubmitting] = useState(false);

  const presets = [
    { label: '+30 Days (1 Month)', val: 30 },
    { label: '+90 Days (1 Term)', val: 90 },
    { label: '+180 Days (Half Year)', val: 180 },
    { label: '+365 Days (1 Year)', val: 365 },
    { label: '+730 Days (2 Years)', val: 730 }
  ];

  const now = new Date();
  const currentExp = currentLicense?.expiresAt ? new Date(currentLicense.expiresAt) : now;
  const baseDate = currentExp > now ? currentExp : now;
  const newExp = new Date(baseDate);
  newExp.setDate(newExp.getDate() + Number(days));

  const handleRenew = async () => {
    if (days <= 0) {
      toast.error('Please enter a valid number of days.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(Number(days));
      onClose();
    } catch (err: any) {
      toast.error('Renewal failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Extend School License</h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{school.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Extension Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setDays(p.val)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                    days === p.val
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Extension (Days)</label>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="bg-blue-950/20 border border-blue-500/20 p-3.5 rounded-xl text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Current Status:</span>
              <span className="text-slate-200 font-medium">{school.status}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Calculated Expiration:</span>
              <span className="text-emerald-400 font-bold font-mono">{newExp.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleRenew}
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Extending...' : 'Confirm Extension'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. CHANGE PLAN MODAL
// ----------------------------------------------------
interface ChangePlanModalProps {
  school: School;
  onClose: () => void;
  onConfirm: (plan: SubscriptionPlan, price: number) => Promise<void>;
}

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({ school, onClose, onConfirm }) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(school.subscriptionPlan || 'STANDARD');
  const [submitting, setSubmitting] = useState(false);

  const plans: { plan: SubscriptionPlan; name: string; price: number; desc: string }[] = [
    { plan: 'BASIC', name: 'Basic Edition', price: 500, desc: 'Up to 300 Students • Standard SBA • Basic Reports' },
    { plan: 'STANDARD', name: 'Standard Edition', price: 1200, desc: 'Up to 800 Students • Full SBA + Report Cards' },
    { plan: 'PREMIUM', name: 'Premium Edition', price: 2500, desc: 'Up to 2,000 Students • SMS Alerts • Financials' },
    { plan: 'ENTERPRISE', name: 'Enterprise Edition', price: 5000, desc: 'Unlimited Students • Custom Subdomain • 24/7 VIP' }
  ];

  const handleSave = async () => {
    const p = plans.find((x) => x.plan === selectedPlan);
    setSubmitting(true);
    try {
      await onConfirm(selectedPlan, p?.price || 1200);
      onClose();
    } catch (err: any) {
      toast.error('Failed to change plan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Change Subscription Plan</h3>
            <p className="text-xs text-slate-400 truncate max-w-[240px]">{school.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {plans.map((p) => (
            <div
              key={p.plan}
              onClick={() => setSelectedPlan(p.plan)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedPlan === p.plan
                  ? 'bg-blue-600/15 border-blue-500 text-white'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">{p.name}</span>
                <span className="font-mono text-xs font-bold text-emerald-400">GH₵ {p.price}/yr</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Confirm Plan Change'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. RESET ADMIN MODAL
// ----------------------------------------------------
interface ResetAdminModalProps {
  school: School;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

export const ResetAdminModal: React.FC<ResetAdminModalProps> = ({ school, onClose, onConfirm }) => {
  const [password, setPassword] = useState(`${school.schoolId}@2026!`);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success('Password copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!password.trim()) {
      toast.error('Please enter a valid password.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(password.trim());
      onClose();
    } catch (err: any) {
      toast.error('Reset failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reset School Admin Password</h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{school.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Set a temporary administrator passcode for <span className="text-slate-200 font-semibold">{school.name}</span>. The school administrator will use this to sign into the system.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Copy"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={generateRandomPassword}
              className="px-2.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold cursor-pointer"
              title="Generate Random"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Apply Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. CONFIRM STATUS (SUSPEND / REACTIVATE) MODAL
// ----------------------------------------------------
interface ConfirmStatusModalProps {
  school: School;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmStatusModal: React.FC<ConfirmStatusModalProps> = ({ school, onClose, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false);
  const isCurrentlyActive = school.status === 'ACTIVE';
  const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      toast.error('Status change failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isCurrentlyActive
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isCurrentlyActive ? 'Suspend School Tenant' : 'Reactivate School Tenant'}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{school.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {isCurrentlyActive
            ? `Are you sure you want to SUSPEND "${school.name}"? Teachers, students, and administrators will be temporarily blocked from logging in until reactivated.`
            : `Are you sure you want to REACTIVATE "${school.name}"? Full system access will be immediately restored.`}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
              isCurrentlyActive ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {submitting ? 'Updating...' : `Confirm ${newStatus}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 5. DELETE SCHOOL MODAL
// ----------------------------------------------------
interface DeleteSchoolModalProps {
  school: School;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteSchoolModal: React.FC<DeleteSchoolModalProps> = ({ school, onClose, onConfirm }) => {
  const [confirmName, setConfirmName] = useState('');
  const [acknowledgeImpact, setAcknowledgeImpact] = useState(false);
  const [acknowledgeIrreversible, setAcknowledgeIrreversible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isMatched =
    confirmName.trim().toLowerCase() === school.name.trim().toLowerCase() ||
    confirmName.trim().toUpperCase() === school.schoolId.trim().toUpperCase();

  const canDelete = isMatched && acknowledgeImpact && acknowledgeIrreversible;

  const handleDelete = async () => {
    if (!canDelete) {
      if (!isMatched) {
        toast.error('Please type the exact School Name or School ID to confirm deletion.');
      } else {
        toast.error('Please check all confirmation boxes to proceed.');
      }
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      toast.error('Deletion failed: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f111a] border border-rose-900/60 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">Delete School Tenant</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Irreversible
                </span>
              </div>
              <p className="text-xs text-rose-300/80 font-medium mt-0.5">
                Target: <span className="text-white font-bold">{school.name}</span> ({school.schoolId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-rose-950/30 border border-rose-800/50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>CRITICAL WARNING: Permanent School Environment Deletion</span>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed">
            This action will permanently purge the entire school tenant database and all affiliated records from the system. Once initiated, this action <strong>cannot be undone</strong> or restored.
          </p>
        </div>

        {/* Impact List */}
        <div className="bg-[#141724] border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-rose-400" /> Data that will be permanently destroyed:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 bg-black/30 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Student profiles & grades</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Staff, teachers & admins</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span>Fee ledgers & invoices</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>License keys & tokens</span>
            </div>
          </div>
        </div>

        {/* Safety Checkboxes */}
        <div className="space-y-2.5 pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={acknowledgeImpact}
              onChange={(e) => setAcknowledgeImpact(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900 cursor-pointer"
            />
            <span>I understand that all academic, financial, and user records for this school will be permanently purged.</span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={acknowledgeIrreversible}
              onChange={(e) => setAcknowledgeIrreversible(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900 cursor-pointer"
            />
            <span>I confirm this is an authorized Super Admin operation and cannot be reversed.</span>
          </label>
        </div>

        {/* Verification Text Input */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              Type <span className="text-white font-mono font-bold">{school.schoolId}</span> or <span className="text-white font-bold">{school.name}</span> to confirm:
            </span>
            {isMatched && (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Matched
              </span>
            )}
          </div>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={`Enter "${school.schoolId}" or "${school.name}"`}
            className="w-full bg-[#0a0b10] border border-slate-700 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 font-mono outline-none transition-all shadow-inner"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || submitting}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-rose-600/20"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Purging Tenant...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete Tenant</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
