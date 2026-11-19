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
    { name: 'Live Monitoring', path: '/monitor' },
    { name: 'Health Insights', path: '/insights' },
    { name: 'AFib Overview', path: '/afib' },
    { name: 'AFib Analysis', path: '/disease-analysis' },
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                PULSEBRIDGE <span className="text-teal-600">DUO</span>
              </span>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500 -mt-0.5">
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
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 border border-teal-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                      ? 'bg-teal-100 text-teal-900 border border-teal-300'
                      : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-teal-200'
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
                  <span className="text-xs font-bold text-slate-900">
                    {user?.full_name?.split(' ')[0]}
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded font-semibold ${
                    role === 'patient' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}>
                    {role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                  title="Logout and switch account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {/* Quick Evaluation Profiles for Reviewers */}
                <div className="hidden xl:flex items-center gap-1">
                  <button
                    onClick={async () => {
                      await loginAsDemoPatient();
                      navigate('/family');
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
                    title="Sign in as Eleanor Vance (Patient, 72)"
                  >
                    Patient Profile
                  </button>
                  <button
                    onClick={async () => {
                      await loginAsDemoCaregiver();
                      navigate('/family');
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 rounded-lg transition-all cursor-pointer"
                    title="Sign in as Marcus Vance (Caregiver)"
                  >
                    Caregiver Profile
                  </button>
                </div>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-teal-600" />
                  Sign In
                </Link>
              </div>
            )}

            <Link
              to="/monitor"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-xs font-semibold shadow-md shadow-teal-600/20 transition-all"
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
