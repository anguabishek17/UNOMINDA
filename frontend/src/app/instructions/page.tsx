'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  X,
  FileUp,
  Sparkles,
  ShieldAlert,
  Calendar,
  AlertOctagon,
  Eye,
  CheckSquare,
  FileSpreadsheet
} from 'lucide-react';

export default function InstructionsPage() {
  const { apiUrl, authFetch } = useAuth();
  const { t } = useLanguage();

  const [instructions, setInstructions] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search/Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIProgress, setShowAIProgress] = useState(false);
  const [aiResult, setAIResult] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('OPERATING');
  const [formPriority, setFormPriority] = useState('HIGH');
  const [formScope, setFormScope] = useState('MACHINE'); // MACHINE | LINE | DEPARTMENT
  const [formTargetId, setFormTargetId] = useState('');
  const [formVersion, setFormVersion] = useState('1.0');
  const [formExpiry, setFormExpiry] = useState('');
  const [formFiles, setFormFiles] = useState<FileList | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // AI Inputs
  const [aiContext, setAIContext] = useState('');

  useEffect(() => {
    fetchInstructions();
    fetchMetadata();
  }, [search, selectedType, selectedPriority, selectedStatus]);

  const fetchInstructions = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (selectedType) q.append('type', selectedType);
      if (selectedPriority) q.append('priority', selectedPriority);
      if (selectedStatus) q.append('status', selectedStatus);

      const res = await authFetch(`${apiUrl}/instructions?${q.toString()}`);
      if (res.ok) {
        setInstructions(await res.json());
      } else {
        throw new Error('Failed to fetch instructions');
      }
    } catch (e) {
      console.error('Failed to load instructions:', e);
      setInstructions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const res = await authFetch(`${apiUrl}/auth/metadata`);
      if (res.ok) {
        const data = await res.json();
        console.log('[Metadata API response]', JSON.stringify(data?.length), 'plants loaded');

        const parsedDepartments = (data || [])
          .flatMap((p: any) => p.departments || [])
          .filter((d: any) => d && d.id);

        const parsedLines = (data || [])
          .flatMap((p: any) => (p.departments || []).flatMap((d: any) => d.lines || []))
          .filter((l: any) => l && l.id);

        const parsedMachines = (data || [])
          .flatMap((p: any) =>
            (p.departments || []).flatMap((d: any) =>
              (d.lines || []).flatMap((l: any) => l.machines || [])
            )
          )
          .filter((m: any) => m && m.id);

        setDepartments(parsedDepartments);
        setLines(parsedLines);
        setMachines(parsedMachines);
      } else {
        console.warn('Metadata API returned non-OK status, falling back to direct fetches');
        await fetchMetadataFallback();
      }
    } catch (e) {
      console.error('Metadata fetch failed:', e);
      await fetchMetadataFallback();
    }
  };

  const fetchMetadataFallback = async () => {
    try {
      // Try fetching machines and lines directly from their own endpoints
      const [machinesRes, linesRes] = await Promise.all([
        authFetch(`${apiUrl}/machines`).catch(() => null),
        authFetch(`${apiUrl}/lines`).catch(() => null)
      ]);

      if (machinesRes?.ok) {
        const machineData = await machinesRes.json();
        setMachines((machineData || []).filter((m: any) => m && m.id));

        // Extract unique departments and lines from machine data
        const deptMap = new Map<string, any>();
        const lineMap = new Map<string, any>();
        (machineData || []).forEach((m: any) => {
          if (m.productionLine) {
            lineMap.set(m.productionLine.id, m.productionLine);
            if (m.productionLine.department) {
              deptMap.set(m.productionLine.department.id, m.productionLine.department);
            }
          }
        });
        if (departments.length === 0) setDepartments(Array.from(deptMap.values()));
        if (lines.length === 0) setLines(Array.from(lineMap.values()));
      }

      if (linesRes?.ok) {
        const lineData = await linesRes.json();
        if (lines.length === 0) setLines((lineData || []).filter((l: any) => l && l.id));
      }
    } catch (e) {
      console.error('Fallback metadata fetch also failed:', e);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle || !formDescription || !formTargetId) {
      setFormError('Please fill in Title, Description, and Scope Target.');
      return;
    }

    const formData = new FormData();
    formData.append('title', formTitle);
    formData.append('description', formDescription);
    formData.append('instructionType', formType);
    formData.append('priority', formPriority);
    formData.append('version', formVersion);
    if (formExpiry) formData.append('expiryDate', formExpiry);

    if (formScope === 'MACHINE') formData.append('machineId', formTargetId);
    if (formScope === 'LINE') formData.append('productionLineId', formTargetId);
    if (formScope === 'DEPARTMENT') formData.append('departmentId', formTargetId);

    if (formFiles) {
      for (let i = 0; i < formFiles.length; i++) {
        formData.append('files', formFiles[i]);
      }
    }

    try {
      const res = await authFetch(`${apiUrl}/instructions`, {
        method: 'POST',
        body: formData // Multmulter handles boundaries automatically
      });

      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchInstructions();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to submit instruction.');
      }
    } catch {
      // Mock local addition
      const mockNew = {
        id: `inst-mock-${Date.now()}`,
        title: formTitle,
        description: formDescription,
        instructionType: formType,
        priority: formPriority,
        version: formVersion,
        status: 'ACTIVE',
        effectiveDate: new Date().toISOString(),
        machine: formScope === 'MACHINE' ? { code: machines.find(m => m.id === formTargetId)?.code || 'M-NEW', name: machines.find(m => m.id === formTargetId)?.name || 'Machine' } : undefined,
        productionLine: formScope === 'LINE' ? { name: lines.find(l => l.id === formTargetId)?.name || 'Line' } : undefined,
        department: formScope === 'DEPARTMENT' ? { name: departments.find(d => d.id === formTargetId)?.name || 'Department' } : undefined,
        attachments: formFiles ? Array.from(formFiles).map(f => ({ id: `att-${Date.now()}`, filename: f.name })) : []
      };
      setInstructions([mockNew, ...instructions]);
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await authFetch(`${apiUrl}/instructions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchInstructions();
    } catch {
      setInstructions(instructions.map(i => i.id === id ? { ...i, status: newStatus } : i));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SOP?')) return;
    try {
      const res = await authFetch(`${apiUrl}/instructions/${id}`, { method: 'DELETE' });
      if (res.ok) fetchInstructions();
    } catch {
      setInstructions(instructions.filter(i => i.id !== id));
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormType('OPERATING');
    setFormPriority('HIGH');
    setFormScope('MACHINE');
    setFormTargetId('');
    setFormVersion('1.0');
    setFormExpiry('');
    setFormFiles(null);
    setFormError(null);
    setAIResult(null);
    setAIContext('');
  };

  // AI Assistant Actions
  const runAIEngine = async (actionType: 'warnings' | 'checklist' | 'summary') => {
    if (!formTitle) {
      alert('Please fill in the Instruction Title first so the AI has context.');
      return;
    }
    setShowAIProgress(true);
    setAIResult(null);

    let endpoint = '';
    let bodyObj = {};

    if (actionType === 'warnings') {
      endpoint = '/ai/suggest-warnings';
      bodyObj = { machineName: formScope === 'MACHINE' ? machines.find(m => m.id === formTargetId)?.name : 'Press Machine', machineCode: 'GENERIC' };
    } else if (actionType === 'checklist') {
      endpoint = '/ai/generate-checklist';
      bodyObj = { machineName: 'Uno Minda Machine', title: formTitle, textContext: formDescription || aiContext };
    } else {
      endpoint = '/ai/summarize-sop';
      bodyObj = { title: formTitle, textContent: formDescription || aiContext };
    }

    try {
      const res = await authFetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
      });

      if (res.ok) {
        const data = await res.json();
        let formatted = '';
        if (actionType === 'warnings') {
          formatted = `⚠️ SAFETY WARNINGS SUGGESTIONS:\n` + data.warnings.map((w: string) => `• ${w}`).join('\n');
        } else if (actionType === 'checklist') {
          formatted = `📋 AUTOMATED SAFETY CHECKLIST:\n` + data.checklist.map((w: string) => `[ ] ${w}`).join('\n');
        } else {
          formatted = `📝 SOP BRIEF SUMMARY:\n${data.summary}`;
        }
        setAIResult(formatted);
      } else {
        throw new Error();
      }
    } catch {
      // Mock AI Fallback offline
      let mockOut = '';
      if (actionType === 'warnings') {
        mockOut = `⚠️ SAFETY WARNINGS SUGGESTIONS:\n• Ensure main electrical circuit breaker is turned off before touching internal wiring.\n• High hazard press nip points. Keep hands clear at all times.\n• Wear safety goggles to protect eyes against metal flying chips.`;
      } else if (actionType === 'checklist') {
        mockOut = `📋 AUTOMATED SAFETY CHECKLIST:\n[ ] Verify emergency stop button is fully functional.\n[ ] Check hydraulics/air pressure registers min 6.0 Bar.\n[ ] Ensure safety light curtains block stroke mechanism when crossed.`;
      } else {
        mockOut = `📝 SOP BRIEF SUMMARY:\nThis document serves as the standard operating procedure for safe machine initiation. It highlights daily checks, pressure values, and light curtain validations before initiating a shift.`;
      }
      setAIResult(mockOut);
    } finally {
      setShowAIProgress(false);
    }
  };

  const applyAIToDescription = () => {
    if (aiResult) {
      setFormDescription((prev) => (prev ? `${prev}\n\n${aiResult}` : aiResult));
      setAIResult(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('instructions')}</h1>
          <p className="text-sm text-slate-400">
            Publish standard operating procedures, safety guidelines, and emergency drills
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-cyan-500/10 cursor-pointer animate-pulse"
        >
          <Plus size={16} className="text-slate-955" />
          <span>Publish SOP</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 glass-panel p-4 border-none shadow-sm">
        <div className="relative md:col-span-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search SOP title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-655"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-[#111625] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="OPERATING">Operating Procedure</option>
          <option value="SAFETY">Safety Guideline</option>
          <option value="EMERGENCY">Emergency Drill</option>
          <option value="MAINTENANCE">Maintenance Checklist</option>
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="bg-[#111625] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-[#111625] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Directory list */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      ) : instructions.length === 0 ? (
        <div className="glass-panel py-16 text-center border-none">
          <FileText size={40} className="mx-auto text-slate-400 mb-3" />
          <p className="text-slate-400 text-sm">No instructions published yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {instructions.map((inst) => (
            <div
              key={inst.id}
              className="glass-panel p-5 border-none flex flex-col md:flex-row justify-between gap-4 glass-card-hover"
            >
              {/* Context Info */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                      inst.priority === 'CRITICAL'
                        ? 'bg-red-500/10 text-red-400 animate-siren border border-red-500/20'
                        : inst.priority === 'HIGH'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {inst.priority}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-350 text-xxs font-semibold">
                    {inst.instructionType}
                  </span>
                  <span className="text-xxs text-slate-450">Ver {inst.version}</span>
                  {/* Scope Badge */}
                  <span className="text-xxs bg-white/5 border border-white/10 px-2 py-0.5 rounded font-bold text-slate-450">
                    Target:{' '}
                    {inst.machine
                      ? `Machine ${inst.machine.code}`
                      : inst.productionLine
                      ? `Line ${inst.productionLine.name}`
                      : inst.department
                      ? `Dept ${inst.department.name}`
                      : 'All'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white">{inst.title}</h3>
                <p className="text-xxs text-slate-400 leading-relaxed max-w-4xl line-clamp-3">
                  {inst.description}
                </p>

                {/* Attachments */}
                {inst.attachments && inst.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {inst.attachments.map((att: any) => (
                      <span
                        key={att.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 text-slate-300 text-xxs border border-white/10"
                      >
                        <FileSpreadsheet size={12} className="text-cyan-400" />
                        <span>{att.filename}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div className="flex md:flex-col justify-between items-end md:items-end gap-2 border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xxs text-slate-400 font-bold uppercase">Status:</span>
                  <select
                    value={inst.status}
                    onChange={(e) => handleStatusUpdate(inst.id, e.target.value)}
                    className="bg-[#111625] border border-white/10 rounded-lg p-1 text-xxs font-bold text-slate-300 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(inst.id)}
                    className="p-2 bg-white/5 border border-red-500/20 hover:bg-red-500/10 rounded-lg text-red-400 cursor-pointer transition-colors duration-300"
                    title="Delete SOP"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Publish SOP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#030712]/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative glass-panel rounded-2xl max-w-4xl w-full p-6 shadow-2xl border-none animate-in fade-in duration-200 text-white flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            {/* Form Column */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText size={18} className="text-cyan-400" />
                  <span>Publish SOP Instruction</span>
                </h3>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., CNC startup inspection SOP"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-655"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Type</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full bg-[#111625] border border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
                    >
                      <option value="OPERATING">Operating SOP</option>
                      <option value="SAFETY">Safety Protocol</option>
                      <option value="EMERGENCY">Emergency drill</option>
                      <option value="MAINTENANCE">Maintenance guide</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Priority</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full bg-[#111625] border border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Target Scope</label>
                    <select
                      value={formScope}
                      onChange={(e) => { setFormScope(e.target.value); setFormTargetId(''); }}
                      className="w-full bg-[#111625] border border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
                    >
                      <option value="MACHINE">Machine Specific</option>
                      <option value="LINE">Production Line wide</option>
                      <option value="DEPARTMENT">Department wide</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Target Object *</label>
                    <select
                      required
                      value={formTargetId}
                      onChange={(e) => setFormTargetId(e.target.value)}
                      className="w-full bg-[#111625] border border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
                    >
                      <option value="">Select Target...</option>
                      {formScope === 'MACHINE' && (machines || []).filter(m => m && m.id).map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                      {formScope === 'LINE' && (lines || []).filter(l => l && l.id).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      {formScope === 'DEPARTMENT' && (departments || []).filter(d => d && d.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {formScope === 'MACHINE' && machines.length === 0 && (
                      <p className="text-xxs text-amber-400 mt-1.5 flex items-center gap-1">
                        <AlertOctagon size={11} />
                        <span>No machines available. Please create a machine first.</span>
                      </p>
                    )}
                    {formScope === 'LINE' && lines.length === 0 && (
                      <p className="text-xxs text-amber-400 mt-1.5 flex items-center gap-1">
                        <AlertOctagon size={11} />
                        <span>No production lines available. Please create a line first.</span>
                      </p>
                    )}
                    {formScope === 'DEPARTMENT' && departments.length === 0 && (
                      <p className="text-xxs text-amber-400 mt-1.5 flex items-center gap-1">
                        <AlertOctagon size={11} />
                        <span>No departments available. Please create a department first.</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Instruction SOP content *</label>
                  <textarea
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Enter detailed instruction workflow, steps, parameters, etc."
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-655"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Version</label>
                    <input
                      type="text"
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={formExpiry}
                      onChange={(e) => setFormExpiry(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Document Attachments (Multer)</label>
                  <div className="border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center bg-white/5 relative hover:bg-white/10 transition-colors cursor-pointer">
                    <FileUp size={24} className="text-slate-400 mb-2" />
                    <span className="text-xxs text-slate-405 text-center">Drag & drop files or click to upload PDF/MP4</span>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setFormFiles(e.target.files)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  {formFiles && (
                    <div className="mt-2 text-xxs text-cyan-400 font-semibold">
                      Selected: {Array.from(formFiles).map(f => f.name).join(', ')}
                    </div>
                  )}
                </div>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-xxs text-red-400 p-2.5 rounded-lg">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer text-center transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-md cursor-pointer transition-colors duration-300"
                  >
                    Publish
                  </button>
                </div>
              </form>
            </div>

            {/* AI Assistant Column */}
            <div className="w-full md:w-80 bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-white/10">
                <Sparkles size={16} className="text-cyan-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  {t('aiAssistant')}
                </h4>
              </div>

              <p className="text-xxs text-slate-400 leading-normal">
                Use Google Gemini to generate structured warnings or safety checks. Enter titles/details on the left first.
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => runAIEngine('warnings')}
                  disabled={showAIProgress}
                  className="w-full py-2.5 px-3 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 rounded-xl text-xxs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-300"
                >
                  <AlertOctagon size={13} className="text-red-400" />
                  <span>{t('warningBtn')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => runAIEngine('checklist')}
                  disabled={showAIProgress}
                  className="w-full py-2.5 px-3 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-400 rounded-xl text-xxs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-300"
                >
                  <CheckSquare size={13} className="text-blue-400" />
                  <span>{t('checklistBtn')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => runAIEngine('summary')}
                  disabled={showAIProgress}
                  className="w-full py-2.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 rounded-xl text-xxs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-300"
                >
                  <Eye size={13} className="text-cyan-400" />
                  <span>{t('summarizeBtn')}</span>
                </button>
              </div>

              {showAIProgress && (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500 mx-auto mb-2"></div>
                  <span className="text-xxs text-slate-400">{t('aiLoading')}</span>
                </div>
              )}

              {aiResult && (
                <div className="flex-1 flex flex-col justify-between bg-black/30 p-3 rounded-xl border border-white/10 text-xxs">
                  <div className="overflow-y-auto max-h-40 whitespace-pre-line leading-relaxed text-slate-300">
                    {aiResult}
                  </div>
                  <button
                    type="button"
                    onClick={applyAIToDescription}
                    className="mt-3 w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold py-2 rounded-lg text-xxs transition-colors cursor-pointer"
                  >
                    Append to Content
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
