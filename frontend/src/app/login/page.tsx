'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/navigation';
import { Shield, Key, Mail, Lock, UserCheck, Settings } from 'lucide-react';

export default function LoginPage() {
  const { login, error: authError } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        // Redirection handled by RootPage / Auth state, but we can double redirect
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (savedUser.role === 'EMPLOYEE') {
          router.push('/employee/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Invalid email or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#030712] p-4 overflow-hidden">
      {/* Background visual graphics */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]"></div>

      {/* Language Bar Top Right */}
      <div className="absolute top-6 right-6 flex items-center gap-1 border border-white/10 rounded-xl p-0.5 bg-white/5 backdrop-blur-md">
        <button
          onClick={() => setLanguage('en')}
          className={`text-xxs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            language === 'en' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('hi')}
          className={`text-xxs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            language === 'hi' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          हिन्दी
        </button>
        <button
          onClick={() => setLanguage('ta')}
          className={`text-xxs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            language === 'ta' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          தமிழ்
        </button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-6 z-10 animate-fade-in">
        {/* Logo and Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-slate-950 font-bold text-3xl shadow-xl shadow-cyan-500/20 mb-4">
            M
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-400">
            {t('welcome')}
          </h1>
          <p className="text-slate-400 text-xxs mt-1.5 tracking-wider uppercase font-semibold">{t('subWelcome')}</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 border-none relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-400 text-xxs font-bold uppercase tracking-wider mb-2">
                {t('email')}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@unominda.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-655"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xxs font-bold uppercase tracking-wider mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-655"
                />
              </div>
            </div>

            {(error || authError) && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 flex items-center gap-2">
                <Shield size={14} />
                <span>{error || authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/10 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key size={16} className="text-slate-950" />
              {loading ? t('loggingIn') : t('signIn')}
            </button>
          </form>
        </div>

        {/* UNO MINDA Logo */}
        <div className="flex justify-center py-4">
          <img
            src="/images/unominda-logo.png"
            alt="UNO MINDA Logo"
            className="w-[260px] sm:w-[280px] md:w-[300px] h-auto object-contain select-none rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] border border-white/10"
          />
        </div>

      </div>
    </div>
  );
}
