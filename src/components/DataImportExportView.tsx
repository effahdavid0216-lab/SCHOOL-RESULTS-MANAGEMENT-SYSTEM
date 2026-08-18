import React, { useState } from 'react';
import { Download, Upload, FileText, CheckCircle2, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { exportToCSV, generateSampleCSVTemplate, getStudentsBySchool, saveStudent } from '../lib/services';

interface Props {
  schoolId: string;
}

export const DataImportExportView: React.FC<Props> = ({ schoolId }) => {
  const [importType, setImportType] = useState<'STUDENTS' | 'TEACHERS' | 'SCORES'>('STUDENTS');
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDownloadTemplate = () => {
    const templateData = generateSampleCSVTemplate(importType);
    exportToCSV(`${importType.toLowerCase()}_sample_import_template.csv`, templateData);
  };

  const handleBatchExport = async () => {
    setLoading(true);
    const students = await getStudentsBySchool(schoolId);
    exportToCSV(`school_students_export_${new Date().toISOString().split('T')[0]}.csv`, students);
    setLoading(false);
  };

  const handleProcessImport = async () => {
    if (!importText.trim()) {
      setMsg({ type: 'error', text: 'Paste CSV or JSON formatted content to import.' });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const lines = importText.trim().split('\n');
      if (lines.length <= 1) {
        throw new Error('Import data appears empty or missing headers.');
      }

      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(s => s.trim());
        if (row.length >= 4 && importType === 'STUDENTS') {
          const fullName = row[0] || 'Student Name';
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || fullName;
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Student';
          const gender = row[2]?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE';

          await saveStudent({
            schoolId,
            studentId: row[1] || `ST-${Math.floor(1000 + Math.random() * 9000)}`,
            admissionNo: row[1] || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
            fullName,
            firstName,
            lastName,
            gender: gender as any,
            classId: 'class_001',
            className: row[3] || 'JHS 1',
            dateOfBirth: '2012-05-10',
            nationality: 'Ghanaian',
            academicYear: '2026/2027',
            schoolType: 'PRIMARY_JHS',
            admissionDate: new Date().toISOString().split('T')[0],
            status: 'ACTIVE',
            parentName: 'Parent/Guardian',
            parentRelationship: 'Father/Mother',
            parentPhone: row[4] || '0240000000',
            emergencyName: 'Parent/Guardian',
            emergencyPhone: row[4] || '0240000000',
            emergencyRelationship: 'Parent'
          });
          count++;
        }
      }

      setMsg({ type: 'success', text: `Successfully imported ${count} ${importType.toLowerCase()} records into system database!` });
      setImportText('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to process batch import.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f111a] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-light text-white serif italic">Data Migration, Import & Export Engine</h2>
            <p className="text-xs text-slate-400">Batch upload student rosters, staff lists & examination marks via CSV or Excel templates</p>
          </div>
        </div>

        <button
          onClick={handleBatchExport}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
        >
          <Download className="w-4 h-4" /> Export All Students CSV
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
          msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Main Import Workspace */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(['STUDENTS', 'TEACHERS', 'SCORES'] as const).map(t => (
              <button
                key={t}
                onClick={() => setImportType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                  importType === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#161925] border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Import {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 bg-[#161925] hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" /> Download Sample CSV Template
          </button>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
            Paste CSV Content (Headers: fullName, admissionNo, gender, className)
          </label>
          <textarea
            rows={8}
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={`fullName,admissionNo,gender,className\nKwame Mensah,ADM-2026-001,MALE,JHS 1\nAbena Osei,ADM-2026-002,FEMALE,JHS 1`}
            className="w-full bg-[#161925] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleProcessImport}
            disabled={loading || !importText.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Execute Data Batch Import
          </button>
        </div>
      </div>
    </div>
  );
};
