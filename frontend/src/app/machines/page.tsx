'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Cpu,
  Search,
  Plus,
  Edit2,
  Trash2,
  Printer,
  X,
  FileImage,
  RefreshCw,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react';

export default function MachinesPage() {
  const { apiUrl, authFetch } = useAuth();
  const { t } = useLanguage();

  const [machines, setMachines] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLineId, setFormLineId] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchMachines();
    fetchMetadata();
  }, [search, selectedDept, selectedLine, selectedStatus]);

  const fetchMachines = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedLine) queryParams.append('lineId', selectedLine);
      if (selectedDept) queryParams.append('departmentId', selectedDept);
      if (selectedStatus) queryParams.append('status', selectedStatus);

      const res = await authFetch(`${apiUrl}/machines?${queryParams.toString()}`);
      if (res.ok) {
        setMachines(await res.json());
      } else {
        throw new Error('Failed to load');
      }
    } catch (e) {
      console.warn('Real backend fail. Loading mock machines.');
      // Mock data
      setMachines([
        {
          id: 'm-1',
          name: 'Hyundai Wia F400 CNC Milling',
          code: 'CNC-01',
          location: 'Bay 3, South Row',
          status: 'ACTIVE',
          productionLineId: 'line-1',
          productionLine: { name: 'CNC Milling Line A', department: { name: 'Machine Shop (CNC)' } },
          qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="20" height="20" fill="black"/><rect x="70" y="10" width="20" height="20" fill="black"/><rect x="10" y="70" width="20" height="20" fill="black"/><rect x="40" y="40" width="20" height="20" fill="black"/></svg>'
        },
        {
          id: 'm-2',
          name: 'Mazak QuickTurn CNC Lathe',
          code: 'CNC-02',
          location: 'Bay 3, North Row',
          status: 'ACTIVE',
          productionLineId: 'line-1',
          productionLine: { name: 'CNC Milling Line A', department: { name: 'Machine Shop (CNC)' } },
          qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="20" height="20" fill="black"/><rect x="70" y="10" width="20" height="20" fill="black"/><rect x="10" y="70" width="20" height="20" fill="black"/><rect x="40" y="40" width="20" height="20" fill="black"/></svg>'
        },
        {
          id: 'm-3',
          name: 'AIDA 400T Hydraulic Press',
          code: 'PRESS-01',
          location: 'Bay 1, East Side',
          status: 'ACTIVE',
          productionLineId: 'line-2',
          productionLine: { name: 'Heavy Press Line B', department: { name: 'Press Shop (Stamping)' } },
          qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="20" height="20" fill="black"/><rect x="70" y="10" width="20" height="20" fill="black"/><rect x="10" y="70" width="20" height="20" fill="black"/><rect x="40" y="40" width="20" height="20" fill="black"/></svg>'
        },
        {
          id: 'm-4',
          name: 'Komatsu 200T Mechanical Press',
          code: 'PRESS-02',
          location: 'Bay 1, West Side',
          status: 'MAINTENANCE',
          productionLineId: 'line-2',
          productionLine: { name: 'Heavy Press Line B', department: { name: 'Press Shop (Stamping)' } },
          qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="20" height="20" fill="black"/><rect x="70" y="10" width="20" height="20" fill="black"/><rect x="10" y="70" width="20" height="20" fill="black"/><rect x="40" y="40" width="20" height="20" fill="black"/></svg>'
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
        setLines(data.flatMap((p: any) => p.departments.flatMap((d: any) => d.lines)));
      } else {
        throw new Error();
      }
    } catch {
      setDepartments([
        { id: 'dept-1', name: 'Machine Shop (CNC)' },
        { id: 'dept-2', name: 'Press Shop (Stamping)' },
        { id: 'dept-3', name: 'Quality Control' }
      ]);
      setLines([
        { id: 'line-1', name: 'CNC Milling Line A', departmentId: 'dept-1' },
        { id: 'line-2', name: 'Heavy Press Line B', departmentId: 'dept-2' }
      ]);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName || !formCode || !formLineId || !formLocation) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      const res = await authFetch(`${apiUrl}/machines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          code: formCode,
          productionLineId: formLineId,
          location: formLocation,
          status: formStatus
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchMachines();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to save machine.');
      }
    } catch {
      // Mock local addition
      const mockNew = {
        id: `m-mock-${Date.now()}`,
        name: formName,
        code: formCode,
        location: formLocation,
        status: formStatus,
        productionLineId: formLineId,
        productionLine: {
          name: lines.find(l => l.id === formLineId)?.name || 'Line A',
          department: { name: 'Machine Shop (CNC)' }
        },
        qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="20" height="20" fill="black"/><rect x="70" y="10" width="20" height="20" fill="black"/><rect x="10" y="70" width="20" height="20" fill="black"/></svg>'
      };
      setMachines([...machines, mockNew]);
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const res = await authFetch(`${apiUrl}/machines/${selectedMachine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          code: formCode,
          productionLineId: formLineId,
          location: formLocation,
          status: formStatus
        })
      });

      if (res.ok) {
        setShowEditModal(false);
        resetForm();
        fetchMachines();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to update machine.');
      }
    } catch {
      // Mock local update
      setMachines(machines.map(m => m.id === selectedMachine.id ? {
        ...m,
        name: formName,
        code: formCode,
        location: formLocation,
        status: formStatus,
        productionLineId: formLineId,
        productionLine: {
          name: lines.find(l => l.id === formLineId)?.name || m.productionLine.name,
          department: m.productionLine.department
        }
      } : m));
      setShowEditModal(false);
      resetForm();
    }
  };

  const handleStatusToggle = async (machine: any) => {
    const nextStatus = machine.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await authFetch(`${apiUrl}/machines/${machine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchMachines();
    } catch {
      setMachines(machines.map(m => m.id === machine.id ? { ...m, status: nextStatus } : m));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this machine? All related instruction scopes will be unlinked.')) return;
    try {
      const res = await authFetch(`${apiUrl}/machines/${id}`, { method: 'DELETE' });
      if (res.ok) fetchMachines();
    } catch {
      setMachines(machines.filter(m => m.id !== id));
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (machine: any) => {
    setSelectedMachine(machine);
    setFormName(machine.name);
    setFormCode(machine.code);
    setFormLineId(machine.productionLineId);
    setFormLocation(machine.location);
    setFormStatus(machine.status);
    setShowEditModal(true);
  };

  const openQRModal = (machine: any) => {
    setSelectedMachine(machine);
    setShowQRModal(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormLineId('');
    setFormLocation('');
    setFormStatus('ACTIVE');
    setFormError(null);
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${selectedMachine.code}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: white;
                color: black;
              }
              .card {
                border: 4px solid black;
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                max-width: 350px;
              }
              img {
                width: 250px;
                height: 250px;
                margin: 20px 0;
              }
              h2 { margin: 5px 0; font-size: 24px; }
              p { margin: 5px 0; color: #444; font-size: 14px; }
              .logo { font-weight: bold; font-size: 20px; letter-spacing: 2px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">UNO MINDA</div>
              <img src="${selectedMachine.qrCode}" alt="QR Code" />
              <h2>${selectedMachine.name}</h2>
              <p>Code: <strong>${selectedMachine.code}</strong></p>
              <p>Location: ${selectedMachine.location}</p>
              <p style="margin-top: 15px; font-size: 11px; font-style: italic; color: #666;">
                Scan using the Employee Terminal to fetch SOPs
              </p>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('machines')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage factory floor machines, locations, and print scanning tags
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

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 bg-white dark:bg-[#0d121f] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => { setSelectedDept(e.target.value); setSelectedLine(''); }}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-amber-500 text-slate-600 dark:text-slate-300"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {/* Line Filter */}
        <select
          value={selectedLine}
          onChange={(e) => setSelectedLine(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-amber-500 text-slate-600 dark:text-slate-300"
        >
          <option value="">All Lines</option>
          {lines
            .filter(l => !selectedDept || l.departmentId === selectedDept)
            .map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-amber-500 text-slate-600 dark:text-slate-300"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : machines.length === 0 ? (
        <div className="glass-panel py-16 text-center rounded-2xl border border-slate-200 dark:border-slate-850">
          <Cpu size={40} className="mx-auto text-slate-400 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No machines matching the search criteria were found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((machine) => (
            <div
              key={machine.id}
              className="glass-panel p-6 rounded-2xl relative flex flex-col justify-between border border-slate-200 dark:border-slate-850 glass-card-hover"
            >
              {/* Header section info */}
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xxs font-bold font-mono border border-slate-200/50 dark:border-slate-700/50">
                    {machine.code}
                  </span>
                  {/* Status Indicator */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xxs font-bold ${
                      machine.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : machine.status === 'MAINTENANCE'
                        ? 'bg-amber-500/10 text-amber-500 animate-amber-siren'
                        : 'bg-slate-500/10 text-slate-500'
                    }`}
                  >
                    {machine.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold mt-3 text-slate-900 dark:text-white truncate" title={machine.name}>
                  {machine.name}
                </h3>

                <div className="space-y-1 mt-3 text-xxs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{machine.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Line:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {machine.productionLine?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Dept:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {machine.productionLine?.department?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                {/* Status toggle button */}
                <button
                  onClick={() => handleStatusToggle(machine)}
                  className={`p-2 rounded-lg border text-xxs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    machine.status === 'ACTIVE'
                      ? 'border-red-500/20 text-red-500 hover:bg-red-500/5'
                      : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5'
                  }`}
                  title={machine.status === 'ACTIVE' ? 'Deactivate Machine' : 'Activate Machine'}
                >
                  {machine.status === 'ACTIVE' ? <Pause size={12} /> : <Play size={12} />}
                  <span>{machine.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => openQRModal(machine)}
                    className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer"
                    title="View QR Code tag"
                  >
                    <FileImage size={14} />
                  </button>
                  <button
                    onClick={() => openEditModal(machine)}
                    className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer"
                    title="Edit machine configuration"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(machine.id)}
                    className="p-2 border border-red-500/10 hover:bg-red-500/10 rounded-lg text-red-500 cursor-pointer"
                    title="Delete machine"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Machine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative glass-panel rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Cpu size={18} className="text-amber-500" />
                <span>Add Machine</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Machine Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Hyundai Milling Center"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Machine Code *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g., CNC-05"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Location *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g., Bay 3, North"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Production Line *</label>
                <select
                  required
                  value={formLineId}
                  onChange={(e) => setFormLineId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Line</option>
                  {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Initial Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
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
                Add Machine
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Machine Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="relative glass-panel rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit2 size={18} className="text-amber-500" />
                <span>Edit Machine</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Machine Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Machine Code *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Location *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Production Line *</label>
                <select
                  required
                  value={formLineId}
                  onChange={(e) => setFormLineId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-300 focus:outline-none"
                >
                  {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-300 focus:outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
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

      {/* QR Code Printable Dialog */}
      {showQRModal && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowQRModal(false)}></div>
          <div className="relative glass-panel rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 flex flex-col items-center text-center">
            <button onClick={() => setShowQRModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>

            <span className="font-bold text-xs uppercase tracking-widest text-slate-400 border border-slate-300 dark:border-slate-850 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 mb-4">
              {selectedMachine.code}
            </span>

            <div className="p-4 bg-white rounded-xl shadow-inner border border-slate-200">
              <img src={selectedMachine.qrCode} alt="Machine QR Code" className="w-48 h-48 mx-auto" />
            </div>

            <h4 className="font-bold mt-4 text-sm text-slate-900 dark:text-white leading-tight">
              {selectedMachine.name}
            </h4>
            <p className="text-xxs text-slate-400 mt-1">
              Location: <strong>{selectedMachine.location}</strong>
            </p>

            <p className="text-xxs text-slate-400 italic mt-4 max-w-xs leading-normal">
              Operators can scan this tag using their tablet or phone terminal to load instructions.
            </p>

            <button
              onClick={printQR}
              className="mt-6 flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 py-3 rounded-xl text-xs font-semibold shadow-md cursor-pointer transition-colors"
            >
              <Printer size={14} />
              <span>Print Identification Tag</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
