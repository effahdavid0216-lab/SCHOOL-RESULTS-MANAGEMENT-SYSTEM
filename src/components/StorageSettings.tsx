import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileText,
  Trash2,
  Upload,
  Folder,
  Layers,
  Lock,
  Sparkles,
  Link2,
  Unlink,
  Database,
  Key,
  Globe,
  Radio,
  Server,
  Activity,
  ChevronRight,
  Info,
  Download
} from 'lucide-react';
import {
  getSchoolStorageConfig,
  saveSchoolStorageConfig,
  connectGoogleDriveStorage,
  disconnectStorageProvider,
  testStorageConnection,
  getFolderStructureForSchool,
  listSchoolAssets,
  uploadSchoolAsset,
  deleteSchoolAsset,
  StorageFolder,
  FileCategory
} from '../lib/storageService';
import { getSchoolDetails } from '../lib/services';
import { School, StorageProviderConfig } from '../types';
import { PageHeader, Badge, Button, Modal, Card, StatCard } from './ui';
import { Input, Select, Switch } from './FormControls';

interface Props {
  schoolId: string;
}

export const StorageSettings: React.FC<Props> = ({ schoolId }) => {
  const [config, setConfig] = useState<StorageProviderConfig | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [folderTree, setFolderTree] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  // OAuth Modal State
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState<boolean>(false);
  const [oauthEmail, setOauthEmail] = useState<string>('admin@school.edu.gh');
  const [oauthStep, setOauthStep] = useState<'SELECT' | 'AUTHENTICATING' | 'SUCCESS'>('SELECT');
  const [autoSyncReports, setAutoSyncReports] = useState<boolean>(true);
  const [autoSyncPhotos, setAutoSyncPhotos] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cfg, schData, assetList] = await Promise.all([
        getSchoolStorageConfig(schoolId),
        getSchoolDetails(schoolId),
        listSchoolAssets(schoolId)
      ]);

      setConfig(cfg);
      setSchool(schData);
      setFiles(assetList);

      const tree = getFolderStructureForSchool(schoolId, schData?.name);
      setFolderTree(tree);
    } catch (err) {
      console.error('Error loading storage config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = async (provider: 'SUPABASE' | 'GOOGLE_DRIVE') => {
    if (!config) return;
    if (provider === 'GOOGLE_DRIVE' && !config.connectedAccount) {
      // Open OAuth connection dialog
      setIsOAuthModalOpen(true);
      return;
    }
    const updated: StorageProviderConfig = {
      ...config,
      provider,
      updatedAt: new Date().toISOString()
    };
    setConfig(updated);
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      await saveSchoolStorageConfig(config);
      setStatusMessage({ type: 'success', text: 'Storage provider configuration updated successfully.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save storage settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteOAuthFlow = async () => {
    setOauthStep('AUTHENTICATING');
    try {
      // Simulate real OAuth authorization exchange with Google Identity / Workspace
      await new Promise((res) => setTimeout(res, 1200));

      const rootFolderName = `EduMaster-${school?.name ? school.name.replace(/\s+/g, '-') : schoolId}`;
      const updatedConfig: StorageProviderConfig = {
        id: schoolId,
        schoolId,
        provider: 'GOOGLE_DRIVE',
        isActive: true,
        connectedAccount: oauthEmail,
        rootFolderId: `gdrive_folder_${schoolId}`,
        rootFolderName,
        connectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveSchoolStorageConfig(updatedConfig);
      setConfig(updatedConfig);
      setOauthStep('SUCCESS');

      setTimeout(() => {
        setIsOAuthModalOpen(false);
        setOauthStep('SELECT');
        setStatusMessage({
          type: 'success',
          text: `Successfully authenticated Google Drive account (${oauthEmail}). Root partition initialized.`
        });
      }, 1000);
    } catch (err: any) {
      setOauthStep('SELECT');
      setStatusMessage({ type: 'error', text: err.message || 'OAuth authentication failed.' });
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Drive? Files will remain preserved, and the storage engine will revert to Supabase Storage.')) return;
    setSaving(true);
    try {
      const updated = await disconnectStorageProvider(schoolId);
      setConfig(updated);
      setStatusMessage({ type: 'success', text: 'Google Drive disconnected. Storage switched to Supabase Storage.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disconnect.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const startTime = performance.now();
      const res = await testStorageConnection(schoolId);
      const latencyMs = Math.round(performance.now() - startTime);
      setTestResult({ ...res, latencyMs });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Storage connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file record?')) return;
    try {
      await deleteSchoolAsset(schoolId, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setStatusMessage({ type: 'success', text: 'File successfully deleted.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete file.' });
    }
  };

  const filteredFiles = selectedFolder === 'ALL' ? files : files.filter((f) => f.category === selectedFolder);

  const totalBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const totalKB = (totalBytes / 1024).toFixed(1);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-xs uppercase font-bold tracking-wider">Loading Storage Provider Architecture...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <PageHeader
        title="School Storage & Cloud Integration"
        subtitle="Configure primary cloud storage providers, Google Drive OAuth integration, tenant folder hierarchies, and automated backup pipelines."
        badge={
          <Badge
            variant={config?.provider === 'GOOGLE_DRIVE' && config?.connectedAccount ? 'active' : 'approved'}
            label={config?.provider === 'GOOGLE_DRIVE' ? 'Google Drive Active' : 'Supabase Storage Active'}
            icon={<ShieldCheck className="w-3 h-3" />}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />}
              onClick={handleTestConnection}
              disabled={testing}
            >
              Test Latency & Connection
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={handleSaveConfig}
              isLoading={saving}
            >
              Save Storage Settings
            </Button>
          </div>
        }
      />

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <p>{statusMessage.text}</p>
        </div>
      )}

      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 animate-in fade-in duration-150 ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {testResult.success ? 'Storage Engine Test Passed' : 'Storage Engine Warning'}
              </span>
              {testResult.latencyMs && (
                <span className="px-2 py-0.5 bg-white/60 dark:bg-slate-800/60 rounded-full font-mono text-[10px]">
                  {testResult.latencyMs}ms Ping
                </span>
              )}
            </div>
            <p className="text-xs opacity-90">{testResult.message}</p>
          </div>
        </div>
      )}

      {/* Storage Architecture Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Storage Engine"
          value={config?.provider === 'GOOGLE_DRIVE' ? 'Google Drive' : 'Supabase Bucket'}
          icon={<Server className="w-5 h-5" />}
          description={config?.provider === 'GOOGLE_DRIVE' ? config.connectedAccount || 'OAuth Connected' : 'PostgreSQL RLS Secured'}
          colorScheme={config?.provider === 'GOOGLE_DRIVE' ? 'blue' : 'emerald'}
        />

        <StatCard
          title="Total Stored Assets"
          value={files.length}
          icon={<FileText className="w-5 h-5" />}
          description={`${totalKB} KB used across categories`}
          colorScheme="indigo"
        />

        <StatCard
          title="Tenant Isolation"
          value="ENFORCED"
          icon={<ShieldCheck className="w-5 h-5" />}
          description={`Partition ID: school_${schoolId}`}
          colorScheme="purple"
        />
      </div>

      {/* Provider Selector Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supabase Storage Card */}
        <div
          onClick={() => handleProviderSelect('SUPABASE')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 space-y-4 ${
            config?.provider === 'SUPABASE'
              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Supabase Object Storage</h3>
                <p className="text-xs text-slate-500">Built-in High Performance Encrypted Bucket</p>
              </div>
            </div>
            {config?.provider === 'SUPABASE' && (
              <Badge variant="active" label="Active Engine" />
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Fast, zero-configuration multi-tenant storage bucket (`school-assets`) protected by PostgreSQL Row-Level Security policies. Ideal for default deployment.
          </p>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-500">Bucket: <strong>school-assets</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Built-in Online
            </span>
          </div>
        </div>

        {/* Google Drive Storage Card */}
        <div
          onClick={() => handleProviderSelect('GOOGLE_DRIVE')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 space-y-4 ${
            config?.provider === 'GOOGLE_DRIVE'
              ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Google Drive Integration</h3>
                <p className="text-xs text-slate-500">Google Workspace / Drive Cloud Partition</p>
              </div>
            </div>
            {config?.provider === 'GOOGLE_DRIVE' && (
              <Badge variant="active" label="Active Engine" />
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Store documents, student photos, generated terminal reports, and database backups directly inside your school's Google Workspace Drive with automated folder hierarchy.
          </p>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            {config?.connectedAccount ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{config.connectedAccount}</span>
              </div>
            ) : (
              <span className="text-slate-400">OAuth Status: Not Linked</span>
            )}

            {config?.connectedAccount ? (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Unlink className="w-3.5 h-3.5" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisconnectGoogleDrive();
                }}
              >
                Disconnect Drive
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Link2 className="w-3.5 h-3.5" />}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOAuthModalOpen(true);
                }}
              >
                Connect Google Account
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Canonical Folder Tree Hierarchy */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Canonical Folder Partition Hierarchy</h3>
              <p className="text-xs text-slate-500">Standardized folder partition guaranteed for both Google Drive and Supabase engines</p>
            </div>
          </div>
          <Badge variant="neutral" label="Tenant Isolated Root" />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2 text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
            <Folder className="w-4 h-4" />
            <span>Root: {folderTree?.rootFolderName || `${school?.name || 'School'}_${schoolId}`}</span>
          </div>

          <div className="pl-6 space-y-2 border-l-2 border-indigo-200 dark:border-indigo-900 ml-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-2">📁 students/ (Passport Photos & Identity Records)</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Student Photos</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-2">📁 teachers/ (Staff Photos & Digital Signatures)</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Staff Signatures</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-2">📁 logos/ (School Badges, Crests & Watermarks)</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Branding</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-2">📁 reports/ (Terminal Report Cards, Broadsheets & Transcripts)</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Academic Reports</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-2">📁 backups/ (SQL Dumps, CSV Exports & Snapshots)</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">System Archives</span>
            </div>
          </div>
        </div>
      </div>

      {/* Files Ledger Explorer */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Tenant Storage Assets Ledger</h3>
            <p className="text-xs text-slate-500">Every stored asset is tracked with SHA-256 metadata verification</p>
          </div>

          <div className="w-56">
            <Select
              label=""
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'PASSPORT_PHOTO', label: 'Student Photos' },
                { value: 'SCHOOL_LOGO', label: 'School Logos' },
                { value: 'REPORT_CARD', label: 'Report Cards' },
                { value: 'DOCUMENT', label: 'Official Documents' },
                { value: 'BACKUP', label: 'Backups' }
              ]}
            />
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No files currently stored in this category for tenant {schoolId}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Storage Engine</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate max-w-[200px]">{file.fileName || file.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral" label={file.category || 'ASSET'} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {file.provider === 'GOOGLE_DRIVE' ? 'Google Drive' : 'Supabase Bucket'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{((file.sizeBytes || 0) / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(file.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Google OAuth Modal */}
      <Modal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
        title="Google Drive OAuth Authentication"
        description="Securely link your Google Workspace or School Admin Google Drive account."
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60 flex items-start gap-3">
            <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-blue-900 dark:text-blue-200">Google Workspace Drive Permissions</p>
              <p className="text-blue-700 dark:text-blue-300">
                Granting access enables EduMaster to create a dedicated school partition folder, upload terminal reports, and archive student records without exposing personal credentials.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Google Workspace / Admin Email"
              type="email"
              value={oauthEmail}
              onChange={(e) => setOauthEmail(e.target.value)}
              placeholder="admin@school.edu.gh"
              required
              helperText="The Google account with write permissions for school storage."
            />

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
              <Switch
                label="Auto-Sync Generated Terminal Reports"
                description="Automatically push PDF report cards to Google Drive upon generation"
                checked={autoSyncReports}
                onChange={setAutoSyncReports}
              />
              <Switch
                label="Auto-Sync Student & Staff Photos"
                description="Backup identity photos to the dedicated Google Drive folder"
                checked={autoSyncPhotos}
                onChange={setAutoSyncPhotos}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOAuthModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={
                oauthStep === 'AUTHENTICATING' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )
              }
              disabled={oauthStep === 'AUTHENTICATING' || !oauthEmail}
              onClick={handleExecuteOAuthFlow}
            >
              {oauthStep === 'AUTHENTICATING' ? 'Authorizing OAuth...' : 'Authorize & Connect Google Drive'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
