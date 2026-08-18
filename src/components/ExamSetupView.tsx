import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  Sliders
} from 'lucide-react';
import {
  ExamConfig,
  SBAComponentConfig,
  GradingSystem,
  GradeBoundary
} from '../types';
import {
  getExamConfigsBySchool,
  saveExamConfig,
  getGradingSystemsBySchool,
  saveGradingSystem,
  deleteGradingSystem
} from '../lib/services';
import {
  DEFAULT_SBA_COMPONENTS,
  DEFAULT_BECE_GRADING,
  DEFAULT_WAEC_GRADING,
  DEFAULT_GPA_GRADING,
  getDefaultGradingBoundaries
} from '../lib/academicEngine';

interface Props {
  schoolId: string;
}

export const ExamSetupView: React.FC<Props> = ({ schoolId }) => {
  const [activeTab, setActiveTab] = useState<'SBA_SCALING' | 'GRADING_SYSTEM'>('GRADING_SYSTEM');
  
  // SBA Config State
  const [config, setConfig] = useState<ExamConfig | null>(null);
  
  // Grading Systems State
  const [gradingSystems, setGradingSystems] = useState<GradingSystem[]>([]);
  const [selectedGradingId, setSelectedGradingId] = useState<string>('');
  const [activeGradingSystem, setActiveGradingSystem] = useState<GradingSystem | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAllData();
  }, [schoolId]);

  const loadAllData = async () => {
    setLoading(true);
    const [configs, gradings] = await Promise.all([
      getExamConfigsBySchool(schoolId),
      getGradingSystemsBySchool(schoolId)
    ]);

    // Setup Exam/SBA Config
    if (configs.length > 0) {
      setConfig(configs[0]);
    } else {
      const defaultCfg: ExamConfig = {
        id: '',
        schoolId,
        examType: 'END_OF_TERM',
        name: 'Standard SBA + End-of-Term Examination',
        sbaTargetScale: 50,
        examTargetScale: 50,
        sbaComponents: [...DEFAULT_SBA_COMPONENTS],
        examMaxScore: 100,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setConfig(defaultCfg);
    }

    // Setup Grading Systems
    if (gradings.length > 0) {
      setGradingSystems(gradings);
      setSelectedGradingId(gradings[0].id);
      setActiveGradingSystem(gradings[0]);
    } else {
      const defaultBece: GradingSystem = {
        id: 'bece_default',
        schoolId,
        name: 'BECE / Basic Education 9-Point Scale',
        type: 'BECE',
        boundaries: [...DEFAULT_BECE_GRADING],
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      setGradingSystems([defaultBece]);
      setSelectedGradingId(defaultBece.id);
      setActiveGradingSystem(defaultBece);
    }

    setLoading(false);
  };

  const handleSelectGrading = (id: string) => {
    setSelectedGradingId(id);
    const found = gradingSystems.find(g => g.id === id);
    if (found) {
      setActiveGradingSystem(JSON.parse(JSON.stringify(found)));
    }
  };

  // Grade Boundary Modifications
  const handleBoundaryChange = (index: number, field: keyof GradeBoundary, value: any) => {
    if (!activeGradingSystem) return;
    const updatedBoundaries = [...activeGradingSystem.boundaries];
    updatedBoundaries[index] = {
      ...updatedBoundaries[index],
      [field]: field === 'minScore' || field === 'maxScore' || field === 'points' ? Number(value) : value
    };
    setActiveGradingSystem({
      ...activeGradingSystem,
      boundaries: updatedBoundaries
    });
  };

  const handleAddBoundary = () => {
    if (!activeGradingSystem) return;
    const newBoundary: GradeBoundary = {
      grade: 'NEW',
      minScore: 0,
      maxScore: 40,
      points: 1,
      remarks: 'PASS'
    };
    setActiveGradingSystem({
      ...activeGradingSystem,
      boundaries: [...activeGradingSystem.boundaries, newBoundary]
    });
  };

  const handleRemoveBoundary = (index: number) => {
    if (!activeGradingSystem) return;
    const updated = activeGradingSystem.boundaries.filter((_, i) => i !== index);
    setActiveGradingSystem({
      ...activeGradingSystem,
      boundaries: updated
    });
  };

  const handleApplyPreset = (type: 'BECE' | 'WAEC' | 'GPA') => {
    if (!activeGradingSystem) return;
    const presetBoundaries = getDefaultGradingBoundaries(type);
    const nameMap: Record<string, string> = {
      BECE: 'BECE / Basic Education 9-Point Scale',
      WAEC: 'WAEC / WASSCE Senior High Scale',
      GPA: 'Standard GPA 4.0 Grading Scale'
    };

    setActiveGradingSystem({
      ...activeGradingSystem,
      type,
      name: nameMap[type] || `${type} Scale`,
      boundaries: presetBoundaries
    });
    setMsg({ type: 'success', text: `Loaded ${type} standard boundaries. You can customize scores and remarks below.` });
  };

  const handleCreateNewGradingSystem = () => {
    const newSys: GradingSystem = {
      id: `grading_${Date.now()}`,
      schoolId,
      name: 'Custom School Scale',
      type: 'CUSTOM',
      boundaries: [...DEFAULT_BECE_GRADING],
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    setGradingSystems([...gradingSystems, newSys]);
    setSelectedGradingId(newSys.id);
    setActiveGradingSystem(newSys);
  };

  const handleDeleteActiveGrading = async () => {
    if (!activeGradingSystem) return;
    if (gradingSystems.length <= 1) {
      setMsg({ type: 'error', text: 'You must have at least one active grading system in the school.' });
      return;
    }

    if (confirm(`Are you sure you want to delete "${activeGradingSystem.name}"?`)) {
      setSaving(true);
      try {
        if (!activeGradingSystem.id.startsWith('bece_default')) {
          await deleteGradingSystem(activeGradingSystem.id);
        }
        const remaining = gradingSystems.filter(g => g.id !== activeGradingSystem.id);
        setGradingSystems(remaining);
        setSelectedGradingId(remaining[0].id);
        setActiveGradingSystem(remaining[0]);
        setMsg({ type: 'success', text: 'Grading scale deleted successfully.' });
      } catch (err: any) {
        setMsg({ type: 'error', text: err.message || 'Failed to delete grading system.' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveGradingSystem = async () => {
    if (!activeGradingSystem) return;
    setSaving(true);
    setMsg(null);
    try {
      const savedId = await saveGradingSystem(activeGradingSystem);
      const updatedList = gradingSystems.map(g => g.id === activeGradingSystem.id ? { ...activeGradingSystem, id: savedId } : g);
      setGradingSystems(updatedList);
      setMsg({ type: 'success', text: `Grading system "${activeGradingSystem.name}" updated successfully.` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save grading system.' });
    } finally {
      setSaving(false);
    }
  };

  // SBA Handlers
  const handleComponentChange = (index: number, field: keyof SBAComponentConfig, value: any) => {
    if (!config) return;
    const updated = [...config.sbaComponents];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, sbaComponents: updated });
  };

  const handleAddComponent = () => {
    if (!config) return;
    const newComp: SBAComponentConfig = {
      id: `comp_${Date.now()}`,
      key: `comp_${Date.now()}`,
      name: 'NEW SBA ASSIGNMENT',
      maxScore: 10,
      weightPercent: 10,
      status: 'ACTIVE'
    };
    setConfig({ ...config, sbaComponents: [...config.sbaComponents, newComp] });
  };

  const handleRemoveComponent = (index: number) => {
    if (!config) return;
    const updated = config.sbaComponents.filter((_, i) => i !== index);
    setConfig({ ...config, sbaComponents: updated });
  };

  const handleResetDefaults = () => {
    if (!config) return;
    setConfig({
      ...config,
      sbaTargetScale: 50,
      examTargetScale: 50,
      examMaxScore: 100,
      sbaComponents: [...DEFAULT_SBA_COMPONENTS]
    });
    setMsg({ type: 'success', text: 'Reset to standard Ghana Education Service (GES) SBA components (15/15/15/15 = 60 scaled to 50).' });
  };

  const handleSaveSbaConfig = async () => {
    if (!config) return;
    setSaving(true);
    setMsg(null);
    try {
      await saveExamConfig(config);
      setMsg({ type: 'success', text: 'Exam and SBA configurations saved successfully.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs uppercase tracking-wider">Loading Examination & Academic Grading Engine...</p>
      </div>
    );
  }

  const currentSbaMaxTotal = config?.sbaComponents
    .filter(c => c.status === 'ACTIVE')
    .reduce((acc, curr) => acc + (Number(curr.maxScore) || 0), 0) || 0;

  const isStandard60 = currentSbaMaxTotal === 60;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              GES ACADEMIC ASSESSMENT ENGINE
            </span>
          </div>
          <h2 className="text-xl font-light text-white serif italic">Academic Grading & SBA Scaling Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Customize score boundaries, minimum/maximum thresholds, letter grades, GPA points, and official remarks for BECE, WAEC, and GPA.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-[#161925] p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('GRADING_SYSTEM')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'GRADING_SYSTEM' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Grading Scales & Remarks
          </button>
          <button
            onClick={() => setActiveTab('SBA_SCALING')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'SBA_SCALING' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> SBA & Exam Scaling
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-lg ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-[10px] text-slate-400 hover:text-white cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* TAB 1: GRADING SYSTEM & REMARKS */}
      {activeTab === 'GRADING_SYSTEM' && (
        <div className="space-y-6">
          {/* Grading System Selector & Presets */}
          <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-light text-white serif italic">Grading System Configuration</h3>
                  <p className="text-xs text-slate-400">Select active grading scheme or customize min/max boundaries and remarks.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCreateNewGradingSystem}
                  className="px-3 py-1.5 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Scale
                </button>
                <button
                  onClick={handleSaveGradingSystem}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Saving Scale...' : 'Save Grading Scale'}
                </button>
              </div>
            </div>

            {/* Presets Bar */}
            <div className="p-4 bg-[#161925] border border-slate-800 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Active Scheme:</label>
                  <select
                    value={selectedGradingId}
                    onChange={(e) => handleSelectGrading(e.target.value)}
                    className="bg-[#0f111a] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {gradingSystems.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.type})</option>
                    ))}
                  </select>
                </div>

                {/* Instant Presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Load GES Presets:</span>
                  <button
                    onClick={() => handleApplyPreset('BECE')}
                    className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    BECE (1-9)
                  </button>
                  <button
                    onClick={() => handleApplyPreset('WAEC')}
                    className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    WAEC / WASSCE (A1-F9)
                  </button>
                  <button
                    onClick={() => handleApplyPreset('GPA')}
                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    GPA 4.0 (A-F)
                  </button>
                </div>
              </div>

              {activeGradingSystem && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Grading Scale Title</label>
                    <input
                      type="text"
                      value={activeGradingSystem.name}
                      onChange={(e) => setActiveGradingSystem({ ...activeGradingSystem, name: e.target.value })}
                      className="w-full bg-[#0f111a] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Standard Type</label>
                    <select
                      value={activeGradingSystem.type}
                      onChange={(e) => setActiveGradingSystem({ ...activeGradingSystem, type: e.target.value as any })}
                      className="w-full bg-[#0f111a] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="BECE">BECE Standard (Ghana Basic Education Certificate Exam)</option>
                      <option value="WAEC">WAEC / WASSCE (West African Senior School Certificate)</option>
                      <option value="GPA">Grade Point Average (4.0 Scale)</option>
                      <option value="CUSTOM">Custom Institutional Scale</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editable Boundaries Table */}
          {activeGradingSystem && (
            <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-light text-white serif italic">Score Boundaries, Letter Grades & Remarks</h3>
                  <p className="text-xs text-slate-400">Edit min score, max score, grade code, and the printed remarks for report cards.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddBoundary}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                  {gradingSystems.length > 1 && (
                    <button
                      onClick={handleDeleteActiveGrading}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Scheme
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3">Min Score (%)</th>
                      <th className="py-2.5 px-3">Max Score (%)</th>
                      <th className="py-2.5 px-3">Points / Weight</th>
                      <th className="py-2.5 px-3">Official Remarks (Printed on Report Card)</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-mono">
                    {activeGradingSystem.boundaries.map((boundary, idx) => (
                      <tr key={idx} className="hover:bg-[#161925] transition-colors">
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={boundary.grade}
                            onChange={(e) => handleBoundaryChange(idx, 'grade', e.target.value.toUpperCase())}
                            className="bg-[#161925] border border-slate-700 text-white font-bold text-center rounded-lg px-2 py-1.5 text-xs w-20 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={boundary.minScore}
                            onChange={(e) => handleBoundaryChange(idx, 'minScore', e.target.value)}
                            className="bg-[#161925] border border-slate-700 text-white font-semibold rounded-lg px-2.5 py-1.5 text-xs w-24 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={boundary.maxScore}
                            onChange={(e) => handleBoundaryChange(idx, 'maxScore', e.target.value)}
                            className="bg-[#161925] border border-slate-700 text-white font-semibold rounded-lg px-2.5 py-1.5 text-xs w-24 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            step="0.1"
                            value={boundary.points}
                            onChange={(e) => handleBoundaryChange(idx, 'points', e.target.value)}
                            className="bg-[#161925] border border-slate-700 text-cyan-300 font-bold rounded-lg px-2.5 py-1.5 text-xs w-20 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <input
                            type="text"
                            value={boundary.remarks}
                            onChange={(e) => handleBoundaryChange(idx, 'remarks', e.target.value.toUpperCase())}
                            className="bg-[#161925] border border-slate-700 text-white font-medium rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500"
                            placeholder="e.g. EXCELLENT, VERY GOOD, CREDIT"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleRemoveBoundary(idx)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Remove boundary"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SBA & EXAM SCALING */}
      {activeTab === 'SBA_SCALING' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scaling Target Parameters */}
            <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-base font-light text-white serif italic">Target Scaling Parameters</h3>
              
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    SBA Scaled Weight (Target % / Points)
                  </label>
                  <input
                    type="number"
                    value={config?.sbaTargetScale || 50}
                    onChange={(e) => config && setConfig({ ...config, sbaTargetScale: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default GES standard: 50% (or 30% for SHS).</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Exam Scaled Weight (Target % / Points)
                  </label>
                  <input
                    type="number"
                    value={config?.examTargetScale || 50}
                    onChange={(e) => config && setConfig({ ...config, examTargetScale: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default GES standard: 50% (or 70% for SHS).</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Raw End-of-Term Exam Maximum Score
                  </label>
                  <input
                    type="number"
                    value={config?.examMaxScore || 100}
                    onChange={(e) => config && setConfig({ ...config, examMaxScore: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">The maximum marks on the exam paper (e.g. 100).</span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleResetDefaults}
                    className="px-3.5 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset Default (60➔50)
                  </button>
                  <button
                    onClick={handleSaveSbaConfig}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save SBA Setup
                  </button>
                </div>
              </div>
            </div>

            {/* Total SBA Weight Status */}
            <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-base font-light text-white serif italic flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active SBA Total Raw Weight
              </h3>

              <div className="p-4 bg-[#161925] border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Active Raw SBA Max:</span>
                  <span className="text-lg font-bold text-white font-mono">{currentSbaMaxTotal} Points</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">SBA Scaling Ratio:</span>
                  <span className="text-xs font-mono text-blue-400 font-semibold">
                    ({currentSbaMaxTotal} Raw) ➔ ({config?.sbaTargetScale || 50} Scaled)
                  </span>
                </div>

                {!isStandard60 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] rounded-lg flex items-start gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Notice: Standard GES SBA total raw score is 60 (15+15+15+15). Your total is {currentSbaMaxTotal}. The scaling engine auto-scales {currentSbaMaxTotal} to {config?.sbaTargetScale || 50}.
                    </span>
                  </div>
                )}

                {isStandard60 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] rounded-lg flex items-center gap-2 mt-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Standard Ghana Education Service (GES) SBA structure active (49/60 ➔ 40.83/50).</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SBA Components Table */}
          <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-light text-white serif italic">SBA Components Breakdown</h3>
              <button
                onClick={handleAddComponent}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Component
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Component Name</th>
                    <th className="py-2.5 px-3">Max Raw Score</th>
                    <th className="py-2.5 px-3">Weight (%)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {config?.sbaComponents.map((comp, idx) => (
                    <tr key={comp.id} className="hover:bg-[#161925]">
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={comp.name}
                          onChange={(e) => handleComponentChange(idx, 'name', e.target.value.toUpperCase())}
                          className="bg-[#161925] border border-slate-700 text-white font-semibold rounded-lg px-2.5 py-1 text-xs w-full focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          value={comp.maxScore}
                          onChange={(e) => handleComponentChange(idx, 'maxScore', Number(e.target.value))}
                          className="bg-[#161925] border border-slate-700 text-white font-semibold rounded-lg px-2.5 py-1 text-xs w-24 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          value={comp.weightPercent}
                          onChange={(e) => handleComponentChange(idx, 'weightPercent', Number(e.target.value))}
                          className="bg-[#161925] border border-slate-700 text-white font-semibold rounded-lg px-2.5 py-1 text-xs w-24 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={comp.status}
                          onChange={(e) => handleComponentChange(idx, 'status', e.target.value as 'ACTIVE' | 'INACTIVE')}
                          className="bg-[#161925] border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleRemoveComponent(idx)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove component"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
