'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { FileText, CheckCircle, Clock, Search, HelpCircle } from 'lucide-react';

export default function EmployeeHistoryPage() {
  const { apiUrl, authFetch } = useAuth();
  const { t } = useLanguage();

  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

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

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.machineCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">{t('history')}</h1>
        <p className="text-sm text-slate-400">
          Review your personal shift safety and operational sign-offs log
        </p>
      </div>

      {/* Search Filter bar */}
      <div className="relative glass-panel p-4 border-none shadow-sm flex items-center gap-2">
        <Search size={16} className="text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Filter history by title or machine code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-slate-655"
        />
      </div>

      {/* History Checklist Card */}
      <div className="glass-panel p-6 border-none">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-10">
            <HelpCircle size={36} className="text-slate-400 mx-auto mb-2" />
            <p className="text-xxs text-slate-400">No matching sign-off logs found.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredHistory.map((row) => (
              <div key={row.id} className="py-4 flex justify-between items-start text-xxs first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-cyan-400 font-bold">
                      {row.machineCode}
                    </span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-405 text-slate-400 font-semibold">{row.type}</span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{row.title}</h4>
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <Clock size={12} className="text-slate-500" />
                    <span>Viewed Duration: <strong className="text-cyan-400">{row.duration}s</strong></span>
                  </div>
                </div>
                <div className="text-right space-y-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-450 font-bold inline-flex items-center gap-1 border border-emerald-500/20">
                    <CheckCircle size={10} />
                    <span>{t('acknowledged')}</span>
                  </span>
                  <span className="text-xxs text-slate-400 block">{row.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
