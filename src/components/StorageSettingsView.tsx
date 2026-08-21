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
  Database
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
  deleteSchoolAsset
} from '../lib/storageService';
import { getSchoolDetails } from '../lib/services';
import { School, StorageProviderConfig } from '../types';
import { PageHeader, Badge, Button, Select, Input } from './ui';

interface Props {
  schoolId: string;
}

export const StorageSettingsView: React.FC<Props> = ({ schoolId }) => {
  const [config, setConfig] = useState<StorageProviderConfig | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [folderTree, setFolderTree] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

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

  const handleProviderChange = async (provider: 'SUPABASE' | 'GOOGLE_DRIVE') => {
    if (!config) return;
    const updated = {
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
      setStatusMessage({ type: 'success', text: 'Storage configuration successfully updated and locked.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save storage settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogleDrive = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const updated = await connectGoogleDriveStorage(schoolId, school?.name);
      setConfig(updated);
      setStatusMessage({
        type: 'success',
        text: `Connected to Google Drive successfully. Root Folder: "${updated.rootFolderName || 'School Data'}"`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to authenticate Google Drive.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this storage provider? Existing files will remain preserved.')) return;
    setSaving(true);
    try {
      const updated = await disconnectStorageProvider(schoolId);
      setConfig(updated);
      setStatusMessage({ type: 'success', text: 'Storage provider disconnected. Switched to Supabase Storage.' });
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
      const res = await testStorageConnection(schoolId);
      setTestResult(res);
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
      setStatusMessage({ type: 'success', text: 'File deleted from storage provider.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete file.' });
    }
  };

  const filteredFiles = selectedFolder === 'ALL' ? files : files.filter((f) => f.category === selectedFolder);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Loading Storage Provider Architecture...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <PageHeader
        title="School Storage & Cloud Architecture"
        subtitle="Manage cloud storage providers, Google Drive OAuth integration, folder hierarchies, and tenant isolation policies."
        badge={<Badge variant="active" label="Storage Abstraction Online" icon={<ShieldCheck className="w-3 h-3" />} />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />}
              onClick={handleTestConnection}
              disabled={testing}
            >
              Test Connection
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={handleSaveConfig}
              loading={saving}
            >
              Save Configuration
            </Button>
          </div>
        }
      />

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />}
          <p>{statusMessage.text}</p>
        </div>
      )}

      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
          <div>
            <p className="font-bold">{testResult.success ? 'Diagnostic Test Passed' : 'Diagnostic Alert'}</p>
            <p className="text-[11px] opacity-90">{testResult.message}</p>
          </div>
        </div>
      )}

      {/* Storage Architecture Overview & Provider Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supabase Storage Provider Card */}
        <div
          onClick={() => handleProviderChange('SUPABASE')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all space-y-4 ${
            config?.provider === 'SUPABASE'
              ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Supabase Storage</h3>
                <p className="text-xs text-slate-500">Default Built-in High-Performance Object Storage</p>
              </div>
            </div>
            {config?.provider === 'SUPABASE' && (
              <Badge variant="active" label="Selected Provider" />
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Encrypted, multi-tenant isolated bucket storage governed strictly by PostgreSQL Row Level Security (RLS). Zero configuration required.
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Bucket: <strong>school-assets</strong></span>
            <span>•</span>
            <span>Tenant Isolation: <strong>ENFORCED</strong></span>
          </div>
        </div>

        {/* Google Drive Storage Provider Card */}
        <div
          onClick={() => handleProviderChange('GOOGLE_DRIVE')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all space-y-4 ${
            config?.provider === 'GOOGLE_DRIVE'
              ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Google Drive Storage</h3>
                <p className="text-xs text-slate-500">External Google Workspace Cloud Drive</p>
              </div>
            </div>
            {config?.provider === 'GOOGLE_DRIVE' && (
              <Badge variant="active" label="Selected Provider" />
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Store documents, reports, backups, and student photos inside your school's dedicated Google Drive hierarchy with auto-created folder structures.
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {config?.connectedAccount ? (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected: {config.connectedAccount}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-semibold">Not Connected</div>
            )}

            {config?.connectedAccount ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisconnect();
                }}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <Unlink className="w-3.5 h-3.5" /> Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnectGoogleDrive();
                }}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <Link2 className="w-3.5 h-3.5" /> Connect Google Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Canonical Folder Tree Hierarchy */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Canonical Folder Hierarchy</h3>
              <p className="text-xs text-slate-500">Standardized folder partition guaranteed for both Google Drive and Supabase storage engines</p>
            </div>
          </div>
          <Badge variant="neutral" label="Isolated Partition" />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2 text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
            <Folder className="w-4 h-4" />
            <span>Root: {folderTree?.rootFolderName || `${school?.name || 'School'}_${schoolId}`}</span>
          </div>

          <div className="pl-6 space-y-1.5 border-l-2 border-indigo-200 dark:border-indigo-900 ml-2">
            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
              <span className="flex items-center gap-2">📁 students/ (Student Passport Photos & Identity Records)</span>
              <span className="text-[10px] text-slate-400 uppercase">Passport Photo</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
              <span className="flex items-center gap-2">📁 teachers/ (Faculty Staff Profile Photos & Signatures)</span>
              <span className="text-[10px] text-slate-400 uppercase">Staff Records</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
              <span className="flex items-center gap-2">📁 logos/ (School Badges, Crests & Emblems)</span>
              <span className="text-[10px] text-slate-400 uppercase">Branding</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
              <span className="flex items-center gap-2">📁 documents/ (Official Transcripts, Testimonials, Letters)</span>
              <span className="text-[10px] text-slate-400 uppercase">Certification</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
              <span className="flex items-center gap-2">📁 reports/ (Generated Broadsheets & Terminal Report Cards)</span>
              <span className="text-[10px] text-slate-400 uppercase">Terminal Reports</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
              <span className="flex items-center gap-2">📁 backups/ (System Archives, CSV Exports, JSON Snapshots)</span>
              <span className="text-[10px] text-slate-400 uppercase">System Archive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Files Explorer */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tenant Storage Files Ledger</h3>
            <p className="text-xs text-slate-500">Every stored asset is registered with multi-tenant verification and SHA-256 verification</p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              label=""
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="PASSPORT_PHOTO">Student Photos</option>
              <option value="SCHOOL_LOGO">School Logos</option>
              <option value="REPORT_CARD">Report Cards</option>
              <option value="DOCUMENT">Official Documents</option>
              <option value="BACKUP">Backups</option>
            </Select>
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
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="truncate max-w-[200px]">{file.fileName || file.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {file.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{file.provider || 'SUPABASE'}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{(file.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(file.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
    </div>
  );
};
