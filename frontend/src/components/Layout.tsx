'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  GitFork,
  FileText,
  FileUp,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Globe,
  Sun,
  Moon,
  Menu,
  X,
  QrCode,
  ShieldAlert,
  User
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, apiUrl, authFetch } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, pathname]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Fetch every 30 seconds for live updates
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      // Return realistic mock notifications if DB is not active or during offline run
      const res = await authFetch(`${apiUrl}/instructions?status=ACTIVE`);
      if (res.ok) {
        const sops = await res.json();
        // create mock notifications based on active sops
        const mockNotifs = sops.slice(0, 3).map((s: any, idx: number) => ({
          id: `notif-${idx}`,
          title: `New Assigned SOP`,
          message: `${s.title} was uploaded for ${s.machine?.name || 'your department'}.`,
          type: 'NEW_INSTRUCTION',
          isRead: false,
          time: 'Just now'
        }));
        setNotifications(mockNotifs.length > 0 ? mockNotifs : [
          {
            id: 'n-1',
            title: 'Welcome to UNO MINDA',
            message: 'You have been successfully registered on the portal.',
            type: 'SYSTEM',
            isRead: false,
            time: '1h ago'
          }
        ]);
      } else {
        // Mock fallback
        setNotifications([
          {
            id: 'n-1',
            title: 'Welcome to UNO MINDA',
            message: 'System loaded in demo mode. Database URL pending configuration.',
            type: 'SYSTEM',
            isRead: false,
            time: '1h ago'
          },
          {
            id: 'n-2',
            title: '🚨 Emergency Drill Scheduled',
            message: 'A safety drill for the Press Shop will take place today at 3:00 PM.',
            type: 'EMERGENCY',
            isRead: false,
            time: '3h ago'
          }
        ]);
      }
    } catch (e) {
      setNotifications([
        {
          id: 'n-1',
          title: 'Welcome to UNO MINDA',
          message: 'System loaded in demo mode. Database URL pending configuration.',
          type: 'SYSTEM',
          isRead: false,
          time: '1h ago'
        }
      ]);
    }
  };

  if (!user && pathname === '/login') {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Session...</p>
        </div>
      </div>
    );
  }

  // Sidebar Menu Filtering based on Roles
  const isEmployee = user.role === 'EMPLOYEE';
  const menuItems = isEmployee
    ? [
        { name: t('employeePortal'), path: '/employee/dashboard', icon: QrCode },
        { name: 'View Instructions', path: '/employee/instructions', icon: FileText },
        { name: t('history'), path: '/employee/history', icon: FileText }
      ]
    : [
        { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { name: t('machines'), path: '/machines', icon: Cpu },
        { name: t('lines'), path: '/lines', icon: GitFork },
        { name: t('instructions'), path: '/instructions', icon: FileText },
        { name: 'Upload Instruction', path: '/instructions/upload', icon: FileUp },
        { name: t('reports'), path: '/reports', icon: BarChart3 },
        { name: 'Settings', path: '/settings', icon: Settings }
      ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#030712] text-slate-200 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 glass-panel m-4 mr-2 text-slate-100 border-none transition-all duration-300">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 text-lg shadow-md shadow-cyan-500/20">
            M
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white tracking-wider">UNO MINDA</h1>
            <p className="text-xxs text-cyan-400 font-semibold tracking-wider">INSTRUCTION HUB</p>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 font-semibold border border-cyan-500/30 shadow-lg shadow-cyan-500/10 active-nav-glow'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card info footer */}
        <div className="p-4 border-t border-white/10 bg-white/2">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 border border-white/10 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-white truncate">{user.name}</h4>
              <p className="text-xxs text-slate-400 uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay backdrop + sidebar slide-in) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-[#030712]/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <aside className="relative flex flex-col w-64 glass-panel text-slate-100 h-full border-y-0 border-l-0 rounded-l-none rounded-r-3xl shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950">M</div>
                <span className="font-bold text-white tracking-wider">UNO MINDA</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                {t('logout')}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden my-4 mr-4 ml-2">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 glass-panel border-none mb-4 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-200">
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold px-2 py-0.5 rounded bg-white/5 text-slate-350 border border-white/10">
                  {user.plant?.name || 'All Plants'}
                </span>
                {user.department && (
                  <>
                    <span>/</span>
                    <span className="font-medium text-slate-300">{user.department.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selection */}
            <div className="flex items-center gap-1 border border-white/10 rounded-xl p-0.5 bg-white/5">
              <button
                onClick={() => setLanguage('en')}
                className={`text-xxs font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  language === 'en' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`text-xxs font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  language === 'hi' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`text-xxs font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  language === 'ta' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications Alert Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 relative cursor-pointer"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 text-xxs font-bold text-white rounded-full flex items-center justify-center border-2 border-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl shadow-xl py-2 z-50 text-xs">
                  <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/10">
                    <span className="font-bold text-white">Recent Alerts</span>
                    <button
                      onClick={() => setNotifications(notifications.map(n => ({ ...n, isRead: true })))}
                      className="text-cyan-400 hover:underline text-xxs"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-slate-400">No new notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 hover:bg-white/5 border-b border-white/5 flex flex-col gap-0.5 ${
                            !n.isRead ? 'bg-cyan-500/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                            {n.type === 'EMERGENCY' && <ShieldAlert size={13} className="text-red-500 animate-pulse" />}
                            <span>{n.title}</span>
                          </div>
                          <p className="text-slate-450 text-xxs leading-snug">{n.message}</p>
                          <span className="text-xxs text-slate-400 mt-1">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 glass-panel border-none relative">
          {children}
        </main>
      </div>
    </div>
  );
}
