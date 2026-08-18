import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  CheckCircle,
  Archive,
  RefreshCw,
  Loader2,
  Layers
} from 'lucide-react';
import { SubjectItem, SubjectType, SchoolType } from '../types';
import {
  getSubjectsBySchool,
  saveSubjectItem,
  deleteSubjectItem
} from '../lib/services';

interface Props {
  schoolId: string;
  schoolType?: SchoolType;
}

export const SubjectManagement: React.FC<Props> = ({ schoolId, schoolType = 'PRIMARY_JHS' }) => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | SubjectType>('ALL');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Partial<SubjectItem> | null>(null);

  // Form State
  const [subjectName, setSubjectName] = useState('');
  const [code, setCode] = useState('');
  const [subjectType, setSubjectType] = useState<SubjectType>('CORE');
  const [subSchoolType, setSubSchoolType] = useState<SchoolType>(schoolType);

  useEffect(() => {
    loadSubjects();
  }, [schoolId, schoolType]);

  const loadSubjects = async () => {
    setLoading(true);
    const list = await getSubjectsBySchool(schoolId);
    setSubjects(list);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setSubjectName('');
    setCode('');
    setSubjectType('CORE');
    setSubSchoolType(schoolType);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setSubjectName(sub.subjectName);
    setCode(sub.code || '');
    setSubjectType(sub.subjectType);
    setSubSchoolType(sub.schoolType);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSubjectItem({
      id: editingSubject?.id,
      schoolId,
      subjectName,
      code: code || subjectName.slice(0, 3).toUpperCase(),
      subjectType,
      schoolType: subSchoolType,
      status: 'ACTIVE'
    });
    setIsModalOpen(false);
    loadSubjects();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to archive this subject? Existing marks will be preserved.')) {
      await deleteSubjectItem(id);
      loadSubjects();
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || s.subjectType === selectedCategory;
    const matchesLevel = selectedLevelFilter === 'ALL' || s.schoolType === selectedLevelFilter || s.schoolType === 'PRIMARY_JHS';
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-light text-white serif italic flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Subject & Curriculum Setup
          </h2>
          <p className="text-xs text-slate-400">
            Categorize curriculum under CORE, ELECTIVE, and LANGUAGE with dynamic school level filtering.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 cursor-pointer tracking-wider uppercase"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Category Tabs & Filter Bar */}
      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            {(['ALL', 'CORE', 'ELECTIVE', 'LANGUAGE'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#161925] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value)}
              className="px-3 py-2 bg-[#161925] border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All School Levels</option>
              <option value="PRIMARY">PRIMARY ONLY</option>
              <option value="JHS">JHS ONLY</option>
            </select>

            <input
              type="text"
              placeholder="Search subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 bg-[#161925] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading curriculum subjects...</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161925] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Subject Name</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">School Level</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No subject records found. Click "Add Subject" to create one.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((s) => (
                  <tr key={s.id} className="hover:bg-[#161925]/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{s.subjectName}</td>
                    <td className="px-6 py-4 font-mono text-blue-400 font-bold">{s.code}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${
                        s.subjectType === 'CORE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        s.subjectType === 'ELECTIVE' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        {s.subjectType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{s.schoolType.replace('_', ' + ')}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold text-[10px] uppercase">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-[#161925] cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#161925] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs text-slate-200">
            <h3 className="text-lg font-light text-white serif italic">
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Code</label>
                <input
                  type="text"
                  placeholder="e.g. MATH"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Subject Category *</label>
                <select
                  value={subjectType}
                  onChange={(e) => setSubjectType(e.target.value as SubjectType)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="CORE">CORE</option>
                  <option value="ELECTIVE">ELECTIVE</option>
                  <option value="LANGUAGE">LANGUAGE</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">School Level Assignment *</label>
                <select
                  value={subSchoolType}
                  onChange={(e) => setSubSchoolType(e.target.value as SchoolType)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="PRIMARY_JHS">PRIMARY + JHS (Both Levels)</option>
                  <option value="PRIMARY">PRIMARY ONLY</option>
                  <option value="JHS">JHS ONLY</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#161925] border border-slate-700 hover:bg-slate-800 font-semibold text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-semibold text-white rounded-xl shadow-lg shadow-blue-900/20 text-xs tracking-wider uppercase cursor-pointer"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
