import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, HeartHandshake, BookOpen, 
  Stethoscope, Sliders, FileText, Bell, History, 
  Settings, ShieldCheck, LogOut, ArrowLeft, Activity,
  Server, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  // If not admin, block rendering (handled also at router level)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Administrative Access Required</h2>
          <p className="text-xs text-slate-600">
            This console is restricted to authenticated PulseBridge Duo System Administrators.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
            >
              Sign In with Admin Account
            </Link>
            <Link
              to="/"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              Return to Clinical Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Patients', path: '/admin/patients', icon: Users },
    { name: 'Caregivers', path: '/admin/caregivers', icon: HeartHandshake },
    { name: 'AFib Knowledge', path: '/admin/afib-knowledge', icon: BookOpen },
    { name: 'Symptoms', path: '/admin/symptoms', icon: Stethoscope },
    { name: 'Parameters (4)', path: '/admin/parameters', icon: Sliders },
    { name: 'Medical Reports', path: '/admin/reports', icon: FileText },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: History },
    { name: 'App Settings', path: '/admin/settings', icon: Settings },
    { name: 'Security Status', path: '/admin/security', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Console Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                PULSEBRIDGE <span className="text-purple-400">ADMIN</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold hidden sm:inline-block">
                Console v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all border border-slate-700/60"
              title="Return to Public Clinical Portal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clinical Portal</span>
            </Link>

            <div className="h-4 w-px bg-slate-800"></div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-white leading-tight">
                  {user?.full_name || 'Administrator'}
                </span>
                <span className="text-[10px] text-purple-300 font-mono">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-800"
                title="Sign out of Admin Console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-60 shrink-0">
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs sticky top-20 space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-600 font-bold">
              Console Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/admin' 
                ? location.pathname === '/admin' || location.pathname === '/admin/'
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-600'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-3 mt-3 border-t border-slate-100 px-3 pb-1">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
                <Server className="w-3.5 h-3.5 text-purple-500" />
                <span>Zero Secrets Tracked</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
