import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ChevronRight, Users, FileText, UserCheck, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, isAuthenticated, logout, loginAsDemoPatient, loginAsDemoCaregiver } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Devices', path: '/devices' },
    { name: 'Simulation Studio', path: '/simulation' },
    { name: 'Live Monitoring', path: '/monitor' },
    { name: 'Health Insights', path: '/insights' },
    { name: 'Technology', path: '/technology' },
    { name: 'About', path: '/about' },
  ];

  // Dynamic role-based navigation
  const roleLinks = [];
  if (role === 'patient') {
    roleLinks.push(
      { name: 'Caregivers', path: '/family', icon: Users },
      { name: 'Medical Reports', path: '/reports', icon: FileText }
    );
  } else if (role === 'caregiver') {
    roleLinks.push(
      { name: 'My Patients', path: '/family', icon: Users }
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                PULSEBRIDGE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">DUO</span>
              </span>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 -mt-0.5">
                Connected Health Ecosystem
              </p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Role-Specific Links */}
            {roleLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
                      : 'text-teal-300 hover:text-white hover:bg-teal-900/30 border border-teal-500/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Status, User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* Authenticated User / Role Pill */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-slate-200">
                    {user?.full_name?.split(' ')[0]}
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded ${
                    role === 'patient' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {/* Quick Demo Switchers for Judges */}
                <div className="hidden xl:flex items-center gap-1">
                  <button
                    onClick={async () => {
                      await loginAsDemoPatient();
                      navigate('/family');
                    }}
                    className="px-2 py-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-md transition-all"
                    title="Sign in as Eleanor Vance (Demo Patient, 72)"
                  >
                    Demo Patient
                  </button>
                  <button
                    onClick={async () => {
                      await loginAsDemoCaregiver();
                      navigate('/family');
                    }}
                    className="px-2 py-1 text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 rounded-md transition-all"
                    title="Sign in as Marcus Vance (Demo Caregiver)"
                  >
                    Demo Caregiver
                  </button>
                </div>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400" />
                  Sign In
                </Link>
              </div>
            )}

            <Link
              to="/monitor"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
            >
              Dashboard
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
