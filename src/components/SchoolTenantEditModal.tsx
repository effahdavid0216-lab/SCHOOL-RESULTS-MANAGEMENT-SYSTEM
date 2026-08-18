import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Building,
  Key,
  ShieldCheck,
  Lock,
  Calendar,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Sparkles,
  AlertCircle,
  FileText
} from 'lucide-react';
import { School, License, SchoolType, SubscriptionPlan } from '../types';
import { getSchoolCredentialsFull, updateSchoolTenantFull, SchoolFullCredentials } from '../lib/services';
import { generateSecureLicenseKey, generateActivationCode, generateSecurityToken } from '../lib/licenseService';
import toast from 'react-hot-toast';

interface SchoolTenantEditModalProps {
  school: School;
  initialLicense?: License;
  onClose: () => void;
  onSaved: (updatedSchool: School) => void;
}

export const SchoolTenantEditModal: React.FC<SchoolTenantEditModalProps> = ({
  school,
  initialLicense,
  onClose,
  onSaved
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState(school.name || '');
  const [schoolType, setSchoolType] = useState<SchoolType>(school.schoolType || 'PRIMARY_JHS');
  const [contactPerson, setContactPerson] = useState(school.contactPerson || '');
  const [phone, setPhone] = useState(school.phone || '');
  const [altPhone, setAltPhone] = useState(school.altPhone || '');
  const [email, setEmail] = useState(school.email || '');
  const [address, setAddress] = useState(school.address || '');
  const [district, setDistrict] = useState(school.district || '');
  const [region, setRegion] = useState(school.region || '');
  const [country, setCountry] = useState(school.country || 'Ghana');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'PENDING_ACTIVATION'>(
    (school.status as any) || 'ACTIVE'
  );
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(
    school.subscriptionPlan || initialLicense?.subscriptionPlan || 'STANDARD'
  );
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(
    school.subscriptionPrice || initialLicense?.price || 1200
  );
  const [licenseKey, setLicenseKey] = useState(initialLicense?.licenseKey || '');
  const [activationCode, setActivationCode] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [durationDays, setDurationDays] = useState<number>(initialLicense?.durationDays || 365);
  const [notes, setNotes] = useState(school.notes || '');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  useEffect(() => {
    const loadFullCredentials = async () => {
      setLoading(true);
      try {
        const full = await getSchoolCredentialsFull(school.schoolId);
        if (full.school) {
          setName(full.school.name || school.name);
          setSchoolType(full.school.schoolType || school.schoolType || 'PRIMARY_JHS');
          setContactPerson(full.school.contactPerson || school.contactPerson || '');
          setPhone(full.school.phone || school.phone || '');
          setAltPhone(full.school.altPhone || school.altPhone || '');
          setEmail(full.school.email || school.email || '');
          setAddress(full.school.address || school.address || '');
          setDistrict(full.school.district || school.district || '');
          setRegion(full.school.region || school.region || '');
          setCountry(full.school.country || school.country || 'Ghana');
          setStatus((full.school.status as any) || 'ACTIVE');
          setSubscriptionPlan(full.school.subscriptionPlan || 'STANDARD');
          setSubscriptionPrice(full.school.subscriptionPrice || 1200);
          setNotes(full.school.notes || '');
        }

        if (full.license) {
          setLicenseKey(full.license.licenseKey);
          setDurationDays(full.license.durationDays || 365);
        } else {
          setLicenseKey('LIC-' + school.schoolId + '-STD');
        }

        if (full.activationCode) {
          setActivationCode(full.activationCode.code);
        } else {
          setActivationCode('ACT-' + school.schoolId.replace(/[^A-Z0-9]/gi, '').slice(0, 6) + '-2026');
        }

        if (full.registrationToken) {
          setRegistrationToken(full.registrationToken.token);
        } else {
          setRegistrationToken('TOK-' + school.schoolId.replace(/[^A-Z0-9]/gi, '').slice(0, 6) + '-SEC');
        }
      } catch (err: any) {
        console.error('Error fetching full tenant data for edit:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFullCredentials();
  }, [school.schoolId]);

  const handlePlanChange = (plan: SubscriptionPlan) => {
    setSubscriptionPlan(plan);
    const defaultPrices: Record<SubscriptionPlan, number> = {
      BASIC: 500,
      STANDARD: 1200,
      PREMIUM: 2500,
      ENTERPRISE: 5000,
      TRIAL: 0
    };
    setSubscriptionPrice(defaultPrices[plan] || 1200);
  };

  const handleRegenerateKeys = async () => {
    const newLic = generateSecureLicenseKey(school.schoolId, durationDays);
    const newAct = generateActivationCode(school.schoolId);
    const newTok = await generateSecurityToken(school.schoolId, newAct);
    setLicenseKey(newLic);
    setActivationCode(newAct);
    setRegistrationToken(newTok);
    toast.success('Generated fresh License Key, Activation Code, and Token!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Explicit field string format validations
    if (!name.trim() || name.trim().length < 3) {
      toast.error('School Name must be at least 3 characters long.');
      return;
    }

    if (licenseKey.trim() && licenseKey.trim().length < 8) {
      toast.error('License Key must follow the standard license string format (min 8 characters, e.g. LIC-GH-XXXX).');
      return;
    }

    if (activationCode.trim() && activationCode.trim().length < 6) {
      toast.error('Activation Code must be a valid alphanumeric key (min 6 characters, e.g. ACT-XXXX-2026).');
      return;
    }

    if (registrationToken.trim() && registrationToken.trim().length < 8) {
      toast.error('Security Token must be a valid security hash string (min 8 characters).');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid official email address format.');
      return;
    }

    if (durationDays < 1 || isNaN(durationDays)) {
      toast.error('Duration days must be a positive number (minimum 1 day).');
      return;
    }

    setSaving(true);
    try {
      const exp = new Date();
      exp.setDate(exp.getDate() + durationDays);

      const updatedSchoolData: Partial<School> = {
        name: name.trim(),
        schoolType,
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        altPhone: altPhone.trim(),
        email: email.trim(),
        address: address.trim(),
        district: district.trim(),
        region: region.trim(),
        country: country.trim(),
        status: status as any,
        subscriptionPlan,
        subscriptionPrice: Number(subscriptionPrice),
        notes: notes.trim()
      };

      await updateSchoolTenantFull(
        school.schoolId,
        updatedSchoolData,
        {
          licenseKey: licenseKey.trim(),
          durationDays: Number(durationDays),
          expiresAt: exp.toISOString(),
          status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
          subscriptionPlan,
          price: Number(subscriptionPrice)
        },
        {
          activationCode: activationCode.trim(),
          registrationToken: registrationToken.trim(),
          adminPassword: newAdminPassword.trim() ? newAdminPassword.trim() : undefined
        }
      );

      const finalSchool: School = {
        ...school,
        ...updatedSchoolData
      } as School;

      toast.success(`School tenant "${name}" updated successfully!`);
      onSaved(finalSchool);
      onClose();
    } catch (err: any) {
      console.error('Failed to update school tenant:', err);
      toast.error(`Update failed: ${err.message || 'Server error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Edit School Tenant</h3>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                  {school.schoolId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Super Admin Master Tenant Editor • Update profile, subscription, and security keys.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs">Loading tenant configuration & security vault...</p>
            </div>
          ) : (
            <>
              {/* Basic Information */}
              <div className="space-y-4 bg-[#141724] border border-slate-800 p-5 rounded-2xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-400" /> School Tenant Profile
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">School Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Great Academic Heights Complex"
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">School Level / Category</label>
                    <select
                      value={schoolType}
                      onChange={(e) => setSchoolType(e.target.value as SchoolType)}
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="PRIMARY_JHS">Combined Primary & JHS (Basic School)</option>
                      <option value="PRIMARY">Primary School Only</option>
                      <option value="JHS">Junior High School (JHS Only)</option>
                      <option value="SHS">Senior High School (SHS / TVET)</option>
                      <option value="NURSERY_KINDERGARTEN">Early Childhood & Kindergarten</option>
                      <option value="BASIC">Full Basic (KG to JHS)</option>
                      <option value="OTHER">International / Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Tenant Account Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE (Full Access)</option>
                      <option value="SUSPENDED">SUSPENDED (Restricted)</option>
                      <option value="EXPIRED">EXPIRED (Renewal Required)</option>
                      <option value="PENDING_ACTIVATION">PENDING_ACTIVATION (Awaiting Setup)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Contact Person (Headmaster)</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Rev. Dr. Kofi Mensah"
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Official Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0244123456"
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Official Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@school.edu.gh"
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">District / Municipality</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Kumasi Metro"
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Region</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. Ashanti Region"
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Physical Campus Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Plot 14, Ring Road Central, Near Post Office"
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription & Pricing Tier */}
              <div className="space-y-4 bg-[#141724] border border-slate-800 p-5 rounded-2xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Subscription Plan & Duration
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Subscription Plan</label>
                    <select
                      value={subscriptionPlan}
                      onChange={(e) => handlePlanChange(e.target.value as SubscriptionPlan)}
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="BASIC">BASIC (GH₵ 500/yr)</option>
                      <option value="STANDARD">STANDARD (GH₵ 1,200/yr)</option>
                      <option value="PREMIUM">PREMIUM (GH₵ 2,500/yr)</option>
                      <option value="ENTERPRISE">ENTERPRISE (GH₵ 5,000/yr)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Annual Fee (GH₵)</label>
                    <input
                      type="number"
                      value={subscriptionPrice}
                      onChange={(e) => setSubscriptionPrice(Number(e.target.value))}
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Duration (Days)</label>
                    <input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* License & Security Credentials Vault */}
              <div className="space-y-4 bg-[#141724] border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" /> License & Security Credentials
                  </h4>
                  <button
                    type="button"
                    onClick={handleRegenerateKeys}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Regenerate Live Keys
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">License Key</label>
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      placeholder="e.g. LIC-GH-2026-XXXX"
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Activation Code</label>
                    <input
                      type="text"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value)}
                      placeholder="e.g. ACT-XXXX-2026"
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Security Token</label>
                    <input
                      type="text"
                      value={registrationToken}
                      onChange={(e) => setRegistrationToken(e.target.value)}
                      placeholder="e.g. TOK-XXXX-SEC"
                      className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-purple-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Password Override & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-[#141724] border border-slate-800 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" /> Admin Password Override
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Leave blank to keep existing password, or enter a new temporary password for the School Admin.
                  </p>
                  <input
                    type="text"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new administrator password..."
                    className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2 bg-[#141724] border border-slate-800 p-5 rounded-2xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> Super Admin Notes
                  </h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Special agreements, payment notes, or deployment records..."
                    className="w-full bg-[#0a0b10] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between -mx-6 -mb-6 mt-6 rounded-b-3xl">
            <span className="text-xs text-slate-400">
              Changes will take effect across the database and update tenant access immediately.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
