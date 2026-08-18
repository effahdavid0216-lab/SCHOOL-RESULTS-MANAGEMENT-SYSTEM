import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Building,
  Key,
  ShieldCheck,
  Lock,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Share2,
  ExternalLink,
  Edit3,
  RefreshCw,
  Sparkles,
  AlertCircle,
  FileText,
  UserCheck,
  Globe,
  Award,
  Trash2
} from 'lucide-react';
import { School, License, ActivationCode, RegistrationToken } from '../types';
import { getSchoolCredentialsFull, SchoolFullCredentials } from '../lib/services';
import toast from 'react-hot-toast';

interface SchoolTenantViewModalProps {
  school: School;
  initialLicense?: License;
  onClose: () => void;
  onEdit?: (school: School) => void;
  onEditSchool?: (school: School) => void;
  onDeleteSchool?: (school: School) => void;
  onRefresh?: () => void;
}

export const SchoolTenantViewModal: React.FC<SchoolTenantViewModalProps> = ({
  school,
  initialLicense,
  onClose,
  onEdit,
  onEditSchool,
  onDeleteSchool,
  onRefresh
}) => {
  const [loading, setLoading] = useState(true);
  const [credData, setCredData] = useState<SchoolFullCredentials | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const full = await getSchoolCredentialsFull(school.schoolId);
      setCredData(full);
    } catch (err: any) {
      console.error('Error fetching credentials:', err);
      toast.error('Could not load all credentials from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [school.schoolId]);

  const activeLicense = credData?.license || initialLicense;
  const activationCode =
    credData?.activationCode?.code ||
    'ACT-' + school.schoolId.replace(/[^A-Z0-9]/gi, '').slice(0, 6) + '-2026';
  const securityToken =
    credData?.registrationToken?.token ||
    'TOK-' + school.schoolId.replace(/[^A-Z0-9]/gi, '').slice(0, 6) + '-SEC';
  const licenseKey = activeLicense?.licenseKey || 'LIC-' + school.schoolId + '-STD';

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleCopyAll = () => {
    const lines = [
      `========================================`,
      `🏫 EDUMASTER PRO - SCHOOL TENANT CREDENTIALS`,
      `========================================`,
      `School Name:      ${school.name}`,
      `School ID:        ${school.schoolId}`,
      `License Key:      ${licenseKey}`,
      `Activation Code:  ${activationCode}`,
      `Security Token:   ${securityToken}`,
      `----------------------------------------`,
      `Contact Person:   ${school.contactPerson || 'School Head'}`,
      `Phone Number:     ${school.phone || 'N/A'}`,
      `Admin Email:      ${school.email || 'admin@school.edu.gh'}`,
      `Status:           ${school.status || 'ACTIVE'}`,
      `Plan Tier:        ${school.subscriptionPlan || 'STANDARD'}`,
      `Expires At:       ${
        activeLicense?.expiresAt
          ? new Date(activeLicense.expiresAt).toLocaleDateString()
          : 'Active (1 Year)'
      }`,
      `----------------------------------------`,
      `Activation Link:  ${window.location.origin}`,
      `Support Helpline: 0592005260 / 0540712524`,
      `========================================`
    ].join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedKey('ALL_CREDENTIALS');
    toast.success('All school credentials copied in formatted text!');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `*EduMaster Pro - School Activation Credentials*%0A%0A*School Name:* ${school.name}%0A*School ID:* ${school.schoolId}%0A*License Key:* ${licenseKey}%0A*Activation Code:* ${activationCode}%0A*Security Token:* ${securityToken}%0A%0A*Activation Link:* ${window.location.origin}%0A%0A*Developer Support:* 0592005260 / 0540712524`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEditClick = () => {
    onClose();
    if (onEditSchool) {
      onEditSchool(school);
    } else if (onEdit) {
      onEdit(school);
    }
  };

  const handleDeleteClick = () => {
    onClose();
    if (onDeleteSchool) {
      onDeleteSchool(school);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">{school.name}</h3>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                    school.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : school.status === 'SUSPENDED'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {school.status || 'ACTIVE'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {school.schoolType || 'PRIMARY_JHS'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                School Tenant ID:{' '}
                <span className="font-mono text-blue-400 font-bold">{school.schoolId}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCredentials}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Refresh Credentials"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-950/20 border border-blue-500/20 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-medium">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Registered Security & License credentials for Super Admin provisioning.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyAll}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
              >
                {copiedKey === 'ALL_CREDENTIALS' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy All Credentials</span>
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Share</span>
              </button>
              <button
                onClick={handleEditClick}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit School</span>
              </button>
              {onDeleteSchool && (
                <button
                  onClick={handleDeleteClick}
                  className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Tenant</span>
                </button>
              )}
            </div>
          </div>

          {/* Core Security & License Credentials Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" /> Essential Security & License Codes
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* School ID Card */}
              <div className="bg-[#141724] border border-slate-800 p-4 rounded-2xl transition-all">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-400" /> School Tenant ID
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Tenant ID</span>
                </div>
                <div className="flex items-center justify-between bg-black/40 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-sm text-blue-300 font-bold">
                  <span>{school.schoolId}</span>
                  <button
                    onClick={() => handleCopy(school.schoolId, 'School ID')}
                    className="p-1 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                    title="Copy School ID"
                  >
                    {copiedKey === 'School ID' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* License Key Card */}
              <div className="bg-[#141724] border border-slate-800 p-4 rounded-2xl transition-all">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> System License Key
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {activeLicense?.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-black/40 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-sm text-emerald-300 font-bold">
                  <span className="truncate mr-2">{licenseKey}</span>
                  <button
                    onClick={() => handleCopy(licenseKey, 'License Key')}
                    className="p-1 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Copy License Key"
                  >
                    {copiedKey === 'License Key' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Activation Code Card */}
              <div className="bg-[#141724] border border-slate-800 p-4 rounded-2xl transition-all">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" /> School Activation Code
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    {credData?.activationCode?.status || 'VALID'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-black/40 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-sm text-amber-300 font-bold">
                  <span>{activationCode}</span>
                  <button
                    onClick={() => handleCopy(activationCode, 'Activation Code')}
                    className="p-1 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                    title="Copy Activation Code"
                  >
                    {copiedKey === 'Activation Code' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Registration Token Card */}
              <div className="bg-[#141724] border border-slate-800 p-4 rounded-2xl transition-all">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400" /> Security Registration Token
                  </span>
                  <span className="text-[10px] text-purple-400 font-mono font-bold">
                    {credData?.registrationToken?.status || 'SECURE'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-black/40 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-sm text-purple-300 font-bold">
                  <span className="truncate mr-2">{securityToken}</span>
                  <button
                    onClick={() => handleCopy(securityToken, 'Security Token')}
                    className="p-1 hover:bg-purple-500/20 text-slate-300 hover:text-purple-400 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Copy Security Token"
                  >
                    {copiedKey === 'Security Token' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* School Details & Subscription Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Contact & Location Details */}
            <div className="bg-[#12141f] border border-slate-800 p-5 rounded-2xl space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" /> Contact & Location Info
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" /> Contact Person
                  </span>
                  <span className="text-slate-200 font-semibold">{school.contactPerson || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> Phone Number
                  </span>
                  <span className="text-slate-200 font-mono font-semibold">{school.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" /> Official Email
                  </span>
                  <span className="text-slate-200 font-mono">{school.email || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> District / Region
                  </span>
                  <span className="text-slate-200 font-medium">
                    {school.district || 'District'}, {school.region || 'Region'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">Physical Address</span>
                  <span className="text-slate-300 truncate max-w-[200px]">{school.address || 'Ghana'}</span>
                </div>
              </div>
            </div>

            {/* Subscription & Expiration */}
            <div className="bg-[#12141f] border border-slate-800 p-5 rounded-2xl space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" /> Subscription & Term License
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Subscription Tier</span>
                  <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold rounded-md">
                    {school.subscriptionPlan || activeLicense?.subscriptionPlan || 'STANDARD'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Annual License Fee</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    GH₵ {school.subscriptionPrice || activeLicense?.price || 1200}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">License Expiration</span>
                  <span className="text-slate-200 font-mono font-semibold">
                    {activeLicense?.expiresAt
                      ? new Date(activeLicense.expiresAt).toLocaleDateString()
                      : '365 Days Valid'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Activation Status</span>
                  <span
                    className={`font-bold ${
                      school.activationStatus === 'ACTIVATED' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {school.activationStatus || 'ACTIVATED'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">Registration Date</span>
                  <span className="text-slate-300">
                    {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Portal Credentials Box */}
          <div className="bg-[#141829] border border-blue-900/30 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Lock className="w-4 h-4" /> School Administrator Portal Access
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-black/30 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-semibold mb-1">
                  Admin Login Identifier
                </span>
                <span className="text-slate-200 font-mono font-bold truncate block">
                  {credData?.adminUser?.email ||
                    school.email ||
                    'admin@' + school.schoolId.toLowerCase() + '.edu.gh'}
                </span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-semibold mb-1">
                  Default Initial Password
                </span>
                <span className="text-amber-400 font-mono font-bold">
                  {school.schoolId}@2026!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Super Admin Vault • All tenant credential access is logged in real-time.
          </span>
          <div className="flex items-center gap-3">
            {onDeleteSchool && (
              <button
                onClick={handleDeleteClick}
                className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Tenant</span>
              </button>
            )}
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> Edit School Info & Keys
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
