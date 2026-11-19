import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>PULSEBRIDGE DUO</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              One Intelligent Healthcare Platform. Two Wearable Experiences. Continuous health parameter monitoring, 
              dual-wearable hardware options, and transparent rule-based risk alerting.
            </p>
            {/* Medical Disclaimer Alert Box */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-200">Prototype Demonstration Only:</strong> Readings shown in this application are 
                generated or simulated samples, not certified patient measurements. PulseBridge Duo is not a cleared medical device 
                and cannot be used for clinical diagnosis or treatment decisions.
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs mb-3 font-mono">
              Platform
            </h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Home Showcase</Link></li>
              <li><Link to="/devices" className="hover:text-blue-400 transition-colors">Explore Devices</Link></li>
              <li><Link to="/devices/ring" className="hover:text-blue-400 transition-colors">PulseBridge Ring 3D</Link></li>
              <li><Link to="/devices/watch" className="hover:text-blue-400 transition-colors">PulseBridge Watch 3D</Link></li>
              <li><Link to="/technology" className="hover:text-blue-400 transition-colors">6-Layer Architecture</Link></li>
            </ul>
          </div>

          {/* Experience Links */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs mb-3 font-mono">
              Experience
            </h4>
            <ul className="space-y-2">
              <li><Link to="/simulation" className="hover:text-blue-400 transition-colors">Simulation Studio</Link></li>
              <li><Link to="/monitor" className="hover:text-blue-400 transition-colors">Live Monitoring</Link></li>
              <li><Link to="/insights" className="hover:text-blue-400 transition-colors">Health Insights</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">Transparency Matrix</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>© 2026 PulseBridge Duo · Hackathon Engineering Prototype · Not a medical device</div>
          <div className="flex items-center gap-4 font-mono">
            <span>FastAPI REST & WebSocket</span>
            <span>·</span>
            <span>Three.js WebGL</span>
            <span>·</span>
            <span>Wokwi Phase 1 Preserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
