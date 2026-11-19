import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
              <Activity className="w-5 h-5 text-teal-600" />
              <span>PULSEBRIDGE DUO</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed max-w-md">
              One Intelligent Healthcare Platform. Two Wearable Experiences. Continuous health parameter monitoring, 
              dual-wearable preview options, and transparent rule-based risk alerting.
            </p>
            {/* Medical Disclaimer Alert Box */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-amber-900 text-[11px] leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950 font-bold">Illustrative Demonstration Platform:</strong> Readings shown in this application are 
                preview samples or illustrative telemetry, not certified clinical measurements. PulseBridge Duo is a connected healthcare 
                product prototype designed for remote monitoring and caregiver collaboration.
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-slate-900 font-bold uppercase tracking-wider text-xs mb-3 font-mono">
              Platform
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li><Link to="/" className="hover:text-teal-600 transition-colors">Home Showcase</Link></li>
              <li><Link to="/devices" className="hover:text-teal-600 transition-colors">Explore Devices</Link></li>
              <li><Link to="/devices/ring" className="hover:text-teal-600 transition-colors">PulseBridge Ring 3D</Link></li>
              <li><Link to="/devices/watch" className="hover:text-teal-600 transition-colors">PulseBridge Watch 3D</Link></li>
              <li><Link to="/about" className="hover:text-teal-600 transition-colors">Platform Architecture</Link></li>
            </ul>
          </div>

          {/* Experience Links */}
          <div>
            <h4 className="text-slate-900 font-bold uppercase tracking-wider text-xs mb-3 font-mono">
              Experience
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li><Link to="/afib" className="hover:text-teal-600 transition-colors">AFib Overview</Link></li>
              <li><Link to="/disease-analysis" className="hover:text-teal-600 transition-colors">AFib Analysis</Link></li>
              <li><Link to="/monitor" className="hover:text-teal-600 transition-colors">Live Monitoring</Link></li>
              <li><Link to="/insights" className="hover:text-teal-600 transition-colors">Health Insights</Link></li>
              <li><Link to="/about" className="hover:text-teal-600 transition-colors">Product Guide & Ethics</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>© 2026 PulseBridge Duo · Connected Healthcare Ecosystem · Privacy-Preserving Health Monitoring</div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Continuous Telemetry</span>
            <span>·</span>
            <span>Family Caregiver Sync</span>
            <span>·</span>
            <span>Personalized Alerts</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
