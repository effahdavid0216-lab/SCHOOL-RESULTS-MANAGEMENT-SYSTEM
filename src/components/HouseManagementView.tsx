import React, { useState, useEffect } from 'react';
import {
  Home,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Archive,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Shield,
  Palette
} from 'lucide-react';
import { House, Student } from '../types';
import {
  getHousesBySchool,
  saveHouseItem,
  archiveHouseItem,
  restoreHouseItem,
  getStudentsBySchool
} from '../lib/services';

interface Props {
  schoolId: string;
}

export const HouseManagementView: React.FC<Props> = ({ schoolId }) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [houseName, setHouseName] = useState('');
  const [houseMaster, setHouseMaster] = useState('');
  const [houseColor, setHouseColor] = useState('#3b82f6');
  const [capacity, setCapacity] = useState(100);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [hList, sList] = await Promise.all([
      getHousesBySchool(schoolId),
      getStudentsBySchool(schoolId)
    ]);
    setHouses(hList);
    setStudents(sList);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingHouse(null);
    setHouseName('');
    setHouseMaster('');
    setHouseColor('#3b82f6');
    setCapacity(100);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: House) => {
    setEditingHouse(h);
    setHouseName(h.houseName);
    setHouseMaster(h.houseMaster || '');
    setHouseColor(h.houseColor || '#3b82f6');
    setCapacity(h.capacity || 100);
    setDescription(h.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseName.trim()) return;
    setIsSaving(true);
    try {
      await saveHouseItem({
        id: editingHouse?.id,
        schoolId,
        houseName: houseName.trim(),
        houseMaster: houseMaster.trim(),
        houseColor,
        capacity,
        description: description.trim(),
        status: editingHouse?.status || 'ACTIVE'
      });
      setIsModalOpen(false);
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (houseId: string) => {
    if (confirm('Archive this house? Enrolled students will still retain historical assignment.')) {
      await archiveHouseItem(schoolId, houseId);
      await loadData();
    }
  };

  const handleRestore = async (houseId: string) => {
    await restoreHouseItem(schoolId, houseId);
    await loadData();
  };

  const filteredHouses = houses.filter((h) => {
    const matchesTab = (h.status || 'ACTIVE') === tab;
    const matchesSearch =
      h.houseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.houseMaster && h.houseMaster.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const getStudentCountInHouse = (hName: string) => {
    return students.filter((s) => s.house?.toLowerCase() === hName.toLowerCase()).length;
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f111a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
              CO-CURRICULAR & HOUSES
            </span>
          </div>
          <h2 className="text-xl font-light text-white serif italic flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-400" />
            House System & Student Allocation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Create customized school houses, assign house masters/patrons, and allocate students for inter-house activities.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Create New House
        </button>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-[#0f111a] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search house by name or house master..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#161925] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'ACTIVE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#161925] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Active Houses ({houses.filter((h) => (h.status || 'ACTIVE') === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setTab('ARCHIVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'ARCHIVED'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#161925] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Archived ({houses.filter((h) => h.status === 'ARCHIVED').length})
          </button>
        </div>
      </div>

      {/* House Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-xs">Loading school houses...</span>
        </div>
      ) : filteredHouses.length === 0 ? (
        <div className="bg-[#0f111a] rounded-2xl border border-slate-800 p-12 text-center text-slate-500 text-xs">
          No houses found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHouses.map((house) => {
            const count = getStudentCountInHouse(house.houseName);
            return (
              <div
                key={house.id}
                className="bg-[#0f111a] border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-sm"
                        style={{ backgroundColor: house.houseColor || '#3b82f6' }}
                      >
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{house.houseName}</h4>
                        <p className="text-[11px] text-slate-400">
                          Master: {house.houseMaster || 'Not Assigned'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        house.status === 'ARCHIVED'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {house.status || 'ACTIVE'}
                    </span>
                  </div>

                  {house.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{house.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 bg-[#161925] p-3 rounded-xl border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Enrolled</span>
                      <span className="font-semibold text-white flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-400" /> {count} Students
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Capacity</span>
                      <span className="font-semibold text-slate-300">
                        {house.capacity || 100} Max
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleOpenEdit(house)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Edit House"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>

                  {house.status === 'ARCHIVED' ? (
                    <button
                      onClick={() => handleRestore(house.id)}
                      className="p-2 hover:bg-slate-800 text-emerald-400 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title="Restore House"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchive(house.id)}
                      className="p-2 hover:bg-slate-800 text-amber-400 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title="Archive House"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit House Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f111a] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161925]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-400" />
                {editingHouse ? 'Edit School House' : 'Create New House'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">House Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aggrey House (Red), Kwame Nkrumah House"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">House Master / Patron</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Kwame Mensah"
                  value={houseMaster}
                  onChange={(e) => setHouseMaster(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">House Color Theme</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={houseColor}
                      onChange={(e) => setHouseColor(e.target.value)}
                      className="w-9 h-9 rounded-xl bg-transparent cursor-pointer border border-slate-700"
                    />
                    <span className="text-[11px] font-mono text-slate-300">{houseColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Student Capacity</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 100)}
                    className="w-full px-3.5 py-2.5 bg-[#161925] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">House Motto / Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Excellence, Discipline, and Service."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#161925] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save House
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
