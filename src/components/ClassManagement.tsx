import React, { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  UserCheck,
  Loader2
} from 'lucide-react';
import { ClassItem, Teacher } from '../types';
import {
  getClassesBySchool,
  saveClassItem,
  deleteClassItem,
  getTeachersBySchool
} from '../lib/services';

interface Props {
  schoolId: string;
}

export const ClassManagement: React.FC<Props> = ({ schoolId }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<ClassItem> | null>(null);

  // Form State
  const [className, setClassName] = useState('');
  const [level, setLevel] = useState('JHS');
  const [stream, setStream] = useState('A');
  const [capacity, setCapacity] = useState(35);
  const [classTeacherId, setClassTeacherId] = useState('');

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [cList, tList] = await Promise.all([
      getClassesBySchool(schoolId),
      getTeachersBySchool(schoolId)
    ]);
    setClasses(cList);
    setTeachers(tList);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setClassName('');
    setLevel('JHS');
    setStream('A');
    setCapacity(35);
    setClassTeacherId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassName(cls.className);
    setLevel(cls.level);
    setStream(cls.stream || 'A');
    setCapacity(cls.capacity || 35);
    setClassTeacherId(cls.classTeacherId || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const tch = teachers.find(t => t.id === classTeacherId);
    await saveClassItem({
      id: editingClass?.id,
      schoolId,
      className,
      level,
      stream,
      schoolType: 'PRIMARY_JHS',
      academicYear: '2026/2027',
      classTeacherId,
      classTeacherName: tch?.fullName || '',
      capacity,
      status: 'ACTIVE'
    });
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this class?')) {
      await deleteClassItem(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-light text-white serif italic flex items-center gap-2">
            <School className="w-5 h-5 text-blue-400" />
            Classes & Streams Setup
          </h2>
          <p className="text-xs text-slate-400">
            Define grade levels, class streams, student capacity limits, and class teacher assignments.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 cursor-pointer tracking-wider uppercase"
        >
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      <div className="bg-[#0f111a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading class listings...</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161925] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Class Name</th>
                <th className="px-6 py-3.5">Level</th>
                <th className="px-6 py-3.5">Stream</th>
                <th className="px-6 py-3.5">Capacity</th>
                <th className="px-6 py-3.5">Class Teacher</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No classes set up yet. Click "Add Class" to define one.
                  </td>
                </tr>
              ) : (
                classes.map((c) => (
                  <tr key={c.id} className="hover:bg-[#161925]/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{c.className}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{c.level}</td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-400">{c.stream || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-300">{c.capacity} Students</td>
                    <td className="px-6 py-4 text-slate-400">
                      {c.classTeacherName || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-[#161925] cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs text-slate-200">
            <h3 className="text-lg font-light text-white serif italic">
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JHS 1A"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Level *</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="KG">KG</option>
                    <option value="PRIMARY">PRIMARY</option>
                    <option value="JHS">JHS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Stream</label>
                  <input
                    type="text"
                    placeholder="e.g. A, B, Gold"
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Student Capacity *</label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Assigned Class Teacher</label>
                <select
                  value={classTeacherId}
                  onChange={(e) => setClassTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.staffId})</option>
                  ))}
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
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
