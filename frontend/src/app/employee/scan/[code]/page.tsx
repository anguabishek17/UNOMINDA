'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Cpu,
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Play,
  Download,
  FileCode,
  Film,
  Image as ImageIcon,
  FileText,
  Maximize2
} from 'lucide-react';

export default function MachineInstructionsView() {
  const { apiUrl, authFetch, user } = useAuth();
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const machineCode = params.code as string;
  const hostUrl = apiUrl ? apiUrl.replace('/api', '') : '';

  const [machine, setMachine] = useState<any>(null);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fullscreen workflow states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [exitPasswordInput, setExitPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Forced Reading Timer State
  const [countdown, setCountdown] = useState(10);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const viewStartRef = useRef<number>(0);

  useEffect(() => {
    fetchMachineDetails();
  }, [machineCode]);

  useEffect(() => {
    // Reset and start timer when entering fullscreen viewing mode
    if (selectedInst && isFullscreen) {
      if (acknowledgedIds.includes(selectedInst.id)) {
        setCountdown(0);
        setTimerActive(false);
      } else {
        setCountdown(10); // 10 seconds standard forced read
        setTimerActive(true);
        viewStartRef.current = Date.now();
      }
    } else {
      setCountdown(10);
      setTimerActive(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedInst, isFullscreen, acknowledgedIds]);

  useEffect(() => {
    if (timerActive && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, countdown]);

  const fetchMachineDetails = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${apiUrl}/machines/scan/${machineCode}`);
      if (res.ok) {
        const data = await res.json();
        setMachine(data.machine);
        setInstructions(data.instructions);
        
        // Extract already signed off instruction IDs
        const acked = data.instructions.filter((i: any) => i.acknowledged).map((i: any) => i.id);
        setAcknowledgedIds(acked);

        if (data.instructions.length > 0) {
          setSelectedInst(data.instructions[0]);
        }
      } else {
        throw new Error('Machine scan failed');
      }
    } catch (e) {
      console.error('Failed to load scanned machine details:', e);
      setMachine(null);
      setInstructions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPasswordAndExit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!exitPasswordInput.trim()) {
      setPasswordError('Please enter the exit password.');
      return;
    }

    const durationSeconds = Math.round((Date.now() - viewStartRef.current) / 1000);

    try {
      const res = await authFetch(`${apiUrl}/acknowledgements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user?.id,
          instructionId: selectedInst.id,
          machineId: machine.id,
          duration: durationSeconds,
          exitPassword: exitPasswordInput.trim()
        })
      });

      if (res.ok) {
        alert('Instruction completed and acknowledged successfully.');
        triggerConfettiGlow();
        setAcknowledgedIds((prev) => [...prev, selectedInst.id]);
        
        // Reset states
        setIsFullscreen(false);
        setShowPasswordModal(false);
        setExitPasswordInput('');
        setPasswordError(null);
        
        // Refresh station details
        fetchMachineDetails();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setPasswordError(errorData.error || 'Incorrect exit password. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('Network error checking exit password.');
    }
  };

  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownloadAttachment = async (id: string, filename: string) => {
    setIsDownloading(id);
    try {
      const res = await authFetch(`${apiUrl}/instructions/download/${id}`);
      if (!res.ok) {
        throw new Error('Failed to download attachment');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download attachment. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadSOP = async (id: string, title: string, fileUrl: string) => {
    setIsDownloading(id);
    try {
      const res = await authFetch(`${apiUrl}/instructions/download-sop/${id}`);
      if (!res.ok) {
        throw new Error('Failed to download SOP file');
      }
      const blob = await res.blob();
      const extension = fileUrl.substring(fileUrl.lastIndexOf('.'));
      const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}${extension}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download SOP document. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  const triggerConfettiGlow = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#10b981', '#3b82f6']
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="glass-panel max-w-md mx-auto p-8 text-center border-none mt-12">
        <AlertTriangle className="text-red-500 mx-auto mb-4" size={40} />
        <h3 className="font-bold text-sm text-white font-sans">Station Not Found</h3>
        <p className="text-xxs text-slate-400 mt-2">
          The machine code <strong>{machineCode}</strong> is not registered, or the database is currently offline.
        </p>
        <button
          onClick={() => router.push('/employee/dashboard')}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold hover:underline cursor-pointer bg-white/5 px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={14} />
          Back to Terminal
        </button>
      </div>
    );
  }

  // Fullscreen Overlay Renderer
  if (isFullscreen && selectedInst) {
    return (
      <div className="fixed inset-0 z-50 bg-[#030712] flex flex-col p-6 overflow-y-auto animate-fade-in text-slate-200">
        {/* Fullscreen Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xxs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-semibold">
                STAGE 2: Fullscreen SOP Viewer
              </span>
              <span className="text-xxs text-slate-400">Type: {selectedInst.instructionType} • Version {selectedInst.version}</span>
            </div>
            <h2 className="text-lg font-black text-white mt-1">{selectedInst.title}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {countdown > 0 ? (
              <div className="flex items-center gap-2 text-xxs text-amber-450 font-bold bg-amber-500/10 px-4 py-2 border border-amber-500/20 rounded-xl animate-pulse">
                <Clock size={13} />
                <span>Reading Instruction ({countdown}s)</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setPasswordError(null);
                  setShowPasswordModal(true);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-450 hover:to-teal-350 text-slate-950 font-bold text-xxs px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md active:scale-98 transition-transform"
              >
                <CheckCircle size={14} />
                <span>STAGE 3: Complete & Exit</span>
              </button>
            )}
          </div>
        </div>

        {/* Fullscreen Multimedia Viewer Content */}
        <div className="flex-1 flex flex-col gap-6 max-w-5xl mx-auto w-full">
          {/* Main Multimedia Container */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex flex-col justify-center min-h-[420px] relative shadow-2xl">
            {selectedInst.fileUrl ? (
              <>
                {selectedInst.fileType === 'image' && (
                  <img
                    src={`${hostUrl}${selectedInst.fileUrl}`}
                    alt={selectedInst.title}
                    className="w-full h-auto max-h-[65vh] object-contain mx-auto"
                  />
                )}
                {selectedInst.fileType === 'video' && (
                  <video
                    src={`${hostUrl}${selectedInst.fileUrl}`}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[65vh] mx-auto"
                  />
                )}
                {selectedInst.fileType === 'pdf' && (
                  <iframe
                    src={`${hostUrl}${selectedInst.fileUrl}`}
                    title={selectedInst.title}
                    className="w-full h-[65vh] border-0"
                  />
                )}
                {selectedInst.fileType === 'docx' && (
                  <div className="flex flex-col items-center gap-3 p-12 text-center">
                    <div className="p-4 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20">
                      <FileCode size={40} />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-350">
                        Word SOP document attachment
                      </h5>
                      <p className="text-xxs text-slate-400 mt-2 max-w-[320px] leading-relaxed">
                        DOCX manuals cannot be previewed inline. Please click the button below to download the instruction.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadSOP(selectedInst.id, selectedInst.title, selectedInst.fileUrl)}
                      disabled={isDownloading === selectedInst.id}
                      className="mt-2 inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 text-xxs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      <Download size={13} />
                      <span>{isDownloading === selectedInst.id ? 'Downloading...' : 'Download SOP Document'}</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-xs text-slate-300 leading-relaxed font-sans max-h-[60vh] overflow-y-auto whitespace-pre-wrap">
                {selectedInst.description}
              </div>
            )}
          </div>

          {/* Description overlay */}
          {selectedInst.fileUrl && (
            <div className="glass-panel p-6 border-none">
              <h3 className="text-xxs font-bold text-slate-450 uppercase tracking-wider mb-2">Instruction Description</h3>
              <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">{selectedInst.description}</p>
            </div>
          )}
        </div>

        {/* Exit Password Modal dialog */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-panel p-6 max-w-sm w-full border-none shadow-2xl relative bg-slate-900/90">
              <h3 className="font-extrabold text-sm text-white mb-2">Exit Verification Required</h3>
              <p className="text-xxs text-slate-400 mb-4 leading-normal">
                Enter the exit password configured for this machine or instruction to confirm your training completion and log the audit entry.
              </p>
              
              <form onSubmit={handleVerifyPasswordAndExit} className="space-y-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Exit Password</label>
                  <input
                    type="password"
                    value={exitPasswordInput}
                    onChange={(e) => setExitPasswordInput(e.target.value)}
                    placeholder="Enter security key"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-xxs text-red-400 mt-2 font-medium flex items-center gap-1 animate-pulse">
                      <AlertTriangle size={12} />
                      <span>{passwordError}</span>
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setExitPasswordInput('');
                      setPasswordError(null);
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 rounded-xl text-xxs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-450 hover:to-teal-350 text-slate-950 font-bold py-2.5 rounded-xl text-xxs cursor-pointer shadow-md"
                  >
                    Confirm & Complete
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal Split View
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header bar and back navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push('/employee/dashboard')}
          className="flex items-center gap-1.5 text-xxs font-bold text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors duration-300"
        >
          <ArrowLeft size={14} />
          <span>Back to Terminal</span>
        </button>
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xxs font-bold flex items-center gap-1 border border-emerald-500/20">
          <ShieldCheck size={12} />
          <span>Line Lock Active</span>
        </span>
      </div>

      {/* Machine Details Banner */}
      <div className="glass-panel p-6 border-none flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-400 text-slate-950 rounded-xl shadow-lg shadow-cyan-500/10">
            <Cpu size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{machine.name}</h2>
              <span className="font-mono text-xxs font-bold px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-cyan-400">
                {machine.code}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xxs text-slate-400 mt-1">
              <MapPin size={12} className="text-slate-500" />
              <span>{machine.location}</span>
            </div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-450 text-xxs font-bold w-fit border border-emerald-500/20">
          {machine.status}
        </span>
      </div>

      {/* Main split instruction panel layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Instruction list side pane */}
        <div className="space-y-3">
          <h3 className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
            Instructions List
          </h3>
          {instructions.length === 0 ? (
            <div className="glass-panel p-6 text-center border-none">
              <p className="text-xxs text-slate-400">No instructions assigned to this station.</p>
            </div>
          ) : (
            instructions.map((inst) => {
              const isSelected = selectedInst?.id === inst.id;
              const isAcked = acknowledgedIds.includes(inst.id);
              return (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInst(inst)}
                  className={`w-full glass-panel p-4 rounded-xl border text-left flex justify-between items-center transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 font-semibold border-cyan-500/30 shadow-lg shadow-cyan-500/10 active-nav-glow'
                      : 'border-none hover:bg-white/10 bg-white/5'
                  }`}
                >
                  <div className="overflow-hidden pr-2">
                    <span
                      className={`text-xxs font-bold uppercase tracking-wider block ${
                        inst.priority === 'CRITICAL' ? 'text-red-400 text-glow-red animate-pulse' : 'text-slate-400'
                      }`}
                    >
                      {inst.priority}
                    </span>
                    <h4 className="font-bold text-xs mt-1 text-white truncate">
                      {inst.title}
                    </h4>
                  </div>
                  {isAcked ? (
                    <span className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
                      <CheckCircle size={14} />
                    </span>
                  ) : (
                    <ChevronRight size={14} className="text-slate-400" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Selected Instruction details viewport */}
        <div className="md:col-span-2 space-y-6">
          {selectedInst ? (
            <div className="glass-panel p-6 border-none space-y-6">
              {/* SOP Meta Details */}
              <div className="flex justify-between items-start flex-wrap gap-2 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xxs px-2 py-0.5 bg-white/5 border border-white/10 rounded font-semibold text-slate-350">
                      {selectedInst.instructionType}
                    </span>
                    <span className="text-xxs text-slate-450">Version {selectedInst.version}</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-white mt-1.5">
                    {selectedInst.title}
                  </h3>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-xxs font-bold ${
                    selectedInst.priority === 'CRITICAL'
                      ? 'bg-red-500/10 text-red-400 animate-siren border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {selectedInst.priority}
                </span>
              </div>

              {/* Text Description */}
              <div className="text-xs leading-relaxed text-slate-300 font-sans">
                {selectedInst.description}
              </div>

              {/* Locked Fullscreen Prompt */}
              <div className="pt-6 border-t border-white/10 flex flex-col items-center gap-4 text-center">
                {acknowledgedIds.includes(selectedInst.id) ? (
                  <div className="w-full flex flex-col items-center gap-3 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-450">
                    <CheckCircle size={28} />
                    <div>
                      <h4 className="font-bold text-xs">Training Check Completed</h4>
                      <p className="text-xxs text-slate-400 mt-1 max-w-[320px]">
                        You have already completed the fullscreen review and submitted the exit password for this instruction.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-900/40 border border-white/10">
                    <div className="p-3.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
                      <Maximize2 size={24} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">View in Fullscreen Mode Required</h4>
                      <p className="text-xxs text-slate-400 mt-1 max-w-[320px] leading-relaxed">
                        To sign off on this SOP, you must open the fullscreen viewer, review the multimedia instruction, and verify the exit security password.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/5 active:scale-98 transition-transform"
                    >
                      <Maximize2 size={14} />
                      <span>Open Fullscreen Instruction</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-16 text-center border-none">
              <p className="text-xxs text-slate-400">Select an instruction from the left menu to view.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
