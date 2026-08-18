import React, { useState, useEffect } from 'react';
import { ArrowUpRight, GraduationCap, CheckCircle2, UserCheck, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { ClassItem, Student } from '../types';
import { getClassesBySchool, getStudentsBySchool, promoteStudentsBatch } from '../lib/services';

interface Props {
  schoolId: string;
}

export const PromotionModuleView: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [fromClassId, setFromClassId] = useState<string>('');
  const [toClassId, setToClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadClasses();
  }, [schoolId]);

  const loadClasses = async () => {
    setLoading(true);
    const clsList = await getClassesBySchool(schoolId);
    setClasses(clsList);
    if (clsList.length > 0) {
      setFromClassId(clsList[0].id);
      if (clsList.length > 1) setToClassId(clsList[1].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (fromClassId) {
      loadStudents();
    }
  }, [fromClassId]);

  const loadStudents = async () => {
    setLoading(true);
    const stList = await getStudentsBySchool(schoolId, fromClassId);
    setStudents(stList);
    setSelectedStudentIds(stList.map(s => s.id));
    setLoading(false);
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const handleToggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(stId => stId !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handlePromoteBatch = async () => {
    if (selectedStudentIds.length === 0) {
      setMsg({ type: 'error', text: 'Select at least one student to promote.' });
      return;
    }

    const fromCls = classes.find(c => c.id === fromClassId);
    const toCls = classes.find(c => c.id === toClassId);

    if (!toCls && toClassId !== 'GRADUATED') {
      setMsg({ type: 'error', text: 'Select a valid target destination class.' });
      return;
    }

    setPromoting(true);
    setMsg(null);

    try {
      await promoteStudentsBatch(
        schoolId,
        selectedStudentIds,
        toClassId === 'GRADUATED' ? 'GRADUATED' : toClassId,
        toClassId === 'GRADUATED' ? 'Graduated Alumni' : (toCls?.className || 'Class'),
        '2026/2027'
      );

      setMsg({
        type: 'success',
        text: `Successfully promoted ${selectedStudentIds.length} students from ${fromCls?.className} to ${toClassId === 'GRADUATED' ? 'Graduated Alumni' : toCls?.className}!`
      });

      loadStudents();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Promotion failed.' });
    } finally {
      setPromoting(false);
    }
  };

  if (loading && classes.length === 0) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading Academic Promotion Engine...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f111a] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-light text-white serif italic">Academic Class Promotion Engine</h2>
            <p className="text-xs text-slate-400">Batch transition students to the next academic grade, repeat classes or graduate JHS 3 / SHS 3 candidates</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
          msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Promotion Config */}
      <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Source Class (Current Grade)</label>
            <select
              value={fromClassId}
              onChange={e => setFromClassId(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 text-white text-xs rounded-xl p-3 outline-none focus:border-blue-500"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Target Destination (New Grade)</label>
            <select
              value={toClassId}
              onChange={e => setToClassId(e.target.value)}
              className="w-full bg-[#161925] border border-slate-700 text-white text-xs rounded-xl p-3 outline-none focus:border-blue-500"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
              <option value="GRADUATED">🎓 Graduated Alumni (Completed)</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <span className="text-xs text-slate-400">Selected {selectedStudentIds.length} of {students.length} students for promotion</span>
          <button
            onClick={handlePromoteBatch}
            disabled={promoting || selectedStudentIds.length === 0}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
            Execute Batch Promotion
          </button>
        </div>
      </div>

      {/* Student Checklist */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Class Roster Checklist</h3>
          <button
            onClick={handleToggleSelectAll}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="divide-y divide-slate-800 text-xs text-slate-300">
          {students.map(st => {
            const isSelected = selectedStudentIds.includes(st.id);
            return (
              <div key={st.id} className="p-3.5 flex items-center justify-between hover:bg-[#141724]">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleStudent(st.id)}
                    className="w-4 h-4 rounded border-slate-700 bg-[#161925] text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-white block">{st.fullName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Admission No: {st.admissionNo}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isSelected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
                }`}>
                  {isSelected ? 'TO BE PROMOTED' : 'HOLD / REPEAT'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
