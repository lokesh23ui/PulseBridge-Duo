import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, ShieldCheck, HeartPulse, User, Lock, 
  ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsDemoPatient, loginAsDemoCaregiver } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientProfile = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemoPatient();
      navigate('/family');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCaregiverProfile = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemoCaregiver();
      navigate('/family');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
      <div className="max-w-md w-full space-y-7">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-600 items-center justify-center text-white shadow-xl shadow-teal-600/20 mb-3">
            <Activity className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            PulseBridge <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Connected Care</span>
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to access continuous health telemetry or your family care network
          </p>
        </div>

        {/* Quick Evaluation Profiles for Reviewers & Evaluators */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Quick Evaluation Profiles
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
              Instant Access
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Patient Profile */}
            <button
              type="button"
              onClick={handlePatientProfile}
              disabled={loading}
              className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-left transition-all group hover:scale-[1.01] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                  Patient
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Age 72</span>
              </div>
              <p className="text-xs font-bold text-slate-900">Eleanor Vance</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Vitals vault, invites & permissions</p>
            </button>

            {/* Caregiver Profile */}
            <button
              type="button"
              onClick={handleCaregiverProfile}
              disabled={loading}
              className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200 hover:border-teal-400 hover:bg-teal-50 text-left transition-all group hover:scale-[1.01] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-teal-800 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  Caregiver
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Son</span>
              </div>
              <p className="text-xs font-bold text-slate-900">Marcus Vance</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Shared monitor, alerts & reports</p>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs uppercase font-mono text-slate-500 font-medium">Or sign in with email</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 text-xs">✕</button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Remember session</span>
            </label>
            <span className="text-slate-400 text-[11px] font-mono">Secure Token Auth</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Need a new account?{' '}
          <Link to="/register" className="font-bold text-teal-700 hover:text-teal-800 underline underline-offset-2">
            Register as Patient or Caregiver
          </Link>
        </p>
      </div>
    </div>
  );
};