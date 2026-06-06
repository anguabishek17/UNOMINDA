'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  GitFork,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Layers,
  Cpu
} from 'lucide-react';

export default function LinesPage() {
  const { apiUrl, authFetch } = useAuth();
  const { t } = useLanguage();

  const [lines, setLines] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Modals & States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState<any>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchLines();
    fetchMetadata();
  }, [search, selectedDept]);

  const fetchLines = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedDept) queryParams.append('departmentId', selectedDept);

      const res = await authFetch(`${apiUrl}/lines?${queryParams.toString()}`);
      if (res.ok) {
        setLines(await res.json());
      } else {
        throw new Error('Failed to fetch lines');
      }
    } catch (e) {
      console.warn('Real backend unavailable. Loading mock lines.');
      // Mock data
      setLines([
        {
          id: 'line-1',
          name: 'CNC Milling Line A',
          description: 'High precision multi-axis milling line for auto-components.',
          departmentId: 'dept-1',
          department: { name: 'Machine Shop (CNC)' },
          _count: { machines: 2 }
        },
        {
          id: 'line-2',
          name: 'Heavy Press Line B',
          description: 'Stamping and drawing panels for passenger vehicles.',
          departmentId: 'dept-2',
          department: { name: 'Press Shop (Stamping)' },
          _count: { machines: 2 }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const res = await fetch(`${apiUrl}/auth/metadata`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.flatMap((p: any) => p.departments));
      } else {
        throw new Error();
      }
    } catch {
      setDepartments([
        { id: 'dept-1', name: 'Machine Shop (CNC)' },
        { id: 'dept-2', name: 'Press Shop (Stamping)' },
        { id: 'dept-3', name: 'Quality Control' }
      ]);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName || !formDeptId) {
      setFormError('Line Name and Department are required.');
      return;
    }

    try {
      const res = await authFetch(`${apiUrl}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          departmentId: formDeptId
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchLines();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to create line.');
      }
    } catch {
      // Mock local add
      const mockNew = {
        id: `line-mock-${Date.now()}`,
        name: formName,
        description: formDescription,
        departmentId: formDeptId,
        department: { name: departments.find(d => d.id === formDeptId)?.name || 'Unknown' },
        _count: { machines: 0 }
      };
      setLines([...lines, mockNew]);
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const res = await authFetch(`${apiUrl}/lines/${selectedLine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          departmentId: formDeptId
        })
      });

      if (res.ok) {
        setShowEditModal(false);
        resetForm();
        fetchLines();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to edit line.');
      }
    } catch {
      // Mock local edit
      setLines(lines.map(l => l.id === selectedLine.id ? {
        ...l,
        name: formName,
        description: formDescription,
        departmentId: formDeptId,
        department: { name: departments.find(d => d.id === formDeptId)?.name || l.department.name }
      } : l));
      setShowEditModal(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this line? All machines assigned to it will need to be remapped.')) return;
    try {
      const res = await authFetch(`${apiUrl}/lines/${id}`, { method: 'DELETE' });
      if (res.ok) fetchLines();
    } catch {
      setLines(lines.filter(l => l.id !== id));
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (line: any) => {
    setSelectedLine(line);
    setFormName(line.name);
    setFormDescription(line.description || '');
    setFormDeptId(line.departmentId);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormDeptId('');
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('lines')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define and map production lines inside plants and departments
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus size={16} />
          {t('add')}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-[#0d121f] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by line name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-amber-500 text-slate-600 dark:text-slate-300"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Lines Grid */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : lines.length === 0 ? (
        <div className="glass-panel py-16 text-center rounded-2xl">
          <GitFork size={40} className="mx-auto text-slate-400 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No production lines found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lines.map((line) => (
            <div
              key={line.id}
              className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between glass-card-hover"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <GitFork size={16} />
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{line.name}</h3>
                      <span className="text-xxs text-slate-400 font-medium">Dept: {line.department?.name}</span>
                    </div>
                  </div>
                  <span className="text-xxs bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Cpu size={12} />
                    <span>{line._count?.machines || 0} Machines</span>
                  </span>
                </div>

                <p className="text-xxs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                  {line.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  onClick={() => openEditModal(line)}
                  className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(line.id)}
                  className="p-2 border border-red-500/10 hover:bg-red-500/10 rounded-lg text-red-500 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Line Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative glass-panel rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200 text-slate-850 dark:text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Layers size={18} className="text-amber-500" />
                <span>Add Production Line</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Line Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., CNC Assembly Line A"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Department Assignment *</label>
                <select
                  required
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Briefly state production purpose, station layouts, or details..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                ></textarea>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-xxs text-red-400 p-2.5 rounded-lg">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Add Line
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Line Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="relative glass-panel rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-200 text-slate-850 dark:text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 size={18} className="text-amber-500" />
                <span>Edit Production Line</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Line Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Department Assignment *</label>
                <select
                  required
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-350 focus:outline-none"
                >
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                ></textarea>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-xxs text-red-400 p-2.5 rounded-lg">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
