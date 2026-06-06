'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Search,
  ScanLine,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { apiUrl, authFetch, user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [machineCode, setMachineCode] = useState('');
  const [machines, setMachines] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Scanner Simulator State
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    fetchMachines();
    fetchHistory();
  }, []);

  const fetchMachines = async () => {
    try {
      const res = await authFetch(`${apiUrl}/machines`);
      if (res.ok) {
        setMachines(await res.json());
      } else {
        throw new Error('Failed to fetch machines');
      }
    } catch (e) {
      console.error('Failed to load machines:', e);
      setMachines([]);
    }
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${apiUrl}/acknowledgements`);
      if (res.ok) {
        setHistory(await res.json());
      } else {
        throw new Error('Failed to fetch history');
      }
    } catch (e) {
      console.error('Failed to load history:', e);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineCode.trim()) return;
    router.push(`/employee/scan/${machineCode.trim().toUpperCase()}`);
  };

  const handleSelectMachine = (code: string) => {
    router.push(`/employee/scan/${code}`);
  };

  const startScanSimulator = () => {
    setIsScanning(true);
    // Simulate camera scanning a QR code on a machine
    setTimeout(() => {
      setIsScanning(false);
      // Auto select CNC-01 as the scanned result
      router.push(`/employee/scan/CNC-01`);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome back, {user?.name}</h2>
          <p className="text-xxs text-slate-500 mt-1 uppercase tracking-wider">
            Station Assignment: <span className="text-amber-500 font-semibold">{user?.department?.name || 'Machine Shop (CNC)'}</span>
          </p>
        </div>
        <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
          <ShieldCheck size={20} />
        </div>
      </div>

      {/* QR Code and Manual Entry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Camera Scanner simulator */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col items-center justify-between text-center relative overflow-hidden h-72">
          {isScanning ? (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4">
              <div className="w-40 h-40 border-2 border-dashed border-amber-500 rounded-xl relative flex items-center justify-center overflow-hidden animate-pulse">
                {/* Horizontal scanner red line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-red-500 top-0 animate-[bounce_2s_infinite]"></div>
                <QrCode size={48} className="text-slate-700 dark:text-slate-400" />
              </div>
              <p className="text-xxs text-amber-500 font-bold mt-4 tracking-wider animate-pulse">
                SCANNING STATION QR TAG...
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit mx-auto">
                  <QrCode size={24} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('scanQR')}</h3>
                <p className="text-xxs text-slate-500 leading-normal max-w-xs mx-auto">
                  Scan the QR sticker affixed to the machine chassis to fetch operating instructions immediately.
                </p>
              </div>

              <button
                onClick={startScanSimulator}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5 transition-transform active:scale-98 cursor-pointer"
              >
                <ScanLine size={15} />
                <span>Simulate Camera Scan</span>
              </button>
            </>
          )}
        </div>

        {/* Manual Code Input & Quick Select list */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between h-72">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Search size={16} className="text-slate-400" />
              <span>Search Station Code</span>
            </h3>

            {/* Manual Code Form */}
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={machineCode}
                onChange={(e) => setMachineCode(e.target.value)}
                placeholder="e.g., CNC-01"
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Go
              </button>
            </form>

            {/* Quick Select machines */}
            <div className="mt-4">
              <label className="block text-xxs font-bold text-slate-400 uppercase mb-2">Station Shortcuts</label>
              <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
                {machines.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMachine(m.code)}
                    className="p-2 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-left text-xxs flex justify-between items-center transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{m.code}</span>
                      <span className="text-slate-500 text-xxs truncate max-w-28 block">{m.name}</span>
                    </div>
                    <ChevronRight size={12} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Acknowledgement Logs */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-850 pb-3 mb-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={16} className="text-amber-500" />
            <span>{t('history')}</span>
          </h3>
          <span className="text-xxs font-bold uppercase text-slate-400">Personal Log</span>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : history.length === 0 ? (
          <p className="text-center py-6 text-slate-400 text-xxs">No past acknowledgements logged in this shift.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {history.map((row) => (
              <div key={row.id} className="py-3.5 flex justify-between items-start text-xxs first:pt-0 last:pb-0">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{row.title}</h4>
                  <div className="flex gap-2 mt-1 text-slate-400 font-medium">
                    <span>Machine: <strong className="text-slate-700 dark:text-slate-350">{row.machineCode}</strong></span>
                    <span>•</span>
                    <span>Read Duration: <strong className="text-amber-500">{row.duration}s</strong></span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle size={10} />
                    <span>{t('acknowledged')}</span>
                  </span>
                  <span className="text-xxs text-slate-400 block mt-1">{row.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
