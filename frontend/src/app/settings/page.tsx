'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Cpu,
  FileText,
  Lock,
  Save,
  CheckCircle,
  AlertTriangle,
  Search,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

export default function SettingsPage() {
  const { apiUrl, authFetch, user } = useAuth();

  const [machines, setMachines] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'machines' | 'instructions'>('machines');

  // Track password edits per entity
  const [passwordEdits, setPasswordEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [machineRes, instrRes] = await Promise.all([
        authFetch(`${apiUrl}/machines`),
        authFetch(`${apiUrl}/instructions`)
      ]);

      if (machineRes.ok) {
        const machineData = await machineRes.json();
        setMachines(machineData);
      }
      if (instrRes.ok) {
        const instrData = await instrRes.json();
        setInstructions(instrData);
      }
    } catch (e) {
      console.error('Failed to load settings data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (id: string, value: string) => {
    setPasswordEdits((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveMachinePassword = async (id: string) => {
    const newPassword = passwordEdits[id];
    if (newPassword === undefined) return;

    setSavingId(id);
    setErrorId(null);
    setSavedId(null);

    try {
      const res = await authFetch(`${apiUrl}/machines/${id}/exit-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exitPassword: newPassword })
      });

      if (res.ok) {
        setSavedId(id);
        // Update local state
        setMachines((prev) =>
          prev.map((m) => (m.id === id ? { ...m, exitPassword: newPassword || null } : m))
        );
        // Clear edit
        setPasswordEdits((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        setTimeout(() => setSavedId(null), 2500);
      } else {
        setErrorId(id);
        setTimeout(() => setErrorId(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorId(id);
      setTimeout(() => setErrorId(null), 3000);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveInstructionPassword = async (id: string) => {
    const newPassword = passwordEdits[id];
    if (newPassword === undefined) return;

    setSavingId(id);
    setErrorId(null);
    setSavedId(null);

    try {
      const res = await authFetch(`${apiUrl}/instructions/${id}/exit-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exitPassword: newPassword })
      });

      if (res.ok) {
        setSavedId(id);
        setInstructions((prev) =>
          prev.map((i) => (i.id === id ? { ...i, exitPassword: newPassword || null } : i))
        );
        setPasswordEdits((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        setTimeout(() => setSavedId(null), 2500);
      } else {
        setErrorId(id);
        setTimeout(() => setErrorId(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorId(id);
      setTimeout(() => setErrorId(null), 3000);
    } finally {
      setSavingId(null);
    }
  };

  const filteredMachines = machines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredInstructions = instructions.filter(
    (i) =>
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-400 text-slate-950 rounded-xl shadow-lg shadow-cyan-500/10">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Settings</h1>
          <p className="text-sm text-slate-400">
            Configure exit verification passwords for machines and instructions
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="glass-panel p-4 border-none flex items-start gap-3">
        <ShieldCheck size={18} className="text-cyan-400 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-xs font-bold text-white">Exit Password Configuration</h3>
          <p className="text-xxs text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Exit passwords are required during Stage 3 of the instruction workflow. When an employee finishes
            viewing an instruction in fullscreen mode, they must enter this password to confirm completion. 
            The system checks the <strong>instruction-level</strong> password first, then falls back to the
            <strong> machine-level</strong> password, and defaults to <code className="text-cyan-400 bg-white/5 px-1 rounded">1234</code> if none is set.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('machines')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'machines'
              ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          <Cpu size={15} />
          <span>Machine Passwords ({machines.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('instructions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'instructions'
              ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          <FileText size={15} />
          <span>Instruction Passwords ({instructions.length})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative glass-panel p-4 border-none shadow-sm flex items-center gap-2">
        <Search size={16} className="text-slate-400 ml-2" />
        <input
          type="text"
          placeholder={activeTab === 'machines' ? 'Search machines by name, code, or location...' : 'Search instructions by title or description...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-slate-500"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      ) : activeTab === 'machines' ? (
        <div className="space-y-3">
          <h3 className="text-xxs font-bold text-slate-400 uppercase tracking-wider px-1">
            Machine Exit Passwords
          </h3>
          {filteredMachines.length === 0 ? (
            <div className="glass-panel p-8 text-center border-none">
              <p className="text-xxs text-slate-400">No machines found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMachines.map((machine) => {
                const editValue = passwordEdits[machine.id];
                const currentPassword = machine.exitPassword || '';
                const displayValue = editValue !== undefined ? editValue : currentPassword;
                const hasChanges = editValue !== undefined && editValue !== currentPassword;

                return (
                  <div
                    key={machine.id}
                    className="glass-panel p-4 border-none flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:bg-white/[0.04]"
                  >
                    {/* Machine Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 shrink-0">
                        <Cpu size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{machine.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xxs font-mono text-cyan-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                            {machine.code}
                          </span>
                          <span className="text-xxs text-slate-400 truncate">{machine.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Password Input + Save */}
                    <div className="flex items-center gap-2 sm:w-72">
                      <div className="relative flex-1">
                        <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => handlePasswordChange(machine.id, e.target.value)}
                          placeholder="Set exit password..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 font-mono"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveMachinePassword(machine.id)}
                        disabled={!hasChanges || savingId === machine.id}
                        className={`px-3 py-2.5 rounded-xl text-xxs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          savedId === machine.id
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                            : errorId === machine.id
                            ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                            : hasChanges
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 shadow-md'
                            : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                        }`}
                      >
                        {savingId === machine.id ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
                        ) : savedId === machine.id ? (
                          <CheckCircle size={14} />
                        ) : errorId === machine.id ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <Save size={14} />
                        )}
                        <span>{savedId === machine.id ? 'Saved' : errorId === machine.id ? 'Error' : 'Save'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xxs font-bold text-slate-400 uppercase tracking-wider px-1">
            Instruction Exit Passwords
          </h3>
          {filteredInstructions.length === 0 ? (
            <div className="glass-panel p-8 text-center border-none">
              <p className="text-xxs text-slate-400">No instructions found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInstructions.map((inst) => {
                const editValue = passwordEdits[inst.id];
                const currentPassword = inst.exitPassword || '';
                const displayValue = editValue !== undefined ? editValue : currentPassword;
                const hasChanges = editValue !== undefined && editValue !== currentPassword;

                return (
                  <div
                    key={inst.id}
                    className="glass-panel p-4 border-none flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:bg-white/[0.04]"
                  >
                    {/* Instruction Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{inst.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xxs font-bold uppercase ${
                            inst.priority === 'CRITICAL' ? 'text-red-400' : inst.priority === 'HIGH' ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                            {inst.priority}
                          </span>
                          <span className="text-xxs text-slate-500">•</span>
                          <span className="text-xxs text-slate-400">{inst.instructionType}</span>
                          <span className="text-xxs text-slate-500">•</span>
                          <span className="text-xxs text-slate-400">v{inst.version}</span>
                        </div>
                      </div>
                    </div>

                    {/* Password Input + Save */}
                    <div className="flex items-center gap-2 sm:w-72">
                      <div className="relative flex-1">
                        <KeyRound size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => handlePasswordChange(inst.id, e.target.value)}
                          placeholder="Set exit password..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 font-mono"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveInstructionPassword(inst.id)}
                        disabled={!hasChanges || savingId === inst.id}
                        className={`px-3 py-2.5 rounded-xl text-xxs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          savedId === inst.id
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                            : errorId === inst.id
                            ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                            : hasChanges
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 shadow-md'
                            : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                        }`}
                      >
                        {savingId === inst.id ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
                        ) : savedId === inst.id ? (
                          <CheckCircle size={14} />
                        ) : errorId === inst.id ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <Save size={14} />
                        )}
                        <span>{savedId === inst.id ? 'Saved' : errorId === inst.id ? 'Error' : 'Save'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
