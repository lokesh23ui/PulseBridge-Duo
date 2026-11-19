import React from 'react';
import { Link } from 'react-router-dom';
import { CircleDot, Watch, Cpu, Battery, Wifi, WifiOff, ExternalLink } from 'lucide-react';

interface DeviceStatusCardProps {
  deviceType: 'ring' | 'watch' | 'esp32_gateway';
  name: string;
  status: 'connected' | 'degraded' | 'disconnected';
  batteryPercent: number;
  signalQuality: number;
  lastSeen?: string;
  onToggleConnection?: () => void;
  onToggleCharging?: () => void;
  isCharging?: boolean;
}

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({
  deviceType,
  name,
  status,
  batteryPercent,
  signalQuality,
  lastSeen,
  onToggleConnection,
  onToggleCharging,
  isCharging = false
}) => {
  const isRing = deviceType === 'ring';
  const isWatch = deviceType === 'watch';

  const Icon = isRing ? CircleDot : isWatch ? Watch : Cpu;
  const linkHref = isRing ? '/devices/ring' : isWatch ? '/devices/watch' : '/technology';

  const isOnline = status !== 'disconnected';

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isRing ? 'bg-sky-50 text-sky-600' : isWatch ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-700'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{name}</h4>
              <p className="text-[11px] font-mono text-slate-400">
                {isRing ? 'PB-RING-01' : isWatch ? 'PB-WATCH-01' : 'PB-ESP32-01'}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1 ${
            isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
            {status.toUpperCase()}
          </span>
        </div>

        {/* Telemetry Row */}
        <div className="grid grid-cols-2 gap-3 my-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Battery Level</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Battery className={`w-4 h-4 ${batteryPercent < 20 ? 'text-red-500' : 'text-slate-700'}`} />
              <span className="font-mono font-bold text-slate-800">{batteryPercent}%</span>
              {isCharging && <span className="text-[10px] text-teal-600 font-semibold">(Charging)</span>}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Signal Quality</span>
            <span className="font-mono font-bold text-slate-800">
              {Math.round(signalQuality * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          to={linkHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <span>Open 3D Model</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        {onToggleConnection && (
          <button
            type="button"
            onClick={onToggleConnection}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              isOnline
                ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isOnline ? 'Disconnect' : 'Reconnect'}
          </button>
        )}
      </div>
    </div>
  );
};
