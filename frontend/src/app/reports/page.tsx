'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  BarChart3,
  FileText,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export default function ReportsPage() {
  const { apiUrl, authFetch } = useAuth();
  const { t } = useLanguage();

  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetadata();
    fetchComplianceLedger();
  }, [selectedDept]);

  const fetchMetadata = async () => {
    try {
      const res = await fetch(`${apiUrl}/auth/metadata`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.flatMap((p: any) => p.departments));
      }
    } catch (e) {
      console.error('Failed to load metadata:', e);
      setDepartments([]);
    }
  };

  const fetchComplianceLedger = async () => {
    setIsLoading(true);
    try {
      const q = selectedDept ? `?departmentId=${selectedDept}` : '';
      const res = await authFetch(`${apiUrl}/reports/completions${q}`);
      if (res.ok) {
        setLedger(await res.json());
      } else {
        throw new Error('Failed to fetch completions');
      }
    } catch (e) {
      console.error('Failed to load completions log:', e);
      setLedger([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (reportType: 'employee-pdf' | 'employee-excel' | 'machine-pdf' | 'audit-excel') => {
    let url = '';
    let filename = '';

    if (reportType === 'employee-pdf') {
      url = `${apiUrl}/reports/compliance?format=pdf`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;
      filename = 'Employee_Compliance_Report.pdf';
    } else if (reportType === 'employee-excel') {
      url = `${apiUrl}/reports/compliance?format=excel`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;
      filename = 'Employee_Compliance_Report.xlsx';
    } else if (reportType === 'machine-pdf') {
      url = `${apiUrl}/reports/machines?format=pdf`;
      filename = 'Machine_SOP_Report.pdf';
    } else {
      url = `${apiUrl}/reports/audit`;
      filename = 'Audit_Trail_Report.xlsx';
    }

    try {
      const res = await authFetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('Failed to generate report from backend. Ensure DB URL is configured.');
      }
    } catch (e) {
      alert('Network error requesting report.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('reports')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generate audit-ready compliance sheets, export activity logs, and download PDF certificates
        </p>
      </div>

      {/* Reports Grid Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Employee Compliance */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit">
              <UserCheck size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Employee Compliance Ledger</h3>
            <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export comprehensive reports of all employee sign-offs, read durations, and safety checklist acknowledgements.
            </p>

            {/* Department selector filter */}
            <div className="pt-2">
              <label className="block text-xxs font-bold text-slate-400 uppercase mb-1">Filter Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xxs focus:outline-none"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => handleDownload('employee-pdf')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xxs shadow-md transition-colors cursor-pointer"
            >
              <FileText size={13} />
              <span>PDF Report</span>
            </button>
            <button
              onClick={() => handleDownload('employee-excel')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xxs transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={13} />
              <span>Excel Sheet</span>
            </button>
          </div>
        </div>

        {/* Card 2: Machine SOP Audit */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl w-fit">
              <FileText size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Machine Instruction Audit</h3>
            <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed">
              Generate PDF documents summarizing machine operational guidelines, total page scans, and plant compliance rankings.
            </p>
          </div>

          <button
            onClick={() => handleDownload('machine-pdf')}
            className="mt-6 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xxs shadow-md cursor-pointer"
          >
            <Download size={13} />
            <span>Generate PDF Audit</span>
          </button>
        </div>

        {/* Card 3: System Audit Trail */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl w-fit">
              <FileSpreadsheet size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">System Activity Trail</h3>
            <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed">
              Download complete, timestamped excel worksheets containing audit logs, user login details, changes to SOP configurations, and active warnings.
            </p>
          </div>

          <button
            onClick={() => handleDownload('audit-excel')}
            className="mt-6 flex items-center justify-center gap-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xxs cursor-pointer"
          >
            <Download size={13} />
            <span>Export Excel Logs</span>
          </button>
        </div>
      </div>

      {/* Inline Ledger Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-850">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-850 pb-3 mb-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Shift Compliance Tracker</h3>
          <span className="text-xxs font-bold uppercase text-slate-400">Ledger view</span>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xxs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="py-2.5">Operator</th>
                  <th className="py-2.5">Department</th>
                  <th className="py-2.5">Machine</th>
                  <th className="py-2.5">Instruction</th>
                  <th className="py-2.5">Date & Time</th>
                  <th className="py-2.5">Duration</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {ledger.map((row, idx) => (
                  <tr key={idx} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">
                      <div>{row.name}</div>
                      <div className="text-xxs text-slate-400 font-normal">{row.email}</div>
                    </td>
                    <td className="py-3">{row.dept}</td>
                    <td className="py-3 font-mono font-bold text-cyan-400">{row.machineCode}</td>
                    <td className="py-3 truncate max-w-[200px]" title={row.instructionTitle}>
                      {row.instructionTitle}
                    </td>
                    <td className="py-3 text-slate-400">{row.acknowledgedAt}</td>
                    <td className="py-3 font-mono">{row.duration}s</td>
                    <td className="py-3">
                      <span className="px-1.5 py-0.5 rounded-full text-xxs font-bold bg-emerald-500/10 text-emerald-500">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
