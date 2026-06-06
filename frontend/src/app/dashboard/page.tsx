'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  TrendingUp,
  AlertTriangle,
  Cpu,
  GitFork,
  Users,
  FileText,
  Clock,
  CheckCircle,
  Activity,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export default function Dashboard() {
  const { user, apiUrl, authFetch } = useAuth();
  const { t } = useLanguage();

  const [stats, setStats] = useState<any>({
    totalMachines: 0,
    totalLines: 0,
    totalEmployees: 0,
    totalInstructions: 0,
    pendingAcknowledgements: 0,
    expiredInstructions: 0,
    todayActivities: []
  });

  const [charts, setCharts] = useState<any>({
    departmentCompliance: [],
    machineCompliance: [],
    monthlyUploads: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await authFetch(`${apiUrl}/analytics/stats`);
      const chartsRes = await authFetch(`${apiUrl}/analytics/charts`);

      if (statsRes.ok && chartsRes.ok) {
        setStats(await statsRes.json());
        setCharts(await chartsRes.json());
      } else {
        throw new Error('Failed to fetch from backend');
      }
    } catch (e) {
      console.error('Failed to load dashboard data from backend:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Calculate compliance rate
  const complianceScore = charts.departmentCompliance.length > 0
    ? Math.round(charts.departmentCompliance.reduce((acc: number, item: any) => acc + item.compliance, 0) / charts.departmentCompliance.length)
    : 80;

  return (
    <div className="space-y-6">
      {/* Header and Welcome */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('adminDashboard')}</h1>
          <p className="text-sm text-slate-400">
            Overview of plant instructions, operator compliance, and shift status
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold shadow-lg shadow-emerald-500/5">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>System Healthy</span>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border-none relative overflow-hidden group glass-card-hover">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xxs font-bold uppercase tracking-wider">{t('totalMachines')}</p>
              <h3 className="text-2xl font-black mt-1 text-white">{stats.totalMachines}</h3>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Cpu size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xxs text-slate-450">
            <span className="text-emerald-400 font-bold flex items-center"><ArrowUpRight size={10} /> +100%</span>
            <span>Online Status</span>
          </div>
        </div>

        <div className="glass-panel p-5 border-none relative overflow-hidden group glass-card-hover">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xxs font-bold uppercase tracking-wider">{t('totalLines')}</p>
              <h3 className="text-2xl font-black mt-1 text-white">{stats.totalLines}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <GitFork size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xxs text-slate-450">
            <span>Plant-wide Line map</span>
          </div>
        </div>

        <div className="glass-panel p-5 border-none relative overflow-hidden group glass-card-hover">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xxs font-bold uppercase tracking-wider">{t('totalEmployees')}</p>
              <h3 className="text-2xl font-black mt-1 text-white">{stats.totalEmployees}</h3>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xxs text-emerald-400">
            <span className="font-semibold">100% Active Shifts</span>
          </div>
        </div>

        <div className="glass-panel p-5 border-none relative overflow-hidden group glass-card-hover">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xxs font-bold uppercase tracking-wider">{t('totalInstructions')}</p>
              <h3 className="text-2xl font-black mt-1 text-white">{stats.totalInstructions}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xxs text-amber-400">
            <span className="font-bold">{stats.expiredInstructions} Expiring Soon</span>
          </div>
        </div>
      </div>

      {/* Compliance Rate & Siren warning banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Glow Ring Card */}
        <div className="glass-panel p-6 border-none flex flex-col justify-between items-center text-center">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Plant Compliance</h4>
            <p className="text-xxs text-slate-500 mt-0.5">Required target: 90%</p>
          </div>

          <div className="relative my-6 flex items-center justify-center">
            {/* SVG Glowing Progress Ring */}
            <svg className="w-36 h-36 transform -rotate-90 filter drop-shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke="currentColor"
                strokeWidth="10"
                className="text-white/5"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke="currentColor"
                strokeWidth="10"
                className={`transition-all duration-1000 ${
                  complianceScore >= 90 ? 'text-cyan-400' : 'text-blue-500'
                }`}
                strokeDasharray={377}
                strokeDashoffset={377 - (377 * complianceScore) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-white text-glow-cyan">{complianceScore}%</span>
              <span className="text-xxs text-slate-400 uppercase font-bold tracking-wider">COMPLIANT</span>
            </div>
          </div>

          <div className="text-xxs text-slate-400 w-full border-t border-white/10 pt-4 flex justify-around">
            <div className="text-center">
              <span className="text-white font-bold block text-sm">{stats.pendingAcknowledgements}</span>
              <span>Pending Sign-offs</span>
            </div>
            <div className="border-l border-white/10 h-6"></div>
            <div className="text-center">
              <span className="text-white font-bold block text-sm">{stats.totalInstructions}</span>
              <span>Active SOPs</span>
            </div>
          </div>
        </div>

        {/* Department Compliance Graph Panel */}
        <div className="glass-panel p-6 border-none lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('deptCompliance')}</h4>
            <TrendingUp size={16} className="text-cyan-400" />
          </div>

          <div className="space-y-4 pt-2">
            {charts.departmentCompliance.map((dept: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">{dept.department}</span>
                  <span className="font-bold text-white">{dept.compliance}%</span>
                </div>
                <div className="h-3 w-full bg-white/5 border border-white/10 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      dept.compliance >= 90
                        ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-450'
                        : dept.compliance >= 70
                        ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{ width: `${dept.compliance}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Compliance Rankings */}
        <div className="glass-panel p-6 border-none space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('machineCompliance')}</h4>
            <Cpu size={16} className="text-slate-400" />
          </div>

          <div className="space-y-3">
            {charts.machineCompliance.map((machine: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/10 font-mono text-xxs font-bold text-cyan-400">
                    {machine.machineCode}
                  </span>
                  <span className="text-slate-350 truncate max-w-[130px]">{machine.machineName}</span>
                </div>
                <span
                  className={`font-semibold ${
                    machine.compliance >= 90
                      ? 'text-emerald-400'
                      : machine.compliance >= 60
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {machine.compliance}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Activity Stream */}
        <div className="glass-panel p-6 border-none lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('todayActivity')}</h4>
            <Activity size={16} className="text-cyan-455 animate-pulse" />
          </div>

          <div className="divide-y divide-white/5 max-h-60 overflow-y-auto pr-1">
            {stats.todayActivities.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400">No shift activities logged today</p>
            ) : (
              stats.todayActivities.map((act: any) => (
                <div key={act.id} className="py-3 flex justify-between items-start gap-4 text-xs first:pt-0 last:pb-0">
                  <div className="flex gap-3 items-start">
                    <div className="mt-0.5 p-1 rounded-lg bg-white/5 border border-white/10 text-slate-400">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-slate-300">
                        <span className="font-semibold text-white">{act.user}</span>{' '}
                        {act.action === 'ACKNOWLEDGE_INSTRUCTION' ? (
                          <span className="text-slate-400">
                            signed off <span className="font-semibold text-white">{act.details?.title}</span> on{' '}
                            <span className="font-mono bg-white/5 border border-white/10 px-1 py-0.5 rounded text-xxs font-bold text-cyan-400">
                              {act.details?.machineCode}
                            </span>
                          </span>
                        ) : act.action === 'SCAN_QR_CODE' ? (
                          <span className="text-slate-400">
                            scanned QR code of machine{' '}
                            <span className="font-mono bg-white/5 border border-white/10 px-1 py-0.5 rounded text-xxs font-bold text-cyan-400">
                              {act.details?.machineCode}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">performed {act.action.replace(/_/g, ' ').toLowerCase()}</span>
                        )}
                      </p>
                      {act.details?.duration && (
                        <span className="text-xxs text-cyan-400 font-medium block mt-0.5">
                          Read Time: {act.details.duration} seconds
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xxs text-slate-400 font-medium whitespace-nowrap">{act.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
