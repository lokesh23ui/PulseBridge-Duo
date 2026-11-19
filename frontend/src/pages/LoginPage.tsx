import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, HeartPulse, User, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsDemoPatient, loginAsDemoCaregiver } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/family');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPatient = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemoPatient();
      navigate('/family');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoCaregiver = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemoCaregiver();
      navigate('/family');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-4">
            <Activity className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            PulseBridge <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Connected Care</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your personal telemetry or family monitoring portal
          </p>
        </div>

        {/* 1-Click Interactive Judge Demo Logins */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              1-Click Instant Demo Portals
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Judges & Testers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Demo Patient Button */}
            <button
              onClick={handleDemoPatient}
              disabled={loading}
              className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all group hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5" />
                  Patient
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Age 72</span>
              </div>
              <p className="text-xs font-semibold text-white">Eleanor Vance</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Manage data, invites & permissions</p>
            </button>

            {/* Demo Caregiver Button */}
            <button
              onClick={handleDemoCaregiver}
              disabled={loading}
              className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/30 hover:border-purple-500/60 text-left transition-all group hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Caregiver
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Son</span>
              </div>
              <p className="text-xs font-semibold text-white">Marcus Vance</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Live vitals, custom alerts & reports</p>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-xs uppercase font-mono text-slate-500">Or sign in with email</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
